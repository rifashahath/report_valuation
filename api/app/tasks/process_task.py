"""
Celery task: process_document_task
===================================
Pipeline
--------
1. Fetch file path from MongoDB (original_files collection)
2. OCR  → extract raw text per page
3. Translate each page (Tamil → legal English) via OpenAI
4. Simplify each page (legal → plain English)
5. Create a full-document AI summary
6. Persist output to ai_extracted_content collection
7. Write a translated PDF to the shared /app/uploads volume
8. Update original_files.status throughout so the frontend
   can poll /api/v1/jobs/{job_id} for live progress.

All DB writes use pymongo directly (no async) because Celery
tasks run in a regular synchronous worker process.
"""

import os
import io
import logging
import re
from datetime import datetime

from celery import Task
from bson import ObjectId
from pymongo import MongoClient

from app.celery_app import celery_app

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_db():
    """Return the pymongo database handle (one connection per task call)."""
    mongo_uri = os.getenv("MONGO_URI", "mongodb://mongodb:27017")
    db_name   = os.getenv("MONGO_DB_NAME", "reportdb")
    client    = MongoClient(mongo_uri, serverSelectionTimeoutMS=5_000)
    return client[db_name]


def _set_status(db, document_id: str, status: str, extra: dict = None):
    """Update original_files.status (and any extra fields) in MongoDB."""
    update = {
        "processing_status": status,
        "updated_at": datetime.utcnow(),
    }
    if extra:
        update.update(extra)
    db["original_files"].update_one(
        {"_id": ObjectId(document_id)},
        {"$set": update},
    )
    logger.info("[%s] status → %s", document_id, status)


def _contains_tamil(text: str) -> bool:
    return bool(re.search(r"[\u0B80-\u0BFF]", text))


def _build_pdf(title: str, content: str) -> bytes:
    """Render a simple PDF from plain text using reportlab."""
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        rightMargin=72, leftMargin=72,
        topMargin=72,   bottomMargin=18,
    )
    styles = getSampleStyleSheet()
    story  = [Paragraph(title, styles["Title"]), Spacer(1, 12)]

    for line in content.split("\n"):
        line = line.strip()
        if not line:
            story.append(Spacer(1, 8))
            continue
        if line.startswith("#"):
            level = len(line) - len(line.lstrip("#"))
            text  = line.lstrip("#").strip()
            story.append(Paragraph(text, styles["Heading1" if level == 1 else "Heading2"]))
        elif line.startswith(("- ", "* ")):
            story.append(Paragraph(f"• {line[2:].strip()}", styles["BodyText"]))
        else:
            story.append(Paragraph(line, styles["BodyText"]))

    doc.build(story)
    buf.seek(0)
    return buf.getvalue()


# ---------------------------------------------------------------------------
# Celery base class with shared retry logic
# ---------------------------------------------------------------------------

class BaseDocumentTask(Task):
    abstract = True
    # Automatically retry on transient network / rate-limit errors
    autoretry_for = (Exception,)
    retry_kwargs  = {"max_retries": 3, "countdown": 10}
    retry_backoff = True


# ---------------------------------------------------------------------------
# Main task
# ---------------------------------------------------------------------------

@celery_app.task(
    bind=True,
    base=BaseDocumentTask,
    name="app.tasks.process_task.process_document_task",
    queue="document_processing",
    # Override retry so we don't retry on every exception –
    # only explicit self.retry() calls will retry.
    autoretry_for=(),
)
def process_document_task(self, document_id: str, user_id: str):
    """
    Background Celery task that processes a single uploaded document.

    Parameters
    ----------
    document_id : str  – MongoDB ObjectId of the original_files record
    user_id     : str  – MongoDB ObjectId of the requesting user
    """
    db = _get_db()

    # ------------------------------------------------------------------ #
    # 0. Resolve file path from DB                                         #
    # ------------------------------------------------------------------ #
    try:
        _set_status(db, document_id, "processing")
        file_doc = db["original_files"].find_one({"_id": ObjectId(document_id)})
        if not file_doc:
            raise ValueError(f"document_id {document_id} not found in DB")

        file_path = file_doc.get("file_path")
        if not file_path or not os.path.exists(file_path):
            raise FileNotFoundError(f"File not on disk: {file_path}")

        file_type = file_doc.get("file_type", "pdf")  # may be 'pdf' or 'application/pdf'
        is_pdf    = "pdf" in str(file_type).lower()
        report_id = str(file_doc.get("report_id", ""))
        file_name = file_doc.get("file_name", "document")

        logger.info("[%s] Starting processing: %s", document_id, file_path)

    except Exception as exc:
        logger.error("[%s] Setup failed: %s", document_id, exc, exc_info=True)
        _set_status(db, document_id, "failed", {"error_message": str(exc)})
        raise

    # ------------------------------------------------------------------ #
    # 1. OCR extraction                                                    #
    # ------------------------------------------------------------------ #
    try:
        _set_status(db, document_id, "ocr_started")

        from app.services.ocr_service import OCRService
        ocr = OCRService()

        if is_pdf:
            pages = ocr.extract_text_from_pdf(file_path)   # [(page_num, text), …]
        else:
            pages = ocr.extract_text_from_image(file_path)

        total_pages = len(pages)
        _set_status(db, document_id, "ocr_completed", {"total_pages": total_pages})
        logger.info("[%s] OCR done: %d pages", document_id, total_pages)

    except Exception as exc:
        logger.error("[%s] OCR failed: %s", document_id, exc, exc_info=True)
        _set_status(db, document_id, "failed", {"error_message": f"OCR failed: {exc}"})
        raise

    # ------------------------------------------------------------------ #
    # 2. Translate + simplify each page                                    #
    # ------------------------------------------------------------------ #
    import asyncio
    from app.services.translation_service import TranslationService

    translator = TranslationService(api_key=os.getenv("OPENAI_API_KEY"))

    async def _translate_page(page_num: int, raw_text: str):
        """Run translation + simplification for one page."""
        if not raw_text.strip():
            return page_num, "", ""

        # Tamil or mixed content → translate
        if _contains_tamil(raw_text):
            legal_en = await translator.translate_to_legal_english(raw_text, page_num)
        else:
            legal_en = raw_text.strip()   # already English

        simple_en = await translator.simplify_text(legal_en, page_num)
        return page_num, legal_en, simple_en

    async def _process_all_pages():
        results = []
        for page_num, raw_text in pages:
            try:
                _set_status(db, document_id, "translation_started",
                            {"current_page": page_num})
                pn, legal, simple = await _translate_page(page_num, raw_text)
                results.append({
                    "page_number": pn,
                    "original_text": raw_text,
                    "legal_english": legal,
                    "simple_english": simple,
                })
                _set_status(db, document_id, "translation_completed",
                            {"current_page": page_num})
            except Exception as page_exc:
                logger.warning("[%s] Page %d translation failed: %s",
                               document_id, page_num, page_exc)
                # Store raw OCR text as fallback so we don't lose the page
                results.append({
                    "page_number": page_num,
                    "original_text": raw_text,
                    "legal_english": raw_text,
                    "simple_english": raw_text,
                    "translation_error": str(page_exc),
                })
        return results

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        page_results = loop.run_until_complete(_process_all_pages())
        loop.close()
    except Exception as exc:
        logger.error("[%s] Translation phase failed: %s", document_id, exc, exc_info=True)
        _set_status(db, document_id, "failed", {"error_message": f"Translation failed: {exc}"})
        raise

    # ------------------------------------------------------------------ #
    # 3. Create AI summary for the whole document                          #
    # ------------------------------------------------------------------ #
    try:
        _set_status(db, document_id, "summarising")

        from app.models.report import PageData, ProcessingStatus

        page_data_objects = [
            PageData(
                page_number=p["page_number"],
                original_text=p.get("original_text"),
                legal_english=p.get("legal_english"),
                simple_english=p.get("simple_english"),
                status=ProcessingStatus.COMPLETED,
            )
            for p in page_results
        ]

        loop2 = asyncio.new_event_loop()
        asyncio.set_event_loop(loop2)
        summary = loop2.run_until_complete(
            translator.create_document_summary(page_data_objects)
        )
        loop2.close()
        logger.info("[%s] Summary created (%d chars)", document_id, len(summary))

    except Exception as exc:
        logger.warning("[%s] Summary failed (non-fatal): %s", document_id, exc)
        summary = "Summary generation failed."

    # ------------------------------------------------------------------ #
    # 4. Persist translated content → ai_extracted_content collection      #
    # ------------------------------------------------------------------ #
    try:
        full_text = "\n\n".join(
            f"Page {p['page_number']}\n{p.get('legal_english','')}"
            for p in page_results
        )

        ai_doc = {
            "report_id":         ObjectId(report_id),
            "original_file_id":  ObjectId(document_id),
            "ai_report_content": full_text,
            "summary":           summary,
            "page_results":      page_results,
            "created_at":        datetime.utcnow(),
            "created_by":        ObjectId(user_id),
        }
        # Upsert – replace any previous analysis for this file
        db["ai_extracted_content"].replace_one(
            {"original_file_id": ObjectId(document_id)},
            ai_doc,
            upsert=True,
        )
        logger.info("[%s] Saved to ai_extracted_content", document_id)

    except Exception as exc:
        logger.error("[%s] DB persist failed: %s", document_id, exc, exc_info=True)
        _set_status(db, document_id, "failed", {"error_message": f"DB persist failed: {exc}"})
        raise

    # ------------------------------------------------------------------ #
    # 5. Write translated PDF to shared volume                             #
    # ------------------------------------------------------------------ #
    try:
        stem = os.path.splitext(file_path)[0]   # same dir, new extension
        output_pdf_path = f"{stem}_translated.pdf"

        pdf_bytes = _build_pdf(
            title=f"Translated Document – {file_name}",
            content=full_text,
        )
        with open(output_pdf_path, "wb") as fh:
            fh.write(pdf_bytes)

        # Store the output path so the download endpoint can serve it
        db["original_files"].update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"output_pdf_path": output_pdf_path}},
        )
        logger.info("[%s] Translated PDF written: %s", document_id, output_pdf_path)

    except Exception as exc:
        logger.warning("[%s] PDF generation failed (non-fatal): %s", document_id, exc)
        output_pdf_path = None

    # ------------------------------------------------------------------ #
    # 6. Mark as completed                                                 #
    # ------------------------------------------------------------------ #
    _set_status(
        db,
        document_id,
        "completed",
        {
            "output_pdf_path":   output_pdf_path,
            "processed_pages":   len(page_results),
            "summary":           summary,
            "completed_at":      datetime.utcnow(),
        },
    )
    logger.info("[%s] ✅ Processing completed", document_id)

    # Return value is stored in Celery result backend (Redis)
    return {
        "document_id":    document_id,
        "status":         "completed",
        "total_pages":    len(page_results),
        "output_pdf":     output_pdf_path,
        "summary_length": len(summary),
    }
