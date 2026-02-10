import { ContextOptimizer } from '../src/core/contextOptimizer';
import { ContextSnapshot, TabInfo, BudgetBreakdown, OptimizationPlan, OptimizationAction, OptimizationPriority } from '../src/core/types';
import { ModelProfile } from '../src/core/modelProfiles';
import { Uri } from 'vscode';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const baseModel: ModelProfile = {
  id: 'claude-sonnet-4',
  label: 'Claude Sonnet 4',
  provider: 'anthropic',
  contextWindow: 200000,
  maxOutput: 16000,
  rotThreshold: 20,
  inputCostPer1M: 3,
  outputCostPer1M: 15,
  cachedInputCostPer1M: 0.30,
  supportsCaching: true,
  cachingType: 'prompt-caching',
};

function makeTab(overrides: Partial<TabInfo> = {}): TabInfo {
  const label = overrides.label ?? 'file.ts';
  return {
    uri: Uri.file(`/workspace/${label}`),
    label,
    languageId: 'typescript',
    relativePath: label,
    estimatedTokens: 1000,
    relevanceScore: 0.5,
    relevanceReason: 'open tab',
    isActive: false,
    isDirty: false,
    isPinned: false,
    diagnosticCount: 0,
    lastEditTimestamp: Date.now(),
    ...overrides,
  };
}

function makeSnapshot(overrides: Partial<ContextSnapshot> = {}): ContextSnapshot {
  return {
    timestamp: Date.now(),
    activeFile: null,
    tabs: [],
    pinnedFiles: new Set<string>(),
    totalEstimatedTokens: 30000,
    windowCapacity: 200000,
    usagePercent: 15,
    budgetLevel: 'low',
    diagnosticsSummary: { errors: 0, warnings: 0, info: 0 },
    chatTurnCount: 5,
    contextHealth: 'healthy',
    healthReasons: [],
    modelId: 'claude-sonnet-4',
    modelLabel: 'Claude Sonnet 4',
    workspaceFileCount: 10,
    workspaceFileTokens: 50000,
    tokenizerType: 'claude-bpe',
    tokenizerLabel: 'Claude BPE',
    turnHistory: [],
    budgetBreakdown: {
      files: 20000,
      systemPrompt: 3000,
      instructions: 2000,
      conversation: 5000,
      outputReservation: 16000,
    },
    secretScan: null,
    costEstimate: null,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('ContextOptimizer', () => {
  let optimizer: ContextOptimizer;
  const THRESHOLD = 0.3; // default relevance threshold

  beforeEach(() => {
    optimizer = new ContextOptimizer();
  });

  // ── Basic plan structure ──────────────────────────────────────────────

  describe('Plan structure', () => {
    it('returns a valid OptimizationPlan', () => {
      const plan = optimizer.analyze(makeSnapshot(), baseModel, THRESHOLD);

      expect(plan.timestamp).toBeGreaterThan(0);
      expect(plan.score).toBeGreaterThanOrEqual(0);
      expect(plan.score).toBeLessThanOrEqual(100);
      expect(typeof plan.verdict).toBe('string');
      expect(Array.isArray(plan.actions)).toBe(true);
      expect(plan.categoryCounts).toHaveProperty('tokens');
      expect(plan.categoryCounts).toHaveProperty('cost');
      expect(plan.categoryCounts).toHaveProperty('security');
      expect(plan.categoryCounts).toHaveProperty('health');
      expect(plan.categoryCounts).toHaveProperty('workflow');
    });

    it('produces perfect score for clean context', () => {
      const plan = optimizer.analyze(makeSnapshot(), baseModel, THRESHOLD);
      expect(plan.score).toBe(100);
      expect(plan.actions).toHaveLength(0);
      expect(plan.verdict).toContain('well-optimized');
    });
  });

  // ── 1. Distractor detection ───────────────────────────────────────────

  describe('analyzeDistractors', () => {
    it('flags low-relevance non-pinned tabs', () => {
      const snapshot = makeSnapshot({
        tabs: [
          makeTab({ label: 'important.ts', relevanceScore: 0.8 }),
          makeTab({ label: 'noise1.ts', relevanceScore: 0.1 }),
          makeTab({ label: 'noise2.ts', relevanceScore: 0.05 }),
        ],
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const distractor = plan.actions.find(a => a.id === 'close-distractors');
      expect(distractor).toBeDefined();
      expect(distractor!.category).toBe('tokens');
      expect(distractor!.actionable).toBe(true);
      expect(distractor!.tokenSavings).toBeGreaterThan(0);
    });

    it('does not flag pinned tabs as distractors', () => {
      const snapshot = makeSnapshot({
        tabs: [
          makeTab({ label: 'pinned.ts', relevanceScore: 0.1, isPinned: true }),
        ],
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const distractor = plan.actions.find(a => a.id === 'close-distractors');
      expect(distractor).toBeUndefined();
    });

    it('does not flag the active tab as a distractor', () => {
      const snapshot = makeSnapshot({
        tabs: [
          makeTab({ label: 'active.ts', relevanceScore: 0.1, isActive: true }),
        ],
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const distractor = plan.actions.find(a => a.id === 'close-distractors');
      expect(distractor).toBeUndefined();
    });

    it('sets high priority when >5 distractors', () => {
      const tabs = Array.from({ length: 8 }, (_, i) =>
        makeTab({ label: `noise${i}.ts`, relevanceScore: 0.05 }),
      );
      const snapshot = makeSnapshot({ tabs });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const distractor = plan.actions.find(a => a.id === 'close-distractors');
      expect(distractor?.priority).toBe('high');
    });
  });

  // ── 2. Large files ────────────────────────────────────────────────────

  describe('analyzeLargeFiles', () => {
    it('flags large low-relevance files above 5K tokens', () => {
      const snapshot = makeSnapshot({
        windowCapacity: 200000,
        tabs: [
          makeTab({
            label: 'bigfile.ts',
            relevanceScore: 0.4, // above threshold but < 0.5
            estimatedTokens: 15000,
          }),
        ],
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const large = plan.actions.find(a => a.id.startsWith('large-file-'));
      expect(large).toBeDefined();
      expect(large!.title).toContain('bigfile.ts');
      expect(large!.tokenSavings).toBe(15000);
    });

    it('does not flag small files', () => {
      const snapshot = makeSnapshot({
        tabs: [
          makeTab({
            label: 'small.ts',
            relevanceScore: 0.4,
            estimatedTokens: 200,
          }),
        ],
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const large = plan.actions.find(a => a.id.startsWith('large-file-'));
      expect(large).toBeUndefined();
    });
  });

  // ── 3. Secrets ────────────────────────────────────────────────────────

  describe('analyzeSecrets', () => {
    it('creates critical action when secrets are found', () => {
      const snapshot = makeSnapshot({
        tabs: [makeTab({ label: '.env', relativePath: '.env', estimatedTokens: 200 })],
        secretScan: {
          totalFindings: 2,
          critical: 1,
          high: 1,
          warning: 0,
          envFilesOpen: ['.env'],
          findings: [
            { rule: 'aws-access-key', description: 'AWS key found', severity: 'critical', filePath: '.env', fileUri: 'file:///workspace/.env', line: 1, preview: 'AKIA****' },
            { rule: 'generic-api-key', description: 'API key found', severity: 'high', filePath: '.env', fileUri: 'file:///workspace/.env', line: 2, preview: 'api_****' },
          ],
          scannedAt: Date.now(),
        },
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const secretAction = plan.actions.find(a => a.id === 'close-secret-files');
      expect(secretAction).toBeDefined();
      expect(secretAction!.priority).toBe('critical');
      expect(secretAction!.category).toBe('security');
    });

    it('creates env-file action when .env is open', () => {
      const snapshot = makeSnapshot({
        secretScan: {
          totalFindings: 1,
          critical: 1,
          high: 0,
          warning: 0,
          envFilesOpen: ['.env.local'],
          findings: [
            { rule: 'sensitive-file', description: '.env.local open', severity: 'critical', filePath: '.env.local', fileUri: 'file:///workspace/.env.local', line: 0, preview: '' },
          ],
          scannedAt: Date.now(),
        },
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const envAction = plan.actions.find(a => a.id === 'close-env-files');
      expect(envAction).toBeDefined();
    });

    it('no secret actions when scan is clean', () => {
      const snapshot = makeSnapshot({
        secretScan: {
          totalFindings: 0, critical: 0, high: 0, warning: 0,
          envFilesOpen: [], findings: [], scannedAt: Date.now(),
        },
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const secretActions = plan.actions.filter(a => a.category === 'security');
      expect(secretActions).toHaveLength(0);
    });
  });

  // ── 4. Caching ────────────────────────────────────────────────────────

  describe('analyzeCaching', () => {
    it('suggests caching when savings exceed 10%', () => {
      const snapshot = makeSnapshot({
        costEstimate: {
          inputTokens: 30000, inputCostUSD: 0.09,
          outputTokensEstimate: 2000, outputCostUSD: 0.03,
          totalCostUSD: 0.12,
          cachingSupported: true, cachingType: 'prompt-caching',
          cachingDescription: 'Anthropic prompt caching',
          cacheableTokens: 19000, uncacheableTokens: 11000,
          estimatedHitRatio: 0.8,
          cachedCostUSD: 0.04, uncachedCostUSD: 0.09,
          savingsPerTurnUSD: 0.05, savingsPercent: 55,
          turnsCompleted: 5, estimatedSessionCostUSD: 0.6,
          cost10Turns: 1.2, cost25Turns: 3, cost50Turns: 6,
          cachedCost10Turns: 0.7, cachedCost25Turns: 1.75, cachedCost50Turns: 3.5,
          dailyCostUSD: 4.8, monthlyCostUSD: 105.6,
          cachedDailyCostUSD: 2.8, cachedMonthlyCostUSD: 61.6,
        },
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const cachingAction = plan.actions.find(a => a.id === 'enable-caching');
      expect(cachingAction).toBeDefined();
      expect(cachingAction!.category).toBe('cost');
    });

    it('does not suggest caching when unsupported', () => {
      const snapshot = makeSnapshot({
        costEstimate: {
          inputTokens: 30000, inputCostUSD: 0.15,
          outputTokensEstimate: 2000, outputCostUSD: 0.04,
          totalCostUSD: 0.19,
          cachingSupported: false, cachingType: 'none',
          cachingDescription: '',
          cacheableTokens: 0, uncacheableTokens: 30000,
          estimatedHitRatio: 0,
          cachedCostUSD: 0.15, uncachedCostUSD: 0.15,
          savingsPerTurnUSD: 0, savingsPercent: 0,
          turnsCompleted: 5, estimatedSessionCostUSD: 0.95,
          cost10Turns: 1.9, cost25Turns: 4.75, cost50Turns: 9.5,
          cachedCost10Turns: 1.9, cachedCost25Turns: 4.75, cachedCost50Turns: 9.5,
          dailyCostUSD: 7.6, monthlyCostUSD: 167.2,
          cachedDailyCostUSD: 7.6, cachedMonthlyCostUSD: 167.2,
        },
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const cachingAction = plan.actions.find(a => a.id === 'enable-caching');
      expect(cachingAction).toBeUndefined();
    });
  });

  // ── 5. Context rot ───────────────────────────────────────────────────

  describe('analyzeContextRot', () => {
    it('warns when approaching rot threshold', () => {
      const snapshot = makeSnapshot({ chatTurnCount: 17 }); // 3 turns left on threshold 20
      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const rot = plan.actions.find(a => a.id === 'context-rot-approaching');
      expect(rot).toBeDefined();
      expect(rot!.category).toBe('health');
    });

    it('critical warning when threshold exceeded', () => {
      const snapshot = makeSnapshot({ chatTurnCount: 25 });
      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const rot = plan.actions.find(a => a.id === 'context-rot-exceeded');
      expect(rot).toBeDefined();
      expect(rot!.priority).toBe('high');
    });

    it('no warning when well under threshold', () => {
      const snapshot = makeSnapshot({ chatTurnCount: 5 });
      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const rotActions = plan.actions.filter(a => a.id.startsWith('context-rot'));
      expect(rotActions).toHaveLength(0);
    });
  });

  // ── 6. Budget pressure ───────────────────────────────────────────────

  describe('analyzeBudgetPressure', () => {
    it('critical at ≥85% usage', () => {
      const snapshot = makeSnapshot({ usagePercent: 90 });
      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const budget = plan.actions.find(a => a.id === 'budget-critical');
      expect(budget).toBeDefined();
      expect(budget!.priority).toBe('critical');
    });

    it('warning at ≥70% usage', () => {
      const snapshot = makeSnapshot({ usagePercent: 75 });
      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const budget = plan.actions.find(a => a.id === 'budget-warning');
      expect(budget).toBeDefined();
      expect(budget!.priority).toBe('medium');
    });

    it('no warning at low usage', () => {
      const snapshot = makeSnapshot({ usagePercent: 30 });
      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const budgetActions = plan.actions.filter(a => a.id.startsWith('budget-'));
      expect(budgetActions).toHaveLength(0);
    });
  });

  // ── 7. Pin suggestions ───────────────────────────────────────────────

  describe('analyzePinSuggestions', () => {
    it('suggests pinning high-relevance imported files', () => {
      const snapshot = makeSnapshot({
        tabs: [
          makeTab({ label: 'utils.ts', relevanceScore: 0.85, relevanceReason: 'imported by active file' }),
        ],
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const pin = plan.actions.find(a => a.id === 'pin-suggestions');
      expect(pin).toBeDefined();
      expect(pin!.category).toBe('workflow');
    });

    it('does not suggest pinning already-pinned files', () => {
      const snapshot = makeSnapshot({
        tabs: [
          makeTab({ label: 'utils.ts', relevanceScore: 0.85, isPinned: true, relevanceReason: 'imported by active file' }),
        ],
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const pin = plan.actions.find(a => a.id === 'pin-suggestions');
      expect(pin).toBeUndefined();
    });
  });

  // ── 8. Excessive pins ────────────────────────────────────────────────

  describe('analyzeExcessivePins', () => {
    it('warns when >5 files are pinned', () => {
      const pinnedFiles = new Set(Array.from({ length: 8 }, (_, i) => `/workspace/f${i}.ts`));
      const tabs = Array.from({ length: 8 }, (_, i) =>
        makeTab({ label: `f${i}.ts`, isPinned: true }),
      );
      const snapshot = makeSnapshot({ pinnedFiles, tabs });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const excessive = plan.actions.find(a => a.id === 'excessive-pins');
      expect(excessive).toBeDefined();
      expect(excessive!.category).toBe('workflow');
    });

    it('no warning with ≤5 pinned files', () => {
      const pinnedFiles = new Set(['/workspace/a.ts', '/workspace/b.ts']);
      const snapshot = makeSnapshot({ pinnedFiles });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const excessive = plan.actions.find(a => a.id === 'excessive-pins');
      expect(excessive).toBeUndefined();
    });
  });

  // ── 9. Duplicates ────────────────────────────────────────────────────

  describe('analyzeDuplicates', () => {
    it('flags files with same base name', () => {
      const snapshot = makeSnapshot({
        tabs: [
          makeTab({ label: 'utils.ts', relativePath: 'src/utils.ts', relevanceScore: 0.3 }),
          makeTab({ label: 'utils.ts', relativePath: 'lib/utils.ts', relevanceScore: 0.2 }),
        ],
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const dup = plan.actions.find(a => a.id.startsWith('duplicate-'));
      expect(dup).toBeDefined();
      expect(dup!.title).toContain('utils');
    });

    it('does not flag duplicates when both are high-relevance', () => {
      const snapshot = makeSnapshot({
        tabs: [
          makeTab({ label: 'utils.ts', relativePath: 'src/utils.ts', relevanceScore: 0.8 }),
          makeTab({ label: 'utils.ts', relativePath: 'lib/utils.ts', relevanceScore: 0.9 }),
        ],
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const dup = plan.actions.find(a => a.id.startsWith('duplicate-'));
      expect(dup).toBeUndefined();
    });
  });

  // ── Scoring ───────────────────────────────────────────────────────────

  describe('Scoring and verdict', () => {
    it('deducts 20 per critical issue', () => {
      const snapshot = makeSnapshot({
        usagePercent: 90, // critical budget
        secretScan: {
          totalFindings: 1, critical: 1, high: 0, warning: 0,
          envFilesOpen: ['.env'],
          findings: [{ rule: 'sensitive-file', description: '.env open', severity: 'critical', filePath: '.env', fileUri: '', line: 0, preview: '' }],
          scannedAt: Date.now(),
        },
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      // 2 criticals (budget + env-files) → -40, plus budget usage > 80 → -10 = 50
      expect(plan.score).toBeLessThanOrEqual(60);
    });

    it('sorts actions by priority then token savings', () => {
      const snapshot = makeSnapshot({
        usagePercent: 90,
        tabs: [
          makeTab({ label: 'noise.ts', relevanceScore: 0.05, estimatedTokens: 5000 }),
          makeTab({ label: 'noise2.ts', relevanceScore: 0.05, estimatedTokens: 3000 }),
        ],
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      // Verify ordering: critical first, then high, then medium, then low
      for (let i = 1; i < plan.actions.length; i++) {
        const priorityOrder: Record<OptimizationPriority, number> = {
          critical: 0, high: 1, medium: 2, low: 3,
        };
        const prevPri = priorityOrder[plan.actions[i - 1].priority];
        const curPri = priorityOrder[plan.actions[i].priority];
        expect(prevPri).toBeLessThanOrEqual(curPri);
      }
    });

    it('totalTokenSavings sums all action savings', () => {
      const snapshot = makeSnapshot({
        tabs: [
          makeTab({ label: 'noise1.ts', relevanceScore: 0.05, estimatedTokens: 2000 }),
          makeTab({ label: 'noise2.ts', relevanceScore: 0.05, estimatedTokens: 3000 }),
        ],
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      const summedSavings = plan.actions.reduce((s, a) => s + a.tokenSavings, 0);
      expect(plan.totalTokenSavings).toBe(summedSavings);
    });

    it('categoryCounts matches action categories', () => {
      const snapshot = makeSnapshot({
        usagePercent: 90,
        chatTurnCount: 25,
        tabs: [
          makeTab({ label: 'noise.ts', relevanceScore: 0.05, estimatedTokens: 2000 }),
        ],
      });

      const plan = optimizer.analyze(snapshot, baseModel, THRESHOLD);
      for (const [cat, count] of Object.entries(plan.categoryCounts)) {
        const actual = plan.actions.filter(a => a.category === cat).length;
        expect(actual).toBe(count);
      }
    });

    it('verdict changes with score', () => {
      // Perfect
      const perfect = optimizer.analyze(makeSnapshot(), baseModel, THRESHOLD);
      expect(perfect.verdict).toContain('well-optimized');

      // Bad
      const bad = optimizer.analyze(
        makeSnapshot({ usagePercent: 95, chatTurnCount: 25 }),
        baseModel,
        THRESHOLD,
      );
      expect(bad.verdict).not.toContain('well-optimized');
    });
  });
});
