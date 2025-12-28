from __future__ import annotations

import os
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.agents.goal_coach_agent import adapt_plan_from_checkin, create_goal_plan
from app.llm.llm_client import LLMClient
from app.rules.safety_guardrails import DISCLAIMER
from app.storage.coach_store import CoachStore

router = APIRouter()


def _store() -> CoachStore:
    # CoachStore handles env and stable defaults internally.
    return CoachStore()


def _maybe_llm() -> Optional[LLMClient]:
    # Uses existing LLM client config if environment is set; otherwise None.
    try:
        client = LLMClient()
        if not client.is_configured:
            return None
        return client
    except Exception:
        return None


class CreateGoalRequest(BaseModel):
    user_id: str = Field("demo", description="User identifier (frontend can pass auth user id).")
    goal: str = Field(..., min_length=3, max_length=500)
    horizon_days: int = Field(7, ge=1, le=30)
    context: Dict[str, Any] = Field(default_factory=dict)


@router.post("/coach/goal")
def coach_create_goal(req: CreateGoalRequest):
    llm = _maybe_llm()
    res = create_goal_plan(goal=req.goal, horizon_days=req.horizon_days, user_context=req.context, llm=llm)

    plan = _store().create_plan(
        user_id=req.user_id,
        goal=req.goal,
        horizon_days=req.horizon_days,
        plan_steps=res.plan_steps,
        next_actions=res.next_actions,
    )

    return {
        "disclaimer": DISCLAIMER,
        "plan_id": plan.plan_id,
        "title": res.title,
        "reasoning_summary": res.reasoning_summary,
        "plan_steps": plan.plan_steps,
        "next_actions": plan.next_actions,
        "created_at": plan.created_at,
    }


class CheckinRequest(BaseModel):
    plan_id: str
    adherence: float = Field(0.5, ge=0.0, le=1.0, description="How well you followed the plan (0..1).")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Any tracked metrics (minutes, water, mood…).")
    notes: str = Field("", max_length=1000)


@router.post("/coach/checkin")
def coach_checkin(req: CheckinRequest):
    store = _store()
    plan = store.get_plan(req.plan_id)
    if not plan:
        return {"disclaimer": DISCLAIMER, "error": "plan_not_found"}

    checkin = {
        "at": datetime.utcnow().isoformat() + "Z",
        "adherence": req.adherence,
        "metrics": req.metrics,
        "notes": req.notes,
    }

    llm = _maybe_llm()
    updated = adapt_plan_from_checkin(
        goal=plan.goal,
        prior_plan_steps=plan.plan_steps,
        prior_next_actions=plan.next_actions,
        checkin=checkin,
        llm=llm,
    )

    saved = store.update_plan(
        plan_id=req.plan_id,
        plan_steps=updated.plan_steps,
        next_actions=updated.next_actions,
        checkin=checkin,
    )

    return {
        "disclaimer": DISCLAIMER,
        "plan_id": req.plan_id,
        "title": updated.title,
        "reasoning_summary": updated.reasoning_summary,
        "plan_steps": saved.plan_steps if saved else updated.plan_steps,
        "next_actions": saved.next_actions if saved else updated.next_actions,
        "last_checkin": checkin,
    }


@router.get("/coach/state/{plan_id}")
def coach_state(plan_id: str):
    plan = _store().get_plan(plan_id)
    if not plan:
        return {"disclaimer": DISCLAIMER, "error": "plan_not_found"}

    return {
        "disclaimer": DISCLAIMER,
        "plan_id": plan.plan_id,
        "user_id": plan.user_id,
        "goal": plan.goal,
        "horizon_days": plan.horizon_days,
        "created_at": plan.created_at,
        "updated_at": plan.updated_at,
        "plan_steps": plan.plan_steps,
        "next_actions": plan.next_actions,
        "checkins": plan.checkins,
    }
