import {
  ContextSnapshot,
  TabInfo,
  OptimizationPlan,
  OptimizationAction,
  OptimizationPriority,
  CostEstimateSummary,
  SecretScanSummary,
} from './types';
import { ModelProfile } from './modelProfiles';

/**
 * Aggregates all analysis data (relevance, cost, secrets, health) into a
 * single prioritized optimization plan.
 *
 * This is the brain behind `@tokalator /optimize` — it doesn't close tabs
 * or take any action. It produces a plan that the chat handler or dashboard
 * can render and let the user execute selectively.
 */
export class ContextOptimizer {

  /**
   * Analyze the current context state and produce an optimization plan.
   */
  analyze(
    snapshot: ContextSnapshot,
    model: ModelProfile,
    relevanceThreshold: number,
  ): OptimizationPlan {
    const actions: OptimizationAction[] = [];

    // ── 1. Token savings: low-relevance tabs ──
    this.analyzeDistractors(snapshot, relevanceThreshold, actions);

    // ── 2. Token savings: large low-value files ──
    this.analyzeLargeFiles(snapshot, relevanceThreshold, actions);

    // ── 3. Security: secrets in context ──
    this.analyzeSecrets(snapshot, actions);

    // ── 4. Cost: caching opportunities ──
    this.analyzeCaching(snapshot, model, actions);

    // ── 5. Health: context rot ──
    this.analyzeContextRot(snapshot, model, actions);

    // ── 6. Health: budget pressure ──
    this.analyzeBudgetPressure(snapshot, actions);

    // ── 7. Workflow: pin suggestions ──
    this.analyzePinSuggestions(snapshot, relevanceThreshold, actions);

    // ── 8. Workflow: excessive pins ──
    this.analyzeExcessivePins(snapshot, actions);

    // ── 9. Token savings: duplicate/similar files ──
    this.analyzeDuplicates(snapshot, actions);

    // Sort: critical → high → medium → low, then by token savings desc
    const priorityOrder: Record<OptimizationPriority, number> = {
      critical: 0, high: 1, medium: 2, low: 3,
    };
    actions.sort((a, b) => {
      const p = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (p !== 0) return p;
      return b.tokenSavings - a.tokenSavings;
    });

    // Compute totals
    const totalTokenSavings = actions.reduce((s, a) => s + a.tokenSavings, 0);
    const totalCostSavingsPerTurn = actions.reduce((s, a) => s + a.costSavingsPerTurn, 0);

    // Optimization score (100 = nothing to improve)
    const score = this.computeScore(snapshot, model, actions);

    // Verdict
    const verdict = this.computeVerdict(score, actions);

    // Category counts
    const categoryCounts = { tokens: 0, cost: 0, security: 0, health: 0, workflow: 0 };
    for (const a of actions) {
      categoryCounts[a.category]++;
    }

    return {
      timestamp: Date.now(),
      score,
      verdict,
      totalTokenSavings,
      totalCostSavingsPerTurn,
      actions,
      categoryCounts,
    };
  }

  // ── Analyzers ─────────────────────────────────────────────────────────

  /**
   * Detect low-relevance tabs that can be closed.
   */
  private analyzeDistractors(
    snapshot: ContextSnapshot,
    threshold: number,
    actions: OptimizationAction[],
  ): void {
    const distractors = snapshot.tabs.filter(
      t => t.relevanceScore < threshold && !t.isActive && !t.isPinned,
    );

    if (distractors.length === 0) return;

    const totalTokens = distractors.reduce((s, t) => s + t.estimatedTokens, 0);
    const inputCostPer1M = snapshot.costEstimate?.inputCostUSD
      ? (snapshot.costEstimate.inputCostUSD / snapshot.costEstimate.inputTokens) * 1_000_000
      : 0;
    const costSavings = (totalTokens / 1_000_000) * inputCostPer1M;

    actions.push({
      id: 'close-distractors',
      category: 'tokens',
      priority: distractors.length > 5 ? 'high' : 'medium',
      title: `Close ${distractors.length} low-relevance tab${distractors.length > 1 ? 's' : ''}`,
      description: distractors
        .sort((a, b) => a.relevanceScore - b.relevanceScore)
        .map(t => `${t.label} (score: ${t.relevanceScore.toFixed(2)}, ~${this.fmtTokens(t.estimatedTokens)})`)
        .join('\n'),
      tokenSavings: totalTokens,
      costSavingsPerTurn: costSavings,
      actionable: true,
      actionKey: 'closeTabs',
      actionData: distractors.map(t => t.uri.toString()),
    });
  }

  /**
   * Detect individual files that are very large but have low relevance.
   */
  private analyzeLargeFiles(
    snapshot: ContextSnapshot,
    threshold: number,
    actions: OptimizationAction[],
  ): void {
    // Files above the threshold but with disproportionately large token counts
    const mediumRelevance = snapshot.tabs.filter(
      t => t.relevanceScore >= threshold
        && t.relevanceScore < 0.5
        && !t.isActive
        && !t.isPinned
        && t.estimatedTokens > 5000,
    );

    for (const tab of mediumRelevance) {
      const pctOfWindow = (tab.estimatedTokens / snapshot.windowCapacity) * 100;
      if (pctOfWindow < 1) continue; // Not worth mentioning below 1%

      actions.push({
        id: `large-file-${tab.label}`,
        category: 'tokens',
        priority: pctOfWindow > 5 ? 'high' : 'medium',
        title: `${tab.label} uses ${pctOfWindow.toFixed(1)}% of context`,
        description: `~${this.fmtTokens(tab.estimatedTokens)} tokens with relevance ${tab.relevanceScore.toFixed(2)} (${tab.relevanceReason}). Consider closing if not needed.`,
        tokenSavings: tab.estimatedTokens,
        costSavingsPerTurn: 0,
        actionable: true,
        actionKey: 'closeTab',
        actionData: tab.uri.toString(),
      });
    }
  }

  /**
   * Flag secrets found in context.
   */
  private analyzeSecrets(
    snapshot: ContextSnapshot,
    actions: OptimizationAction[],
  ): void {
    const scan = snapshot.secretScan;
    if (!scan || scan.totalFindings === 0) return;

    // Critical/high secrets → critical action
    if (scan.critical > 0 || scan.high > 0) {
      const secretFiles = [...new Set(scan.findings.map(f => f.filePath))];
      const secretTokens = snapshot.tabs
        .filter(t => secretFiles.some(f => t.relativePath.endsWith(f) || t.label === f))
        .reduce((s, t) => s + t.estimatedTokens, 0);

      actions.push({
        id: 'close-secret-files',
        category: 'security',
        priority: 'critical',
        title: `${scan.totalFindings} secret${scan.totalFindings > 1 ? 's' : ''} exposed in AI context`,
        description: scan.findings
          .map(f => `${f.severity.toUpperCase()}: ${f.description} in ${f.filePath}`)
          .join('\n'),
        tokenSavings: secretTokens,
        costSavingsPerTurn: 0,
        actionable: true,
        actionKey: 'closeSecretFiles',
        actionData: secretFiles,
      });
    }

    // .env files open
    if (scan.envFilesOpen.length > 0) {
      actions.push({
        id: 'close-env-files',
        category: 'security',
        priority: 'critical',
        title: `${scan.envFilesOpen.length} sensitive file${scan.envFilesOpen.length > 1 ? 's' : ''} open`,
        description: `${scan.envFilesOpen.join(', ')} — these should never be in AI context`,
        tokenSavings: 0,
        costSavingsPerTurn: 0,
        actionable: false,
        actionKey: 'closeEnvFiles',
        actionData: scan.envFilesOpen,
      });
    }
  }

  /**
   * Analyze caching opportunities.
   */
  private analyzeCaching(
    snapshot: ContextSnapshot,
    model: ModelProfile,
    actions: OptimizationAction[],
  ): void {
    const cost = snapshot.costEstimate;
    if (!cost || !cost.cachingSupported) return;

    if (cost.savingsPercent > 10) {
      actions.push({
        id: 'enable-caching',
        category: 'cost',
        priority: cost.savingsPercent > 30 ? 'high' : 'medium',
        title: `Enable ${cost.cachingType} → save ${cost.savingsPercent.toFixed(0)}%/turn`,
        description: `${cost.cachingDescription}\n`
          + `Cacheable: ~${this.fmtTokens(cost.cacheableTokens)} tokens (stable prefix)\n`
          + `Savings: $${cost.savingsPerTurnUSD.toFixed(4)}/turn → $${(cost.monthlyCostUSD - cost.cachedMonthlyCostUSD).toFixed(2)}/month`,
        tokenSavings: 0,
        costSavingsPerTurn: cost.savingsPerTurnUSD,
        actionable: false, // User must enable caching via API settings
      });
    }
  }

  /**
   * Detect context rot risk.
   */
  private analyzeContextRot(
    snapshot: ContextSnapshot,
    model: ModelProfile,
    actions: OptimizationAction[],
  ): void {
    const turnsLeft = model.rotThreshold - snapshot.chatTurnCount;

    if (turnsLeft <= 0) {
      actions.push({
        id: 'context-rot-exceeded',
        category: 'health',
        priority: 'high',
        title: `Context rot threshold exceeded (${snapshot.chatTurnCount}/${model.rotThreshold} turns)`,
        description: `Model performance degrades after ${model.rotThreshold} turns. `
          + `Start a fresh session with \`@tokalator /reset\` or \`/exit\`.`,
        tokenSavings: 0,
        costSavingsPerTurn: 0,
        actionable: true,
        actionKey: 'reset',
      });
    } else if (turnsLeft <= 5) {
      actions.push({
        id: 'context-rot-approaching',
        category: 'health',
        priority: 'medium',
        title: `${turnsLeft} turns until context rot threshold`,
        description: `You've used ${snapshot.chatTurnCount} of ${model.rotThreshold} turns. `
          + `Consider wrapping up or resetting soon.`,
        tokenSavings: 0,
        costSavingsPerTurn: 0,
        actionable: false,
      });
    }
  }

  /**
   * Analyze budget pressure (approaching context window limit).
   */
  private analyzeBudgetPressure(
    snapshot: ContextSnapshot,
    actions: OptimizationAction[],
  ): void {
    if (snapshot.usagePercent >= 85) {
      actions.push({
        id: 'budget-critical',
        category: 'health',
        priority: 'critical',
        title: `Budget at ${snapshot.usagePercent.toFixed(0)}% — overflow risk`,
        description: `Using ~${this.fmtTokens(snapshot.totalEstimatedTokens)} of ${this.fmtTokens(snapshot.windowCapacity)}. `
          + `Close tabs, reset conversation, or switch to a model with a larger context window.`,
        tokenSavings: 0,
        costSavingsPerTurn: 0,
        actionable: false,
      });
    } else if (snapshot.usagePercent >= 70) {
      actions.push({
        id: 'budget-warning',
        category: 'health',
        priority: 'medium',
        title: `Budget at ${snapshot.usagePercent.toFixed(0)}% — approaching limit`,
        description: `Conversation history grows ~800 tokens/turn. `
          + `At this rate, you have ~${Math.floor((snapshot.windowCapacity - snapshot.totalEstimatedTokens) / 800)} turns remaining.`,
        tokenSavings: 0,
        costSavingsPerTurn: 0,
        actionable: false,
      });
    }
  }

  /**
   * Suggest pinning high-relevance files that keep appearing.
   */
  private analyzePinSuggestions(
    snapshot: ContextSnapshot,
    threshold: number,
    actions: OptimizationAction[],
  ): void {
    // Files with high relevance that aren't pinned
    const candidates = snapshot.tabs.filter(
      t => t.relevanceScore >= 0.7
        && !t.isPinned
        && !t.isActive
        && t.relevanceReason.includes('imported'),
    );

    if (candidates.length === 0) return;

    // Only suggest top 3
    const top = candidates.slice(0, 3);
    actions.push({
      id: 'pin-suggestions',
      category: 'workflow',
      priority: 'low',
      title: `Pin ${top.length} high-relevance file${top.length > 1 ? 's' : ''}`,
      description: top
        .map(t => `${t.label} (score: ${t.relevanceScore.toFixed(2)}, ${t.relevanceReason})`)
        .join('\n'),
      tokenSavings: 0,
      costSavingsPerTurn: 0,
      actionable: true,
      actionKey: 'pinFiles',
      actionData: top.map(t => t.uri.toString()),
    });
  }

  /**
   * Warn about excessive pinned files.
   */
  private analyzeExcessivePins(
    snapshot: ContextSnapshot,
    actions: OptimizationAction[],
  ): void {
    const pinnedCount = snapshot.pinnedFiles.size;
    if (pinnedCount <= 5) return;

    const pinnedTokens = snapshot.tabs
      .filter(t => t.isPinned)
      .reduce((s, t) => s + t.estimatedTokens, 0);

    actions.push({
      id: 'excessive-pins',
      category: 'workflow',
      priority: pinnedCount > 10 ? 'high' : 'medium',
      title: `${pinnedCount} pinned files using ~${this.fmtTokens(pinnedTokens)}`,
      description: `Pinned files are always included in context. Review and unpin files you're done with.`,
      tokenSavings: 0,
      costSavingsPerTurn: 0,
      actionable: false,
    });
  }

  /**
   * Detect files with very similar names (potential duplicates or old versions).
   */
  private analyzeDuplicates(
    snapshot: ContextSnapshot,
    actions: OptimizationAction[],
  ): void {
    // Group by base filename (without extension path)
    const byName = new Map<string, TabInfo[]>();
    for (const tab of snapshot.tabs) {
      const base = tab.label.replace(/\.[^.]+$/, ''); // strip extension
      const group = byName.get(base) || [];
      group.push(tab);
      byName.set(base, group);
    }

    for (const [name, tabs] of byName) {
      if (tabs.length < 2) continue;

      // Files with same base name but different paths (e.g., utils.ts in two dirs)
      const totalTokens = tabs.reduce((s, t) => s + t.estimatedTokens, 0);
      const minRelevance = Math.min(...tabs.map(t => t.relevanceScore));

      if (minRelevance >= 0.5) continue; // Both are relevant, skip

      actions.push({
        id: `duplicate-${name}`,
        category: 'tokens',
        priority: 'low',
        title: `${tabs.length} files named "${name}" open`,
        description: tabs
          .map(t => `${t.relativePath} (score: ${t.relevanceScore.toFixed(2)}, ~${this.fmtTokens(t.estimatedTokens)})`)
          .join('\n'),
        tokenSavings: 0,
        costSavingsPerTurn: 0,
        actionable: false,
      });
    }
  }

  // ── Scoring ───────────────────────────────────────────────────────────

  /**
   * Compute an overall optimization score (0-100).
   * 100 = perfectly optimized, 0 = everything is wrong.
   */
  private computeScore(
    snapshot: ContextSnapshot,
    model: ModelProfile,
    actions: OptimizationAction[],
  ): number {
    let score = 100;

    // Deduct for critical issues
    const criticals = actions.filter(a => a.priority === 'critical').length;
    score -= criticals * 20;

    // Deduct for high issues
    const highs = actions.filter(a => a.priority === 'high').length;
    score -= highs * 10;

    // Deduct for medium issues
    const mediums = actions.filter(a => a.priority === 'medium').length;
    score -= mediums * 5;

    // Deduct for budget usage
    if (snapshot.usagePercent > 80) score -= 10;
    else if (snapshot.usagePercent > 60) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Human-readable verdict based on score.
   */
  private computeVerdict(score: number, actions: OptimizationAction[]): string {
    if (actions.length === 0) return 'Your context is well-optimized. Nothing to improve.';
    if (score >= 90) return 'Context looks great — minor improvements available.';
    if (score >= 70) return 'Good context hygiene — a few optimizations would help.';
    if (score >= 50) return 'Several optimizations available — review recommendations.';
    if (score >= 30) return 'Context needs attention — multiple issues found.';
    return 'Critical issues detected — immediate action recommended.';
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private fmtTokens(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
  }
}
