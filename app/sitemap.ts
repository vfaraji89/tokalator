import { getCatalogByKind } from "@/lib/catalog";
import wikiData from "../content/wiki/articles.json";
import type { MetadataRoute } from "next";

const BASE = "https://tokalator.wiki";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Static pages
  const staticRoutes = [
    { path: "/", priority: 1.0, freq: "weekly" as const },
    { path: "/about", priority: 0.6, freq: "monthly" as const },
    { path: "/wiki", priority: 0.8, freq: "weekly" as const },
    { path: "/dictionary", priority: 0.7, freq: "monthly" as const },
    { path: "/learn", priority: 0.8, freq: "weekly" as const },
    { path: "/extension", priority: 0.7, freq: "monthly" as const },
    { path: "/calculator", priority: 0.9, freq: "weekly" as const },
    { path: "/context", priority: 0.8, freq: "weekly" as const },
    { path: "/tools", priority: 0.7, freq: "monthly" as const },
    { path: "/tools/compare", priority: 0.8, freq: "weekly" as const },
    { path: "/tools/caching", priority: 0.8, freq: "weekly" as const },
    { path: "/tools/conversation", priority: 0.7, freq: "weekly" as const },
    { path: "/tools/analysis", priority: 0.7, freq: "weekly" as const },
    { path: "/tools/pricing", priority: 0.8, freq: "weekly" as const },
    { path: "/tools/usage", priority: 0.7, freq: "weekly" as const },
    { path: "/agents", priority: 0.7, freq: "weekly" as const },
    { path: "/prompts", priority: 0.7, freq: "weekly" as const },
    { path: "/instructions", priority: 0.7, freq: "weekly" as const },
    { path: "/collections", priority: 0.7, freq: "weekly" as const },
    { path: "/context-engineering", priority: 0.7, freq: "weekly" as const },
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));

  // Wiki articles
  for (const article of wikiData.articles) {
    entries.push({
      url: `${BASE}/wiki/${article.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // Catalog detail pages
  const kinds = ["agent", "prompt", "instruction", "collection"] as const;
  const kindPaths: Record<string, string> = {
    agent: "agents",
    prompt: "prompts",
    instruction: "instructions",
    collection: "collections",
  };
  for (const kind of kinds) {
    const items = getCatalogByKind(kind);
    for (const item of items) {
      entries.push({
        url: `${BASE}/${kindPaths[kind]}/${item.id}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
