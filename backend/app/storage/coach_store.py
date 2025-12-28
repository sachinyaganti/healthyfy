from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4


@dataclass
class CoachPlan:
    plan_id: str
    user_id: str
    goal: str
    created_at: str
    updated_at: str
    horizon_days: int
    plan_steps: List[str]
    next_actions: List[str]
    checkins: List[Dict[str, Any]]


class CoachStore:
    def __init__(self, data_dir: str | None = None) -> None:
        # Prefer explicit env configuration, but fall back to a stable default
        # anchored at the repository root so local runs from different CWDs
        # still persist to the same place.
        resolved = (
            data_dir
            or os.getenv("COACH_DATA_DIR")
            or os.getenv("VECTOR_DATA_DIR")
            or str(Path(__file__).resolve().parents[3] / "data")
        )
        self.data_dir = Path(resolved)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.path = self.data_dir / "coach_plans.json"

    def _now_iso(self) -> str:
        return datetime.utcnow().isoformat() + "Z"

    def _load_all(self) -> Dict[str, Any]:
        if not self.path.exists():
            return {"plans": {}}
        try:
            return json.loads(self.path.read_text(encoding="utf-8"))
        except Exception:
            return {"plans": {}}

    def _save_all(self, payload: Dict[str, Any]) -> None:
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(tmp, self.path)

    def create_plan(
        self,
        user_id: str,
        goal: str,
        horizon_days: int,
        plan_steps: List[str],
        next_actions: List[str],
    ) -> CoachPlan:
        now = self._now_iso()
        plan = CoachPlan(
            plan_id=str(uuid4()),
            user_id=user_id,
            goal=goal,
            created_at=now,
            updated_at=now,
            horizon_days=horizon_days,
            plan_steps=plan_steps,
            next_actions=next_actions,
            checkins=[],
        )

        payload = self._load_all()
        payload.setdefault("plans", {})
        payload["plans"][plan.plan_id] = asdict(plan)
        self._save_all(payload)
        return plan

    def get_plan(self, plan_id: str) -> Optional[CoachPlan]:
        payload = self._load_all()
        raw = (payload.get("plans") or {}).get(plan_id)
        if not raw:
            return None
        return CoachPlan(**raw)

    def update_plan(
        self,
        plan_id: str,
        plan_steps: Optional[List[str]] = None,
        next_actions: Optional[List[str]] = None,
        checkin: Optional[Dict[str, Any]] = None,
    ) -> Optional[CoachPlan]:
        payload = self._load_all()
        plans = payload.get("plans") or {}
        raw = plans.get(plan_id)
        if not raw:
            return None

        raw["updated_at"] = self._now_iso()
        if plan_steps is not None:
            raw["plan_steps"] = plan_steps
        if next_actions is not None:
            raw["next_actions"] = next_actions
        if checkin is not None:
            raw.setdefault("checkins", [])
            raw["checkins"].insert(0, checkin)

        plans[plan_id] = raw
        payload["plans"] = plans
        self._save_all(payload)
        return CoachPlan(**raw)
