from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Resume
from app.schemas.schemas import ResumeOut
from app.services import ai_service, resume_service, storage_service
from app.core.config import settings

router = APIRouter()

ALLOWED_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


@router.post("/upload", response_model=ResumeOut, status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400, detail="Only PDF, DOCX, or TXT files are accepted"
        )

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:  # 5 MB limit
        raise HTTPException(status_code=400, detail="File too large (max 5 MB)")

    # Parse resume text
    parsed_text = resume_service.parse_resume_file(file_bytes, file.content_type)

    # Upload to MinIO
    storage_key = storage_service.upload_file(
        file_bytes=file_bytes,
        filename=file.filename,
        content_type=file.content_type,
        bucket=settings.MINIO_BUCKET_RESUMES,
    )

    # AI analysis
    try:
        analysis = await ai_service.analyze_resume(
            resume_text=parsed_text,
            target_role=current_user.target_role or "Software Engineer",
        )
    except Exception as e:
        analysis = {
            "ats_score": None,
            "skills": [],
            "experience": [],
            "education": [],
            "ai_feedback": f"Analysis failed: {str(e)}",
        }

    # Deactivate previous resumes
    await db.execute(
        Resume.__table__.update()
        .where(Resume.user_id == current_user.id)
        .values(is_active=False)
    )

    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        storage_key=storage_key,
        parsed_text=parsed_text,
        skills=analysis.get("skills", []),
        experience=analysis.get("experience", []),
        education=analysis.get("education", []),
        ai_feedback=analysis.get("ai_feedback"),
        ats_score=analysis.get("ats_score"),
        is_active=True,
    )
    db.add(resume)
    await db.flush()
    await db.refresh(resume)
    return resume


@router.get("/", response_model=List[ResumeOut])
async def list_resumes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == current_user.id)
        .order_by(Resume.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{resume_id}", response_model=ResumeOut)
async def get_resume(
    resume_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume
