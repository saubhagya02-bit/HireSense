from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    Enum as SQLEnum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.core.database import Base


# Enums
class InterviewStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class InterviewType(str, enum.Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    SYSTEM_DESIGN = "system_design"
    HR = "hr"
    MIXED = "mixed"


class DifficultyLevel(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


# User
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    target_role = Column(String(255))
    experience_years = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    resumes = relationship("Resume", back_populates="user")
    interviews = relationship("InterviewSession", back_populates="user")


# Resume
class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    storage_key = Column(String(512), nullable=False)
    parsed_text = Column(Text)
    skills = Column(JSON, default=list)
    experience = Column(JSON, default=list)
    education = Column(JSON, default=list)
    ai_feedback = Column(Text)
    ats_score = Column(Float) 
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="resumes")


# Interview Session
class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=True)
    title = Column(String(255), nullable=False)
    interview_type = Column(SQLEnum(InterviewType), default=InterviewType.TECHNICAL)
    difficulty = Column(SQLEnum(DifficultyLevel), default=DifficultyLevel.INTERMEDIATE)
    status = Column(SQLEnum(InterviewStatus), default=InterviewStatus.PENDING)
    target_role = Column(String(255))
    total_questions = Column(Integer, default=5)
    duration_minutes = Column(Integer)  
    overall_score = Column(Float)  
    technical_score = Column(Float)
    communication_score = Column(Float)
    confidence_score = Column(Float)
    ai_summary = Column(Text)  
    recommendations = Column(JSON, default=list)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="interviews")
    questions = relationship(
        "InterviewQuestion", back_populates="session", cascade="all, delete-orphan"
    )
    answers = relationship(
        "InterviewAnswer", back_populates="session", cascade="all, delete-orphan"
    )


# Interview Question
class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    order_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(100))  
    difficulty = Column(String(50))
    expected_topics = Column(JSON, default=list)  
    follow_up = Column(Text)  
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship("InterviewAnswer", back_populates="question", uselist=False)


# Interview Answer
class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("interview_questions.id"), nullable=False)
    transcribed_text = Column(Text)  
    audio_storage_key = Column(String(512))  
    duration_seconds = Column(Float)

    # Voice analysis
    speech_rate_wpm = Column(Float)  
    filler_word_count = Column(Integer) 
    pause_count = Column(Integer)
    energy_mean = Column(Float)  
    pitch_mean = Column(Float)
    confidence_score = Column(Float)  

    # AI scoring
    relevance_score = Column(Float)  
    completeness_score = Column(Float)
    clarity_score = Column(Float)
    technical_accuracy = Column(Float)
    overall_score = Column(Float)
    ai_feedback = Column(Text) 
    keywords_mentioned = Column(JSON, default=list)
    missing_keywords = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("InterviewSession", back_populates="answers")
    question = relationship("InterviewQuestion", back_populates="answer")
