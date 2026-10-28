from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "OpenProcure"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "openprocure_super_secret_jwt_key_2026_enterprise_secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Default to local sqlite or postgres via DATABASE_URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./openprocure.db")
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "*"
    ]

    class Config:
        case_sensitive = True

settings = Settings()
