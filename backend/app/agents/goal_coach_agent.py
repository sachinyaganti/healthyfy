from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from app.llm.llm_client import LLMClient
from app.rules.safety_guardrails import enforce_guardrails


@dataclass
class CoachPlanResult:
    title: str
    plan_steps: List[str]
    next_actions: List[str]
    reasoning_summary: str


def _fallback_plan(goal: str, horizon_days: int) -> CoachPlanResult:
    g = (goal or "").strip() or "Improve wellness"
    steps = [
        f"Clarify goal: {g} (define what success looks like).",
        "Pick 1–2 metrics you can track daily (minutes moved, water, mood, sleep).",
        "Choose 2 tiny habits that fit your week (10–20 min).",
        "Schedule those habits (specific days/times).",
        "Run for 7 days, then review and adjust based on what actually happened.",
    ]
    next_actions = [
        "Today: do the smallest version (10 minutes).",
        "Tonight: log 1 metric (quick number).",
        "Tomorrow: repeat; if missed, shrink the task and retry.",
    ]
    return CoachPlanResult(
        title=f"Goal Coach Plan ({horizon_days}d)",
        plan_steps=steps,
        next_actions=next_actions,
        reasoning_summary="Rule-based fallback coach (no external model required).",
    )


def create_goal_plan(
    *,
    goal: str,
    horizon_days: int = 7,
    user_context: Optional[Dict[str, Any]] = None,
    llm: Optional[LLMClient] = None,
) -> CoachPlanResult:
    # Safety: never provide diagnosis/treatment; keep lifestyle-only.
    safe = enforce_guardrails(goal)
    if not safe.allowed:
        # If the user asks for medical instruction or shares red-flag content,
        # return a safe coaching frame (non-medical).
        return _fallback_plan("Non-medical wellness goal", horizon_days)

    if llm is None:
        return _fallback_plan(goal, horizon_days)

    # LLM-assisted plan generation (still constrained to lifestyle coaching).
    ctx = user_context or {}
    prompt = (
        "You are Healthyfy Goal Coach. You create non-medical wellness/fitness plans. "
        "Do NOT diagnose, prescribe, or provide medical treatment advice. "
        "Output JSON with keys: title, plan_steps (array), next_actions (array), reasoning_summary (string).\n\n"
        f"Goal: {goal}\n"
        f"Horizon days: {horizon_days}\n"
        f"Context (optional): {ctx}\n"
        "Make it practical: small actions, clear schedule hints, and simple tracking."
    )

    try:
        raw = llm.complete(prompt)
        # LLMClient returns text; keep this robust and fallback if parsing fails.
        import json

        data = json.loads(raw)
        title = str(data.get("title") or "Goal Coach Plan")
        plan_steps = [str(x) for x in (data.get("plan_steps") or []) if str(x).strip()]
        next_actions = [str(x) for x in (data.get("next_actions") or []) if str(x).strip()]
        reasoning_summary = str(data.get("reasoning_summary") or "LLM-assisted plan")

        if not plan_steps or not next_actions:
            return _fallback_plan(goal, horizon_days)

        return CoachPlanResult(
            title=title,
            plan_steps=plan_steps[:10],
            next_actions=next_actions[:6],
            reasoning_summary=reasoning_summary,
        )
    except Exception:
        return _fallback_plan(goal, horizon_days)


def adapt_plan_from_checkin(
    *,
    goal: str,
    prior_plan_steps: List[str],
    prior_next_actions: List[str],
    checkin: Dict[str, Any],
    llm: Optional[LLMClient] = None,
) -> CoachPlanResult:
    """Simple adaptation loop: adjust based on adherence + notes.

    If user missed tasks, we shrink and simplify. If they succeeded, we gently progress.
    """
    adherence = float(checkin.get("adherence", 0.0) or 0.0)
    notes = str(checkin.get("notes") or "").strip()

    if llm is None:
        if adherence < 0.4:
            plan_steps = prior_plan_steps[:]
            next_actions = [
                "Shrink the next step by 50% (time or difficulty).",
                "Make it frictionless: prepare clothes/water the night before.",
                "Choose 3 fixed days this week and protect them on your calendar.",
            ]
            return CoachPlanResult(
                title="Adjusted plan (make it easier)",
                plan_steps=plan_steps[:10],
                next_actions=next_actions,
                reasoning_summary="Low adherence → reduce scope and increase consistency.",
            )

        if adherence > 0.8:
            next_actions = [
                "Keep the same schedule and add +5 minutes to one session.",
                "Add 1 strength/mobility move (2 sets) on your easiest day.",
                "Continue tracking 1 metric daily.",
            ]
            return CoachPlanResult(
                title="Adjusted plan (gentle progression)",
                plan_steps=prior_plan_steps[:10],
                next_actions=next_actions,
                reasoning_summary="High adherence → small progression while keeping routine.",
            )

        return CoachPlanResult(
            title="Adjusted plan (stay steady)",
            plan_steps=prior_plan_steps[:10],
            next_actions=prior_next_actions[:6],
            reasoning_summary="Moderate adherence → keep plan steady.",
        )

    prompt = (
        "You are Healthyfy Goal Coach. Adapt a non-medical plan based on check-in. "
        "Do NOT diagnose, prescribe, or provide medical treatment advice. "
        "Output JSON with keys: title, plan_steps (array), next_actions (array), reasoning_summary.\n\n"
        f"Goal: {goal}\n"
        f"Prior plan steps: {prior_plan_steps}\n"
        f"Prior next actions: {prior_next_actions}\n"
        f"Check-in: {checkin}\n"
        f"Notes: {notes}\n"
        "Rules: if adherence is low, shrink tasks; if high, progress slightly; keep it simple and actionable."
    )

    try:
        raw = llm.complete(prompt)
        import json

        data = json.loads(raw)
        title = str(data.get("title") or "Adjusted plan")
        plan_steps = [str(x) for x in (data.get("plan_steps") or []) if str(x).strip()]
        next_actions = [str(x) for x in (data.get("next_actions") or []) if str(x).strip()]
        reasoning_summary = str(data.get("reasoning_summary") or "LLM-assisted adaptation")

        if not plan_steps or not next_actions:
            return adapt_plan_from_checkin(
                goal=goal,
                prior_plan_steps=prior_plan_steps,
                prior_next_actions=prior_next_actions,
                checkin=checkin,
                llm=None,
            )

        return CoachPlanResult(
            title=title,
            plan_steps=plan_steps[:10],
            next_actions=next_actions[:6],
            reasoning_summary=reasoning_summary,
        )
    except Exception:
        return adapt_plan_from_checkin(
            goal=goal,
            prior_plan_steps=prior_plan_steps,
            prior_next_actions=prior_next_actions,
            checkin=checkin,
            llm=None,
        )
