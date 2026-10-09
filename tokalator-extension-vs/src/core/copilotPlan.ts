import * as vscode from 'vscode';

/**
 * GitHub Copilot plan definitions and AI Credits tracker.
 *
 * Starting June 1 2026, Copilot billing is usage-based via GitHub AI Credits
 * (1 credit = $0.01 USD). Each plan includes a monthly credit allowance;
 * overage is billed at the same per-token rates.
 *
 * Source: docs.github.com/copilot/reference/copilot-billing/models-and-pricing
 */

export type CopilotPlanId = 'free' | 'pro' | 'pro_plus' | 'business' | 'enterprise';

export interface CopilotPlan {
  id: CopilotPlanId;
  label: string;
  monthlyPrice: number;           // $/month (per user for biz/ent)
  monthlyCredits: number;         // $ of included AI Credits
  pooled: boolean;                // org-level pooling
  codeCompletionsIncluded: boolean;
}

export const COPILOT_PLANS: Record<CopilotPlanId, CopilotPlan> = {
  free: {
    id: 'free',
    label: 'Copilot Free',
    monthlyPrice: 0,
    monthlyCredits: 0,
    pooled: false,
    codeCompletionsIncluded: false,
  },
  pro: {
    id: 'pro',
    label: 'Copilot Pro',
    monthlyPrice: 10,
    monthlyCredits: 10,
    pooled: false,
    codeCompletionsIncluded: true,
  },
  pro_plus: {
    id: 'pro_plus',
    label: 'Copilot Pro+',
    monthlyPrice: 39,
    monthlyCredits: 39,
    pooled: false,
    codeCompletionsIncluded: true,
  },
  business: {
    id: 'business',
    label: 'Copilot Business',
    monthlyPrice: 19,
    monthlyCredits: 19,
    pooled: true,
    codeCompletionsIncluded: true,
  },
  enterprise: {
    id: 'enterprise',
    label: 'Copilot Enterprise',
    monthlyPrice: 39,
    monthlyCredits: 39,
    pooled: true,
    codeCompletionsIncluded: true,
  },
};

export interface SessionCreditUsage {
  sessionId: string;
  creditsUsed: number;
  turnCount: number;
  startedAt: number;
  lastUpdated: number;
}

export interface CreditUsage {
  totalCreditsUsed: number;   // $ consumed this billing period
  turnCount: number;          // turns tracked
  lastUpdated: number;        // timestamp
  sessions: SessionCreditUsage[];
}

export interface CreditSnapshot {
  plan: CopilotPlan;
  usage: CreditUsage;
  creditsRemaining: number;   // monthly allowance - used (can go negative for overage)
  percentUsed: number;        // 0-100+
  projectedMonthly: number;   // extrapolated to 30 days from current rate
  isOverage: boolean;
  overageAmount: number;
  currentSessionId: string;
  currentSessionCredits: number;
  currentSessionTurns: number;
}

const CREDITS_KEY = 'tokalator.copilotCredits';
const PLAN_KEY = 'tokalator.copilotPlan';
const PERIOD_START_KEY = 'tokalator.creditsPeriodStart';

/**
 * Tracks GitHub AI Credits consumption per billing period.
 */
export class CopilotCreditsTracker implements vscode.Disposable {

  private plan: CopilotPlan;
  private usage: CreditUsage;
  private periodStart: number;
  private sessionId: string;
  private disposables: vscode.Disposable[] = [];

  private readonly _onDidUpdate = new vscode.EventEmitter<CreditSnapshot>();
  readonly onDidUpdate = this._onDidUpdate.event;

  constructor(private readonly workspaceState: vscode.Memento) {
    // Load persisted plan
    const planId = workspaceState.get<CopilotPlanId>(PLAN_KEY, 'pro');
    this.plan = COPILOT_PLANS[planId] || COPILOT_PLANS.pro;

    // Each activation gets a unique session ID
    this.sessionId = `session-${Date.now()}`;

    // Load persisted usage
    const saved = workspaceState.get<CreditUsage>(CREDITS_KEY);
    this.usage = saved && Array.isArray(saved.sessions)
      ? saved
      : {
          totalCreditsUsed: saved?.totalCreditsUsed ?? 0,
          turnCount: saved?.turnCount ?? 0,
          lastUpdated: saved?.lastUpdated ?? Date.now(),
          sessions: [],
        };

    // Load or initialize billing period start
    this.periodStart = workspaceState.get<number>(PERIOD_START_KEY, this.currentPeriodStart());

    // Auto-reset if we've crossed a billing period boundary
    if (Date.now() > this.periodStart + 30 * 24 * 60 * 60 * 1000) {
      this.resetPeriod();
    }

    // Watch for plan changes in settings
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('tokalator.copilotPlan')) {
          const cfg = vscode.workspace.getConfiguration('tokalator');
          const newPlanId = cfg.get<CopilotPlanId>('copilotPlan', 'pro');
          if (COPILOT_PLANS[newPlanId] && newPlanId !== this.plan.id) {
            this.plan = COPILOT_PLANS[newPlanId];
            this.workspaceState.update(PLAN_KEY, newPlanId);
            this._onDidUpdate.fire(this.getSnapshot());
          }
        }
      }),
    );
  }

  /**
   * Record credit consumption for a chat turn.
   * costDollars: the estimated cost in USD for this turn (input + output).
   */
  recordTurn(costDollars: number): void {
    this.usage.totalCreditsUsed += costDollars;
    this.usage.turnCount++;
    this.usage.lastUpdated = Date.now();

    let session = this.usage.sessions.find(s => s.sessionId === this.sessionId);
    if (!session) {
      session = {
        sessionId: this.sessionId,
        creditsUsed: 0,
        turnCount: 0,
        startedAt: Date.now(),
        lastUpdated: Date.now(),
      };
      this.usage.sessions.push(session);
    }
    session.creditsUsed += costDollars;
    session.turnCount++;
    session.lastUpdated = Date.now();

    this.persist();
    this._onDidUpdate.fire(this.getSnapshot());
  }

  /**
   * Get current credit snapshot.
   */
  getSnapshot(): CreditSnapshot {
    const allowance = this.plan.monthlyCredits;
    const used = this.usage.totalCreditsUsed;
    const remaining = allowance - used;
    const percentUsed = allowance > 0 ? (used / allowance) * 100 : (used > 0 ? 100 : 0);

    // Project monthly usage from current rate
    const elapsed = Date.now() - this.periodStart;
    const daysElapsed = Math.max(elapsed / (24 * 60 * 60 * 1000), 0.1);
    const dailyRate = used / daysElapsed;
    const projectedMonthly = dailyRate * 30;

    const currentSession = this.usage.sessions.find(s => s.sessionId === this.sessionId);

    return {
      plan: this.plan,
      usage: { ...this.usage, sessions: [...this.usage.sessions] },
      creditsRemaining: remaining,
      percentUsed,
      projectedMonthly,
      isOverage: remaining < 0,
      overageAmount: Math.max(-remaining, 0),
      currentSessionId: this.sessionId,
      currentSessionCredits: currentSession?.creditsUsed ?? 0,
      currentSessionTurns: currentSession?.turnCount ?? 0,
    };
  }

  /**
   * Get current plan.
   */
  getPlan(): CopilotPlan { return this.plan; }

  /**
   * Reset credits for a new billing period.
   */
  resetPeriod(): void {
    this.usage = { totalCreditsUsed: 0, turnCount: 0, lastUpdated: Date.now(), sessions: [] };
    this.periodStart = this.currentPeriodStart();
    this.workspaceState.update(PERIOD_START_KEY, this.periodStart);
    this.persist();
    this._onDidUpdate.fire(this.getSnapshot());
  }

  private currentPeriodStart(): number {
    // Approximate: 1st of current month
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }

  private persist(): void {
    this.workspaceState.update(CREDITS_KEY, this.usage);
  }

  dispose(): void {
    this._onDidUpdate.dispose();
    this.disposables.forEach(d => d.dispose());
  }
}
