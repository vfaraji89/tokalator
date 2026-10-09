/**
 * Build-time script to fetch context engineering content from external sources.
 * Run: npm run fetch-wiki (or npx tsx scripts/fetch-wiki.ts)
 *
 * Sources: arXiv API, OpenAI Cookbook, HTML documentation pages
 * Output: content/wiki/articles.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";
import type { BuiltinTerm, WikiArticle, WikiSource } from "../lib/wiki/types";

// ── Helpers ────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s\S*$/, "") + "...";
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");
}

function htmlToMarkdown(html: string): string {
  return decodeEntities(
    html
      .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, code: string) => "\n```\n" + code.replace(/<[^>]+>/g, "") + "\n```\n")
      .replace(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n: string, t: string) => `${"#".repeat(Number(n))} ${t.replace(/\s+/g, " ").trim()}\n\n`)
      .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**")
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "*$1*")
      .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)")
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function notebookToMarkdown(raw: string): string {
  const nb = JSON.parse(raw) as { cells: { cell_type: string; source: string | string[] }[] };
  return nb.cells
    .map((c) => {
      const src = (Array.isArray(c.source) ? c.source.join("") : c.source).trim();
      return c.cell_type === "code" ? "```python\n" + src + "\n```" : src;
    })
    .filter(Boolean)
    .join("\n\n");
}

function isJunk(text: string): boolean {
  const cssRules = text.match(/[\w\]\)-]\s*\{[^{}]*:[^{}]*;[^{}]*\}/g)?.length ?? 0;
  return (
    /^\s*[{[]\s*["{[]/.test(text) ||
    /(Loading\.\.\.\s*){2,}/.test(text) ||
    /"cell_type"\s*:/.test(text) ||
    cssRules > 3 ||
    text.split(/\s+/).length < 150
  );
}

const CATEGORY_RULES: [RegExp, string][] = [
  [/\bcach/, "caching"],
  [/\bcontext\b|\blong-context|lost.in.the.middle/, "context-management"],
  [/\btokens?\b|token-|\bcompress/, "token-optimization"],
  [/\bagent|\bcoding\b/, "agents"],
  [/\bretrieval|\brag\b/, "rag"],
  [/\bprompt/, "prompt-engineering"],
  [/\btool|function call/, "tool-use"],
];

function categorize(title: string, text: string): string {
  for (const s of [title.toLowerCase(), text.toLowerCase()]) {
    const hit = CATEGORY_RULES.find(([re]) => re.test(s));
    if (hit) return hit[1];
  }
  return "general";
}

const AI_TERMS = /\b(LLMs?|language models?|transformers?|AI|agents?|agentic)\b/i;

// ── arXiv Fetcher ──────────────────────────────────────────────

async function fetchArxiv(source: WikiSource): Promise<WikiArticle[]> {
  const articles: WikiArticle[] = [];
  const seenIds = new Set<string>();
  const queries = source.queries || [];
  const maxResults = Math.ceil((source.maxResults || 15) / (queries.length || 1));
  const requests = [
    ...(source.ids?.length
      ? [{ query: `ids ${source.ids.join(",")}`, url: `https://export.arxiv.org/api/query?id_list=${source.ids.join(",")}&max_results=${source.ids.length}` }]
      : []),
    ...queries.map((query) => ({
      query,
      url: `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`,
    })),
  ];

  for (const { query, url } of requests) {
    console.log(`  arXiv: ${query}...`);

    try {
      let res: Response | undefined;
      for (let attempt = 0; attempt < 4; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 3000 * attempt));
        res = await fetch(url, {
          headers: { "User-Agent": "tokalator-wiki/1.0 (+https://tokalator.ai)" },
        });
        if (res.status !== 429) break;
        console.warn(`  arXiv 429, backing off (attempt ${attempt + 1}/4)...`);
      }
      if (!res || !res.ok) {
        console.warn(`  arXiv query failed: ${res ? res.status : "no response"}`);
        continue;
      }
      const xml = await res.text();

      for (const [, entry] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)) {
        const id = entry.match(/<id>(.*?)<\/id>/)?.[1];
        const rawTitle = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
        const rawAbstract = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1];
        const published = entry.match(/<published>(.*?)<\/published>/)?.[1]?.slice(0, 10);
        if (!id || !rawTitle || !rawAbstract || !published) continue;

        const arxivId = id.replace(/^https?:\/\/arxiv\.org\/abs\//, "").replace(/v\d+$/, "");
        if (seenIds.has(arxivId)) continue;

        const title = decodeEntities(rawTitle.replace(/\s+/g, " ").trim());
        const abstract = decodeEntities(rawAbstract.replace(/\s+/g, " ").trim());
        const authors = [...entry.matchAll(/<author>\s*<name>(.*?)<\/name>/gi)].map((m) => decodeEntities(m[1].trim()));
        const tags = [...entry.matchAll(/<category[^>]*term="([^"]*)"[^>]*\/>/gi)].map((m) => m[1]);

        if (!authors.length || !AI_TERMS.test(`${title} ${abstract}`)) continue;
        seenIds.add(arxivId);

        articles.push({
          slug: `arxiv-${slugify(title)}`,
          title,
          description: truncate(abstract, 200),
          source: source.id,
          sourceLabel: source.name,
          sourceColor: source.color,
          url: `https://arxiv.org/abs/${arxivId}`,
          content: `## Abstract\n\n${abstract}`,
          authors,
          date: published,
          tags: tags.slice(0, 5),
          category: categorize(title, abstract),
        });
      }

      await new Promise((r) => setTimeout(r, 3000));
    } catch (err) {
      console.warn(`  arXiv error for ${query}:`, err);
    }
  }

  return articles;
}

// ── OpenAI Cookbook Fetcher ─────────────────────────────────────

async function fetchOpenAICookbook(source: WikiSource): Promise<WikiArticle[]> {
  const articles: WikiArticle[] = [];

  for (const filePath of source.repoFiles || []) {
    const url = `https://raw.githubusercontent.com/openai/openai-cookbook/main/${filePath}`;
    console.log(`  OpenAI: ${filePath}...`);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`  OpenAI fetch failed (${res.status}): ${filePath}`);
        continue;
      }
      const raw = await res.text();
      const content = filePath.endsWith(".ipynb") ? notebookToMarkdown(raw) : raw;
      if (isJunk(content)) {
        console.warn(`  OpenAI skipped (no usable text): ${filePath}`);
        continue;
      }

      const title = content.match(/^#\s+(.+)$/m)?.[1].trim() || filePath.split("/").pop()!.replace(/\.\w+$/, "");

      let description = "";
      let foundTitle = false;
      for (const line of content.split("\n")) {
        if (line.startsWith("# ")) {
          foundTitle = true;
          continue;
        }
        if (foundTitle && line.trim() && !/^(#|```|!\[|<)/.test(line)) {
          description = truncate(line.trim(), 200);
          break;
        }
      }

      const tags: string[] = [];
      const lower = content.toLowerCase();
      if (lower.includes("token")) tags.push("tokens");
      if (lower.includes("prompt")) tags.push("prompts");
      if (lower.includes("embedding")) tags.push("embeddings");
      if (lower.includes("rate limit")) tags.push("rate-limits");
      if (lower.includes("tiktoken")) tags.push("tiktoken");
      if (lower.includes("stream")) tags.push("streaming");

      articles.push({
        slug: `openai-${slugify(title)}`,
        title,
        description: description || truncate(content.replace(/[#`*\->\[\]()]/g, " ").trim(), 200),
        source: source.id,
        sourceLabel: source.name,
        sourceColor: source.color,
        url: `https://github.com/openai/openai-cookbook/blob/main/${filePath}`,
        content,
        tags: tags.length ? tags : ["openai", "cookbook"],
        category: categorize(title, content.slice(0, 500)),
      });

      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.warn(`  OpenAI error for ${filePath}:`, err);
    }
  }

  return articles;
}

// ── HTML Docs Fetcher ──────────────────────────────────────────

async function fetchDocPages(source: WikiSource): Promise<WikiArticle[]> {
  const articles: WikiArticle[] = [];

  for (const page of source.pages || []) {
    console.log(`  ${source.name}: ${page.title}...`);

    try {
      const res = await fetch(page.url, {
        headers: {
          "User-Agent": "tokalator-wiki/1.0 (+https://tokalator.ai)",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      if (!res.ok) {
        console.warn(`  ${source.name} fetch failed (${res.status}): ${page.url}`);
        continue;
      }

      const html = await res.text();
      const cleaned = html.replace(/<(script|style|noscript|svg|nav|header|footer|template)\b[\s\S]*?<\/\1>/gi, "");
      const main =
        cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
        cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      const content = main ? htmlToMarkdown(main[1]) : "";

      if (isJunk(content)) {
        console.warn(`  ${source.name} skipped (no usable text): ${page.url}`);
        continue;
      }

      const metaDesc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)?.[1];
      const description = metaDesc ? decodeEntities(metaDesc) : truncate(content.replace(/[#`*\->\[\]()]/g, " ").trim(), 200);

      articles.push({
        slug: `${source.id}-${slugify(page.title)}`,
        title: page.title,
        description,
        source: source.id,
        sourceLabel: source.name,
        sourceColor: source.color,
        url: page.url,
        content: content.length > 10000 ? content.slice(0, content.lastIndexOf("\n\n", 10000)) : content,
        tags: page.tags || [source.id],
        category: page.category || categorize(page.title, description),
      });

      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.warn(`  ${source.name} error for ${page.title}:`, err);
    }
  }

  return articles;
}

// ── Builtin Terms → Articles ───────────────────────────────────

function builtinToArticles(terms: BuiltinTerm[]): WikiArticle[] {
  return terms.map((t) => ({
    slug: `builtin-${slugify(t.term)}`,
    title: t.term,
    description: truncate(t.definition, 200),
    source: "builtin",
    sourceLabel: "Built-in",
    sourceColor: "#e3120b",
    url: "",
    content: t.definition,
    tags: t.tags,
    category: t.category,
  }));
}

// ── Main ───────────────────────────────────────────────────────

async function main() {
  const root = resolve(import.meta.dirname || __dirname, "..");
  const configPath = resolve(root, "content/wiki-sources.json");
  const outputDir = resolve(root, "content/wiki");
  const outputPath = resolve(outputDir, "articles.json");

  console.log("Fetching context engineering wiki content...\n");

  const config = JSON.parse(readFileSync(configPath, "utf-8"));
  const allArticles: WikiArticle[] = [];

  for (const source of config.sources as WikiSource[]) {
    console.log(`\n${source.name}:`);

    let articles: WikiArticle[] = [];

    if (source.id === "arxiv") {
      articles = await fetchArxiv(source);
    } else if (source.id === "openai") {
      articles = await fetchOpenAICookbook(source);
    } else {
      articles = await fetchDocPages(source);
    }

    console.log(`  -> ${articles.length} articles fetched`);
    allArticles.push(...articles);
  }

  if (config.builtinTerms) {
    const builtin = builtinToArticles(config.builtinTerms);
    console.log(`\nBuilt-in terms: ${builtin.length}`);
    allArticles.push(...builtin);
  }

  const seen = new Set<string>();
  const deduped = allArticles.filter((a) => {
    if (seen.has(a.slug)) return false;
    seen.add(a.slug);
    return true;
  });

  const bySource: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const a of deduped) {
    bySource[a.source] = (bySource[a.source] || 0) + 1;
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
  }

  const output = {
    articles: deduped,
    fetchedAt: new Date().toLocaleDateString("en-CA"),
    stats: { total: deduped.length, bySource, byCategory },
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");

  console.log(`\nDone. ${deduped.length} articles written to content/wiki/articles.json`);
  console.log(`   Sources: ${JSON.stringify(bySource)}`);
  console.log(`   Categories: ${JSON.stringify(byCategory)}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
