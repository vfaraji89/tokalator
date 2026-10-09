import * as vscode from 'vscode';
import type { AuthService } from './authService';
import type { TelemetrySync } from './telemetrySync';

/**
 * Tokalator license tiers.
 *
 * Community: free, open-source features only
 *   - Token counting, budget dashboard, model selector, tab relevance
 *   - /count, /breakdown, /optimize, /pin, /unpin, /model, /compaction, /preview, /reset, /exit
 *
 * Pro: individual developer ($9/mo or free during beta)
 *   - Everything in Community
 *   - /secure, /skill-gen, /settings-gen, /terminology-gen, /instructions
 *   - Security scanner, SKILL.md generator, AI settings generator
 *   - Local session logging
 *
 * Enterprise: team/org (per-seat pricing)
 *   - Everything in Pro
 *   - /team — team analytics dashboard
 *   - /skills — shared skill catalog (publish/install)
 *   - /audit — usage audit log export
 *   - Telemetry sync to enterprise backend
 *   - Web dashboard access (tokalator-enterprise app)
 *   - Shared skill catalog, team cost projections
 *   - SSO/API key auth, team admin controls
 */
export type LicenseTier = 'community' | 'pro' | 'enterprise';

export interface LicenseState {
  tier: LicenseTier;
  validUntil: string | null;
  teamName: string | null;
  seats: number | null;
}

const COMMUNITY_COMMANDS = new Set([
  'count', 'breakdown', 'optimize', 'pin', 'unpin',
  'model', 'compaction', 'preview', 'reset', 'exit',
]);

const PRO_COMMANDS = new Set([
  'secure', 'skill-gen', 'settings-gen', 'terminology-gen', 'instructions',
]);

const ENTERPRISE_COMMANDS = new Set([
  'team', 'skills', 'audit',
]);

export class LicenseService implements vscode.Disposable {
  private state: LicenseState = {
    tier: 'community',
    validUntil: null,
    teamName: null,
    seats: null,
  };
  private verified = false;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly auth: AuthService,
    private readonly telemetry: TelemetrySync,
  ) {}

  async initialize(): Promise<void> {
    await this.detectTier();
  }

  /** Determine tier from configuration and optional backend verification. */
  private async detectTier(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('tokalator');
    const configTier = cfg.get<string>('licenseTier', 'community') as LicenseTier;

    // Community needs no verification
    if (configTier === 'community') {
      this.state = { tier: 'community', validUntil: null, teamName: null, seats: null };
      return;
    }

    // Pro: check if user set pro (honor locally, no server needed)
    if (configTier === 'pro') {
      this.state = { tier: 'pro', validUntil: null, teamName: null, seats: null };
      return;
    }

    // Enterprise: verify with backend if configured
    if (configTier === 'enterprise') {
      const authState = this.auth.getState();
      if (!authState.isConfigured) {
        this.state = { tier: 'pro', validUntil: null, teamName: null, seats: null };
        vscode.window.showWarningMessage(
          'Tokalator Enterprise: API key or endpoint not configured. Falling back to Pro tier.',
        );
        return;
      }

      try {
        const result = await this.telemetry.verifyAuth();
        if (result.valid) {
          this.state = {
            tier: 'enterprise',
            validUntil: null,
            teamName: result.teamName ?? null,
            seats: null,
          };
          this.verified = true;
        } else {
          this.state = { tier: 'pro', validUntil: null, teamName: null, seats: null };
          vscode.window.showWarningMessage(
            'Tokalator Enterprise: API key validation failed. Falling back to Pro tier.',
          );
        }
      } catch {
        // Offline: trust the config but mark unverified
        this.state = { tier: 'enterprise', validUntil: null, teamName: null, seats: null };
        this.verified = false;
      }
    }
  }

  getTier(): LicenseTier {
    return this.state.tier;
  }

  getState(): LicenseState {
    return { ...this.state };
  }

  isVerified(): boolean {
    return this.verified;
  }

  /** Check if a chat command is allowed under the current tier. */
  isCommandAllowed(command: string): boolean {
    if (COMMUNITY_COMMANDS.has(command)) return true;
    if (PRO_COMMANDS.has(command)) return this.state.tier === 'pro' || this.state.tier === 'enterprise';
    if (ENTERPRISE_COMMANDS.has(command)) return this.state.tier === 'enterprise';
    return true; // unknown commands pass through (default/help)
  }

  /** Get the upgrade message for a blocked command. */
  getUpgradeMessage(command: string): string {
    if (PRO_COMMANDS.has(command)) {
      return `\`/${command}\` requires **Tokalator Pro**. Set \`tokalator.licenseTier\` to \`"pro"\` in settings.`;
    }
    if (ENTERPRISE_COMMANDS.has(command)) {
      return `\`/${command}\` requires **Tokalator Enterprise**. Configure \`tokalator.licenseTier\`, \`tokalator.apiEndpoint\`, \`tokalator.teamId\`, and an API key.`;
    }
    return '';
  }

  /** Label for the current tier (used in dashboard badge). */
  getTierLabel(): string {
    switch (this.state.tier) {
      case 'enterprise': return 'ENTERPRISE';
      case 'pro': return 'PRO';
      default: return 'COMMUNITY';
    }
  }

  /** Badge color for the current tier. */
  getTierColor(): string {
    switch (this.state.tier) {
      case 'enterprise': return '#6366f1';
      case 'pro': return '#e3120b';
      default: return '#6b7280';
    }
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
  }
}
