#!/usr/bin/env npx tsx
/**
 * Auto-Terminology Scanner
 *
 * Discovers domain terms from project sources, compiles a compressed glossary,
 * and outputs it in a format optimized for agent context injection.
 *
 * Sources scanned:
 *   - content/dictionary.json (structured terms)
 *   - terminologies.md (LaTeX table)
 *   - SKILL.md files (frontmatter + inline definitions)
 *
 * Usage:
 *   npx tsx scripts/terminology-scanner.ts
 *   npx tsx scripts/terminology-scanner.ts --format=instructions
 *   npx tsx scripts/terminology-scanner.ts --max-tokens=300 --category=caching
 */

import * as fs from 'fs';
import * as path from 'path';

interface Term {
  term: string;
  definition: string;
  category: string;
  tags: string[];
  source: string;
  tokenEstimate: number;
}

interface ScanResult {
  project: string;
  terms: Term[];
  glossaryTokens: number;
  estimatedSavings25Turns: number;
}

const ROOT = path.resolve(__dirname, '..');
const TOKENS_PER_WORD = 1.3; // average for English technical text

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * TOKENS_PER_WORD);
}

function scanDictionaryJson(): Term[] {
  const dictPath = path.join(ROOT, 'content/dictionary.json');
  if (!fs.existsSync(dictPath)) return [];

  const data = JSON.parse(fs.readFileSync(dictPath, 'utf-8'));
  return (data.terms || []).map((t: { term: string; definition: string; category: string; tags: string[] }) => ({
    term: t.term,
    definition: t.definition,
    category: t.category || 'general',
    tags: t.tags || [],
    source: 'content/dictionary.json',
    tokenEstimate: estimateTokens(`${t.term}: ${t.definition}`),
  }));
}

function scanTerminologiesMd(): Term[] {
  const mdPath = path.join(ROOT, 'terminologies.md');
  if (!fs.existsSync(mdPath)) return [];

  const content = fs.readFileSync(mdPath, 'utf-8');
  const terms: Term[] = [];

  // Parse LaTeX table rows: Term & Definition \\
  const rowPattern = /^(.+?)\s*&\s*(.+?)\s*\\\\$/gm;
  let match;
  let currentCategory = 'general';

  for (const line of content.split('\n')) {
    // Detect category headers: \multicolumn{2}{|l|}{\textit{Category Name}}
    const catMatch = line.match(/\\textit\{(.+?)\}/);
    if (catMatch) {
      currentCategory = catMatch[1].toLowerCase().replace(/\s+/g, '-');
      continue;
    }

    match = line.match(/^(.+?)\s*&\s*(.+?)\s*\\\\$/);
    if (match && !match[1].includes('\\textbf') && !match[1].includes('\\hline')) {
      const term = match[1].trim().replace(/\\texttt\{(.+?)\}/g, '$1');
      let def = match[2].trim()
        .replace(/~\\cite\{[^}]+\}/g, '')
        .replace(/\\texttt\{(.+?)\}/g, '`$1`')
        .replace(/\\url\{(.+?)\}/g, '$1');

      if (term && def && term.length > 1) {
        terms.push({
          term,
          definition: def,
          category: currentCategory,
          tags: [],
          source: 'terminologies.md',
          tokenEstimate: estimateTokens(`${term}: ${def}`),
        });
      }
    }
  }

  return terms;
}

function compressDefinition(def: string, maxWords: number = 20): string {
  const words = def.split(/\s+/);
  if (words.length <= maxWords) return def;

  // Take first sentence or first maxWords words
  const firstSentence = def.match(/^[^.]+\./);
  if (firstSentence && firstSentence[0].split(/\s+/).length <= maxWords) {
    return firstSentence[0];
  }
  return words.slice(0, maxWords).join(' ') + '...';
}

function deduplicateTerms(terms: Term[]): Term[] {
  const seen = new Map<string, Term>();
  for (const t of terms) {
    const key = t.term.toLowerCase();
    if (!seen.has(key) || t.source === 'content/dictionary.json') {
      seen.set(key, t);
    }
  }
  return Array.from(seen.values());
}

function formatAsInstructions(terms: Term[]): string {
  const lines = [
    '---',
    'applyTo: "**"',
    '---',
    '',
    '# Project Terminology (auto-generated)',
    '',
    'These terms have project-specific meanings. Use them precisely without re-defining.',
    '',
  ];

  const byCategory = new Map<string, Term[]>();
  for (const t of terms) {
    const cat = t.category || 'general';
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(t);
  }

  for (const [cat, catTerms] of byCategory) {
    lines.push(`## ${cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`);
    for (const t of catTerms) {
      lines.push(`- **${t.term}**: ${compressDefinition(t.definition)}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function formatAsYaml(result: ScanResult): string {
  const glossary = result.terms
    .map(t => `- **${t.term}**: ${compressDefinition(t.definition)}`)
    .join('\n');

  return `terminology_report:
  project: ${result.project}
  terms_discovered: ${result.terms.length}
  glossary_tokens: ${result.glossaryTokens}
  estimated_savings_25_turns: ${result.estimatedSavings25Turns}
  injection_method: instructions
  glossary: |
${glossary.split('\n').map(l => '    ' + l).join('\n')}
`;
}

// ── Main ──

function main() {
  const args = process.argv.slice(2);
  const format = args.find(a => a.startsWith('--format='))?.split('=')[1] || 'yaml';
  const maxTokens = parseInt(args.find(a => a.startsWith('--max-tokens='))?.split('=')[1] || '500');
  const categoryFilter = args.find(a => a.startsWith('--category='))?.split('=')[1];

  // Scan all sources
  let terms = [
    ...scanDictionaryJson(),
    ...scanTerminologiesMd(),
  ];

  terms = deduplicateTerms(terms);

  // Filter by category if specified
  if (categoryFilter) {
    terms = terms.filter(t => t.category === categoryFilter);
  }

  // Sort by token estimate (smallest first for budget packing)
  terms.sort((a, b) => a.tokenEstimate - b.tokenEstimate);

  // Trim to token budget
  let totalTokens = 0;
  const budgetedTerms: Term[] = [];
  for (const t of terms) {
    const compressed = estimateTokens(`${t.term}: ${compressDefinition(t.definition)}`);
    if (totalTokens + compressed > maxTokens) break;
    totalTokens += compressed;
    budgetedTerms.push(t);
  }

  const result: ScanResult = {
    project: 'tokalator',
    terms: budgetedTerms,
    glossaryTokens: totalTokens,
    estimatedSavings25Turns: Math.round(
      (budgetedTerms.length * 3 * 40 * 25 - totalTokens) * 0.74
    ),
  };

  if (format === 'instructions') {
    const output = formatAsInstructions(budgetedTerms);
    const outPath = path.join(ROOT, '.github/instructions/terminology.instructions.md');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output);
    console.log(`Written ${budgetedTerms.length} terms to ${outPath} (${totalTokens} tokens)`);
  } else {
    console.log(formatAsYaml(result));
  }
}

main();
