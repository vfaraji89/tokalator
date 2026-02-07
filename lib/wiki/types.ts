export interface WikiArticle {
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

export interface WikiData {
  articles: WikiArticle[];
  fetchedAt: string;
  stats: {
    total: number;
    bySource: Record<string, number>;
    byCategory: Record<string, number>;
  };
}

export interface WikiSourceConfig {
  sources: WikiSource[];
  builtinTerms: BuiltinTerm[];
}

export interface WikiSource {
  id: string;
  name: string;
  color: string;
  queries?: string[];
  maxResults?: number;
  repoFiles?: string[];
  pages?: { url: string; title: string; tags?: string[]; category?: string }[];
}

export interface BuiltinTerm {
  term: string;
  definition: string;
  category: string;
  tags: string[];
}
