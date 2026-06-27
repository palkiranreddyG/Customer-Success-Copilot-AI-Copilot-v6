import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "KB Retrieval System"
    API_V1_STR: str = "/api/v1"
    
    # Database Paths
    DB_PATH: str = str(BASE_DIR / "app.db")
    CHROMA_PATH: str = str(BASE_DIR / "chroma_db")
    
    # API Keys
    GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY")
    OPENAI_API_KEY: str | None = os.getenv("OPENAI_API_KEY")
    
    # Embedding config
    # Supported: "gemini", "openai", "local" (sentence-transformers), "mock" (fallback)
    EMBEDDING_PROVIDER: str = "gemini" 
    
    # Chunking config
    DEFAULT_CHUNK_SIZE: int = 512
    DEFAULT_CHUNK_OVERLAP: int = 50

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
