/**
 * Pure-function relevance scorer with no VS Code dependencies.
 * Used for both the VS Code extension (via the wrapper in tabRelevanceScorer.ts)
 * and offline evaluation benchmarks.
 */

/** Minimal tab representation without VS Code types. */
export interface TabInfoPlain {
  relativePath: string;
  languageId: string;
  fsPath: string;
  estimatedTokens: number;
  relevanceScore: number;
  relevanceReason: string;
  isActive: boolean;
  isDirty: boolean;
  isPinned: boolean;
  diagnosticCount: number;
  lastEditTimestamp: number;
  label: string;
}

/** Active file context needed for scoring. */
export interface ActiveFileContext {
  text: string;
  languageId: string;
  fsPath: string;
}

/** Scoring weights (configurable for sensitivity analysis). */
export interface ScoringWeights {
  language: number;
  imports: number;
  path: number;
  recency: number;
  diagnostics: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  language: 0.25,
  imports: 0.30,
  path: 0.20,
  recency: 0.15,
  diagnostics: 0.10,
};

/**
 * Score all tabs relative to the active file using five signals.
 * Returns a new array with updated relevanceScore and relevanceReason.
 */
export function scoreAllPure(
  tabs: TabInfoPlain[],
  activeFile: ActiveFileContext | null,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
  now: number = Date.now(),
): TabInfoPlain[] {
  if (!activeFile) {
    return tabs.map(t => ({ ...t, relevanceScore: 0.5, relevanceReason: 'No active editor' }));
  }

  const activeImports = extractImports(activeFile.text);
  const activePath = activeFile.fsPath;
  const activeLang = activeFile.languageId;

  return tabs.map(tab => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Same language
    if (tab.languageId === activeLang) {
      score += weights.language;
      reasons.push('same language');
    }

    // 2. Import relationship
    if (matchesImport(tab.relativePath, activeImports)) {
      score += weights.imports;
      reasons.push('imported by active file');
    }

    // 3. Path similarity
    const pathScore = computePathSimilarity(activePath, tab.fsPath);
    score += pathScore * weights.path;
    if (pathScore > 0.5) {
      reasons.push('nearby path');
    }

    // 4. Recency of edit
    const ageMs = now - tab.lastEditTimestamp;
    const ageMinutes = ageMs / 60000;
    if (ageMinutes < 2) {
      score += weights.recency;
      reasons.push('recently edited');
    } else if (ageMinutes < 10) {
      score += 0.08;
      reasons.push('edited recently');
    }

    // 5. Diagnostics
    if (tab.diagnosticCount > 0) {
      score += weights.diagnostics;
      reasons.push(`${tab.diagnosticCount} diagnostics`);
    }

    // 6. Pinned — always maximum relevance
    if (tab.isPinned) {
      score = 1.0;
      reasons.length = 0;
      reasons.push('📌 pinned');
    }

    // 7. Active file — always maximum
    if (tab.isActive) {
      score = 1.0;
      reasons.length = 0;
      reasons.push('active editor');
    }

    return {
      ...tab,
      relevanceScore: Math.min(score, 1.0),
      relevanceReason: reasons.join(', ') || 'low relevance',
    };
  });
}

/**
 * Extract import paths from source text (TS/JS, Python, Go, Java).
 */
export function extractImports(text: string): string[] {
  const imports: string[] = [];

  // TypeScript / JavaScript
  const tsImports = text.matchAll(/(?:import\s+.*?from\s+['"](.+?)['"]|require\s*\(\s*['"](.+?)['"]\s*\))/g);
  for (const match of tsImports) {
    imports.push(match[1] || match[2]);
  }

  // Python
  const pyImports = text.matchAll(/(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/g);
  for (const match of pyImports) {
    imports.push((match[1] || match[2]).replace(/\./g, '/'));
  }

  // Go
  const goImports = text.matchAll(/import\s+(?:\w+\s+)?"(.+?)"/g);
  for (const match of goImports) {
    imports.push(match[1]);
  }

  // Java
  const javaImports = text.matchAll(/import\s+([\w.]+);/g);
  for (const match of javaImports) {
    imports.push(match[1].replace(/\./g, '/'));
  }

  return imports;
}

/**
 * Check if a tab's path matches any import from the active file.
 */
export function matchesImport(relativePath: string, imports: string[]): boolean {
  const tabName = fileNameNoExt(relativePath);
  const tabPath = relativePath.replace(/\\/g, '/');

  for (const imp of imports) {
    const normalizedImport = imp.replace(/\\/g, '/').replace(/^\.\//, '');

    // Direct match: import ends with tab's filename
    if (normalizedImport.endsWith(tabName)) {
      const beforeName = normalizedImport.slice(0, -tabName.length);
      if (beforeName === '' || beforeName.endsWith('/')) {
        return true;
      }
    }

    // Path suffix match
    const importWithoutExt = normalizedImport.replace(/\.[^/.]+$/, '');
    const tabWithoutExt = tabPath.replace(/\.[^/.]+$/, '');
    if (tabWithoutExt.endsWith(importWithoutExt)) {
      const beforeMatch = tabWithoutExt.slice(0, -importWithoutExt.length);
      if (beforeMatch === '' || beforeMatch.endsWith('/')) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Compute path similarity based on shared directory prefix segments.
 */
export function computePathSimilarity(pathA: string, pathB: string): number {
  const normA = pathA.replace(/\\/g, '/');
  const normB = pathB.replace(/\\/g, '/');
  const dirA = normA.split('/').slice(0, -1);
  const dirB = normB.split('/').slice(0, -1);

  if (dirA.length === 0 || dirB.length === 0) { return 0; }

  let shared = 0;
  for (let i = 0; i < Math.min(dirA.length, dirB.length); i++) {
    if (dirA[i] === dirB[i]) { shared++; } else { break; }
  }

  if (shared === dirA.length && shared === dirB.length) {
    return 1.0;
  }

  const maxDepth = Math.max(dirA.length, dirB.length);
  return shared / maxDepth;
}

function fileNameNoExt(filePath: string): string {
  const base = filePath.split('/').pop() || '';
  return base.replace(/\.[^.]+$/, '');
}
