"""
Reports API routes
"""

from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from typing import List
from fastapi.responses import Response, FileResponse
import logging
from app.services.llm import LLMService
from datetime import datetime
from pydantic import BaseModel

from app.models.report import DocumentRequest
from app.services.report_service import DocumentProcessingService
from app.repositories.report_repo import ReportRepository, OriginalFileRepository, AIExtractedContentRepository
from app.core.config import config
from app.api.v1.dependencies import get_current_user
import os


logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Reports"])
processing_service = DocumentProcessingService()
llm_service = LLMService()

# ----------------------
# Request Models
# ----------------------

class CreateReportRequest(BaseModel):
  report_name: str
  bank_name: str

class UpdateReportRequest(BaseModel):
    report_name: str

class AnalysisRequest(BaseModel):
    report_id: str

# ----------------------
# APIs
# ----------------------

@router.post("/reports")
async def create_report(
    payload: CreateReportRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new report (no document upload)"""

    report = ReportRepository.create_report(
        report_name=payload.report_name,
        bank_name=payload.bank_name,
        user_id=current_user["id"],
        created_by=current_user["id"],
    )

    if not report:
        raise HTTPException(status_code=500, detail="Failed to create report")

    return {
        "id": report["id"],
        "report_name": report["report_name"],
        "created_at": report.get("created_at", datetime.utcnow().isoformat()),
    }


@router.get("/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):
    """Get all reports for current user"""

    if "admin" in current_user.get("roles", []):
        reports = ReportRepository.get_all()
    else:
        reports = ReportRepository.get_all(user_id=current_user["id"])

    return {"success": True, "reports": reports}


@router.get("/reports/check")
async def check_report_name(
    report_name: str = Query(..., min_length=1),
    current_user: dict = Depends(get_current_user),
):
    """Check if report name already exists"""

    exists = ReportRepository.exists_by_name(
        report_name,
        user_id=current_user["id"],
    )

    return {"exists": exists}

@router.post("/reports/{report_id}/files")
async def upload_files_to_report(
    report_id: str,
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload one or more files to a report and save them to disk."""

    report = ReportRepository.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if (
        report["user_id"] != current_user["id"]
        and "admin" not in current_user.get("roles", [])
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    # Construct structured upload path: uploads/YYYY/Month/Bank/ReportName
    import re
    def sanitize(name):
        return re.sub(r'[^a-zA-Z0-9_\-]', '_', str(name))

    now = datetime.utcnow()
    year = str(now.year)
    month = now.strftime('%B') # Full month name
    
    bank_name = sanitize(report.get("bank_name", "Unknown_Bank"))
    report_name = sanitize(report.get("report_name", report_id))
    
    upload_dir = os.path.join(config.UPLOAD_DIR, year, month, bank_name, report_name)
    os.makedirs(upload_dir, exist_ok=True)

    saved_files = []
    for upload_file in files:
        file_path = os.path.join(upload_dir, upload_file.filename)
        contents = await upload_file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        file_size_mb = len(contents) / (1024 * 1024)
        file_type = upload_file.content_type or "application/pdf"

        file_record = OriginalFileRepository.create(
            report_id=report_id,
            file_name=upload_file.filename,
            file_type=file_type,
            file_path=file_path,
            created_by=current_user["id"],
            file_size_mb=round(file_size_mb, 3),
        )
        saved_files.append({"id": file_record["id"], "file_name": upload_file.filename})

    return {"success": True, "files": saved_files}


@router.post("/reports/{report_id}/import")
async def import_report_files(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Dispatch async Celery processing jobs for all uploaded files in a report.

    Returns immediately with { job_ids } — the frontend should poll
    GET /api/v1/jobs/{job_id} for each job until completion.
    """
    from app.celery_app import celery_app as _celery
    from app.db.session import original_files as orig_col
    from bson import ObjectId
    from datetime import datetime as _dt

    # Validate report
    report = ReportRepository.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if (
        report["user_id"] != current_user["id"]
        and "admin" not in current_user.get("roles", [])
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    files = OriginalFileRepository.get_by_report(report_id)
    if not files:
        raise HTTPException(
            status_code=400,
            detail="No files found for this report"
        )

    queued_jobs   = []
    skipped_files = []

    for file_doc in files:
        file_id   = file_doc["id"]
        file_path = file_doc.get("file_path")

        current_status = file_doc.get("processing_status", "")
        # Check if we actually HAVE content (not just an empty string or whitespace)
        file_content   = file_doc.get("file_content", "")
        has_content    = bool(file_content and file_content.strip())

        # Skip only if processing is actively in flight OR already successfully completed with content.
        # If status is "completed" but content is missing, we re-queue it (likely a stale/failed job).
        if current_status in ("queued", "processing") or (current_status == "completed" and has_content):
            skipped_files.append({
                "file_id": file_id,
                "reason": f"Already {current_status}" if has_content or current_status != "completed" else "Already completed with content"
            })
            continue

        if not file_path or not os.path.exists(file_path):
            skipped_files.append({
                "file_id": file_id,
                "reason": "File missing on disk"
            })
            continue

        # Mark as queued in MongoDB so the poll endpoint reflects it immediately
        orig_col.update_one(
            {"_id": ObjectId(file_id)},
            {"$set": {"processing_status": "queued", "updated_at": _dt.utcnow()}},
        )

        # Dispatch Celery task — use file_id as task_id so job polling is easy
        task = _celery.send_task(
            "app.tasks.process_task.process_document_task",
            args    = [file_id, current_user["id"]],
            queue   = "document_processing",
            task_id = file_id,
        )
        logger.info("Queued process_document_task: file_id=%s task_id=%s", file_id, task.id)

        queued_jobs.append({
            "file_id":    file_id,
            "job_id":     task.id,          # same as file_id
            "file_name":  file_doc.get("file_name"),
            "status_url": f"/api/v1/jobs/{task.id}",
        })

    if not queued_jobs and not skipped_files:
        raise HTTPException(status_code=400, detail="No files to process")

    return {
        "success":       True,
        "report_id":     report_id,
        "job_ids":       [j["job_id"] for j in queued_jobs],
        "queued_jobs":   queued_jobs,
        "skipped_files": skipped_files,
        "message":       "Processing started in the background. Poll each status_url for progress.",
    }



@router.post("/reports/analysis")
async def analyze_and_summarize(
    payload: AnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """Analyze imported report documents using OpenAI"""
    try:
        logger.info("Received analysis request for report_id: %s", payload.report_id)
        # Validate report
        report = ReportRepository.get_by_id(payload.report_id)
        if not report:
            logger.error("Report %s not found in DB", payload.report_id)
            raise HTTPException(
                status_code=404,
                detail="Report not found"
            )
        logger.info("Found report: %s (ID: %s)", report.get("report_name"), report.get("id"))

        if (
            report["user_id"] != current_user["id"]
            and "admin" not in current_user.get("roles", [])
        ):
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )

        # Fetch imported files
        files = OriginalFileRepository.get_by_report(payload.report_id)
        logger.info("Analysis for report %s: found %d files", payload.report_id, len(files))

        contents = []
        for file in files:
            file_content = file.get("file_content", "")
            has_content = bool(file_content and file_content.strip())
            
            logger.info("File %s status: %s, has_content: %s", 
                        file.get("file_name"), 
                        file.get("processing_status"), 
                        has_content)
            
            if has_content:
                contents.append(
                    f"===== DOCUMENT: {file.get('file_name')} =====\n{file_content}"
                )

        if not contents:
            logger.warning("No contents found for report %s after checking %d files", payload.report_id, len(files))
            raise HTTPException(
                status_code=400,
                detail=f"No processed content found for report {payload.report_id}. Please wait for document processing to finish."
            )

        # Merge all document contents
        merged_content = "\n\n".join(contents)

        # Analyze using LLM
        try:
            summarized_content = llm_service.summarize(merged_content)
        except Exception as e:
            if "invalid_api_key" in str(e).lower() or "401" in str(e):
                logger.error("OpenAI Authentication failed: %s", e)
                raise HTTPException(
                    status_code=503,
                    detail="AI services are currently unavailable due to an invalid configuration (API Key). Please check server settings."
                )
            raise e

        # Save analysis
        AIExtractedContentRepository.save_analysis(
            report_id=report["id"],
            content=summarized_content,
            created_by=current_user["id"]
        )

        return {
            "id": report["id"],
            "report_name": report["report_name"],
            "analysis": summarized_content
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to analyze report {payload.report_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal error during analysis: {str(e)}"
        )


@router.put("/reports/{report_id}")
async def update_report(
    report_id: str,
    payload: UpdateReportRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update report name"""

    report = ReportRepository.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if (
        report["user_id"] != current_user["id"]
        and "admin" not in current_user.get("roles", [])
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    updated_report = ReportRepository.update_name(
        report_id,
        payload.report_name,
        current_user["id"],
    )

    if not updated_report:
        raise HTTPException(status_code=500, detail="Failed to update report")

    return {
        "id": updated_report["id"],
        "report_name": updated_report["report_name"],
        "created_at": updated_report["created_at"],
    }


@router.get("/reports/{report_id}")
async def get_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get report by ID"""

    report = ReportRepository.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if (
        report["user_id"] != current_user["id"]
        and "admin" not in current_user.get("roles", [])
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    files = OriginalFileRepository.get_by_report(report_id)
    analysis = AIExtractedContentRepository.get_by_report(report_id)

    return {
        "success": True,
        "report": report,
        "files": files,
        "analysis": analysis
    }


@router.get("/reports/{report_id}/status")
async def get_report_status(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Consolidated status for a report and all its documents.
    Used for frontend polling.
    """
    report = ReportRepository.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if (
        report["user_id"] != current_user["id"]
        and "admin" not in current_user.get("roles", [])
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    files = OriginalFileRepository.get_by_report(report_id)
    
    # Check if AI analysis exists
    analysis = AIExtractedContentRepository.get_by_report(report_id)
    
    # Determine overall status
    if not files:
        overall_status = "empty"
    elif all(f.get("processing_status") == "completed" for f in files) and analysis:
        overall_status = "completed"
    elif any(f.get("processing_status") == "failed" for f in files):
        overall_status = "failed"
    else:
        overall_status = "processing"

    # Count progress
    completed_files = sum(1 for f in files if f.get("processing_status") == "completed")
    total_files = len(files)
    
    return {
        "report_id": report_id,
        "status": overall_status,
        "progress": {
            "completed": completed_files,
            "total": total_files,
            "percentage": (completed_files / total_files * 100) if total_files > 0 else 0
        },
        "files": [
            {
                "id": f["id"],
                "name": f["file_name"],
                "status": f.get("processing_status", "pending"),
                "error": f.get("error_message")
            } for f in files
        ],
        "has_analysis": bool(analysis),
        "updated_at": datetime.utcnow().isoformat()
    }


@router.delete("/reports/{report_id}")
async def delete_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a report"""

    report = ReportRepository.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if (
        report["user_id"] != current_user["id"]
        and "admin" not in current_user.get("roles", [])
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    success = ReportRepository.delete(report_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete report")

    return {"success": True, "message": "Report deleted"}

@router.get("/reports/{report_id}/files/content")
async def get_file_contents(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    report = ReportRepository.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if (
        report["user_id"] != current_user["id"]
        and "admin" not in current_user.get("roles", [])
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    files = OriginalFileRepository.get_by_report(report_id)

    return {
        "report_id": report_id,
        "files": [
            {
                "file_id": f["id"],
                "file_name": f["file_name"],
                # Return the full extracted/translated content
                "content": f.get("file_content") or ""
            }
            for f in files
        ]
    }


@router.get("/reports/{report_id}/analysis")
async def get_report_analysis(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Fetch the stored LLM analysis for a report"""
    report = ReportRepository.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if (
        report["user_id"] != current_user["id"]
        and "admin" not in current_user.get("roles", [])
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    analysis_doc = AIExtractedContentRepository.get_by_report(report_id)
    return {
        "report_id": report_id,
        "report_name": report.get("report_name", ""),
        "analysis": analysis_doc["ai_report_content"] if analysis_doc else None,
    }



@router.get("/reports/{report_id}/download")
async def download_report_pdf(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Download report as PDF"""
    report = ReportRepository.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    analysis_doc = AIExtractedContentRepository.get_by_report(report_id)
    
    # If analysis doesn't exist (e.g. old report), try to regenerate it
    if not analysis_doc:
        logger.info(f"Analysis not found for {report_id}, regenerating...")
        files = OriginalFileRepository.get_by_report(report_id)
        
        contents = []
        for file in files:
            file_content = file.get("file_content")
            if file_content and file_content.strip():
                contents.append(
                    f"===== DOCUMENT: {file.get('file_name')} =====\n{file_content}"
                )
        
        if contents:
            merged_content = "\n\n".join(contents)
            try:
                summarized_content = llm_service.summarize(merged_content)
                # Save for next time
                saved_analysis = AIExtractedContentRepository.save_analysis(
                    report_id=report_id,
                    content=summarized_content,
                    created_by=current_user["id"]
                )
                analysis_content = summarized_content
            except Exception as e:
                logger.error(f"Failed to regenerate analysis: {e}")
                raise HTTPException(status_code=404, detail="Analysis could not be generated")
        else:
             raise HTTPException(status_code=404, detail="No content found to analyze")
    else:
        analysis_content = analysis_doc["ai_report_content"]

    pdf_bytes = processing_service.generate_pdf(
        title=report["report_name"],
        content=analysis_content
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={report['report_name']}.pdf"}
    )

from fastapi.responses import FileResponse

@router.get("/files/{file_id}")
async def download_file(
    file_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Download original file"""
    file = OriginalFileRepository.get_by_id(file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
        
    # Access check (check report ownership)
    report = ReportRepository.get_by_id(file["report_id"])
    if not report:
            raise HTTPException(status_code=404, detail="Report not found")
            
    if report["user_id"] != current_user["id"] and "admin" not in current_user.get("roles", []):
            raise HTTPException(status_code=403, detail="Access denied")
            
    file_path = file.get("file_path")
    if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File on disk not found")
            
    return FileResponse(
        path=file_path,
        filename=file["file_name"],
        media_type="application/pdf"
    )


@router.delete("/files/{file_id}")
async def delete_file(
    file_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a file"""
    file = OriginalFileRepository.get_by_id(file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    report = ReportRepository.get_by_id(file["report_id"])
    if not report:
        raise HTTPException(status_code=404, detail="Report associated with file not found")

    if (
        report["user_id"] != current_user["id"]
        and "admin" not in current_user.get("roles", [])
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    # Delete from disk
    file_path = file.get("file_path")
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            logger.error(f"Failed to delete file from disk: {e}")

    result = OriginalFileRepository.delete(file_id)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to delete file record")

    return {"success": True, "message": "File deleted"}