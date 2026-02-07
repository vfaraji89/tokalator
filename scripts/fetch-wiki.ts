/**
 * Build-time script to fetch context engineering content from external sources.
 * Run: npm run fetch-wiki (or npx tsx scripts/fetch-wiki.ts)
 *
 * Sources: arXiv, OpenAI Cookbook, Anthropic Docs, Google AI Docs
 * Output: content/wiki/articles.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

// ── Types ──────────────────────────────────────────────────────

interface WikiArticle {
  slug: string;
  title: string;
  description: string;
  source: string;
  sourceLabel: string;
  sourceColor: string;
  url: string;
  content: string;
  authors?: string[];
  date?: string;
  tags: string[];
  category: string;
}

interface WikiSource {
  id: string;
  name: string;
  color: string;
  queries?: string[];
  maxResults?: number;
  repoFiles?: string[];
  pages?: { url: string; title: string; tags?: string[]; category?: string }[];
}

interface BuiltinTerm {
  term: string;
  definition: string;
  category: string;
  tags: string[];
}

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

function extractText(html: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const matches: string[] = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    matches.push(m[1].replace(/<[^>]+>/g, "").trim());
  }
  return matches.join("\n\n");
}

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n")
    .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, "`$1`")
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "\n```\n$1\n```\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "$1\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function categorizeByKeywords(text: string, tags: string[]): string {
  const lower = (text + " " + tags.join(" ")).toLowerCase();
  if (lower.includes("cach")) return "caching";
  if (lower.includes("token") && (lower.includes("optim") || lower.includes("count")))
    return "token-optimization";
  if (lower.includes("retrieval") || lower.includes("rag")) return "rag";
  if (lower.includes("context") && (lower.includes("window") || lower.includes("manag") || lower.includes("rot")))
    return "context-management";
  if (lower.includes("prompt") || lower.includes("chain") || lower.includes("xml tag"))
    return "prompt-engineering";
  if (lower.includes("tool") || lower.includes("function call")) return "tool-use";
  return "general";
}

// ── arXiv Fetcher ──────────────────────────────────────────────

async function fetchArxiv(source: WikiSource): Promise<WikiArticle[]> {
  const articles: WikiArticle[] = [];
  const seenIds = new Set<string>();

  for (const query of source.queries || []) {
    const maxResults = Math.ceil((source.maxResults || 15) / (source.queries?.length || 1));
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;

    console.log(`  arXiv: "${query}" (max ${maxResults})...`);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`  arXiv query failed: ${res.status}`);
        continue;
      }
      const xml = await res.text();

      // Parse entries from Atom XML
      const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
      let match;
      while ((match = entryRegex.exec(xml)) !== null) {
        const entry = match[1];

        const idMatch = entry.match(/<id>(.*?)<\/id>/);
        const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
        const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
        const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
        const linkMatch = entry.match(/<link[^>]*href="(https:\/\/arxiv\.org\/abs\/[^"]*)"[^>]*\/>/);

        if (!idMatch || !titleMatch) continue;

        const arxivId = idMatch[1].replace("http://arxiv.org/abs/", "").replace(/v\d+$/, "");
        if (seenIds.has(arxivId)) continue;
        seenIds.add(arxivId);

        const title = titleMatch[1].replace(/\s+/g, " ").trim();
        const abstract = summaryMatch
          ? summaryMatch[1].replace(/\s+/g, " ").trim()
          : "";
        const published = publishedMatch ? publishedMatch[1].slice(0, 10) : undefined;
        const paperUrl = linkMatch ? linkMatch[1] : `https://arxiv.org/abs/${arxivId}`;

        // Authors
        const authorRegex = /<author>\s*<name>(.*?)<\/name>/gi;
        const authors: string[] = [];
        let am;
        while ((am = authorRegex.exec(entry)) !== null) {
          authors.push(am[1].trim());
        }

        // Category tags
        const catRegex = /<category[^>]*term="([^"]*)"[^>]*\/>/gi;
        const tags: string[] = [];
        let cm;
        while ((cm = catRegex.exec(entry)) !== null) {
          tags.push(cm[1]);
        }

        articles.push({
          slug: `arxiv-${slugify(title)}`,
          title,
          description: truncate(abstract, 200),
          source: source.id,
          sourceLabel: source.name,
          sourceColor: source.color,
          url: paperUrl,
          content: `## Abstract\n\n${abstract}`,
          authors: authors.slice(0, 5),
          date: published,
          tags: tags.slice(0, 5),
          category: categorizeByKeywords(title + " " + abstract, tags),
        });
      }

      // Rate limit politeness
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.warn(`  arXiv error for "${query}":`, err);
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
      const content = await res.text();

      // Extract title from first heading
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : filePath.split("/").pop()?.replace(/\.\w+$/, "") || filePath;

      // Extract description from first paragraph after title
      const lines = content.split("\n");
      let description = "";
      let foundTitle = false;
      for (const line of lines) {
        if (line.startsWith("# ")) {
          foundTitle = true;
          continue;
        }
        if (foundTitle && line.trim() && !line.startsWith("#") && !line.startsWith("```")) {
          description = truncate(line.trim(), 200);
          break;
        }
      }

      // Auto-tag from content
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
        category: categorizeByKeywords(title + " " + content.slice(0, 500), tags),
      });

      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.warn(`  OpenAI error for "${filePath}":`, err);
    }
  }

  return articles;
}

// ── HTML Docs Fetcher (Anthropic & Google) ─────────────────────

async function fetchDocPages(source: WikiSource): Promise<WikiArticle[]> {
  const articles: WikiArticle[] = [];

  for (const page of source.pages || []) {
    console.log(`  ${source.name}: ${page.title}...`);

    try {
      const res = await fetch(page.url, {
        headers: {
          "User-Agent": "Tokalator-WikiBot/1.0 (context engineering wiki builder)",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (!res.ok) {
        console.warn(`  ${source.name} fetch failed (${res.status}): ${page.url}`);
        // Create a stub article with just the title and link
        articles.push({
          slug: `${source.id}-${slugify(page.title)}`,
          title: page.title,
          description: `${page.title} — from ${source.name} documentation. Visit the original page for full content.`,
          source: source.id,
          sourceLabel: source.name,
          sourceColor: source.color,
          url: page.url,
          content: `# ${page.title}\n\nThis article is available at [${source.name}](${page.url}). Visit the original documentation for the full content.`,
          tags: page.tags || [source.id],
          category: page.category || categorizeByKeywords(page.title, page.tags || []),
        });
        continue;
      }

      const html = await res.text();

      // Try to extract main content area
      let mainContent = "";

      // Look for <main>, <article>, or content div
      const mainMatch =
        html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
        html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
        html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

      if (mainMatch) {
        mainContent = htmlToMarkdown(mainMatch[1]);
      } else {
        // Fallback: extract body content, strip scripts/styles
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
          let body = bodyMatch[1];
          body = body.replace(/<script[\s\S]*?<\/script>/gi, "");
          body = body.replace(/<style[\s\S]*?<\/style>/gi, "");
          body = body.replace(/<nav[\s\S]*?<\/nav>/gi, "");
          body = body.replace(/<footer[\s\S]*?<\/footer>/gi, "");
          body = body.replace(/<header[\s\S]*?<\/header>/gi, "");
          mainContent = htmlToMarkdown(body);
        }
      }

      // If we got very little content, create a stub
      if (mainContent.length < 100) {
        mainContent = `# ${page.title}\n\nThis article is available at [${source.name}](${page.url}). Visit the original documentation for the full content.`;
      }

      // Extract description
      const metaDescMatch = html.match(
        /<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i
      );
      const description = metaDescMatch
        ? metaDescMatch[1]
        : truncate(mainContent.replace(/[#`*\->\[\]()]/g, " ").trim(), 200);

      articles.push({
        slug: `${source.id}-${slugify(page.title)}`,
        title: page.title,
        description,
        source: source.id,
        sourceLabel: source.name,
        sourceColor: source.color,
        url: page.url,
        content: mainContent.slice(0, 10000), // Cap at ~10k chars
        tags: page.tags || [source.id],
        category: page.category || categorizeByKeywords(page.title + " " + description, page.tags || []),
      });

      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.warn(`  ${source.name} error for "${page.title}":`, err);
      // Create stub on error too
      articles.push({
        slug: `${source.id}-${slugify(page.title)}`,
        title: page.title,
        description: `${page.title} — from ${source.name} documentation.`,
        source: source.id,
        sourceLabel: source.name,
        sourceColor: source.color,
        url: page.url,
        content: `# ${page.title}\n\nVisit [${source.name}](${page.url}) for the full content.`,
        tags: page.tags || [source.id],
        category: page.category || "general",
      });
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
    content: `# ${t.term}\n\n${t.definition}`,
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

  console.log("📖 Fetching context engineering wiki content...\n");

  const config = JSON.parse(readFileSync(configPath, "utf-8"));
  const allArticles: WikiArticle[] = [];

  // Fetch from each source
  for (const source of config.sources as WikiSource[]) {
    console.log(`\n🔍 ${source.name}:`);

    let articles: WikiArticle[] = [];

    if (source.id === "arxiv") {
      articles = await fetchArxiv(source);
    } else if (source.id === "openai") {
      articles = await fetchOpenAICookbook(source);
    } else {
      // Anthropic, Google, or any HTML doc source
      articles = await fetchDocPages(source);
    }

    console.log(`  → ${articles.length} articles fetched`);
    allArticles.push(...articles);
  }

  // Add builtin terms
  if (config.builtinTerms) {
    const builtin = builtinToArticles(config.builtinTerms);
    console.log(`\n📝 Built-in terms: ${builtin.length}`);
    allArticles.push(...builtin);
  }

  // Dedupe by slug
  const seen = new Set<string>();
  const deduped = allArticles.filter((a) => {
    if (seen.has(a.slug)) return false;
    seen.add(a.slug);
    return true;
  });

  // Compute stats
  const bySource: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const a of deduped) {
    bySource[a.source] = (bySource[a.source] || 0) + 1;
    byCategory[a.category] = (byCategory[a.category] || 0) + 1;
  }

  const output = {
    articles: deduped,
    fetchedAt: new Date().toISOString(),
    stats: { total: deduped.length, bySource, byCategory },
  };

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`\n✅ Done! ${deduped.length} articles written to content/wiki/articles.json`);
  console.log(`   Sources: ${JSON.stringify(bySource)}`);
  console.log(`   Categories: ${JSON.stringify(byCategory)}`);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
