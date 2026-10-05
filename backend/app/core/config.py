from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Any


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Smart Interview Platform"
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"

    # Database
    DATABASE_URL: str = (
        "postgresql+asyncpg://interview_user:interview_pass@postgres:5432/interview_db"
    )

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # JWT
    SECRET_KEY: str = "supersecretkey"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost",
        "http://localhost:80",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v: Any) -> List[str]:
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                import json

                return json.loads(v)
            return [i.strip() for i in v.split(",") if i.strip()]
        return ["http://localhost:3000"]

    # AI
    GROQ_API_KEY: str = ""

    # MinIO
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_SECURE: bool = False
    MINIO_BUCKET_RESUMES: str = "resumes"
    MINIO_BUCKET_AUDIO: str = "audio-recordings"

    # SMTP
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@hiresense.com"
    SMTP_FROM_NAME: str = "HireSense"
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
