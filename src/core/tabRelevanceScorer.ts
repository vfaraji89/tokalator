import * as vscode from 'vscode';
import { TabInfo } from './types';
import { scoreAllPure, ActiveFileContext, TabInfoPlain } from './tabRelevanceScorer.pure';

/**
 * Scores each open tab by relevance to the currently active file.
 * Thin wrapper around the pure scoring functions in tabRelevanceScorer.pure.ts.
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
    // Convert VS Code types to plain objects for the pure scorer
    const activeFile: ActiveFileContext | null = activeEditor
      ? {
          text: activeEditor.document.getText(),
          languageId: activeEditor.document.languageId,
          fsPath: activeEditor.document.uri.fsPath,
        }
      : null;

    const plainTabs: TabInfoPlain[] = tabs.map(t => ({
      relativePath: t.relativePath,
      languageId: t.languageId,
      fsPath: t.uri.fsPath,
      estimatedTokens: t.estimatedTokens,
      relevanceScore: t.relevanceScore,
      relevanceReason: t.relevanceReason,
      isActive: t.isActive,
      isDirty: t.isDirty,
      isPinned: t.isPinned,
      diagnosticCount: t.diagnosticCount,
      lastEditTimestamp: t.lastEditTimestamp,
      label: t.label,
    }));

    const scored = scoreAllPure(plainTabs, activeFile);

    // Map scores back onto original TabInfo objects (preserving vscode.Uri)
    return tabs.map((tab, i) => ({
      ...tab,
      relevanceScore: scored[i].relevanceScore,
      relevanceReason: scored[i].relevanceReason,
    }));
  }
}
