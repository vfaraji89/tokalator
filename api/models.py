"""
Pydantic schemas for Tokalator API.
Mirrors the TypeScript interfaces in lib/pricing.ts and lib/providers.ts.
"""

from pydantic import BaseModel, Field
from enum import Enum


# ── Enums ──

class Provider(str, Enum):
    anthropic = "anthropic"
    openai = "openai"
    google = "google"


# ── Usage Records ──

class UsageRecord(BaseModel):
    """Single row of token usage — matches the TS UsageRecord interface."""
    id: str = ""
    date: str
    model: str
    provider: Provider = Provider.anthropic
    project: str = "Imported"
    input_tokens: int = Field(ge=0)
    output_tokens: int = Field(ge=0)
    cache_write_tokens: int = Field(default=0, ge=0)
    cache_read_tokens: int = Field(default=0, ge=0)
    cost: float = 0.0


class CSVParseResponse(BaseModel):
    records: list[UsageRecord]
    total_records: int
    total_cost: float
    detected_provider: str
    warnings: list[str] = []


# ── Economics ──

class QualityRequest(BaseModel):
    """Cobb-Douglas quality function inputs."""
    input_tokens: int = Field(default=50000, ge=0)
    output_tokens: int = Field(default=10000, ge=0)
    cache_tokens: int = Field(default=0, ge=0)
    alpha: float = Field(default=0.30, ge=0.05, le=0.60)
    beta: float = Field(default=0.35, ge=0.05, le=0.60)
    gamma: float = Field(default=0.20, ge=0.05, le=0.50)
    base_quality: float = Field(default=1.0, ge=0.1, le=2.0)


class QualityResponse(BaseModel):
    quality_score: float
    input_contribution: float
    output_contribution: float
    cache_contribution: float
    cost_per_quality: float = 0.0


class BreakevenRequest(BaseModel):
    """Caching break-even analysis inputs."""
    model_id: str = "claude-sonnet-4.5"
    input_tokens: int = Field(default=50000, ge=0)
    output_tokens: int = Field(default=10000, ge=0)
    cache_tokens: int = Field(default=10000, ge=0)
    max_reuses: int = Field(default=30, ge=1, le=100)


class BreakevenPoint(BaseModel):
    reuses: int
    cost_no_cache: float
    cost_with_cache: float


class BreakevenResponse(BaseModel):
    threshold: float
    savings_at_10: float
    roi_at_10: float
    curve: list[BreakevenPoint]


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.4.0"
    service: str = "tokalator-api"
