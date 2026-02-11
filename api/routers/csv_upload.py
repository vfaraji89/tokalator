"""
CSV Upload Router — parse platform exports into normalized UsageRecords.

Supports:
  - Anthropic console CSV (columns: date, model, input_tokens, output_tokens, ...)
  - OpenAI usage export CSV
  - Google AI Studio export CSV
  - Generic CSV with token columns
"""

import io
import csv
import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException

from api.models import UsageRecord, CSVParseResponse, Provider

router = APIRouter(prefix="/csv", tags=["csv"])

# ── Pricing lookup (mirrors lib/providers.ts) ──

PRICING = {
    # Anthropic
    "claude-opus-4.6": (5.0, 25.0),
    "claude-opus-4": (5.0, 25.0),
    "claude-sonnet-4.5": (3.0, 15.0),
    "claude-sonnet-4": (3.0, 15.0),
    "claude-haiku-4.5": (1.0, 5.0),
    "claude-haiku-3.5": (0.80, 4.0),
    "claude-3.5-sonnet": (3.0, 15.0),
    "claude-3-opus": (15.0, 75.0),
    # OpenAI
    "gpt-5.2": (1.75, 14.0),
    "gpt-5.2-codex": (0.50, 4.0),
    "gpt-5.1": (2.50, 10.0),
    "gpt-4.1": (3.0, 12.0),
    "gpt-4.1-mini": (0.80, 3.20),
    "gpt-4.1-nano": (0.20, 0.80),
    "gpt-4o": (2.50, 10.0),
    "gpt-4o-mini": (0.15, 0.60),
    "gpt-5-mini": (0.25, 2.0),
    "o4-mini": (4.0, 16.0),
    # Google
    "gemini-3-pro": (2.0, 12.0),
    "gemini-3-flash": (0.50, 3.0),
    "gemini-2.5-pro": (1.25, 10.0),
    "gemini-2.5-flash": (0.30, 2.50),
    "gemini-2.5-flash-lite": (0.10, 0.40),
    "gemini-2.0-flash": (0.10, 0.40),
}


def _estimate_cost(model: str, inp: int, out: int) -> float:
    """Cost in dollars for given token counts."""
    key = model.lower().strip()
    # try exact match first, then prefix match
    prices = PRICING.get(key)
    if not prices:
        for k, v in PRICING.items():
            if k in key or key in k:
                prices = v
                break
    if not prices:
        prices = (3.0, 15.0)  # safe default
    return (inp / 1_000_000) * prices[0] + (out / 1_000_000) * prices[1]


def _detect_provider(headers: list[str], rows: list[dict]) -> Provider:
    """Guess the source platform from column names and model names."""
    h = " ".join(headers).lower()
    if "organization" in h or "snapshot" in h:
        return Provider.openai
    if "project_id" in h or "vertex" in h:
        return Provider.google

    # check model names in first rows
    for row in rows[:5]:
        model_val = (row.get("model") or row.get("model_id") or "").lower()
        if "claude" in model_val:
            return Provider.anthropic
        if "gpt" in model_val or model_val.startswith("o"):
            return Provider.openai
        if "gemini" in model_val:
            return Provider.google

    return Provider.anthropic


def _normalize_model(raw: str) -> str:
    """Normalize model name to our ID format."""
    m = raw.strip().lower()
    # remove common prefixes
    for prefix in ["models/", "anthropic.", "openai."]:
        if m.startswith(prefix):
            m = m[len(prefix):]
    # map common variations
    aliases = {
        "claude-3-5-sonnet-20241022": "claude-sonnet-4.5",
        "claude-3-5-sonnet": "claude-sonnet-4.5",
        "claude-3-5-haiku": "claude-haiku-4.5",
        "claude-sonnet-4-20250514": "claude-sonnet-4.5",
        "gpt-4o-2024-08-06": "gpt-4o",
        "gpt-4o-mini-2024-07-18": "gpt-4o-mini",
    }
    return aliases.get(m, m)


def _find_column(headers: list[str], candidates: list[str]) -> str | None:
    """Find the first matching column name (case-insensitive)."""
    lower_headers = {h.lower().strip(): h for h in headers}
    for c in candidates:
        if c.lower() in lower_headers:
            return lower_headers[c.lower()]
    return None


def _safe_int(val: str) -> int:
    try:
        return int(float(val.strip().replace(",", "")))
    except (ValueError, AttributeError):
        return 0


@router.post("/parse", response_model=CSVParseResponse)
async def parse_csv(file: UploadFile = File(...)):
    """
    Parse a CSV file from Anthropic / OpenAI / Google dashboards.
    Returns normalized UsageRecord array.
    """
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only .csv files accepted")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # handles BOM
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(400, "CSV has no headers")

    headers = list(reader.fieldnames)
    rows = list(reader)

    if not rows:
        raise HTTPException(400, "CSV has no data rows")

    provider = _detect_provider(headers, rows)
    warnings: list[str] = []

    # Find columns
    col_date = _find_column(headers, ["date", "timestamp", "created_at", "time", "day"])
    col_model = _find_column(headers, ["model", "model_id", "model_name"])
    col_input = _find_column(headers, [
        "input_tokens", "prompt_tokens", "input_token_count",
        "n_context_tokens_total", "inputTokenCount",
    ])
    col_output = _find_column(headers, [
        "output_tokens", "completion_tokens", "output_token_count",
        "n_generated_tokens_total", "outputTokenCount",
    ])
    col_cache_w = _find_column(headers, ["cache_write_tokens", "cache_creation_input_tokens"])
    col_cache_r = _find_column(headers, ["cache_read_tokens", "cache_read_input_tokens"])
    col_cost = _find_column(headers, ["cost", "total_cost", "cost_usd", "amount"])

    if not col_input and not col_output:
        raise HTTPException(400, f"Cannot find token columns. Found: {headers}")

    if not col_model:
        warnings.append("No model column found — using 'unknown'")
    if not col_date:
        warnings.append("No date column found — using today's date")

    records: list[UsageRecord] = []
    today = datetime.now().strftime("%Y-%m-%d")

    for row in rows:
        model_raw = row.get(col_model, "unknown") if col_model else "unknown"
        model = _normalize_model(model_raw)

        inp = _safe_int(row.get(col_input, "0")) if col_input else 0
        out = _safe_int(row.get(col_output, "0")) if col_output else 0
        cw = _safe_int(row.get(col_cache_w, "0")) if col_cache_w else 0
        cr = _safe_int(row.get(col_cache_r, "0")) if col_cache_r else 0

        # skip empty rows
        if inp == 0 and out == 0:
            continue

        # date parsing
        date_str = today
        if col_date and row.get(col_date):
            raw_date = row[col_date].strip()
            for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S"):
                try:
                    date_str = datetime.strptime(raw_date[:19], fmt).strftime("%Y-%m-%d")
                    break
                except ValueError:
                    continue

        # cost — from CSV or calculate
        cost = 0.0
        if col_cost and row.get(col_cost):
            try:
                cost = float(row[col_cost].strip().replace("$", "").replace(",", ""))
            except ValueError:
                cost = _estimate_cost(model, inp, out)
        else:
            cost = _estimate_cost(model, inp, out)

        records.append(UsageRecord(
            id=str(uuid.uuid4())[:8],
            date=date_str,
            model=model,
            provider=provider,
            input_tokens=inp,
            output_tokens=out,
            cache_write_tokens=cw,
            cache_read_tokens=cr,
            cost=round(cost, 6),
        ))

    total_cost = sum(r.cost for r in records)

    return CSVParseResponse(
        records=records,
        total_records=len(records),
        total_cost=round(total_cost, 4),
        detected_provider=provider.value,
        warnings=warnings,
    )
