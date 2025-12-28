from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Optional

import httpx

from app.llm.prompts import SYSTEM_PROMPT


@dataclass
class LLMResponse:
    text: str


class LLMClient:
    """Hosted LLM abstraction.

    Supports:
      - OpenAI-compatible Chat Completions API (including Azure OpenAI with a compatible endpoint).

    Env vars:
      - LLM_BASE_URL (default: https://api.openai.com/v1)
      - LLM_API_KEY
      - LLM_MODEL (default: gpt-4o-mini)
    """

    def __init__(self):
        self.base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
        self.api_key = os.getenv("LLM_API_KEY", "")
        self.model = os.getenv("LLM_MODEL", "gpt-4o-mini")

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def chat(self, user_text: str, context: Optional[dict[str, Any]] = None) -> LLMResponse:
        if not self.is_configured():
            # Deterministic fallback: still provides usable, non-medical help.
            return LLMResponse(
                text=(
                    "Healthyfy (offline mode): I can still help with non-medical wellness. "
                    "Tell me your goal (fitness, nutrition, stress, sleep) and your current routine, and I’ll suggest a simple next step."
                )
            )

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
        ]
        if context:
            messages.append({"role": "system", "content": f"Context: {json.dumps(context, ensure_ascii=False)}"})
        messages.append({"role": "user", "content": user_text})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.4,
        }

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            text = data["choices"][0]["message"]["content"]
            return LLMResponse(text=text)
