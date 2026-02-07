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


@router.post("/reports/{report_id}/files")
async def upload_files(
    report_id: str,
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload files to a report"""
    
    # Validate report
    report = ReportRepository.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if (
        report["user_id"] != current_user["id"]
        and "admin" not in current_user.get("roles", [])
    ):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Create uploads directory if it doesn't exist
    uploads_dir = os.path.join(config.upload_dir, report_id)
    os.makedirs(uploads_dir, exist_ok=True)
    
    uploaded_files = []
    failed_files = []
    
    for file in files:
        try:
            # Validate file type (only PDFs for now)
            if not file.filename.lower().endswith('.pdf'):
                failed_files.append({
                    "file_name": file.filename,
                    "reason": "Only PDF files are supported"
                })
                continue
            
            # Generate unique filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            safe_filename = f"{timestamp}_{file.filename}"
            file_path = os.path.join(uploads_dir, safe_filename)
            
            # Save file to disk
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            # Get file size
            file_size = os.path.getsize(file_path)
            file_size_mb = file_size / (1024 * 1024)
            
            # Save file metadata to database
            file_doc = OriginalFileRepository.create(
                report_id=report_id,
                file_name=file.filename,
                file_type='pdf',
                file_path=file_path,
                file_size_mb=file_size_mb,
                created_by=current_user["id"]
            )
            
            if file_doc:
                uploaded_files.append({
                    "id": file_doc["id"],
                    "file_name": file_doc["file_name"],
                    "file_size_mb": file_size_mb,
                })
            else:
                # If DB save failed, remove the file from disk
                if os.path.exists(file_path):
                    os.remove(file_path)
                failed_files.append({
                    "file_name": file.filename,
                    "reason": "Failed to save file metadata"
                })
                
        except Exception as e:
            logger.error(f"Failed to upload file {file.filename}: {str(e)}")
            failed_files.append({
                "file_name": file.filename,
                "reason": str(e)
            })
    
    return {
        "success": True,
        "uploaded_files": uploaded_files,
        "failed_files": failed_files,
        "message": f"Uploaded {len(uploaded_files)} file(s)"
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

@router.post("/reports/{report_id}/import")
async def import_report_files(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Import all uploaded files under a report:
    OCR + translate and store file_content
    """

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

    imported_files = []
    skipped_files = []

    for file_doc in files:
        file_id = file_doc["id"]
        file_path = file_doc.get("file_path")

        if not file_path or not os.path.exists(file_path):
            skipped_files.append({
                "file_id": file_id,
                "reason": "File missing on disk"
            })
            continue

        if file_doc.get("file_content"):
            skipped_files.append({
                "file_id": file_id,
                "reason": "Already imported"
            })
            continue

        try:
            final_text = await processing_service.import_document(file_path)

            OriginalFileRepository.update_file_content(
                file_id=file_id,
                content=final_text,
                updated_by=current_user["id"]
            )

            imported_files.append({
                "file_id": file_id,
                "file_name": file_doc.get("file_name")
            })

        except Exception as e:
            skipped_files.append({
                "file_id": file_id,
                "reason": f"Import failed: {str(e)}"
            })

    return {
        "success": True,
        "report_id": report_id,
        "imported_files": imported_files,
        "skipped_files": skipped_files,
        "message": "Import completed"
    }



@router.post("/reports/analysis")
async def analyze_and_summarize(
    payload: AnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """Analyze imported report documents using OpenAI"""
    try:
        # Validate report
        report = ReportRepository.get_by_id(payload.report_id)
        if not report:
            raise HTTPException(
                status_code=404,
                detail="Report not found"
            )

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

        # Collect file contents
        contents = []
        for file in files:
            file_content = file.get("file_content")
            if file_content and file_content.strip():
                contents.append(
                    f"===== DOCUMENT: {file.get('file_name')} =====\n{file_content}"
                )

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="No imported document content found. Please run import before analysis."
            )

        # Merge all document contents
        merged_content = "\n\n".join(contents)

        # Analyze using LLM
        summarized_content = llm_service.summarize(merged_content)

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
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze report"
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

    return {
        "success": True,
        "report": report,
        "files": files,
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
                "content_preview": (f.get("file_content") or "")[:1000]
            }
            for f in files
        ]
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