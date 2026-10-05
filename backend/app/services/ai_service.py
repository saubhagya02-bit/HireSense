"""
AI Service — Groq (free tier) with Llama 3
Handles all AI features: question gen, answer eval, resume analysis, session summary
"""

import json
import re
from typing import List, Optional, Dict, Any
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)
MODEL = "openai/gpt-oss-120b"


async def _ask(prompt: str, max_tokens: int = 1500) -> str:
    """Send a prompt to Groq and return the text response."""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


def _extract_json_object(raw: str) -> Dict:
    """Robustly extract a JSON object from LLM output."""
    # Strip markdown fences
    raw = re.sub(r"```json|```", "", raw).strip()

    # Try direct parse first
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Try to find the outermost { ... }
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(raw[start : end + 1])
        except json.JSONDecodeError:
            pass

    # Fix common LLM JSON mistakes
    cleaned = raw
    # Remove trailing commas before } or ]
    cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)
    # Fix single quotes
    cleaned = cleaned.replace("'", '"')
    # Remove control characters
    cleaned = re.sub(r"[\x00-\x1f\x7f]", " ", cleaned)

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1:
        try:
            return json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError:
            pass

    # Return safe default
    return {}


def _extract_json_array(raw: str) -> List:
    """Robustly extract a JSON array from LLM output."""
    raw = re.sub(r"```json|```", "", raw).strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    start = raw.find("[")
    end = raw.rfind("]")
    if start != -1 and end != -1 and end > start:
        try:
            return json.loads(raw[start : end + 1])
        except json.JSONDecodeError:
            pass

    # Fix common mistakes
    cleaned = re.sub(r",\s*([}\]])", r"\1", raw)
    cleaned = re.sub(r"[\x00-\x1f\x7f]", " ", cleaned)
    start = cleaned.find("[")
    end = cleaned.rfind("]")
    if start != -1 and end != -1:
        try:
            return json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError:
            pass

    return []


# ─── Question Generation ─────────────────────────────────────
async def generate_interview_questions(
    role: str,
    interview_type: str,
    difficulty: str,
    count: int,
    skills: Optional[List[str]] = None,
    resume_context: Optional[str] = None,
) -> List[Dict[str, Any]]:
    skills_str = ", ".join(skills or []) or "general software engineering"
    resume_section = (
        f"\nCandidate resume:\n{resume_context[:1000]}" if resume_context else ""
    )

    prompt = f"""Generate {count} interview questions for a {difficulty} {role} position.
Interview type: {interview_type}
Key skills: {skills_str}{resume_section}

Return ONLY a valid JSON array. No markdown, no explanation, no extra text before or after.
Each object must have exactly these fields:
- "question_text": string
- "question_type": one of "conceptual", "coding", "behavioral", "system_design", "situational"
- "difficulty": one of "easy", "medium", "hard"
- "expected_topics": array of 3-4 strings
- "follow_up": string

Example format:
[{{"question_text": "...", "question_type": "conceptual", "difficulty": "medium", "expected_topics": ["topic1", "topic2"], "follow_up": "..."}}]"""

    raw = await _ask(prompt, max_tokens=2000)
    result = _extract_json_array(raw)

    # Validate and fill defaults if needed
    valid = []
    for item in result:
        if isinstance(item, dict) and item.get("question_text"):
            valid.append(
                {
                    "question_text": str(item.get("question_text", "")),
                    "question_type": str(item.get("question_type", "conceptual")),
                    "difficulty": str(item.get("difficulty", difficulty)),
                    "expected_topics": (
                        item.get("expected_topics", [])
                        if isinstance(item.get("expected_topics"), list)
                        else []
                    ),
                    "follow_up": str(item.get("follow_up", "")),
                }
            )

    if not valid:
        raise ValueError("AI returned no valid questions. Please try again.")

    return valid[:count]


# ─── Answer Evaluation ───────────────────────────────────────
async def evaluate_answer(
    question: str,
    answer: str,
    expected_topics: List[str],
    role: str,
    question_type: str,
) -> Dict[str, Any]:
    topics_str = ", ".join(expected_topics)

    prompt = f"""Evaluate this interview answer and return ONLY a valid JSON object.
No markdown, no explanation, no extra text.

Role: {role}
Question type: {question_type}
Question: {question}
Expected topics: {topics_str}
Answer: "{answer[:800]}"

Return exactly this JSON structure:
{{
  "relevance_score": <0-100>,
  "completeness_score": <0-100>,
  "clarity_score": <0-100>,
  "technical_accuracy": <0-100>,
  "overall_score": <0-100>,
  "ai_feedback": "<2-3 sentences of feedback>",
  "keywords_mentioned": ["topic1", "topic2"],
  "missing_keywords": ["topic3"]
}}"""

    raw = await _ask(prompt, max_tokens=600)
    result = _extract_json_object(raw)

    # Fill safe defaults for any missing fields
    return {
        "relevance_score": float(result.get("relevance_score", 50)),
        "completeness_score": float(result.get("completeness_score", 50)),
        "clarity_score": float(result.get("clarity_score", 50)),
        "technical_accuracy": float(result.get("technical_accuracy", 50)),
        "overall_score": float(result.get("overall_score", 50)),
        "ai_feedback": str(result.get("ai_feedback", "Answer recorded.")),
        "keywords_mentioned": (
            result.get("keywords_mentioned", [])
            if isinstance(result.get("keywords_mentioned"), list)
            else []
        ),
        "missing_keywords": (
            result.get("missing_keywords", [])
            if isinstance(result.get("missing_keywords"), list)
            else []
        ),
    }


# ─── Resume Analysis ─────────────────────────────────────────
async def analyze_resume(resume_text: str, target_role: str) -> Dict[str, Any]:
    # Trim resume text to avoid hitting token limits
    trimmed = resume_text[:2000]

    prompt = f"""Analyze this resume for a {target_role} position and return ONLY a valid JSON object.
No markdown, no explanation, no extra text before or after the JSON.

Resume text:
{trimmed}

Return exactly this JSON structure with no trailing commas:
{{
  "ats_score": <0-100 number>,
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {{"title": "Job Title", "company": "Company", "duration": "2 years", "highlights": ["achievement1"]}}
  ],
  "education": [
    {{"degree": "Degree Name", "institution": "University", "year": "2024"}}
  ],
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "ai_feedback": "2-3 sentences of overall assessment",
  "missing_skills": ["skill1"],
  "keyword_gaps": ["keyword1"]
}}"""

    raw = await _ask(prompt, max_tokens=1200)
    result = _extract_json_object(raw)

    # Return with safe defaults for all fields
    return {
        "ats_score": (
            float(result.get("ats_score", 60))
            if result.get("ats_score") is not None
            else 60.0
        ),
        "skills": (
            result.get("skills", []) if isinstance(result.get("skills"), list) else []
        ),
        "experience": (
            result.get("experience", [])
            if isinstance(result.get("experience"), list)
            else []
        ),
        "education": (
            result.get("education", [])
            if isinstance(result.get("education"), list)
            else []
        ),
        "strengths": (
            result.get("strengths", [])
            if isinstance(result.get("strengths"), list)
            else []
        ),
        "improvements": (
            result.get("improvements", [])
            if isinstance(result.get("improvements"), list)
            else []
        ),
        "ai_feedback": str(result.get("ai_feedback", "Resume analyzed successfully.")),
        "missing_skills": (
            result.get("missing_skills", [])
            if isinstance(result.get("missing_skills"), list)
            else []
        ),
        "keyword_gaps": (
            result.get("keyword_gaps", [])
            if isinstance(result.get("keyword_gaps"), list)
            else []
        ),
    }


# ─── Session Summary ─────────────────────────────────────────
async def generate_session_summary(
    role: str,
    answers_data: List[Dict],
    voice_metrics: Dict,
) -> Dict[str, Any]:
    answers_summary = "\n".join(
        [
            f"Q{i+1}: Score {a.get('overall_score', 0):.0f}/100"
            for i, a in enumerate(answers_data)
        ]
    )

    prompt = f"""Summarize this mock interview for a {role} candidate. Return ONLY a valid JSON object.
No markdown, no explanation, no extra text.

Answer scores:
{answers_summary}

Voice metrics:
- Speech rate: {voice_metrics.get('avg_speech_rate', 0):.0f} WPM (ideal: 130-160)
- Filler words: {voice_metrics.get('total_fillers', 0)}
- Confidence: {voice_metrics.get('avg_confidence', 0):.0f}/100

Return exactly this JSON:
{{
  "overall_score": <0-100>,
  "technical_score": <0-100>,
  "communication_score": <0-100>,
  "confidence_score": <0-100>,
  "ai_summary": "<3-4 sentence assessment>",
  "recommendations": ["rec1", "rec2", "rec3", "rec4", "rec5"],
  "next_steps": ["step1", "step2", "step3"]
}}"""

    raw = await _ask(prompt, max_tokens=800)
    result = _extract_json_object(raw)

    scores = [a.get("overall_score", 0) for a in answers_data]
    avg = sum(scores) / len(scores) if scores else 50

    return {
        "overall_score": float(result.get("overall_score", avg)),
        "technical_score": float(result.get("technical_score", avg)),
        "communication_score": float(result.get("communication_score", avg)),
        "confidence_score": float(result.get("confidence_score", avg)),
        "ai_summary": str(result.get("ai_summary", "Interview session completed.")),
        "recommendations": (
            result.get("recommendations", [])
            if isinstance(result.get("recommendations"), list)
            else []
        ),
        "next_steps": (
            result.get("next_steps", [])
            if isinstance(result.get("next_steps"), list)
            else []
        ),
    }


# ─── AI Follow-up ────────────────────────────────────────────
async def get_ai_interviewer_response(
    conversation_history: List[Dict],
    current_question: str,
    candidate_answer: str,
    role: str,
) -> str:
    prompt = f"""You are a technical interviewer for a {role} position.
The candidate answered: "{candidate_answer[:400]}"

Give a brief 1-2 sentence follow-up response as the interviewer.
Either ask a probing follow-up, acknowledge a good point, or redirect if they missed something."""

    return await _ask(prompt, max_tokens=150)
