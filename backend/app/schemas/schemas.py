from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8)
    target_role: Optional[str] = None
    experience_years: Optional[int] = 0


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    target_role: Optional[str]
    experience_years: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# Interview Schemas
class InterviewCreate(BaseModel):
    title: str
    interview_type: str = "technical"
    difficulty: str = "intermediate"
    target_role: Optional[str] = None
    total_questions: int = Field(default=5, ge=3, le=15)
    resume_id: Optional[int] = None


class QuestionOut(BaseModel):
    id: int
    order_number: int
    question_text: str
    question_type: str
    difficulty: str
    expected_topics: List[str]
    follow_up: Optional[str]

    class Config:
        from_attributes = True


class AnswerSubmit(BaseModel):
    question_id: int
    transcribed_text: str
    duration_seconds: Optional[float] = None
    audio_storage_key: Optional[str] = None
    speech_rate_wpm: Optional[float] = None
    filler_word_count: Optional[int] = None


class AnswerOut(BaseModel):
    id: int
    question_id: int
    transcribed_text: Optional[str]
    duration_seconds: Optional[float]
    speech_rate_wpm: Optional[float]
    filler_word_count: Optional[int]
    confidence_score: Optional[float]
    relevance_score: Optional[float]
    completeness_score: Optional[float]
    clarity_score: Optional[float]
    technical_accuracy: Optional[float]
    overall_score: Optional[float]
    ai_feedback: Optional[str]
    keywords_mentioned: List[str]
    missing_keywords: List[str]

    class Config:
        from_attributes = True


class SessionOut(BaseModel):
    id: int
    title: str
    interview_type: str
    difficulty: str
    status: str
    target_role: Optional[str]
    total_questions: int
    overall_score: Optional[float]
    technical_score: Optional[float]
    communication_score: Optional[float]
    confidence_score: Optional[float]
    ai_summary: Optional[str]
    recommendations: List[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    questions: List[QuestionOut] = []
    answers: List[AnswerOut] = []

    class Config:
        from_attributes = True


# Resume Schemas
class ResumeOut(BaseModel):
    id: int
    filename: str
    skills: List[str]
    experience: list
    education: list
    ai_feedback: Optional[str]
    ats_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


# Analytics Schemas
class AnalyticsSummary(BaseModel):
    total_sessions: int
    completed_sessions: int
    average_score: Optional[float]
    best_score: Optional[float]
    total_practice_minutes: Optional[float]
    score_trend: List[dict]  
    skill_breakdown: List[dict]  
    weak_areas: List[str]
    strong_areas: List[str]
    recent_sessions: List[SessionOut]
