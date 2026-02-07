import type { Frontmatter } from '@/lib/types/catalog';

/**
 * Parse YAML frontmatter from a markdown file's content.
 * Frontmatter is delimited by --- at the start and end.
 */
export function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const trimmed = content.trimStart();

  if (!trimmed.startsWith('---')) {
    return { frontmatter: {}, body: content };
  }

  const endIndex = trimmed.indexOf('---', 3);
  if (endIndex === -1) {
    return { frontmatter: {}, body: content };
  }

  const raw = trimmed.slice(3, endIndex).trim();
  const body = trimmed.slice(endIndex + 3).trim();
  const frontmatter: Frontmatter = {};

  for (const line of raw.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Remove surrounding quotes
    if ((value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }

    // Parse arrays: ['item1', 'item2']
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1);
      frontmatter[key] = inner
        .split(',')
        .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else {
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body };
}

/**
 * Derive a human-readable name from a filename.
 * "context-architect.agent.md" -> "Context Architect"
 */
export function nameFromFilename(filename: string): string {
  return filename
    .replace(/\.(agent|prompt|instructions|collection)\.(md|yml|yaml)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}
