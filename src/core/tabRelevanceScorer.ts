import * as vscode from 'vscode';
import { TabInfo } from './types';

/**
 * Scores each open tab by relevance to the currently active file.
 *
 * Scoring factors:
 *  - Same language as active file       (+0.25)
 *  - Import/export relationship         (+0.30)
 *  - Path similarity (shared dirs)      (+0.20)
 *  - Recently edited                    (+0.15)
 *  - Has diagnostics (errors)           (+0.10)
 */
export class TabRelevanceScorer {

  /**
   * Score all tabs relative to the active editor.
   */
  scoreAll(
    tabs: TabInfo[],
    activeEditor: vscode.TextEditor | undefined
  ): TabInfo[] {
    if (!activeEditor) {
      return tabs.map(t => ({ ...t, relevanceScore: 0.5, relevanceReason: 'No active editor' }));
    }

    const activeDoc = activeEditor.document;
    const activeImports = this.extractImports(activeDoc);
    const activePath = activeDoc.uri.fsPath;
    const activeLang = activeDoc.languageId;
    const now = Date.now();

    return tabs.map(tab => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Same language
      if (tab.languageId === activeLang) {
        score += 0.25;
        reasons.push('same language');
      }

      // 2. Import relationship — check if active file imports this tab
      const isImported = this.matchesImport(tab, activeImports);
      if (isImported) {
        score += 0.30;
        reasons.push('imported by active file');
      }

      // 3. Path similarity — shared directory segments
      const pathScore = this.computePathSimilarity(activePath, tab.uri.fsPath);
      score += pathScore * 0.20;
      if (pathScore > 0.5) {
        reasons.push('nearby path');
      }

      // 4. Recency of edit
      const ageMs = now - tab.lastEditTimestamp;
      const ageMinutes = ageMs / 60000;
      if (ageMinutes < 2) {
        score += 0.15;
        reasons.push('recently edited');
      } else if (ageMinutes < 10) {
        score += 0.08;
        reasons.push('edited recently');
      }

      // 5. Diagnostics — files with errors are relevant (you're debugging)
      if (tab.diagnosticCount > 0) {
        score += 0.10;
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
   * Extract import paths from a document (works for TS/JS/Python/Go/Java/etc.)
   */
  private extractImports(doc: vscode.TextDocument): string[] {
    const text = doc.getText();
    const imports: string[] = [];

    // TypeScript / JavaScript: import ... from '...' or require('...')
    const tsImports = text.matchAll(/(?:import\s+.*?from\s+['"](.+?)['"]|require\s*\(\s*['"](.+?)['"]\s*\))/g);
    for (const match of tsImports) {
      imports.push(match[1] || match[2]);
    }

    // Python: import X / from X import Y
    const pyImports = text.matchAll(/(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/g);
    for (const match of pyImports) {
      imports.push((match[1] || match[2]).replace(/\./g, '/'));
    }

    // Go: import "path"
    const goImports = text.matchAll(/import\s+(?:\w+\s+)?"(.+?)"/g);
    for (const match of goImports) {
      imports.push(match[1]);
    }

    // Java: import package.Class
    const javaImports = text.matchAll(/import\s+([\w.]+);/g);
    for (const match of javaImports) {
      imports.push(match[1].replace(/\./g, '/'));
    }

    return imports;
  }

  /**
   * Check if a tab matches any of the imports from the active file.
   * More precise than simple .includes() — handles relative paths properly.
   */
  private matchesImport(tab: TabInfo, imports: string[]): boolean {
    const tabName = this.fileNameNoExt(tab.relativePath);
    const tabPath = tab.relativePath.replace(/\\/g, '/');

    for (const imp of imports) {
      // Normalize the import path
      const normalizedImport = imp.replace(/\\/g, '/').replace(/^\.\//, '');

      // Direct match: import ends with the tab's filename (without extension)
      // e.g., import './utils' matches 'src/utils.ts'
      if (normalizedImport.endsWith(tabName)) {
        // Verify it's not a partial match (e.g., 'utils' shouldn't match 'old-utils')
        const beforeName = normalizedImport.slice(0, -tabName.length);
        if (beforeName === '' || beforeName.endsWith('/')) {
          return true;
        }
      }

      // Path suffix match: tab path ends with the import path
      // e.g., import '../core/types' matches 'src/core/types.ts'
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
   * Compute path similarity based on shared directory.
   * Files in the same directory score highest, nearby directories score lower.
   */
  private computePathSimilarity(pathA: string, pathB: string): number {
    const dirA = pathA.split('/').slice(0, -1); // Remove filename
    const dirB = pathB.split('/').slice(0, -1);

    if (dirA.length === 0 || dirB.length === 0) { return 0; }

    // Count shared prefix segments
    let shared = 0;
    for (let i = 0; i < Math.min(dirA.length, dirB.length); i++) {
      if (dirA[i] === dirB[i]) { shared++; } else { break; }
    }

    // Same directory = 1.0, each level apart reduces score
    const maxDepth = Math.max(dirA.length, dirB.length);
    if (shared === dirA.length && shared === dirB.length) {
      return 1.0; // Same directory
    }

    // Score based on how much of the path is shared
    return shared / maxDepth;
  }

  private fileNameNoExt(filePath: string): string {
    const base = filePath.split('/').pop() || '';
    return base.replace(/\.[^.]+$/, '');
  }
}
