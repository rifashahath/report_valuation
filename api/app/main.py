from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import config
from app.api.v1.auth import router as auth_router
from app.api.v1.reports import router as reports_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if config.DEBUG else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Validate configuration on startup
config.validate()

app = FastAPI(
    title="Tamil Land Document Translator API",
    description="Translate Tamil land documents to English with OCR and AI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Include routers
app.include_router(auth_router)
app.include_router(reports_router)

# CORS - Use configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "Tamil Land Document Translator API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    health_status = {
        "status": "healthy",
        "service": "tamil-translator-api",
        "version": "1.0.0",
        "config": {
            "openai_configured": bool(config.OPENAI_API_KEY),
            "tesseract_lang": config.TESSERACT_LANG,
            "max_file_size_mb": config.MAX_FILE_SIZE_MB,
            "debug_mode": config.DEBUG
        }
    }
    
    # Check if OpenAI key is configured
    if not config.OPENAI_API_KEY:
        health_status["status"] = "unhealthy"
        health_status["error"] = "OpenAI API key not configured"
        return JSONResponse(status_code=503, content=health_status)
    
    return health_status


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if config.DEBUG else "An unexpected error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server on {config.HOST}:{config.PORT}")
    uvicorn.run(
        "app.main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG
    )
