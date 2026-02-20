import os
from dotenv import load_dotenv
import sys

load_dotenv()

class Config:
    # OpenAI
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # Tesseract
    TESSERACT_LANG = os.getenv("TESSERACT_LANG", "tam")
    TESSERACT_PATH = os.getenv("TESSERACT_PATH")
    
    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", 8000))
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    # Processing
    MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", 50))
    SUPPORTED_FILE_TYPES = ["pdf", "png", "jpg", "jpeg", "tiff"]
    
    # CORS
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000").split(",")
    
    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET")
    JWT_ALGORITHM = "HS256"
    JWT_SECRET_KEY = os.getenv("JWT_SECRET")
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRE_MINUTES = 480  # 8 hours – prevents token expiry during long processing jobs
    
    # Uploads
    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")
    
    def validate(self):
        """Validate required configuration"""
        errors = []
        
        if not self.OPENAI_API_KEY:
            errors.append("OPENAI_API_KEY is required. Please set it in .env file")
        
        if errors:
            print("\n❌ Configuration Error:")
            for error in errors:
                print(f"  - {error}")
            print("\n📝 Create a .env file based on .env.example")
            sys.exit(1)

config = Config()
