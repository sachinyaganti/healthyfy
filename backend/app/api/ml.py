from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.ml.forecast import forecast_linear
from app.rules.safety_guardrails import DISCLAIMER

router = APIRouter()


class ForecastRequest(BaseModel):
    series: list[float] = Field(default_factory=list, description="Numeric time series values (oldest->newest).")
    horizon: int = Field(7, ge=1, le=30, description="How many future points to forecast.")


@router.post("/ml/forecast")
def ml_forecast(req: ForecastRequest):
    res = forecast_linear(req.series, req.horizon)
    return {
        "disclaimer": DISCLAIMER,
        "model": res.model,
        "intercept": res.intercept,
        "slope": res.slope,
        "r2": res.r2,
        "forecast": res.forecast,
    }
