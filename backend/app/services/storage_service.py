import uuid
from typing import Optional
from minio import Minio
from minio.error import S3Error
from app.core.config import settings


def get_minio_client() -> Minio:
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )


def ensure_bucket(client: Minio, bucket: str) -> None:
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)


def upload_file(
    file_bytes: bytes,
    filename: str,
    content_type: str,
    bucket: str,
) -> str:
    import io

    client = get_minio_client()
    ensure_bucket(client, bucket)

    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    key = f"{uuid.uuid4().hex}.{ext}"

    client.put_object(
        bucket,
        key,
        io.BytesIO(file_bytes),
        length=len(file_bytes),
        content_type=content_type,
    )
    return key


def get_file_url(bucket: str, key: str, expires_hours: int = 1) -> str:
    from datetime import timedelta

    client = get_minio_client()
    return client.presigned_get_object(
        bucket,
        key,
        expires=timedelta(hours=expires_hours),
    )


def get_file_bytes(bucket: str, key: str) -> bytes:
    client = get_minio_client()
    response = client.get_object(bucket, key)
    data = response.read()
    response.close()
    return data
