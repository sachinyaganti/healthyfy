from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel, Field


FitnessLevel = Literal["beginner", "intermediate", "advanced"]
DietPreference = Literal["balanced", "vegetarian", "vegan", "high-protein", "low-carb"]


class UserContext(BaseModel):
    user_id: Optional[int] = Field(default=None, description="Internal user id")
    display_name: Optional[str] = None

    goals: list[str] = Field(default_factory=list)
    fitness_level: FitnessLevel = "beginner"
    diet_preference: DietPreference = "balanced"
    equipment: list[str] = Field(default_factory=list)

    stress_level: Optional[int] = Field(default=None, ge=1, le=10)
    sleep_hours: Optional[float] = Field(default=None, ge=0, le=24)
