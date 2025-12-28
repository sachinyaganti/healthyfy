from __future__ import annotations

from dataclasses import dataclass


@dataclass
class MentalResult:
    title: str
    actions: list[str]


def breathing_exercise(minutes: int = 2) -> MentalResult:
    mins = max(1, min(int(minutes or 2), 10))
    return MentalResult(
        title="Calm Now",
        actions=[
            f"Set a {mins}-minute timer.",
            "Inhale 4 seconds → hold 2 seconds → exhale 6 seconds.",
            "Relax shoulders on every exhale.",
            "After: name 1 thing you can do next (small and doable).",
        ],
    )


def journal_prompt() -> MentalResult:
    return MentalResult(
        title="Journaling Prompt",
        actions=[
            "What’s been taking up the most mental space today?",
            "What’s one thing I can control in the next 30 minutes?",
            "What would ‘good enough’ look like right now?",
        ],
    )
