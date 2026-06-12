"""
AI Service — Groq (free tier) with Llama 3.3 70b
Handles all AI features: question gen, answer eval, resume analysis, session summary
"""

import json
import re
from typing import List, Optional, Dict, Any
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)
MODEL = "llama-3.3-70b-versatile"


async def _ask(prompt: str, max_tokens: int = 1500) -> str:
    """Send a prompt to Groq and return the text response."""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()


# Question Generation 
async def generate_interview_questions(
    role: str,
    interview_type: str,
    difficulty: str,
    count: int,
    skills: Optional[List[str]] = None,
    resume_context: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Generate tailored interview questions."""

    skills_str = ", ".join(skills or []) or "general software engineering"
    resume_section = f"\nCandidate resume context:\n{resume_context[:1500]}" if resume_context else ""

    prompt = f"""You are a senior technical interviewer at a top tech company.
Generate {count} interview questions for a {difficulty} {role} position.
Interview type: {interview_type}
Key skills to assess: {skills_str}{resume_section}

Return a JSON array with exactly {count} objects. Each object must have:
- "question_text": the full interview question
- "question_type": one of "conceptual", "coding", "behavioral", "system_design", "situational"
- "difficulty": "easy", "medium", or "hard"
- "expected_topics": array of 3-5 key topics the answer should cover
- "follow_up": a natural follow-up question

Return ONLY the JSON array, no markdown, no explanation, no extra text."""

    raw = await _ask(prompt, max_tokens=2000)
    raw = re.sub(r"```json|```", "", raw).strip()
    # Extract JSON array if there's extra text
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if match:
        raw = match.group(0)
    return json.loads(raw)


# Answer Evaluation 
async def evaluate_answer(
    question: str,
    answer: str,
    expected_topics: List[str],
    role: str,
    question_type: str,
) -> Dict[str, Any]:
    """Score and provide feedback on a candidate's answer."""

    topics_str = ", ".join(expected_topics)

    prompt = f"""You are an expert technical interviewer evaluating a candidate's answer.

Role: {role}
Question type: {question_type}
Question: {question}
Expected topics: {topics_str}

Candidate's answer:
"{answer}"

Evaluate and return a JSON object with:
- "relevance_score": 0-100
- "completeness_score": 0-100
- "clarity_score": 0-100
- "technical_accuracy": 0-100
- "overall_score": 0-100 (weighted average)
- "ai_feedback": 2-3 sentences of constructive feedback
- "keywords_mentioned": array of expected topics they covered
- "missing_keywords": array of important topics they missed

Return ONLY the JSON object, no markdown, no extra text."""

    raw = await _ask(prompt, max_tokens=800)
    raw = re.sub(r"```json|```", "", raw).strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        raw = match.group(0)
    return json.loads(raw)


# Resume Analysis
async def analyze_resume(resume_text: str, target_role: str) -> Dict[str, Any]:
    """Comprehensive resume review with ATS scoring."""

    prompt = f"""You are an expert technical recruiter analyzing a resume for a {target_role} position.

Resume:
{resume_text[:3000]}

Return a JSON object with:
- "ats_score": 0-100 (ATS compatibility)
- "skills": array of technical skills found
- "experience": array of objects with {{title, company, duration, highlights[]}}
- "education": array of objects with {{degree, institution, year}}
- "strengths": array of 3-5 resume strengths
- "improvements": array of 3-5 actionable improvements
- "ai_feedback": 3-4 sentences of overall assessment
- "missing_skills": array of skills important for {target_role} that are absent
- "keyword_gaps": array of ATS keywords missing for this role

Return ONLY the JSON object, no markdown, no extra text."""

    raw = await _ask(prompt, max_tokens=1500)
    raw = re.sub(r"```json|```", "", raw).strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        raw = match.group(0)
    return json.loads(raw)


# Session Summary
async def generate_session_summary(
    role: str,
    answers_data: List[Dict],
    voice_metrics: Dict,
) -> Dict[str, Any]:
    """Generate comprehensive post-interview analysis."""

    answers_summary = "\n".join([
        f"Q{i+1}: Score {a.get('overall_score', 0):.0f}/100 — {a.get('ai_feedback', '')[:150]}"
        for i, a in enumerate(answers_data)
    ])

    prompt = f"""You are a senior interview coach summarizing a mock interview for a {role} candidate.

Answer performance:
{answers_summary}

Voice/communication metrics:
- Average speech rate: {voice_metrics.get('avg_speech_rate', 0):.0f} WPM (ideal: 130-160)
- Filler words used: {voice_metrics.get('total_fillers', 0)} total
- Average confidence score: {voice_metrics.get('avg_confidence', 0):.0f}/100

Return a JSON object with:
- "overall_score": 0-100
- "technical_score": 0-100
- "communication_score": 0-100
- "confidence_score": 0-100
- "ai_summary": 3-4 sentence comprehensive assessment
- "recommendations": array of 5 specific actionable improvements
- "next_steps": array of 3 study/practice suggestions

Return ONLY the JSON object, no markdown, no extra text."""

    raw = await _ask(prompt, max_tokens=1000)
    raw = re.sub(r"```json|```", "", raw).strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        raw = match.group(0)
    return json.loads(raw)


# AI Follow-up
async def get_ai_interviewer_response(
    conversation_history: List[Dict],
    current_question: str,
    candidate_answer: str,
    role: str,
) -> str:
    """Generate a dynamic interviewer follow-up response."""

    history_text = "\n".join([
        f"{m['role'].upper()}: {m['content']}"
        for m in conversation_history[-4:]
    ])

    prompt = f"""You are an experienced technical interviewer for a {role} position.
Be professional and concise (2-3 sentences max).

Conversation so far:
{history_text}

The candidate just answered: "{candidate_answer}"

Either ask a targeted follow-up question, acknowledge a good point, or gently redirect if they missed the mark.
Respond naturally as an interviewer would."""

    return await _ask(prompt, max_tokens=200)