"""
Agentic wiki fetcher powered by the Agno framework.
Uses LLM-backed agents with ArxivTools for intelligent paper discovery,
summarization, and curation.

Run: pip install -r scripts/requirements.txt
     npm run fetch-wiki-agent
  or python scripts/fetch-wiki-agent.py

Requires: GOOGLE_API_KEY in .env (uses gemini-3-flash-preview)
Output:   content/wiki/articles.json (same format as fetch-wiki.ts)
"""

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from agno.agent import Agent
from agno.models.google import Gemini
from agno.tools.arxiv import ArxivTools

# ── Paths ──────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "content" / "wiki-sources.json"
OUTPUT_DIR = ROOT / "content" / "wiki"
OUTPUT_PATH = OUTPUT_DIR / "articles.json"

# ── Pydantic Schemas (match TypeScript WikiArticle interface) ──

VALID_CATEGORIES = [
    "caching",
    "token-optimization",
    "rag",
    "context-management",
    "prompt-engineering",
    "tool-use",
    "general",
]


class WikiArticle(BaseModel):
    slug: str = Field(description="URL-safe slug, e.g. arxiv-attention-is-all-you-need")
    title: str
    description: str = Field(description="One-sentence summary, max 200 chars")
    source: str = Field(description="Source ID, e.g. arxiv")
    sourceLabel: str = Field(description="Display name, e.g. arXiv")
    sourceColor: str = Field(description="Hex color for badge, e.g. #b31b1b")
    url: str = Field(description="Link to original paper or page")
    content: str = Field(description="Markdown article body with ## headings")
    authors: list[str] = Field(default_factory=list, description="Up to 5 author names")
    date: Optional[str] = Field(default=None, description="Publication date YYYY-MM-DD")
    tags: list[str] = Field(description="3-5 topic tags")
    category: str = Field(description=f"One of: {', '.join(VALID_CATEGORIES)}")


class ResearchResult(BaseModel):
    articles: list[WikiArticle]


class CurationResult(BaseModel):
    articles: list[WikiArticle]


# ── Helpers ────────────────────────────────────────────────────


def slugify(text: str) -> str:
    s = text.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s[:80]


def truncate(text: str, max_len: int) -> str:
    if len(text) <= max_len:
        return text
    return text[:max_len].rsplit(" ", 1)[0] + "..."


# ── Researcher Agent ───────────────────────────────────────────


def build_researcher() -> Agent:
    return Agent(
        name="WikiResearcher",
        model=Gemini(id="gemini-3-flash-preview", api_key=os.getenv("GOOGLE_API_KEY")),
        tools=[ArxivTools()],
        output_schema=ResearchResult,
        instructions=[
            "You are a research assistant for a context engineering wiki.",
            "When given a search topic, use your ArxivTools to search arXiv.",
            "For each relevant paper found, produce a WikiArticle with:",
            "  - slug: 'arxiv-' + slugified title",
            "  - title: the paper title",
            "  - description: a clear one-sentence summary (max 200 chars)",
            "  - source: 'arxiv'",
            "  - sourceLabel: 'arXiv'",
            "  - sourceColor: '#b31b1b'",
            "  - url: the arXiv abstract URL",
            "  - content: a well-structured markdown summary with ## Abstract and ## Key Contributions sections",
            "  - authors: up to 5 author names",
            "  - date: publication date as YYYY-MM-DD",
            "  - tags: 3-5 relevant topic tags",
            "  - category: one of caching, token-optimization, rag, context-management, prompt-engineering, tool-use, general",
            "Focus on papers relevant to context engineering, prompt optimization, and LLM development.",
            "Return up to 5 articles per query. Skip irrelevant results.",
        ],
        markdown=True,
    )


# ── Curator Agent ──────────────────────────────────────────────


def build_curator() -> Agent:
    return Agent(
        name="WikiCurator",
        model=Gemini(id="gemini-3-flash-preview", api_key=os.getenv("GOOGLE_API_KEY")),
        output_schema=CurationResult,
        instructions=[
            "You are an editor for a context engineering wiki.",
            "Review the list of wiki articles provided.",
            "Your tasks:",
            "  1. Remove duplicate articles (same paper, different slugs)",
            "  2. Fix any incorrect categories — must be one of: "
            + ", ".join(VALID_CATEGORIES),
            "  3. Ensure descriptions are under 200 characters",
            "  4. Ensure tags are lowercase and relevant",
            "  5. Remove articles that are off-topic (not related to context engineering, LLMs, prompts, or tokens)",
            "Return the curated list preserving the WikiArticle schema exactly.",
        ],
        markdown=True,
    )


# ── Static source fetchers (non-agentic, same as fetch-wiki.ts) ─


def fetch_builtin_terms(config: dict) -> list[dict]:
    """Convert builtinTerms from config into WikiArticle dicts."""
    articles = []
    for t in config.get("builtinTerms", []):
        articles.append(
            {
                "slug": f"builtin-{slugify(t['term'])}",
                "title": t["term"],
                "description": truncate(t["definition"], 200),
                "source": "builtin",
                "sourceLabel": "Built-in",
                "sourceColor": "#e3120b",
                "url": "",
                "content": f"# {t['term']}\n\n{t['definition']}",
                "authors": [],
                "date": None,
                "tags": t.get("tags", []),
                "category": t.get("category", "general"),
            }
        )
    return articles


def fetch_openai_cookbook(source: dict) -> list[dict]:
    """Fetch markdown files from OpenAI Cookbook on GitHub."""
    import urllib.request

    articles = []
    for file_path in source.get("repoFiles", []):
        url = f"https://raw.githubusercontent.com/openai/openai-cookbook/main/{file_path}"
        print(f"  OpenAI: {file_path}...")
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=15) as resp:
                content = resp.read().decode("utf-8")

            title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
            title = title_match.group(1).strip() if title_match else file_path.split("/")[-1]

            # Extract first paragraph as description
            description = ""
            found_title = False
            for line in content.split("\n"):
                if line.startswith("# "):
                    found_title = True
                    continue
                if found_title and line.strip() and not line.startswith("#") and not line.startswith("```"):
                    description = truncate(line.strip(), 200)
                    break

            if not description:
                description = truncate(re.sub(r"[#`*\->\[\]()]", " ", content).strip(), 200)

            # Auto-tag
            lower = content.lower()
            tags = []
            if "token" in lower:
                tags.append("tokens")
            if "prompt" in lower:
                tags.append("prompts")
            if "embedding" in lower:
                tags.append("embeddings")
            if "rate limit" in lower:
                tags.append("rate-limits")
            if "tiktoken" in lower:
                tags.append("tiktoken")
            if "stream" in lower:
                tags.append("streaming")
            if not tags:
                tags = ["openai", "cookbook"]

            articles.append(
                {
                    "slug": f"openai-{slugify(title)}",
                    "title": title,
                    "description": description,
                    "source": source["id"],
                    "sourceLabel": source["name"],
                    "sourceColor": source["color"],
                    "url": f"https://github.com/openai/openai-cookbook/blob/main/{file_path}",
                    "content": content,
                    "authors": [],
                    "date": None,
                    "tags": tags,
                    "category": categorize_by_keywords(title + " " + content[:500], tags),
                }
            )
        except Exception as e:
            print(f"  OpenAI error for {file_path}: {e}")

    return articles


def fetch_doc_pages(source: dict) -> list[dict]:
    """Create stub articles for Anthropic/Google doc pages."""
    articles = []
    for page in source.get("pages", []):
        articles.append(
            {
                "slug": f"{source['id']}-{slugify(page['title'])}",
                "title": page["title"],
                "description": f"{page['title']} — from {source['name']} documentation.",
                "source": source["id"],
                "sourceLabel": source["name"],
                "sourceColor": source["color"],
                "url": page["url"],
                "content": f"# {page['title']}\n\nThis article is available at [{source['name']}]({page['url']}). Visit the original documentation for the full content.",
                "authors": [],
                "date": None,
                "tags": page.get("tags", [source["id"]]),
                "category": page.get("category", "general"),
            }
        )
    return articles


def categorize_by_keywords(text: str, tags: list[str]) -> str:
    lower = (text + " " + " ".join(tags)).lower()
    if "cach" in lower:
        return "caching"
    if "token" in lower and ("optim" in lower or "count" in lower):
        return "token-optimization"
    if "retrieval" in lower or "rag" in lower:
        return "rag"
    if "context" in lower and ("window" in lower or "manag" in lower or "rot" in lower):
        return "context-management"
    if "prompt" in lower or "chain" in lower or "xml tag" in lower:
        return "prompt-engineering"
    if "tool" in lower or "function call" in lower:
        return "tool-use"
    return "general"


# ── Main ───────────────────────────────────────────────────────


def main():
    load_dotenv(ROOT / ".env")

    if not os.environ.get("GOOGLE_API_KEY"):
        print("Error: GOOGLE_API_KEY not found in .env or environment.")
        print("Add it to .env: GOOGLE_API_KEY=AIza...")
        sys.exit(1)

    print("=== Agentic Wiki Fetcher (Agno) ===\n")

    config = json.loads(CONFIG_PATH.read_text())
    all_articles: list[dict] = []

    # ── 1. arXiv via Agno ResearcherAgent ──────────────────────

    arxiv_source = next((s for s in config["sources"] if s["id"] == "arxiv"), None)
    if arxiv_source:
        print("--- ResearcherAgent: arXiv papers ---")
        researcher = build_researcher()

        for query in arxiv_source.get("queries", []):
            print(f"\n  Searching: \"{query}\"...")
            try:
                result = researcher.run(
                    f"Search arXiv for papers about: {query}. "
                    f"Return up to 5 relevant articles as WikiArticle objects."
                )
                if result.content:
                    parsed = result.content
                    if isinstance(parsed, ResearchResult):
                        articles = [a.model_dump() for a in parsed.articles]
                    elif isinstance(parsed, str):
                        # Try parsing as JSON if string returned
                        try:
                            data = json.loads(parsed)
                            if isinstance(data, dict) and "articles" in data:
                                articles = data["articles"]
                            elif isinstance(data, list):
                                articles = data
                            else:
                                articles = []
                        except json.JSONDecodeError:
                            articles = []
                    else:
                        articles = []

                    print(f"  -> {len(articles)} articles found")
                    all_articles.extend(articles)
                else:
                    print("  -> No results")
            except Exception as e:
                print(f"  Error for \"{query}\": {e}")

    # ── 2. Static sources (OpenAI, Anthropic, Google) ──────────

    for source in config["sources"]:
        if source["id"] == "arxiv":
            continue

        print(f"\n--- Static fetch: {source['name']} ---")

        if source["id"] == "openai":
            articles = fetch_openai_cookbook(source)
        else:
            articles = fetch_doc_pages(source)

        print(f"  -> {len(articles)} articles")
        all_articles.extend(articles)

    # ── 3. Built-in terms ──────────────────────────────────────

    builtin = fetch_builtin_terms(config)
    print(f"\n--- Built-in terms: {len(builtin)} ---")
    all_articles.extend(builtin)

    # ── 4. Curator Agent pass ──────────────────────────────────

    print(f"\n--- CuratorAgent: reviewing {len(all_articles)} articles ---")

    try:
        curator = build_curator()

        # Send articles in batches to stay within context limits
        batch_size = 20
        curated_articles: list[dict] = []

        for i in range(0, len(all_articles), batch_size):
            batch = all_articles[i : i + batch_size]
            # Truncate content to keep token usage reasonable
            compact = []
            for a in batch:
                c = dict(a)
                if len(c.get("content", "")) > 1000:
                    c["content"] = c["content"][:1000] + "..."
                compact.append(c)

            result = curator.run(
                f"Review and curate these wiki articles. "
                f"Remove duplicates and off-topic entries. "
                f"Fix categories and tags.\n\n"
                f"{json.dumps(compact, indent=2)}"
            )

            if result.content:
                parsed = result.content
                if isinstance(parsed, CurationResult):
                    curated_articles.extend([a.model_dump() for a in parsed.articles])
                elif isinstance(parsed, str):
                    try:
                        data = json.loads(parsed)
                        if isinstance(data, dict) and "articles" in data:
                            curated_articles.extend(data["articles"])
                        elif isinstance(data, list):
                            curated_articles.extend(data)
                    except json.JSONDecodeError:
                        # Fall back to uncurated batch
                        curated_articles.extend(batch)
                else:
                    curated_articles.extend(batch)
            else:
                curated_articles.extend(batch)

        all_articles = curated_articles
        print(f"  -> {len(all_articles)} articles after curation")

    except Exception as e:
        print(f"  Curator error (using uncurated): {e}")

    # ── 5. Deduplicate by slug ─────────────────────────────────

    seen: set[str] = set()
    deduped = []
    for a in all_articles:
        slug = a.get("slug", "")
        if slug and slug not in seen:
            seen.add(slug)
            deduped.append(a)

    # ── 6. Compute stats & write output ────────────────────────

    by_source: dict[str, int] = {}
    by_category: dict[str, int] = {}
    for a in deduped:
        src = a.get("source", "unknown")
        cat = a.get("category", "general")
        by_source[src] = by_source.get(src, 0) + 1
        by_category[cat] = by_category.get(cat, 0) + 1

    output = {
        "articles": deduped,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "stats": {"total": len(deduped), "bySource": by_source, "byCategory": by_category},
    }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, indent=2))

    print(f"\nDone! {len(deduped)} articles written to content/wiki/articles.json")
    print(f"  Sources:    {json.dumps(by_source)}")
    print(f"  Categories: {json.dumps(by_category)}")


if __name__ == "__main__":
    main()
