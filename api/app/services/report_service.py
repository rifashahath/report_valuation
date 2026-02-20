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
      
    async def process_document(self, request: DocumentRequest, document_id: str) -> str:
        """Start document processing and return document ID"""
        logger.info(f"Starting document processing: {document_id}")
        
        # Start processing in background
        task = asyncio.create_task(
            self._process_document_async(document_id, request)
        )
        self.active_processes[document_id] = task
        
        # Cleanup task when done
        task.add_done_callback(
            lambda t: self._cleanup_task(document_id, t)
        )
        
        return document_id
    
    def _cleanup_task(self, document_id: str, task: asyncio.Task):
        """Clean up completed task"""
        self.active_processes.pop(document_id, None)
        if task.exception():
            logger.error(f"Task failed for document {document_id}: {task.exception()}")
    
    async def _process_document_async(self, document_id: str, request: DocumentRequest):
        """Async document processing pipeline"""
        try:
            # Fetch file from repository
            file_doc = OriginalFileRepository.get_by_id(document_id)
            if not file_doc or not file_doc.get("file_path"):
                raise Exception("File path not found for document")

            file_path = file_doc["file_path"]

            # Step 1: OCR Extraction
            await self.sse_manager.send_event(
                document_id,
                "status_update",
                {"status": ProcessingStatus.OCR_STARTED, "message": "Starting OCR extraction"}
            )

            try:
                if request.file_type == "pdf":
                    pages = self.ocr_service.extract_text_from_pdf(file_path)
                else:
                    pages = self.ocr_service.extract_text_from_image(file_path)

            except Exception as e:
                logger.error(f"OCR extraction failed for {document_id}: {str(e)}")
                raise Exception(f"OCR extraction failed: {str(e)}")
            
            await self.sse_manager.send_event(
                document_id,
                "status_update",
                {
                    "status": ProcessingStatus.OCR_COMPLETED,
                    "message": f"OCR completed. Extracted {len(pages)} pages",
                    "pages_extracted": len(pages)
                }
            )
            
            # Step 2: Process each page
            page_results = []
            for page_num, text in pages:
                try:
                    await self.sse_manager.send_event(
                        document_id,
                        "page_started",
                        {"page_number": page_num, "status": "processing"}
                    )
                    
                    # Translation
                    await self.sse_manager.send_event(
                        document_id,
                        "status_update",
                        {
                            "status": ProcessingStatus.TRANSLATION_STARTED,
                            "message": f"Translating page {page_num}",
                            "page_number": page_num
                        }
                    )
                    
                    legal_english = await self.translation_service.translate_to_legal_english(
                        text, page_num
                    )
                    
                    await self.sse_manager.send_event(
                        document_id,
                        "status_update",
                        {
                            "status": ProcessingStatus.TRANSLATION_COMPLETED,
                            "message": f"Translation completed for page {page_num}",
                            "page_number": page_num
                        }
                    )
                    
                    # Simplification
                    await self.sse_manager.send_event(
                        document_id,
                        "status_update",
                        {
                            "status": ProcessingStatus.SIMPLIFICATION_STARTED,
                            "message": f"Simplifying page {page_num}",
                            "page_number": page_num
                        }
                    )
                    
                    simple_english = await self.translation_service.simplify_text(
                        legal_english, page_num
                    )
                    
                    await self.sse_manager.send_event(
                        document_id,
                        "status_update",
                        {
                            "status": ProcessingStatus.SIMPLIFICATION_COMPLETED,
                            "message": f"Simplification completed for page {page_num}",
                            "page_number": page_num
                        }
                    )
                    
                    page_data = PageData(
                        page_number=page_num,
                        original_text=text,
                        legal_english=legal_english,
                        simple_english=simple_english,
                        status=ProcessingStatus.COMPLETED
                    )
                    page_results.append(page_data)
                    
                    await self.sse_manager.send_event(
                        document_id,
                        "page_completed",
                        {"page_number": page_num, "status": "completed"}
                    )
                
                except Exception as e:
                    logger.error(f"Error processing page {page_num} for {document_id}: {str(e)}")
                    await self.sse_manager.send_event(
                        document_id,
                        "page_error",
                        {"page_number": page_num, "error": str(e)}
                    )
                    # Continue with other pages
            
            # Step 3: Create summary
            await self.sse_manager.send_event(
                document_id,
                "status_update",
                {"status": "summary_started", "message": "Creating document summary"}
            )
            
            try:
                summary = await self.translation_service.create_document_summary(page_results)
            except Exception as e:
                logger.error(f"Summary creation failed for {document_id}: {str(e)}")
                summary = "Summary creation failed"
            
            await self.sse_manager.send_event(
                document_id,
                "status_update",
                {
                    "status": ProcessingStatus.COMPLETED,
                    "message": "Document processing completed",
                    "summary": summary,
                    "total_pages": len(page_results)
                }
            )
            
            logger.info(f"Document processing completed successfully: {document_id}")
            
        except Exception as e:
            logger.error(f"Document processing failed for {document_id}: {str(e)}", exc_info=True)
            await self.sse_manager.send_event(
                document_id,
                "error",
                {
                    "status": ProcessingStatus.FAILED,
                    "message": f"Processing failed: {str(e)}"
                }
            )
            raise
    
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
