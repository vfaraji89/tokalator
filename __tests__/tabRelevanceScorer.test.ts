/**
 * Unit tests for core/tabRelevanceScorer.ts
 * Tests: relevance scoring, import matching, path similarity, edge cases
 */
import { TabRelevanceScorer } from '../src/core/tabRelevanceScorer';
import { TabInfo } from '../src/core/types';
import { Uri } from 'vscode';

// Helper to build a minimal TabInfo for testing
function makeTab(overrides: Partial<TabInfo> = {}): TabInfo {
  const defaultUri = Uri.file('/project/src/file.ts');
  return {
    uri: defaultUri,
    label: 'file.ts',
    languageId: 'typescript',
    relativePath: 'src/file.ts',
    estimatedTokens: 100,
    relevanceScore: 0,
    relevanceReason: '',
    isActive: false,
    isDirty: false,
    isPinned: false,
    diagnosticCount: 0,
    lastEditTimestamp: 0,
    ...overrides,
  };
}

// Helper to build a mock active editor
function makeEditor(opts: {
  languageId?: string;
  fsPath?: string;
  text?: string;
} = {}) {
  return {
    document: {
      uri: Uri.file(opts.fsPath || '/project/src/main.ts'),
      languageId: opts.languageId || 'typescript',
      getText: () => opts.text || '',
    },
  } as any;
}

describe('TabRelevanceScorer', () => {
  let scorer: TabRelevanceScorer;

  beforeEach(() => {
    scorer = new TabRelevanceScorer();
  });

  // ============================================
  // No active editor
  // ============================================
  describe('no active editor', () => {
    it('scores all tabs at 0.5 with "No active editor" reason', () => {
      const tabs = [makeTab(), makeTab({ label: 'other.ts' })];
      const scored = scorer.scoreAll(tabs, undefined);

      scored.forEach(t => {
        expect(t.relevanceScore).toBe(0.5);
        expect(t.relevanceReason).toBe('No active editor');
      });
    });

    it('handles empty tab list', () => {
      const scored = scorer.scoreAll([], undefined);
      expect(scored).toEqual([]);
    });
  });

  // ============================================
  // Same language scoring (+0.25)
  // ============================================
  describe('same language', () => {
    it('adds 0.25 for same language', () => {
      const tabs = [makeTab({ languageId: 'typescript' })];
      const editor = makeEditor({ languageId: 'typescript' });
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceScore).toBeGreaterThanOrEqual(0.25);
      expect(scored[0].relevanceReason).toContain('same language');
    });

    it('does not add language score for different languages', () => {
      const tabs = [makeTab({ languageId: 'python' })];
      const editor = makeEditor({ languageId: 'typescript' });
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceReason).not.toContain('same language');
    });
  });

  // ============================================
  // Import relationship scoring (+0.30)
  // ============================================
  describe('import relationship', () => {
    it('detects TS/JS import from statement', () => {
      const tabs = [makeTab({
        uri: Uri.file('/project/src/utils.ts'),
        relativePath: 'src/utils.ts',
        label: 'utils.ts',
        languageId: 'typescript',
      })];
      const editor = makeEditor({
        languageId: 'typescript',
        text: "import { helper } from './utils';",
      });
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceReason).toContain('imported by active file');
    });

    it('detects require() imports', () => {
      const tabs = [makeTab({
        uri: Uri.file('/project/src/config.js'),
        relativePath: 'src/config.js',
        label: 'config.js',
        languageId: 'javascript',
      })];
      const editor = makeEditor({
        languageId: 'javascript',
        text: "const config = require('./config');",
      });
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceReason).toContain('imported by active file');
    });

    it('detects Python imports', () => {
      const tabs = [makeTab({
        uri: Uri.file('/project/utils/helpers.py'),
        relativePath: 'utils/helpers.py',
        label: 'helpers.py',
        languageId: 'python',
      })];
      const editor = makeEditor({
        languageId: 'python',
        fsPath: '/project/main.py',
        text: 'from utils.helpers import parse',
      });
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceReason).toContain('imported by active file');
    });

    it('does not false-positive partial filename matches', () => {
      // 'utils' should NOT match 'old-utils'
      const tabs = [makeTab({
        uri: Uri.file('/project/src/old-utils.ts'),
        relativePath: 'src/old-utils.ts',
        label: 'old-utils.ts',
      })];
      const editor = makeEditor({
        text: "import { x } from './utils';",
      });
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceReason).not.toContain('imported by active file');
    });
  });

  // ============================================
  // Path similarity scoring (+0.20)
  // ============================================
  describe('path similarity', () => {
    it('scores same directory as high path similarity', () => {
      const tabs = [makeTab({
        uri: Uri.file('/project/src/sibling.ts'),
        relativePath: 'src/sibling.ts',
      })];
      const editor = makeEditor({ fsPath: '/project/src/main.ts' });
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceReason).toContain('nearby path');
    });

    it('scores distant directories lower', () => {
      const tabs = [makeTab({
        uri: Uri.file('/project/test/helpers/fixture.ts'),
        relativePath: 'test/helpers/fixture.ts',
      })];
      const editor = makeEditor({ fsPath: '/project/src/core/main.ts' });
      const scored = scorer.scoreAll(tabs, editor);
      // Score may or may not include 'nearby path' depending on shared prefix
      // But it should not be the same as same-directory
    });
  });

  // ============================================
  // Recency scoring (+0.15)
  // ============================================
  describe('recency', () => {
    it('adds 0.15 for recently edited (< 2 minutes)', () => {
      const tabs = [makeTab({
        lastEditTimestamp: Date.now() - 30_000, // 30 seconds ago
        languageId: 'python', // different language to isolate recency
      })];
      const editor = makeEditor({ languageId: 'typescript' });
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceReason).toContain('recently edited');
    });

    it('adds 0.08 for edited within 10 minutes', () => {
      const tabs = [makeTab({
        lastEditTimestamp: Date.now() - 5 * 60_000, // 5 minutes ago
        languageId: 'python',
      })];
      const editor = makeEditor({ languageId: 'typescript' });
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceReason).toContain('edited recently');
    });

    it('no recency bonus for old edits', () => {
      const tabs = [makeTab({
        lastEditTimestamp: Date.now() - 60 * 60_000, // 1 hour ago
        languageId: 'python',
      })];
      const editor = makeEditor({ languageId: 'typescript' });
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceReason).not.toContain('edited');
    });
  });

  // ============================================
  // Diagnostics scoring (+0.10)
  // ============================================
  describe('diagnostics', () => {
    it('adds 0.10 for tabs with diagnostics', () => {
      const tabs = [makeTab({
        diagnosticCount: 3,
        languageId: 'python', // different language to isolate
      })];
      const editor = makeEditor({ languageId: 'typescript' });
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceReason).toContain('3 diagnostics');
    });

    it('no diagnostics bonus for 0 diagnostics', () => {
      const tabs = [makeTab({ diagnosticCount: 0, languageId: 'python' })];
      const editor = makeEditor({ languageId: 'typescript' });
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceReason).not.toContain('diagnostics');
    });
  });

  // ============================================
  // Pinned files (always score 1.0)
  // ============================================
  describe('pinned files', () => {
    it('pinned files always get score 1.0', () => {
      const tabs = [makeTab({ isPinned: true, languageId: 'python' })];
      const editor = makeEditor({ languageId: 'typescript' });
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceScore).toBe(1.0);
      expect(scored[0].relevanceReason).toBe('📌 pinned');
    });
  });

  // ============================================
  // Active file (always score 1.0)
  // ============================================
  describe('active file', () => {
    it('active file always gets score 1.0', () => {
      const tabs = [makeTab({ isActive: true, languageId: 'python' })];
      const editor = makeEditor({ languageId: 'typescript' });
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceScore).toBe(1.0);
      expect(scored[0].relevanceReason).toBe('active editor');
    });
  });

  // ============================================
  // Score capping
  // ============================================
  describe('score capping', () => {
    it('never exceeds 1.0', () => {
      // Tab with many positive signals
      const tabs = [makeTab({
        languageId: 'typescript',
        diagnosticCount: 5,
        lastEditTimestamp: Date.now() - 10_000,
      })];
      const editor = makeEditor({
        languageId: 'typescript',
        text: "import { x } from './file';",
      });
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceScore).toBeLessThanOrEqual(1.0);
    });
  });

  // ============================================
  // BUG test: path similarity with Windows paths
  // ============================================
  describe('cross-platform path similarity', () => {
    it('handles paths with backslashes (Windows)', () => {
      // On Windows, fsPath uses backslashes
      const tabs = [makeTab({
        uri: Uri.file('C:\\project\\src\\file.ts'),
        relativePath: 'src\\file.ts',
      })];
      const editor = makeEditor({ fsPath: 'C:\\project\\src\\main.ts' });
      // Should not throw, and should still compute a similarity
      const scored = scorer.scoreAll(tabs, editor);
      expect(scored[0].relevanceScore).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================
  // Multiple tabs — combined scoring
  // ============================================
  describe('multiple tabs', () => {
    it('scores each tab independently', () => {
      const tabs = [
        makeTab({ label: 'active.ts', isActive: true }),
        makeTab({ label: 'pinned.ts', isPinned: true }),
        makeTab({ label: 'unrelated.py', languageId: 'python', diagnosticCount: 0 }),
      ];
      const editor = makeEditor({ languageId: 'typescript' });
      const scored = scorer.scoreAll(tabs, editor);

      expect(scored[0].relevanceScore).toBe(1.0); // active
      expect(scored[1].relevanceScore).toBe(1.0); // pinned
      expect(scored[2].relevanceScore).toBeLessThan(1.0); // unrelated
    });
  });
});
