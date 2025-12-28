from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

import numpy as np


@dataclass
class LinearForecastResult:
    model: str
    intercept: float
    slope: float
    r2: float
    forecast: List[float]


def _fit_simple_linear_regression(y: np.ndarray) -> Tuple[float, float, float]:
    """Fit y ~= a + b*t using least squares; return (a, b, r2).

    This is a tiny, dependency-light ML-style model intended for non-medical
    trend forecasting (e.g., steps/minutes/water). It avoids sklearn to keep
    compatibility high on Windows/Python versions.
    """
    n = int(y.shape[0])
    if n < 2:
        return float(y[-1]) if n == 1 else 0.0, 0.0, 0.0

    t = np.arange(n, dtype=np.float64)
    y = y.astype(np.float64)

    # Least squares closed form for simple linear regression.
    t_mean = float(t.mean())
    y_mean = float(y.mean())

    denom = float(((t - t_mean) ** 2).sum())
    if denom == 0.0:
        return y_mean, 0.0, 0.0

    slope = float(((t - t_mean) * (y - y_mean)).sum() / denom)
    intercept = float(y_mean - slope * t_mean)

    y_hat = intercept + slope * t
    ss_res = float(((y - y_hat) ** 2).sum())
    ss_tot = float(((y - y_mean) ** 2).sum())
    r2 = 0.0 if ss_tot == 0.0 else float(max(0.0, 1.0 - (ss_res / ss_tot)))

    return intercept, slope, r2


def forecast_linear(series: List[float], horizon: int = 7) -> LinearForecastResult:
    cleaned = [float(x) for x in (series or []) if x is not None]
    if horizon < 1:
        horizon = 1
    if len(cleaned) == 0:
        return LinearForecastResult(model="linear_regression", intercept=0.0, slope=0.0, r2=0.0, forecast=[0.0] * horizon)

    y = np.array(cleaned, dtype=np.float64)
    intercept, slope, r2 = _fit_simple_linear_regression(y)

    n = int(y.shape[0])
    tf = np.arange(n, n + horizon, dtype=np.float64)
    y_future = intercept + slope * tf

    return LinearForecastResult(
        model="linear_regression",
        intercept=float(intercept),
        slope=float(slope),
        r2=float(r2),
        forecast=[float(x) for x in y_future.tolist()],
    )
