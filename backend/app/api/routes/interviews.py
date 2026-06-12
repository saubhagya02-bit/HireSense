from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import (
    User,
    InterviewSession,
    InterviewQuestion,
    InterviewAnswer,
    Resume,
)
from app.schemas.schemas import (
    InterviewCreate,
    SessionOut,
    AnswerSubmit,
    AnswerOut,
    QuestionOut,
)
from app.services import ai_service, audio_service

router = APIRouter()


# Create Session + Generate Questions
@router.post("/", response_model=SessionOut, status_code=201)
async def create_session(
    data: InterviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume_context = None
    if data.resume_id:
        res = await db.execute(
            select(Resume).where(
                Resume.id == data.resume_id, Resume.user_id == current_user.id
            )
        )
        resume = res.scalar_one_or_none()
        if resume:
            resume_context = resume.parsed_text
            skills = resume.skills or []
        else:
            skills = []
    else:
        skills = []

    # Create session
    session = InterviewSession(
        user_id=current_user.id,
        resume_id=data.resume_id,
        title=data.title,
        interview_type=data.interview_type,
        difficulty=data.difficulty,
        target_role=data.target_role or current_user.target_role or "Software Engineer",
        total_questions=data.total_questions,
        status="pending",
    )
    db.add(session)
    await db.flush()

    try:
        questions_data = await ai_service.generate_interview_questions(
            role=session.target_role,
            interview_type=data.interview_type,
            difficulty=data.difficulty,
            count=data.total_questions,
            skills=skills,
            resume_context=resume_context,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Question generation failed: {str(e)}"
        )

    for idx, q in enumerate(questions_data):
        question = InterviewQuestion(
            session_id=session.id,
            order_number=idx + 1,
            question_text=q.get("question_text", ""),
            question_type=q.get("question_type", "conceptual"),
            difficulty=q.get("difficulty", data.difficulty),
            expected_topics=q.get("expected_topics", []),
            follow_up=q.get("follow_up"),
        )
        db.add(question)

    await db.flush()
    await db.refresh(session)

    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.id == session.id)
        .options(
            selectinload(InterviewSession.questions),
            selectinload(InterviewSession.answers),
        )
    )
    return result.scalar_one()


# List Sessions
@router.get("/", response_model=List[SessionOut])
async def list_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == current_user.id)
        .options(
            selectinload(InterviewSession.questions),
            selectinload(InterviewSession.answers),
        )
        .order_by(InterviewSession.created_at.desc())
    )
    return result.scalars().all()


# Get Session
@router.get("/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(InterviewSession)
        .where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
        .options(
            selectinload(InterviewSession.questions),
            selectinload(InterviewSession.answers),
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


# Start Session
@router.post("/{session_id}/start", response_model=SessionOut)
async def start_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "active"
    session.started_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(session)

    full = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.id == session_id)
        .options(
            selectinload(InterviewSession.questions),
            selectinload(InterviewSession.answers),
        )
    )
    return full.scalar_one()


# Submit Answer
@router.post("/{session_id}/answers", response_model=AnswerOut, status_code=201)
async def submit_answer(
    session_id: int,
    data: AnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate session
    s_result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
    )
    session = s_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get question
    q_result = await db.execute(
        select(InterviewQuestion).where(
            InterviewQuestion.id == data.question_id,
            InterviewQuestion.session_id == session_id,
        )
    )
    question = q_result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Voice/text analysis
    text_metrics = audio_service.analyze_transcription(
        data.transcribed_text or "",
        data.duration_seconds or 60,
    )

    # AI evaluation
    try:
        eval_result = await ai_service.evaluate_answer(
            question=question.question_text,
            answer=data.transcribed_text or "",
            expected_topics=question.expected_topics or [],
            role=session.target_role or "Software Engineer",
            question_type=question.question_type or "conceptual",
        )
    except Exception:
        eval_result = {
            "relevance_score": 50,
            "completeness_score": 50,
            "clarity_score": 50,
            "technical_accuracy": 50,
            "overall_score": 50,
            "ai_feedback": "AI evaluation unavailable.",
            "keywords_mentioned": [],
            "missing_keywords": [],
        }

    answer = InterviewAnswer(
        session_id=session_id,
        question_id=data.question_id,
        transcribed_text=data.transcribed_text,
        audio_storage_key=data.audio_storage_key,
        duration_seconds=data.duration_seconds,
        speech_rate_wpm=text_metrics["speech_rate_wpm"],
        filler_word_count=text_metrics["filler_word_count"],
        confidence_score=text_metrics["confidence_score"],
        relevance_score=eval_result.get("relevance_score"),
        completeness_score=eval_result.get("completeness_score"),
        clarity_score=eval_result.get("clarity_score"),
        technical_accuracy=eval_result.get("technical_accuracy"),
        overall_score=eval_result.get("overall_score"),
        ai_feedback=eval_result.get("ai_feedback"),
        keywords_mentioned=eval_result.get("keywords_mentioned", []),
        missing_keywords=eval_result.get("missing_keywords", []),
    )
    db.add(answer)
    await db.flush()
    await db.refresh(answer)
    return answer


# Complete Session + Summary
@router.post("/{session_id}/complete", response_model=SessionOut)
async def complete_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(InterviewSession)
        .where(
            InterviewSession.id == session_id,
            InterviewSession.user_id == current_user.id,
        )
        .options(selectinload(InterviewSession.answers))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    answers_data = [
        {"overall_score": a.overall_score or 0, "ai_feedback": a.ai_feedback or ""}
        for a in session.answers
    ]
    voice_metrics = {
        "avg_speech_rate": sum(a.speech_rate_wpm or 0 for a in session.answers)
        / max(len(session.answers), 1),
        "total_fillers": sum(a.filler_word_count or 0 for a in session.answers),
        "avg_confidence": sum(a.confidence_score or 0 for a in session.answers)
        / max(len(session.answers), 1),
    }

    try:
        summary = await ai_service.generate_session_summary(
            role=session.target_role or "Software Engineer",
            answers_data=answers_data,
            voice_metrics=voice_metrics,
        )
        session.overall_score = summary.get("overall_score")
        session.technical_score = summary.get("technical_score")
        session.communication_score = summary.get("communication_score")
        session.confidence_score = summary.get("confidence_score")
        session.ai_summary = summary.get("ai_summary")
        session.recommendations = summary.get("recommendations", [])
    except Exception:
        scores = [a.overall_score or 0 for a in session.answers]
        session.overall_score = sum(scores) / len(scores) if scores else 0

    session.status = "completed"
    session.completed_at = datetime.now(timezone.utc)
    if session.started_at:
        delta = session.completed_at - session.started_at
        session.duration_minutes = int(delta.total_seconds() / 60)

    await db.flush()

    full = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.id == session_id)
        .options(
            selectinload(InterviewSession.questions),
            selectinload(InterviewSession.answers),
        )
    )
    return full.scalar_one()
