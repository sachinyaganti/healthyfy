from __future__ import annotations

from app.vector.store import DocChunk


def wellness_seed_documents() -> list[DocChunk]:
    return [
        DocChunk(
            id="sleep_basics",
            text=(
                "Sleep basics (non-medical): keep a consistent wake time, get morning light, "
                "avoid heavy meals late, and build a 10-minute wind-down (low light, calm music, journaling)."
            ),
            meta={"topic": "sleep"},
        ),
        DocChunk(
            id="stress_reset",
            text=(
                "Stress reset: try 2 minutes of slow breathing (inhale 4, hold 2, exhale 6). "
                "Name one small next action and do it for 5 minutes."
            ),
            meta={"topic": "stress"},
        ),
        DocChunk(
            id="nutrition_plate",
            text=(
                "Balanced plate idea: half vegetables, a palm-sized protein, a fist-sized carb, "
                "and a thumb of healthy fat. Adjust portions to hunger and activity." 
            ),
            meta={"topic": "nutrition"},
        ),
        DocChunk(
            id="habit_building",
            text=(
                "Habit building: start with a 2-minute version, attach it to an existing routine, "
                "and track streaks gently—misses are data, not failure."
            ),
            meta={"topic": "habits"},
        ),
    ]
