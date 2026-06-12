import re
from typing import Dict, Any, Optional

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    np = None
    NUMPY_AVAILABLE = False


# Filler Words 
FILLER_WORDS = {
    "um", "uh", "like", "you know", "basically", "literally",
    "actually", "honestly", "right", "so yeah", "kind of", "sort of",
}


def analyze_transcription(text: str, duration_seconds: float) -> Dict[str, Any]:
    """Analyze transcribed text for speech patterns."""
    if not text:
        return _empty_metrics()

    words = text.lower().split()
    word_count = len(words)
    speech_rate_wpm = (word_count / duration_seconds * 60) if duration_seconds > 0 else 0

    filler_count = sum(text.lower().count(fw) for fw in FILLER_WORDS)

    sentences = re.split(r"[.!?]+", text.strip())
    sentence_count = len([s for s in sentences if s.strip()])

    unique_words = len(set(words))
    ttr = unique_words / word_count if word_count > 0 else 0

    if 130 <= speech_rate_wpm <= 160:
        rate_score = 100
    elif 110 <= speech_rate_wpm < 130 or 160 < speech_rate_wpm <= 180:
        rate_score = 80
    elif 90 <= speech_rate_wpm < 110 or 180 < speech_rate_wpm <= 200:
        rate_score = 60
    else:
        rate_score = max(0, 40 - abs(speech_rate_wpm - 145) * 0.5)

    filler_ratio = filler_count / word_count if word_count > 0 else 0
    filler_score = max(0, 100 - filler_ratio * 500)

    confidence_score = (rate_score * 0.4 + filler_score * 0.3 + min(ttr * 200, 100) * 0.3)

    return {
        "word_count": word_count,
        "speech_rate_wpm": round(speech_rate_wpm, 1),
        "filler_word_count": filler_count,
        "sentence_count": sentence_count,
        "vocabulary_diversity": round(ttr, 3),
        "confidence_score": round(min(confidence_score, 100), 1),
        "rate_score": round(rate_score, 1),
        "filler_score": round(filler_score, 1),
    }


def analyze_audio_bytes(audio_bytes: bytes, sample_rate: int = 16000) -> Dict[str, Any]:
    """
    Analyze raw audio bytes for acoustic features.
    Requires librosa + numpy installed. Falls back gracefully if unavailable.
    """
    if not NUMPY_AVAILABLE:
        return _empty_audio_metrics()

    try:
        import librosa

        audio_array = np.frombuffer(audio_bytes, dtype=np.float32)

        rms = librosa.feature.rms(y=audio_array)[0]
        energy_mean = float(np.mean(rms))
        energy_std = float(np.std(rms))

        f0 = librosa.yin(audio_array, fmin=80, fmax=400, sr=sample_rate)
        f0_voiced = f0[f0 > 0]
        pitch_mean = float(np.mean(f0_voiced)) if len(f0_voiced) > 0 else 0.0
        pitch_std = float(np.std(f0_voiced)) if len(f0_voiced) > 0 else 0.0

        intervals = librosa.effects.split(audio_array, top_db=30)
        pause_count = max(0, len(intervals) - 1)

        mfcc = librosa.feature.mfcc(y=audio_array, sr=sample_rate, n_mfcc=13)
        mfcc_mean = float(np.mean(mfcc[0]))

        return {
            "energy_mean": round(energy_mean, 4),
            "energy_std": round(energy_std, 4),
            "pitch_mean": round(pitch_mean, 2),
            "pitch_std": round(pitch_std, 2),
            "pause_count": pause_count,
            "mfcc_mean": round(mfcc_mean, 4),
        }

    except ImportError:
        return _empty_audio_metrics()
    except Exception:
        return _empty_audio_metrics()


def compute_voice_confidence(
    audio_metrics: Dict[str, Any],
    text_metrics: Dict[str, Any],
) -> float:
    """Combine acoustic + text features into a single confidence score."""
    base = text_metrics.get("confidence_score", 50.0)

    energy = audio_metrics.get("energy_mean", 0.05)
    energy_bonus = min(10, max(-10, (energy - 0.04) * 200))

    pauses = audio_metrics.get("pause_count", 0)
    pause_penalty = min(15, pauses * 1.5)

    final = base + energy_bonus - pause_penalty
    return round(max(0, min(100, final)), 1)


def _empty_metrics() -> Dict[str, Any]:
    return {
        "word_count": 0,
        "speech_rate_wpm": 0.0,
        "filler_word_count": 0,
        "sentence_count": 0,
        "vocabulary_diversity": 0.0,
        "confidence_score": 0.0,
        "rate_score": 0.0,
        "filler_score": 0.0,
    }


def _empty_audio_metrics() -> Dict[str, Any]:
    return {
        "energy_mean": 0.0,
        "energy_std": 0.0,
        "pitch_mean": 0.0,
        "pitch_std": 0.0,
        "pause_count": 0,
        "mfcc_mean": 0.0,
    }