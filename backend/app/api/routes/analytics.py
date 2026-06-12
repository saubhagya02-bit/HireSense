from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, InterviewSession, InterviewAnswer
from app.schemas.schemas import AnalyticsSummary, SessionOut

router = APIRouter()


@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # All sessions
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == current_user.id)
        .options(
            selectinload(InterviewSession.questions),
            selectinload(InterviewSession.answers),
        )
        .order_by(InterviewSession.created_at.desc())
    )
    sessions = result.scalars().all()

    completed = [s for s in sessions if s.status == "completed"]
    scores = [s.overall_score for s in completed if s.overall_score is not None]

    # Score trend (last 10 sessions)
    trend = [
        {
            "date": (
                s.completed_at.isoformat()
                if s.completed_at
                else s.created_at.isoformat()
            ),
            "score": round(s.overall_score, 1) if s.overall_score else 0,
            "title": s.title,
        }
        for s in completed[-10:]
    ]

    # Skill breakdown across interview types
    type_scores = {}
    for s in completed:
        t = s.interview_type or "mixed"
        if t not in type_scores:
            type_scores[t] = []
        if s.overall_score:
            type_scores[t].append(s.overall_score)

    skill_breakdown = [
        {"skill": k, "score": round(sum(v) / len(v), 1)}
        for k, v in type_scores.items()
        if v
    ]

    all_answers_result = await db.execute(
        select(InterviewAnswer)
        .join(InterviewSession)
        .where(InterviewSession.user_id == current_user.id)
    )
    all_answers = all_answers_result.scalars().all()

    all_keywords = []
    all_missing = []
    for a in all_answers:
        all_keywords.extend(a.keywords_mentioned or [])
        all_missing.extend(a.missing_keywords or [])

    from collections import Counter

    strong = [k for k, _ in Counter(all_keywords).most_common(5)]
    weak = [k for k, _ in Counter(all_missing).most_common(5)]

    # Total practice time
    total_mins = sum(s.duration_minutes or 0 for s in completed)

    return AnalyticsSummary(
        total_sessions=len(sessions),
        completed_sessions=len(completed),
        average_score=round(sum(scores) / len(scores), 1) if scores else None,
        best_score=round(max(scores), 1) if scores else None,
        total_practice_minutes=total_mins,
        score_trend=trend,
        skill_breakdown=skill_breakdown,
        weak_areas=weak,
        strong_areas=strong,
        recent_sessions=[SessionOut.model_validate(s) for s in sessions[:5]],
    )
