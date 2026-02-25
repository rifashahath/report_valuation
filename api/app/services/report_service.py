import os
from typing import Dict
import asyncio
import logging
from app.models.report import DocumentRequest, DocumentResponse, PageData, ProcessingStatus
from app.services.ocr_service import OCRService
from app.services.translation_service import TranslationService
from app.streaming.sse_manager import SSEManager
from app.repositories.report_repo import OriginalFileRepository
from app.core.config import config
from datetime import datetime
from app.db.session import original_files
import re

from app.db.session import db
from bson import ObjectId

logger = logging.getLogger(__name__)

def contains_tamil(text: str) -> bool:
    return bool(re.search(r"[\u0B80-\u0BFF]", text))

class DocumentProcessingService:
    def __init__(self):
        self.ocr_service = OCRService()
        self.translation_service = TranslationService(
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.sse_manager = SSEManager()
        self.active_processes: Dict[str, asyncio.Task] = {}    
    
    async def import_document(self, file_path: str) -> str:
        """
        OCR + translate a document and return final legal English text
        """

        # OCR page-by-page
        pages = self.ocr_service.extract_text_from_pdf(file_path)

        final_pages = []

        for page_num, text in pages:
            if not text.strip():
                continue

            # Tamil or mixed → translate
            if contains_tamil(text):
                try:
                    translated = await self.translation_service.translate_to_legal_english(
                        tamil_text=text,
                        page_num=page_num
                    )
                    final_pages.append(
                        f"Page {page_num}\n{translated}"
                    )
                except Exception as e:
                    logger.warning(
                        f"Translation failed for page {page_num}, using raw OCR text: {e}"
                    )
                    # Fall back to raw OCR text so import still succeeds
                    final_pages.append(
                        f"Page {page_num}\n{text.strip()}"
                    )
            else:
                # Already English
                final_pages.append(
                    f"Page {page_num}\n{text.strip()}"
                )

        return "\n\n".join(final_pages)
      
    async def process_document(self, request: DocumentRequest, document_id: str, user_id: str = "system") -> str:
        """Dispatch document processing to Celery"""
        from app.celery_app import celery_app
        from app.db.session import original_files as orig_col
        from bson import ObjectId
        from datetime import datetime

        logger.info(f"Dispatching document processing to Celery: {document_id}")

        # Initial status
        orig_col.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": {"processing_status": "queued", "updated_at": datetime.utcnow()}},
        )

        # Dispatch
        task = celery_app.send_task(
            "app.tasks.process_task.process_document_task",
            args=[document_id, user_id],
            queue="document_processing",
            task_id=document_id
        )

        return document_id

    def get_sse_stream(self, document_id: str):
        """Get SSE stream for document updates"""
        logger.info(f"Establishing SSE stream for document: {document_id}")
        return self.sse_manager.event_generator(document_id)

    def generate_pdf(self, title: str, content: str) -> bytes:
        """Generate PDF from report content"""
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        import io
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='Justify', alignment=1))

        Story = []
        
        # Title
        Story.append(Paragraph(title, styles["Title"]))
        Story.append(Spacer(1, 12))

        # Content - Split by newlines and handle basic markdown-like structure
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                Story.append(Spacer(1, 12))
                continue
            
            # Simple markdown handling
            if line.startswith('#'):
                # Headers
                header_level = len(line) - len(line.lstrip('#'))
                text = line.lstrip('#').strip()
                style_name = "Heading1" if header_level == 1 else "Heading2"
                Story.append(Paragraph(text, styles[style_name]))
            elif line.startswith('- ') or line.startswith('* '):
                # Bullets
                text = line[2:].strip()
                Story.append(Paragraph(f"• {text}", styles["BodyText"]))
            else:
                # Normal text
                Story.append(Paragraph(line, styles["BodyText"]))
            
        doc.build(Story)
        buffer.seek(0)
        return buffer.getvalue()
