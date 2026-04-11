"""
Pricing refresh agent for Tokalator.

Reads tokalator-extension-vs/models.json, fetches each provider's public
pricing page, asks a Gemini agent (Agno) to extract per-million-token rates
for the model IDs we already track, and rewrites models.json in place.

Designed to run monthly from .github/workflows/fetch-pricing.yml.

Requires:
  GOOGLE_API_KEY   (required)
  ANTHROPIC_API_KEY (optional, unused here but loaded by agno env)

Run locally:
  pip install -r scripts/requirements.txt
  python scripts/fetch-pricing-agent.py
"""

import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from agno.agent import Agent
from agno.models.google import Gemini

ROOT = Path(__file__).resolve().parent.parent
MODELS_JSON = ROOT / "tokalator-extension-vs" / "models.json"

PROVIDER_PAGES = {
    "anthropic": "https://www.anthropic.com/pricing",
    "openai": "https://openai.com/api/pricing/",
    "google": "https://ai.google.dev/pricing",
}

UA = "Mozilla/5.0 (compatible; tokalator-pricing-agent/1.0)"


class ExtractedPrice(BaseModel):
    id: str = Field(description="Model id exactly as given in the input list")
    inputCostPerMTok: Optional[float] = Field(
        default=None,
        description="USD per million input tokens. Null if not found on the page.",
    )
    outputCostPerMTok: Optional[float] = Field(
        default=None,
        description="USD per million output tokens. Null if not found on the page.",
    )
    cachedInputCostPerMTok: Optional[float] = Field(
        default=None,
        description="USD per million cached input tokens. Null if page does not show cache pricing.",
    )


class ExtractionResult(BaseModel):
    prices: list[ExtractedPrice]


def fetch_html(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def strip_html(html: str) -> str:
    html = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.IGNORECASE)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html, flags=re.IGNORECASE)
    html = re.sub(r"<[^>]+>", " ", html)
    html = re.sub(r"&nbsp;", " ", html)
    html = re.sub(r"\s+", " ", html)
    return html.strip()


def build_extractor() -> Agent:
    return Agent(
        name="PricingExtractor",
        model=Gemini(id="gemini-3-flash-preview", api_key=os.getenv("GOOGLE_API_KEY")),
        output_schema=ExtractionResult,
        instructions=[
            "You extract token pricing from provider documentation pages.",
            "You are given a list of model ids we already track plus the text of the provider's pricing page.",
            "For each model id, return inputCostPerMTok and outputCostPerMTok in USD per million tokens.",
            "Include cachedInputCostPerMTok only when the page explicitly lists a cached input rate.",
            "If a model id is not mentioned on the page, still include it in the result with all three fields set to null.",
            "Never fabricate prices. Prefer null to a guess.",
            "Return numbers as plain floats, not strings.",
        ],
    )


def extract_for_provider(
    extractor: Agent, provider: str, model_ids: list[str], page_text: str
) -> list[ExtractedPrice]:
    prompt = (
        f"Provider: {provider}\n"
        f"Model ids to price: {json.dumps(model_ids)}\n\n"
        f"Pricing page text (excerpt, up to 40k chars):\n"
        f"{page_text[:40000]}"
    )
    result = extractor.run(prompt)
    parsed = result.content
    if isinstance(parsed, ExtractionResult):
        return parsed.prices
    if isinstance(parsed, dict) and "prices" in parsed:
        return [ExtractedPrice(**p) for p in parsed["prices"]]
    return []


def main() -> int:
    load_dotenv(ROOT / ".env")

    if not os.environ.get("GOOGLE_API_KEY"):
        print("Error: GOOGLE_API_KEY not set", file=sys.stderr)
        return 1

    if not MODELS_JSON.exists():
        print(f"Error: {MODELS_JSON} not found", file=sys.stderr)
        return 1

    config = json.loads(MODELS_JSON.read_text())
    models: list[dict] = config.get("models", [])
    if not models:
        print("Error: no models in models.json", file=sys.stderr)
        return 1

    by_provider: dict[str, list[dict]] = {}
    for m in models:
        by_provider.setdefault(m["provider"], []).append(m)

    extractor = build_extractor()
    updated_fields = 0
    changed_ids: list[str] = []
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    for provider, group in by_provider.items():
        url = PROVIDER_PAGES.get(provider)
        if not url:
            print(f"Skip {provider}: no known pricing page")
            continue
        ids = [m["id"] for m in group]
        print(f"\n--- {provider} ({len(ids)} models) ---")
        print(f"  Fetching {url}")
        try:
            html = fetch_html(url)
        except Exception as e:
            print(f"  Fetch error: {e}")
            continue
        text = strip_html(html)
        print(f"  Stripped to {len(text)} chars")

        try:
            prices = extract_for_provider(extractor, provider, ids, text)
        except Exception as e:
            print(f"  Extraction error: {e}")
            continue

        by_id = {p.id: p for p in prices}
        for m in group:
            p = by_id.get(m["id"])
            if not p:
                continue
            if p.inputCostPerMTok is not None and p.inputCostPerMTok != m.get("inputCostPerMTok"):
                print(f"  {m['id']}: input {m.get('inputCostPerMTok')} -> {p.inputCostPerMTok}")
                m["inputCostPerMTok"] = p.inputCostPerMTok
                m["verifiedAt"] = today
                m["priceSource"] = "verified"
                updated_fields += 1
                if m["id"] not in changed_ids:
                    changed_ids.append(m["id"])
            if p.outputCostPerMTok is not None and p.outputCostPerMTok != m.get("outputCostPerMTok"):
                print(f"  {m['id']}: output {m.get('outputCostPerMTok')} -> {p.outputCostPerMTok}")
                m["outputCostPerMTok"] = p.outputCostPerMTok
                m["verifiedAt"] = today
                m["priceSource"] = "verified"
                updated_fields += 1
                if m["id"] not in changed_ids:
                    changed_ids.append(m["id"])
            if p.cachedInputCostPerMTok is not None and p.cachedInputCostPerMTok != m.get("cachedInputCostPerMTok"):
                print(f"  {m['id']}: cached {m.get('cachedInputCostPerMTok')} -> {p.cachedInputCostPerMTok}")
                m["cachedInputCostPerMTok"] = p.cachedInputCostPerMTok
                m["verifiedAt"] = today
                m["priceSource"] = "verified"
                if m["id"] not in changed_ids:
                    changed_ids.append(m["id"])

    config["updatedAt"] = datetime.now(timezone.utc).isoformat()
    MODELS_JSON.write_text(json.dumps(config, indent=2) + "\n")
    print(f"\nWrote {MODELS_JSON}")
    print(f"Changed {len(changed_ids)} models, {updated_fields} fields: {changed_ids}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
