import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SmartSkill AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "smartskill-ai-super-secret-production-key-mospi-2026-igot")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (PostgreSQL with automatic fallback to SQLite)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:////tmp/smartskill.db" if (os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME")) else f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '../../smartskill.db')).replace('\\', '/')}"
    )
    
    # AI Engine (Google Gemini 3.8 Flash)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    GEMINI_TEMPERATURE: float = 0.0  # Enforce deterministic generation to prevent hallucinations
    
    # File Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/uploads")))
    MAX_UPLOAD_SIZE_MB: int = 50
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "*"
    ]

    # Support & Email Notifications
    SUPPORT_EMAIL: str = "smartskillai3@gmail.com"
    GMAIL_SMTP_HOST: str = "smtp.gmail.com"
    GMAIL_SMTP_PORT: int = 587
    GMAIL_USER: str = "smartskillai3@gmail.com"
    GMAIL_APP_PASSWORD: str = os.getenv("GMAIL_APP_PASSWORD", "")

    model_config = SettingsConfigDict(
        env_file=[".env", "backend/.env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("ACCESS_TOKEN_EXPIRE_MINUTES", mode="before")
    @classmethod
    def parse_access_token_expire(cls, v):
        if v is None or v == "":
            return 60 * 24
        return int(v)

    @field_validator("GMAIL_SMTP_PORT", mode="before")
    @classmethod
    def parse_gmail_port(cls, v):
        if v is None or v == "":
            return 587
        return int(v)

    @field_validator("GEMINI_TEMPERATURE", mode="before")
    @classmethod
    def parse_gemini_temp(cls, v):
        if v is None or v == "":
            return 0.0
        return float(v)

    @field_validator("UPLOAD_DIR", mode="before")
    @classmethod
    def parse_upload_dir(cls, v):
        if not v:
            if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
                return "/tmp/uploads"
            return os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/uploads"))
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def parse_database_url(cls, v):
        if not v:
            if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
                return "sqlite:////tmp/smartskill.db"
            return f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), '../../smartskill.db')).replace('\\', '/')}"
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    @field_validator("SECRET_KEY", mode="before")
    @classmethod
    def parse_secret_key(cls, v):
        return v or "smartskill-ai-super-secret-production-key-mospi-2026-igot"

    @field_validator("GEMINI_MODEL", mode="before")
    @classmethod
    def parse_gemini_model(cls, v):
        return v or "gemini-3.8-flash"

    @field_validator("SUPPORT_EMAIL", mode="before")
    @classmethod
    def parse_support_email(cls, v):
        return v or "smartskillai3@gmail.com"

    @field_validator("GMAIL_SMTP_HOST", mode="before")
    @classmethod
    def parse_smtp_host(cls, v):
        return v or "smtp.gmail.com"

    @field_validator("GMAIL_USER", mode="before")
    @classmethod
    def parse_gmail_user(cls, v):
        return v or "smartskillai3@gmail.com"


settings = Settings()

# Ensure uploads directory exists
if settings.UPLOAD_DIR:
    try:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    except Exception:
        pass
