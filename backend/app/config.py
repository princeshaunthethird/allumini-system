"""
Application configuration using pydantic-settings.
Reads from environment variables / .env file.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/alumni_network"

    # JWT
    SECRET_KEY: str = "change-this-secret-key-in-production-must-be-32-chars-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # App
    APP_NAME: str = "Alumni Network System"
    DEBUG: bool = True
    BACKEND_URL: str = "http://localhost:8000"

    # File Uploads
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
