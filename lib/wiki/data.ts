import wikiData from "@/content/wiki/articles.json";
import type { WikiData } from "./types";

export const wiki = wikiData as WikiData;

export function getArticle(slug: string) {
  return wiki.articles.find((a) => a.slug === slug);
}
