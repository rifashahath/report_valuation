"""
Async job API
=============
POST /api/v1/jobs/upload   – upload a file, dispatch Celery task, return job_id immediately
GET  /api/v1/jobs/{job_id} – poll status / result

This module sits *alongside* the existing documents.py so the original
SSE-based flow is fully preserved.  The Celery-based flow is opt-in.
"""

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import FileResponse
import os
import logging
from datetime import datetime

from app.repositories.report_repo import ReportRepository, OriginalFileRepository
from app.core.config import config
from app.api.v1.dependencies import get_current_user
from app.celery_app import celery_app

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/jobs", tags=["Async Jobs"])


# ---------------------------------------------------------------------------
# Helper: resolve Celery task state into a user-friendly dict
# ---------------------------------------------------------------------------

def _job_state(task_result) -> dict:
    """Convert a Celery AsyncResult into a JSON-serialisable dict."""
    state = task_result.state          # PENDING | STARTED | SUCCESS | FAILURE | RETRY

    base = {
        "job_id":    task_result.id,
        "state":     state,
        "ready":     task_result.ready(),
        "succeeded": task_result.successful(),
        "failed":    task_result.failed(),
    }

    if state == "SUCCESS":
        base["result"] = task_result.result
    elif state == "FAILURE":
        base["error"] = str(task_result.result)   # contains the exception
    elif state in ("STARTED", "RETRY"):
        # Worker stores progress in task.info if you call self.update_state()
        base["info"] = task_result.info or {}

    return base


# ---------------------------------------------------------------------------
# POST /api/v1/jobs/upload
# ---------------------------------------------------------------------------

@router.post("/upload", summary="Upload file and start async processing job")
async def upload_and_dispatch(
    file:        UploadFile = File(...),
    client_name: str        = Form(...),
    report_id:   str        = Form(...),
    current_user: dict = Depends(get_current_user),
):
    """
    • Validates the report & file type
    • Saves the file to the shared volume
    • Creates an original_files DB record with status='queued'
    • Dispatches `process_document_task` to Celery
    • **Returns immediately** with { job_id, document_id }

    The client should then poll  GET /api/v1/jobs/{job_id}  for progress.
    """

    # ---- validate report ownership ----
    report = ReportRepository.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if (
        report["user_id"] != current_user["id"]
        and "admin" not in current_user.get("roles", [])
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    # ---- validate file type ----
    file_ext = file.filename.rsplit(".", 1)[-1].lower()
    if file_ext not in config.SUPPORTED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file_ext}'. Supported: {', '.join(config.SUPPORTED_FILE_TYPES)}",
        )

    # ---- read & persist file ----
    content         = await file.read()
    file_size_mb    = len(content) / (1024 * 1024)

    if file_size_mb > config.MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({file_size_mb:.1f} MB). Limit: {config.MAX_FILE_SIZE_MB} MB",
        )

    now         = datetime.utcnow()
    year        = str(now.year)
    month       = now.strftime("%b").lower()
    safe_client = client_name.strip().replace(" ", "_").lower()

    upload_dir = os.path.join(config.UPLOAD_DIR, year, month, safe_client)
    os.makedirs(upload_dir, exist_ok=True)

    # Create DB record first to get the document_id
    file_doc = OriginalFileRepository.create(
        report_id    = report_id,
        file_name    = file.filename,
        file_type    = file_ext,
        file_path    = None,          # filled in below
        created_by   = current_user["id"],
        file_size_mb = file_size_mb,
    )
    document_id = file_doc["id"]

    # Save file using document_id as the stem so it is unique
    disk_path = os.path.join(upload_dir, f"{document_id}.{file_ext}")
    with open(disk_path, "wb") as fh:
        fh.write(content)

    # Update record with actual path + initial status
    OriginalFileRepository.update_path(document_id, disk_path, current_user["id"])

    # Set initial processing_status so the poll endpoint can reflect 'queued'
    from app.db.session import original_files as orig_col
    from bson import ObjectId
    orig_col.update_one(
        {"_id": ObjectId(document_id)},
        {"$set": {"processing_status": "queued", "updated_at": datetime.utcnow()}},
    )

    # ---- dispatch Celery task ----
    task = celery_app.send_task(
        "app.tasks.process_task.process_document_task",
        args   = [document_id, current_user["id"]],
        queue  = "document_processing",
        task_id= document_id,          # reuse document_id as task id for easy lookup
    )

    logger.info(
        "Dispatched process_document_task | document_id=%s | celery_task_id=%s",
        document_id, task.id,
    )

    # ---- respond immediately ----
    return {
        "success":      True,
        "job_id":       task.id,          # = document_id
        "document_id":  document_id,
        "report_id":    report_id,
        "file_name":    file.filename,
        "file_size_mb": round(file_size_mb, 3),
        "status":       "queued",
        "status_url":   f"/api/v1/jobs/{task.id}",
        "message":      "File uploaded. Processing started in the background.",
    }


# ---------------------------------------------------------------------------
# GET /api/v1/jobs/{job_id}
# ---------------------------------------------------------------------------

@router.get("/{job_id}", summary="Poll async job status")
async def get_job_status(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Returns the current state of a processing job.

    State machine:
      queued   → Celery picked it up (PENDING / STARTED)
      processing / ocr_started / ocr_completed
               → Task is actively running (stored in MongoDB)
      completed → Result ready; includes output_pdf download URL
      failed    → Error details returned
    """
    # Pull the Celery AsyncResult – works even if the task has not started yet
    from celery.result import AsyncResult
    ar      = AsyncResult(job_id, app=celery_app)
    celery_state = _job_state(ar)

    # Augment with the finer-grained status stored in MongoDB
    mongo_doc = None
    try:
        from app.db.session import original_files as orig_col
        from bson import ObjectId
        doc = orig_col.find_one({"_id": ObjectId(job_id)})
        if doc:
            mongo_doc = {
                "processing_status": doc.get("processing_status", "unknown"),
                "current_page":      doc.get("current_page"),
                "total_pages":       doc.get("total_pages"),
                "output_pdf_path":   doc.get("output_pdf_path"),
                "error_message":     doc.get("error_message"),
                "completed_at":      doc.get("completed_at"),
                "summary":           doc.get("summary"),
            }
    except Exception as exc:
        logger.warning("Could not fetch MongoDB doc for job %s: %s", job_id, exc)

    response = {
        "job_id":  job_id,
        "celery":  celery_state,
        "details": mongo_doc,
    }

    # Convenience: if completed, expose the download URL
    if mongo_doc and mongo_doc.get("output_pdf_path"):
        # Turn the absolute disk path into a relative uploads URL
        abs_path  = mongo_doc["output_pdf_path"]
        upload_dir = config.UPLOAD_DIR
        if abs_path.startswith(upload_dir):
            rel = abs_path[len(upload_dir):].lstrip("/")
            response["download_url"] = f"/uploads/{rel}"

    return response


# ---------------------------------------------------------------------------
# GET /api/v1/jobs/{job_id}/download
# ---------------------------------------------------------------------------

@router.get("/{job_id}/download", summary="Download translated PDF output")
async def download_output(
    job_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Stream the translated PDF that was saved by the Celery worker."""
    from app.db.session import original_files as orig_col
    from bson import ObjectId

    try:
        doc = orig_col.find_one({"_id": ObjectId(job_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job_id")

    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")

    output_path = doc.get("output_pdf_path")
    if not output_path or not os.path.exists(output_path):
        raise HTTPException(
            status_code=404,
            detail="Output PDF not yet available. Check job status first.",
        )

    # Basic ownership check
    created_by = str(doc.get("created_by", ""))
    if created_by != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Access denied")

    return FileResponse(
        path        = output_path,
        media_type  = "application/pdf",
        filename    = os.path.basename(output_path),
    )
