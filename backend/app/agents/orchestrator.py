from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Literal

from app.agents.fitness_agent import build_fitness_plan
from app.agents.nutrition_agent import build_meal_plan
from app.agents.mental_agent import breathing_exercise, journal_prompt
from app.agents.chronic_agent import chronic_lifestyle_support
from app.llm.llm_client import LLMClient
from app.rules.safety_guardrails import enforce_guardrails, DISCLAIMER


Domain = Literal["fitness", "nutrition", "mental", "chronic", "general"]


@dataclass
class OrchestratorResponse:
    domain: Domain
    reply: str
    tool_payload: dict[str, Any] | None = None


def _detect_domain_rule_based(text: str) -> Domain:
    t = (text or "").lower()
    if any(k in t for k in ["workout", "exercise", "steps", "strength", "cardio", "habit"]):
        return "fitness"
    if any(k in t for k in ["meal", "diet", "calorie", "protein", "nutrition", "food"]):
        return "nutrition"
    if any(k in t for k in ["stress", "anx", "mind", "sleep", "breath", "mood", "journal"]):
        return "mental"
    if any(k in t for k in ["diabetes", "thyroid", "pcos", "hypertension", "chronic"]):
        return "chronic"
    return "general"


class AgentOrchestrator:
    def __init__(self):
        self.llm = LLMClient()

    async def handle(self, user_text: str, user_context: dict[str, Any] | None = None) -> OrchestratorResponse:
        guard = enforce_guardrails(user_text)
        if not guard.allowed:
            return OrchestratorResponse(domain="general", reply=guard.safe_response or DISCLAIMER)

        domain = _detect_domain_rule_based(user_text)

        # Try LLM tool JSON if configured; otherwise use deterministic agent tools.
        if self.llm.is_configured():
            context = {"disclaimer": DISCLAIMER, "domain_hint": domain, "user_context": user_context or {}}
            llm_resp = await self.llm.chat(user_text, context=context)

            # If LLM returns JSON tool call, execute; else return as-is.
            text = (llm_resp.text or "").strip()
            if text.startswith("{") and text.endswith("}"):
                try:
                    payload = json.loads(text)
                    tool = payload.get("tool")
                    args = payload.get("args") or {}
                    tool_result = self._execute_tool(tool, args)
                    return OrchestratorResponse(domain=domain, reply=tool_result, tool_payload=payload)
                except Exception:
                    return OrchestratorResponse(domain=domain, reply=text)

            return OrchestratorResponse(domain=domain, reply=text)

        # Offline mode: call deterministic domain tools.
        return OrchestratorResponse(domain=domain, reply=self._offline_reply(domain, user_text, user_context or {}))

    def _execute_tool(self, tool: str, args: dict[str, Any]) -> str:
        if tool == "fitness_plan":
            res = build_fitness_plan(args.get("goal", "general fitness"), args.get("level", "beginner"))
            return "\n".join([f"{DISCLAIMER}", "", res.title, *[f"- {x}" for x in res.plan], "", "YouTube:", *[f"- {u}" for u in res.youtube_links]])
        if tool == "meal_plan":
            res = build_meal_plan(args.get("preference", "balanced"), args.get("allergies", ""))
            return "\n".join([f"{DISCLAIMER}", "", res.title, "Meal ideas:", *[f"- {m}" for m in res.meal_plan], "Tips:", *[f"- {t}" for t in res.tips]])
        if tool == "breathing":
            res = breathing_exercise(args.get("minutes", 2))
            return "\n".join([f"{DISCLAIMER}", "", res.title, *[f"- {a}" for a in res.actions]])
        if tool == "journal_prompt":
            res = journal_prompt()
            return "\n".join([f"{DISCLAIMER}", "", res.title, *[f"- {a}" for a in res.actions]])
        if tool == "chronic_support":
            res = chronic_lifestyle_support(args.get("condition", ""))
            return "\n".join([f"{DISCLAIMER}", "", res.title, "Lifestyle tips:", *[f"- {t}" for t in res.lifestyle_tips], "Stories:", *[f"- {s}" for s in res.community_stories]])
        return f"{DISCLAIMER}\n\nI can help with fitness, nutrition, stress, and habit building. What’s your goal?"

    def _offline_reply(self, domain: Domain, user_text: str, user_context: dict[str, Any]) -> str:
        if domain == "fitness":
            res = build_fitness_plan("general fitness", user_context.get("fitness_level", "beginner"))
            return "\n".join([f"{DISCLAIMER}", "", res.title, *[f"- {x}" for x in res.plan], "", "YouTube:", *[f"- {u}" for u in res.youtube_links]])
        if domain == "nutrition":
            res = build_meal_plan(user_context.get("diet_preference", "balanced"), user_context.get("allergies", ""))
            return "\n".join([f"{DISCLAIMER}", "", res.title, "Meal ideas:", *[f"- {m}" for m in res.meal_plan], "Tips:", *[f"- {t}" for t in res.tips]])
        if domain == "mental":
            if "journal" in (user_text or "").lower():
                res = journal_prompt()
            else:
                res = breathing_exercise(2)
            return "\n".join([f"{DISCLAIMER}", "", res.title, *[f"- {a}" for a in res.actions]])
        if domain == "chronic":
            res = chronic_lifestyle_support("")
            return "\n".join([f"{DISCLAIMER}", "", res.title, "Lifestyle tips:", *[f"- {t}" for t in res.lifestyle_tips], "Stories:", *[f"- {s}" for s in res.community_stories]])

        return (
            f"{DISCLAIMER}\n\n"
            "Tell me what you want to improve (energy, sleep, stress, fitness, nutrition), "
            "and I’ll suggest one small next step you can do today."
        )
