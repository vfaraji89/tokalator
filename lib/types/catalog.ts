// Core types for the Tokalator context engineering catalog

export type ContentKind = 'agent' | 'prompt' | 'instruction' | 'collection' | 'tool' | 'repo';

export type Ecosystem = 'copilot' | 'claude-code' | 'universal';

export type ContentSource = 'builtin' | 'awesome-copilot' | 'community' | 'user';

export interface CatalogItem {
  id: string;
  kind: ContentKind;
  ecosystem: Ecosystem;
  source: ContentSource;
  name: string;
  description: string;
  filePath: string;
  rawContent: string;
  tags: string[];
  model?: string;
  tools?: string[];
  author?: string;
  featured: boolean;
}

export interface Catalog {
  items: CatalogItem[];
  stats: CatalogStats;
  lastScanned: string;
}

export interface CatalogStats {
  totalItems: number;
  byKind: Record<ContentKind, number>;
  byEcosystem: Record<Ecosystem, number>;
  bySource: Record<ContentSource, number>;
}

export interface CatalogConfig {
  featuredIds: string[];
  scanDirectories: ScanDirectory[];
}

export interface ScanDirectory {
  path: string;
  source: ContentSource;
  ecosystem?: Ecosystem;
}

export interface ExtensionFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  route?: string;
  category: 'monitor' | 'calculator' | 'optimizer' | 'analyzer';
}

export interface Frontmatter {
  name?: string;
  description?: string;
  model?: string;
  tools?: string[];
  tags?: string[];
  agent?: string;
  [key: string]: unknown;
}
