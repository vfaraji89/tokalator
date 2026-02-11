"""
Economics Router — Cobb-Douglas quality function and caching break-even.

Implements the econometric model from:
  Bergemann, Bonatti, Smolin (2025) "The Economics of Large Language Models"
"""

import math
from fastapi import APIRouter

from api.models import (
    QualityRequest, QualityResponse,
    BreakevenRequest, BreakevenResponse, BreakevenPoint,
)

router = APIRouter(prefix="/economics", tags=["economics"])

# Pricing for break-even calc (input $/MTok, cache_write $/MTok, cache_read $/MTok)
CACHE_PRICING: dict[str, tuple[float, float, float]] = {
    "claude-opus-4.6": (5.0, 6.25, 0.50),
    "claude-sonnet-4.5": (3.0, 3.75, 0.30),
    "claude-haiku-4.5": (1.0, 1.25, 0.10),
    "gpt-5.2": (1.75, 1.75, 0.175),
    "gpt-4.1": (3.0, 3.0, 0.75),
    "gpt-4.1-mini": (0.80, 0.80, 0.20),
    "gemini-3-pro": (2.0, 2.0, 0.50),
    "gemini-2.5-pro": (1.25, 1.25, 0.125),
    "gemini-2.5-flash": (0.30, 0.30, 0.03),
}


@router.post("/quality", response_model=QualityResponse)
def compute_quality(req: QualityRequest):
    """
    Cobb-Douglas quality function: Q = X^α × Y^β × (b + Z)^γ
    """
    X = max(req.input_tokens / 1000, 0.001)
    Y = max(req.output_tokens / 1000, 0.001)
    Z = req.cache_tokens / 1000
    b = req.base_quality

    input_c = math.pow(X, req.alpha)
    output_c = math.pow(Y, req.beta)
    cache_c = math.pow(b + Z, req.gamma)

    quality = input_c * output_c * cache_c

    return QualityResponse(
        quality_score=round(quality, 4),
        input_contribution=round(input_c, 4),
        output_contribution=round(output_c, 4),
        cache_contribution=round(cache_c, 4),
    )


@router.post("/breakeven", response_model=BreakevenResponse)
def compute_breakeven(req: BreakevenRequest):
    """
    Calculate the number of reuses needed for caching to break even.

    Without cache: cost_per_call = (input_tokens / 1M) × input_price
    With cache:
      - first call:  (cache_tokens / 1M) × cache_write_price + ((input - cache) / 1M) × input_price
      - reuse calls:  (cache_tokens / 1M) × cache_read_price  + ((input - cache) / 1M) × input_price
    """
    prices = CACHE_PRICING.get(req.model_id, (3.0, 3.75, 0.30))
    input_price, cw_price, cr_price = prices

    inp = req.input_tokens
    cache = min(req.cache_tokens, inp)
    uncached = inp - cache

    # per-call cost without caching
    cost_no_cache_1 = (inp / 1_000_000) * input_price

    # first call with cache (write)
    first_call = (cache / 1_000_000) * cw_price + (uncached / 1_000_000) * input_price
    # subsequent calls (read)
    reuse_call = (cache / 1_000_000) * cr_price + (uncached / 1_000_000) * input_price

    # break-even: find n where n × cost_no_cache = first_call + (n-1) × reuse_call
    # n × cost_no_cache = first_call + n × reuse_call - reuse_call
    # n × (cost_no_cache - reuse_call) = first_call - reuse_call
    delta = cost_no_cache_1 - reuse_call
    if delta <= 0:
        threshold = float("inf")
    else:
        threshold = (first_call - reuse_call) / delta

    # build curve
    curve: list[BreakevenPoint] = []
    for n in range(1, req.max_reuses + 1):
        total_no = cost_no_cache_1 * n
        total_with = first_call + reuse_call * max(0, n - 1)
        curve.append(BreakevenPoint(
            reuses=n,
            cost_no_cache=round(total_no, 6),
            cost_with_cache=round(total_with, 6),
        ))

    # savings at 10 reuses
    no_10 = cost_no_cache_1 * 10
    with_10 = first_call + reuse_call * 9
    savings_10 = no_10 - with_10
    roi_10 = (savings_10 / with_10 * 100) if with_10 > 0 else 0

    return BreakevenResponse(
        threshold=round(threshold, 2),
        savings_at_10=round(savings_10, 6),
        roi_at_10=round(roi_10, 1),
        curve=curve,
    )
