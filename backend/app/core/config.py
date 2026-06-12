from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Any


class Settings(BaseSettings):
    APP_NAME: str = "Smart Interview Platform"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = (
        "postgresql+asyncpg://interview_user:interview_pass@postgres:5432/interview_db"
    )
    REDIS_URL: str = "redis://redis:6379/0"

    SECRET_KEY: str = "supersecretkey"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

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

    GROQ_API_KEY: str = ""

    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_SECURE: bool = False
    MINIO_BUCKET_RESUMES: str = "resumes"
    MINIO_BUCKET_AUDIO: str = "audio-recordings"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
