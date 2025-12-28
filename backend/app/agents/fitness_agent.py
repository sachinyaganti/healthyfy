from __future__ import annotations

from dataclasses import dataclass


@dataclass
class FitnessResult:
    title: str
    plan: list[str]
    youtube_links: list[str]


def build_fitness_plan(goal: str, level: str) -> FitnessResult:
    goal_l = (goal or "").lower()
    level_l = (level or "beginner").lower()

    if "strength" in goal_l:
        plan = [
            f"{level_l.title()} strength: 3 workouts this week (20–35 min).",
            "Pick 4 moves: squat, push, hinge, pull. Do 2–3 sets each.",
            "Finish with a 5-minute easy stretch.",
            "Track: session done + how you felt (1–10).",
        ]
        links = [
            "https://www.youtube.com/results?search_query=beginner+full+body+strength+workout",
            "https://www.youtube.com/results?search_query=bodyweight+strength+workout+no+equipment",
        ]
    else:
        plan = [
            f"{level_l.title()} movement: 4 sessions this week (15–30 min).",
            "2 days brisk walking or easy cycling; 2 days mobility + light strength.",
            "Keep intensity ‘talk-test’ friendly.",
            "Track: minutes moved + mood after.",
        ]
        links = [
            "https://www.youtube.com/results?search_query=low+impact+cardio+workout",
            "https://www.youtube.com/results?search_query=beginner+mobility+routine",
        ]

    return FitnessResult(title="Personal Fitness Coaching", plan=plan, youtube_links=links)
