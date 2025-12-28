from __future__ import annotations

import re
from dataclasses import dataclass


MEDICAL_BLOCK_PATTERNS = [
    r"\bdiagnos(e|is)\b",
    r"\bprescrib(e|ing|ed)\b",
    r"\bdosage\b",
    r"\bmg\b",
    r"\bantibiotic\b",
    r"\binsulin\b",
    r"\bshould i take\b",
    r"\bwhat medication\b",
    r"\bcure\b",
    r"\btreat(ment)?\b",
    r"\bside effects?\b",
]

RED_FLAG_PATTERNS = [
    r"\bchest pain\b",
    r"\bshortness of breath\b",
    r"\bfaint(ing)?\b",
    r"\bsuicid(al|e)\b",
    r"\bself-harm\b",
    r"\bstroke\b",
    r"\bsevere\b.*\bheadache\b",
]

DISCLAIMER = (
    "Healthyfy provides wellness and lifestyle support only. "
    "It does NOT diagnose, treat, or replace professional medical advice."
)


@dataclass
class GuardrailResult:
    allowed: bool
    reason: str | None = None
    safe_response: str | None = None


def _matches_any(text: str, patterns: list[str]) -> bool:
    for pat in patterns:
        if re.search(pat, text, flags=re.IGNORECASE):
            return True
    return False


def enforce_guardrails(user_text: str) -> GuardrailResult:
    text = (user_text or "").strip()
    if not text:
        return GuardrailResult(allowed=True)

    if _matches_any(text, RED_FLAG_PATTERNS):
        return GuardrailResult(
            allowed=False,
            reason="red_flag",
            safe_response=(
                f"{DISCLAIMER}\n\n"
                "I’m really sorry you’re dealing with this. I can’t help with medical emergencies. "
                "If you feel unsafe or have severe symptoms, please seek urgent care or contact local emergency services right now. "
                "If you can, reach out to someone you trust and stay with them."
            ),
        )

    if _matches_any(text, MEDICAL_BLOCK_PATTERNS):
        return GuardrailResult(
            allowed=False,
            reason="medical_request",
            safe_response=(
                f"{DISCLAIMER}\n\n"
                "I can’t provide diagnosis, prescriptions, or medication guidance. "
                "If you’re concerned about symptoms or treatment, please talk to a licensed clinician.\n\n"
                "If you’d like, tell me your wellness goal (energy, sleep, fitness, stress), and I can share safe lifestyle options."
            ),
        )

    return GuardrailResult(allowed=True)
