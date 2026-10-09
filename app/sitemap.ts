import { getCatalogByKind } from "@/lib/catalog";
import wikiData from "../content/wiki/articles.json";
import events from "../content/events.json";
import type { MetadataRoute } from "next";

const BASE = "https://tokalator.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = "2026-10-10";

  const staticRoutes = [
    { path: "/", priority: 1.0, freq: "weekly" as const },
    { path: "/extension", priority: 0.9, freq: "monthly" as const },
    { path: "/tools", priority: 0.8, freq: "monthly" as const },
    { path: "/tools/calculator", priority: 0.9, freq: "weekly" as const },
    { path: "/tools/compare", priority: 0.8, freq: "weekly" as const },
    { path: "/tools/pricing", priority: 0.8, freq: "weekly" as const },
    { path: "/tools/caching", priority: 0.7, freq: "monthly" as const },
    { path: "/tools/conversation", priority: 0.7, freq: "monthly" as const },
    { path: "/tools/context", priority: 0.7, freq: "monthly" as const },
    { path: "/tools/economics", priority: 0.7, freq: "monthly" as const },
    { path: "/tools/usage", priority: 0.8, freq: "monthly" as const },
    { path: "/wiki", priority: 0.8, freq: "weekly" as const },
    { path: "/dictionary", priority: 0.7, freq: "monthly" as const },
    { path: "/learn", priority: 0.8, freq: "monthly" as const },
    { path: "/context-engineering", priority: 0.6, freq: "monthly" as const },
    { path: "/catalog", priority: 0.6, freq: "weekly" as const },
    { path: "/agents", priority: 0.6, freq: "weekly" as const },
    { path: "/prompts", priority: 0.6, freq: "weekly" as const },
    { path: "/instructions", priority: 0.6, freq: "weekly" as const },
    { path: "/collections", priority: 0.6, freq: "weekly" as const },
    { path: "/events", priority: 0.5, freq: "monthly" as const },
    { path: "/about", priority: 0.5, freq: "monthly" as const },
    { path: "/privacy", priority: 0.3, freq: "yearly" as const },
    { path: "/terms", priority: 0.3, freq: "yearly" as const },
  ];


  const entries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));

  for (const article of wikiData.articles) {
    entries.push({
      url: `${BASE}/wiki/${article.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  for (const event of events.events) {
    entries.push({ url: `${BASE}/events/${event.slug}`, lastModified: now, changeFrequency: "yearly", priority: 0.4 });
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
