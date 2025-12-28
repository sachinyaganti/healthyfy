from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ChronicSupportResult:
    title: str
    lifestyle_tips: list[str]
    community_stories: list[str]


def chronic_lifestyle_support(condition: str) -> ChronicSupportResult:
    c = (condition or "").strip() or "your condition"
    tips = [
        f"For {c}: build a steady routine (sleep, meals, movement) rather than extremes.",
        "Track how habits affect your energy and mood; look for patterns.",
        "Prefer gentle consistency: small changes you can repeat weekly.",
        "Bring questions to a clinician for medical decisions; use Healthyfy for lifestyle support.",
    ]
    stories = [
        "Story: ‘I started with 10-minute walks after lunch—after a month, my energy felt steadier.’",
        "Story: ‘Meal prep on Sundays helped me avoid decision fatigue during the week.’",
        "Story: ‘Breathing exercises became my reset between meetings.’",
    ]
    return ChronicSupportResult(title="Chronic Condition Support (Non-Diagnostic)", lifestyle_tips=tips, community_stories=stories)
