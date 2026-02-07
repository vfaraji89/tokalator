import fs from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import type {
  CatalogItem,
  Catalog,
  CatalogStats,
  CatalogConfig,
  ContentKind,
  ContentSource,
  Ecosystem,
} from '@/lib/types/catalog';
import { parseFrontmatter, nameFromFilename } from './frontmatter';

const PROJECT_ROOT = process.cwd();

const DEFAULT_CONFIG: CatalogConfig = {
  featuredIds: [],
  scanDirectories: [
    { path: 'copilot-contribution', source: 'builtin', ecosystem: 'copilot' },
    { path: 'awesome-copilot', source: 'awesome-copilot', ecosystem: 'copilot' },
    { path: 'user-content', source: 'user' },
  ],
};

// File extension patterns → content kind
const KIND_PATTERNS: [RegExp, ContentKind][] = [
  [/\.agent\.md$/i, 'agent'],
  [/\.prompt\.md$/i, 'prompt'],
  [/\.instructions\.md$/i, 'instruction'],
  [/\.collection\.(yml|yaml)$/i, 'collection'],
];

let cachedCatalog: Catalog | null = null;

function loadConfig(): CatalogConfig {
  const configPath = path.join(PROJECT_ROOT, 'catalog-config.json');
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function detectKind(filename: string): ContentKind | null {
  for (const [pattern, kind] of KIND_PATTERNS) {
    if (pattern.test(filename)) return kind;
  }
  // CLAUDE.md files are instructions for Claude Code
  if (/^CLAUDE\.md$/i.test(filename)) return 'instruction';
  return null;
}

function detectEcosystem(filePath: string, source: ContentSource, dirEcosystem?: Ecosystem): Ecosystem {
  if (dirEcosystem) return dirEcosystem;

  const lower = filePath.toLowerCase();
  if (lower.includes('claude-code') || lower.includes('claude.md')) return 'claude-code';
  if (lower.includes('copilot')) return 'copilot';
  return 'universal';
}

function slugFromPath(filePath: string): string {
  const basename = path.basename(filePath);
  return basename
    .replace(/\.(agent|prompt|instructions|collection)\.(md|yml|yaml)$/i, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function walkDirectory(dir: string, extensions: string[]): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip hidden directories and node_modules
    if (entry.name.startsWith('.') && entry.isDirectory()) continue;
    if (entry.name === 'node_modules') continue;
    if (entry.name === '.git') continue;

    if (entry.isDirectory()) {
      results.push(...walkDirectory(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath);
    } else if (/^CLAUDE\.md$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

function parseFile(
  filePath: string,
  source: ContentSource,
  dirEcosystem?: Ecosystem,
  featuredIds: string[] = []
): CatalogItem | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const filename = path.basename(filePath);
    const kind = detectKind(filename);

    if (!kind) return null;

    // Handle YAML collection files
    if (kind === 'collection' && (filename.endsWith('.yml') || filename.endsWith('.yaml'))) {
      try {
        const parsed = parseYaml(raw);
        const id = parsed.id || slugFromPath(filePath);
        return {
          id,
          kind,
          ecosystem: detectEcosystem(relativePath, source, dirEcosystem),
          source,
          name: parsed.name || nameFromFilename(filename),
          description: parsed.description || '',
          filePath: relativePath,
          rawContent: raw,
          tags: parsed.tags || [],
          featured: featuredIds.includes(id) || source === 'builtin',
        };
      } catch {
        return null;
      }
    }

    // Handle markdown files with frontmatter
    const { frontmatter, body } = parseFrontmatter(raw);
    const id = slugFromPath(filePath);

    return {
      id,
      kind,
      ecosystem: detectEcosystem(relativePath, source, dirEcosystem),
      source,
      name: (frontmatter.name as string) || nameFromFilename(filename),
      description: (frontmatter.description as string) || extractFirstParagraph(body),
      filePath: relativePath,
      rawContent: raw,
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags as string[] : [],
      model: frontmatter.model as string | undefined,
      tools: Array.isArray(frontmatter.tools) ? frontmatter.tools as string[] : undefined,
      featured: featuredIds.includes(id) || source === 'builtin',
    };
  } catch {
    return null;
  }
}

function extractFirstParagraph(body: string): string {
  const lines = body.split('\n');
  const paragraphLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) continue;
    if (trimmed === '' && paragraphLines.length > 0) break;
    if (trimmed !== '') paragraphLines.push(trimmed);
  }

  const result = paragraphLines.join(' ');
  return result.length > 200 ? result.slice(0, 197) + '...' : result;
}

function computeStats(items: CatalogItem[]): CatalogStats {
  const stats: CatalogStats = {
    totalItems: items.length,
    byKind: { agent: 0, prompt: 0, instruction: 0, collection: 0, tool: 0, repo: 0 },
    byEcosystem: { copilot: 0, 'claude-code': 0, universal: 0 },
    bySource: { builtin: 0, 'awesome-copilot': 0, community: 0, user: 0 },
  };

  for (const item of items) {
    stats.byKind[item.kind]++;
    stats.byEcosystem[item.ecosystem]++;
    stats.bySource[item.source]++;
  }

  return stats;
}

/** Scan for CLAUDE.md files at project root and in .claude/ directories */
function scanClaudeCodeContent(featuredIds: string[]): CatalogItem[] {
  const items: CatalogItem[] = [];

  // Check project root for CLAUDE.md
  const claudeMdPath = path.join(PROJECT_ROOT, 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath)) {
    const item = parseFile(claudeMdPath, 'user', 'claude-code', featuredIds);
    if (item) items.push(item);
  }

  // Check .claude/ directory for commands, hooks, etc.
  const claudeDir = path.join(PROJECT_ROOT, '.claude');
  if (fs.existsSync(claudeDir)) {
    const files = walkDirectory(claudeDir, ['.md', '.yml', '.yaml']);
    for (const file of files) {
      // Skip plans directory (internal)
      if (file.includes('/plans/')) continue;
      const item = parseFile(file, 'user', 'claude-code', featuredIds);
      if (item) items.push(item);
    }
  }

  return items;
}

export function scanCatalog(forceRefresh = false): Catalog {
  if (cachedCatalog && !forceRefresh) return cachedCatalog;

  const config = loadConfig();
  const items: CatalogItem[] = [];
  const seenIds = new Set<string>();

  // Scan configured directories
  for (const dir of config.scanDirectories) {
    const fullDir = path.join(PROJECT_ROOT, dir.path);
    const files = walkDirectory(fullDir, ['.agent.md', '.prompt.md', '.instructions.md', '.collection.yml', '.collection.yaml']);

    for (const file of files) {
      const item = parseFile(file, dir.source, dir.ecosystem, config.featuredIds);
      if (item && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        items.push(item);
      }
    }
  }

  // Auto-detect Claude Code content
  const claudeItems = scanClaudeCodeContent(config.featuredIds);
  for (const item of claudeItems) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      items.push(item);
    }
  }

  // Sort: featured first, then alphabetical
  items.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  cachedCatalog = {
    items,
    stats: computeStats(items),
    lastScanned: new Date().toISOString(),
  };

  return cachedCatalog;
}

export function getCatalogByKind(kind: ContentKind): CatalogItem[] {
  const catalog = scanCatalog();
  return catalog.items.filter(item => item.kind === kind);
}

export function getCatalogItemById(id: string): CatalogItem | undefined {
  const catalog = scanCatalog();
  return catalog.items.find(item => item.id === id);
}

export function getCatalogStats(): CatalogStats {
  return scanCatalog().stats;
}
