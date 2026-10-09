import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { ContextMonitor } from '../core/contextMonitor';
import type { ContextSnapshot } from '../core/types';
import { findModel } from '../core/modelProfiles';
import { WorkspaceSecurityScanner, SECRET_FILE_PATTERNS } from '../core/workspaceSecurityScanner';
import type { LicenseService } from '../core/licenseService';
import type { TelemetrySync } from '../core/telemetrySync';
import type { CopilotCreditsTracker } from '../core/copilotPlan';
import type { PriceWatchService, RateChange } from '../core/priceWatch';

/**
 * Chat participant `@tokalator` for Tokalator.
 *
 * Commands:
 *  /count        — Show current token count and budget level
 *  /optimize     — Close low-relevance tabs
 *  /pin          — Pin a file as always-relevant
 *  /unpin        — Unpin a file
 *  /breakdown    — Show where tokens are going
 *  /instructions — List and estimate tokens for instruction files
 *  /model        — Show or switch the active AI model
 *  /compaction   — Per-turn token growth and compaction recommendations
 *  /reset        — Reset session state (turn counter)
 */
export class ContextChatParticipant implements vscode.Disposable {

  private participant: vscode.ChatParticipant;
  // Track unknown model IDs we've already warned about to avoid repeated toasts
  private readonly _warnedUnknownModels = new Set<string>();
  private license: LicenseService | null = null;
  private telemetry: TelemetrySync | null = null;
  private creditsTracker: CopilotCreditsTracker | null = null;
  private priceWatch: PriceWatchService | null = null;

  constructor(private readonly monitor: ContextMonitor) {
    this.participant = vscode.chat.createChatParticipant(
      'tokalator.tokens',
      this.handleRequest.bind(this),
    );

    this.participant.iconPath = new vscode.ThemeIcon('symbol-numeric');
  }

  setLicense(license: LicenseService): void { this.license = license; }
  setTelemetry(telemetry: TelemetrySync): void { this.telemetry = telemetry; }
  setCreditsTracker(tracker: CopilotCreditsTracker): void { this.creditsTracker = tracker; }
  setPriceWatch(pw: PriceWatchService): void { this.priceWatch = pw; }

  // Cached history length from the last request for context comparison
  private lastHistoryLength = 0;

  private async handleRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken,
  ): Promise<vscode.ChatResult> {

    // Auto-sync Tokalator's model to match the active Copilot model
    await this.syncModelFromRequest(request);

    const READONLY_COMMANDS = new Set(['count', 'breakdown', 'preview', 'credits', 'pricewatch']);
    const historyTurns = context.history.filter(
      h => h instanceof vscode.ChatRequestTurn && !READONLY_COMMANDS.has(h.command ?? '')
    ).length;
    this.lastHistoryLength = context.history.length;
    if (historyTurns > this.monitor.getChatTurnCount()) {
      this.monitor.syncChatTurns(historyTurns);
    }

    const isReadOnly = READONLY_COMMANDS.has(request.command ?? '');
    if (!isReadOnly) {
      await this.monitor.incrementChatTurns();
      const snapshot = this.monitor.getLatestSnapshot();
      if (snapshot && this.creditsTracker) {
        this.creditsTracker.recordTurn(snapshot.costEstimate.effectiveCost);
      }
    }

    switch (request.command) {
      case 'count':
        return this.handleCount(stream);

      case 'credits':
        return this.handleCredits(stream);

      case 'optimize':
        return this.handleOptimize(stream);

      case 'pin':
        return this.handlePin(request, stream);

      case 'unpin':
        return this.handleUnpin(request, stream);

      case 'breakdown':
        return this.handleBreakdown(stream);

      case 'instructions':
        return this.handleInstructions(stream);

      case 'model':
        return this.handleModel(request, stream);

      case 'reset':
        return this.handleReset(stream);

      case 'compaction':
        return this.handleCompaction(stream);

      case 'preview':
        return this.handlePreview(request, stream);

      case 'secure':
        return this.handleSecure(request, stream);

      case 'terminology-gen':
        return this.handleTerminologyGen(stream);

      case 'skill-gen':
        return this.handleSkillGen(request, stream);

      case 'settings-gen':
        return this.handleSettingsGen(request, stream);

      case 'exit':
        return this.handleExit(stream);

      case 'team':
        return this.handleEnterprise('team', stream);

      case 'skills':
        return this.handleSkills(request, stream);

      case 'audit':
        return this.handleEnterprise('audit', stream);

      case 'pricewatch':
        return this.handlePriceWatch(stream);

      default:
        return this.handleDefault(request, stream);
    }
  }

  /**
   * /count — Token count and budget level
   */
  private async handleCount(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    await this.monitor.refresh();
    const snapshot = this.monitor.getLatestSnapshot();

    if (!snapshot) {
      stream.markdown('Unable to get token count.');
      return {};
    }

    stream.markdown(`## Token Budget: ${snapshot.budgetLevel.toUpperCase()}\n\n`);

    // Simple summary
    stream.markdown(`| Metric | Tokalator Estimate |\n|---|---|\n`);
    stream.markdown(`| **Tabs open** | ${snapshot.tabs.length} |\n`);
    stream.markdown(`| **Tokens used** | ~${this.fmtTokens(snapshot.totalEstimatedTokens)} |\n`);
    stream.markdown(`| **Window size** | ${this.fmtTokens(snapshot.windowCapacity)} (${snapshot.modelLabel}) |\n`);
    stream.markdown(`| **Usage** | ${snapshot.usagePercent.toFixed(1)}% |\n`);
    stream.markdown(`| **Tokenizer** | ${snapshot.tokenizerLabel} |\n`);
    stream.markdown(`| **Chat turns** | ${snapshot.chatTurnCount} (session history: ${this.lastHistoryLength}) |\n`);
    stream.markdown(`| **Est. input cost** | ${this.fmtCost(snapshot.costEstimate.inputCost)} |\n`);
    stream.markdown(`| **Est. output cost** | ${this.fmtCost(snapshot.costEstimate.outputCost)} (max ${this.fmtTokens(snapshot.costEstimate.outputTokens)}) |\n`);
    stream.markdown(`| **Est. turn cost** | ${this.fmtCost(snapshot.costEstimate.totalCost)} |\n\n`);

    // Budget breakdown comparison
    if (snapshot.budgetBreakdown) {
      const bd = snapshot.budgetBreakdown;
      const totalEst = snapshot.totalEstimatedTokens || 1;
      stream.markdown(`### Budget Breakdown (compare with GitHub Context Window)\n\n`);
      stream.markdown(`| Component | Tokalator | % | GitHub Equivalent |\n|---|---|---|---|\n`);
      stream.markdown(`| System prompt | ~${this.fmtTokens(bd.systemPrompt)} | ${((bd.systemPrompt/totalEst)*100).toFixed(1)}% | System Instructions + Tool Definitions |\n`);
      stream.markdown(`| Instructions | ~${this.fmtTokens(bd.instructions)} | ${((bd.instructions/totalEst)*100).toFixed(1)}% | (included in System) |\n`);
      stream.markdown(`| Files (open tabs) | ~${this.fmtTokens(bd.files)} | ${((bd.files/totalEst)*100).toFixed(1)}% | User Context (Tool Results) |\n`);
      stream.markdown(`| Conversation | ~${this.fmtTokens(bd.conversation)} | ${((bd.conversation/totalEst)*100).toFixed(1)}% | User Context (Messages) |\n`);
      stream.markdown(`| Output reservation | ~${this.fmtTokens(bd.outputReservation)} | ${((bd.outputReservation/totalEst)*100).toFixed(1)}% | Reserved for response |\n`);
      stream.markdown(`| **Total** | **~${this.fmtTokens(totalEst)}** | **${snapshot.usagePercent.toFixed(1)}%** | |\n\n`);
      stream.markdown(`> Compare with the GitHub context window popup (click the % indicator at the bottom of the chat panel) to validate these estimates.\n\n`);
    }

    // Health notes
    for (const reason of snapshot.healthReasons) {
      stream.markdown(`- ${reason}\n`);
    }

    // Quick actions
    const config = vscode.workspace.getConfiguration('tokalator');
    const threshold = config.get<number>('relevanceThreshold', 0.3);
    const distractors = snapshot.tabs.filter(t => t.relevanceScore < threshold && !t.isActive && !t.isPinned);

    if (distractors.length > 0) {
      stream.markdown(`\n> **${distractors.length} low-relevance tabs** — run \`@tokalator /optimize\` to close them\n`);
    }

    return {};
  }

  /**
   * /credits — Show GitHub AI Credits usage and remaining allowance
   */
  private async handleCredits(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    if (!this.creditsTracker) {
      stream.markdown('Credits tracker not initialized.');
      return {};
    }

    const cs = this.creditsTracker.getSnapshot();
    const plan = cs.plan;

    stream.markdown(`## GitHub AI Credits — ${plan.label}\n\n`);

    stream.markdown(`| | |\n|---|---|\n`);
    stream.markdown(`| **Plan** | ${plan.label} (${this.fmtCost(plan.monthlyPrice)}/mo) |\n`);
    stream.markdown(`| **Monthly allowance** | ${this.fmtCost(plan.monthlyCredits)} in AI Credits |\n`);
    stream.markdown(`| **Credits used** | ${this.fmtCost(cs.usage.totalCreditsUsed)} (${cs.usage.turnCount} turns) |\n`);
    stream.markdown(`| **Credits remaining** | ${this.fmtCost(Math.max(cs.creditsRemaining, 0))} |\n`);
    stream.markdown(`| **Usage** | ${cs.percentUsed.toFixed(1)}% of allowance |\n`);
    stream.markdown(`| **Projected monthly** | ${this.fmtCost(cs.projectedMonthly)} |\n`);

    if (cs.isOverage) {
      stream.markdown(`| **Overage** | ${this.fmtCost(cs.overageAmount)} over allowance |\n`);
    }
    stream.markdown('\n');

    // Model-specific cost per turn
    await this.monitor.refresh();
    const snapshot = this.monitor.getLatestSnapshot();
    if (snapshot) {
      const costPerTurn = snapshot.costEstimate.totalCost;
      const turnsRemaining = cs.creditsRemaining > 0 ? Math.floor(cs.creditsRemaining / costPerTurn) : 0;
      stream.markdown(`### At Current Usage (${snapshot.modelLabel})\n\n`);
      stream.markdown(`| | |\n|---|---|\n`);
      stream.markdown(`| **Cost per turn** | ${this.fmtCost(costPerTurn)} |\n`);
      stream.markdown(`| **Turns remaining** | ~${turnsRemaining} |\n`);

      // Cached input savings estimate
      const cached = snapshot.costEstimate.inputCostPerMTok;
      const model = this.monitor.getModels().find(m => m.id === snapshot.modelId);
      if (model?.cachedInputCostPerMTok) {
        const fullInputCost = snapshot.costEstimate.inputCost;
        const cachedInputCost = (snapshot.costEstimate.inputTokens / 1_000_000) * model.cachedInputCostPerMTok;
        const savings = fullInputCost - cachedInputCost;
        stream.markdown(`| **Cached input rate** | ${this.fmtCost(model.cachedInputCostPerMTok * 1_000_000 / 1_000_000)}/MTok (vs ${this.fmtCost(cached)}/MTok) |\n`);
        stream.markdown(`| **Potential cache savings** | ${this.fmtCost(savings)}/turn |\n`);
      }
      stream.markdown('\n');
    }

    // Warnings
    if (cs.percentUsed > 90) {
      stream.markdown(`> **Warning:** You've used ${cs.percentUsed.toFixed(0)}% of your monthly credits. Consider switching to a cheaper model or upgrading your plan.\n\n`);
    } else if (cs.projectedMonthly > plan.monthlyCredits * 1.5) {
      stream.markdown(`> **Heads up:** At current rate, projected monthly spend is ${this.fmtCost(cs.projectedMonthly)} (${((cs.projectedMonthly / plan.monthlyCredits) * 100).toFixed(0)}% of allowance).\n\n`);
    }

    stream.markdown(`*1 AI Credit = $0.01. Rates from [GitHub Copilot billing](https://docs.github.com/copilot/reference/copilot-billing/models-and-pricing). Code completions are free on paid plans.*\n`);

    return {};
  }

  /**
   * /optimize — Close low-relevance tabs
   */
  private async handleOptimize(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    stream.progress('Finding low-relevance tabs...');

    const closed = await this.monitor.optimizeTabs();

    if (closed.length === 0) {
      stream.markdown('All tabs look relevant. Nothing to close.\n');
    } else {
      stream.markdown(`## Closed ${closed.length} tabs\n\n`);
      for (const name of closed) {
        stream.markdown(`- ~~${name}~~\n`);
      }
      stream.markdown(`\nYour token budget is now more focused.\n`);
    }

    return {};
  }

  /**
   * /pin — Pin a file
   */
  private async handlePin(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
  ): Promise<vscode.ChatResult> {
    const promptValue = this.stripQuotes(request.prompt.trim());
    let targets: vscode.Uri[] = [];

    if (!promptValue) {
      const activeUri = vscode.window.activeTextEditor?.document.uri;
      if (!activeUri) {
        stream.markdown('Specify a file to pin or focus the file you want to pin. Example: `@tokalator /pin src/auth.ts`\n');
        return {};
      }
      targets = [activeUri];
    } else {
      targets = await this.resolveUrisFromInput(promptValue);
      if (targets.length === 0) {
        stream.markdown(`No file found matching \`${promptValue}\`\n`);
        return {};
      }
    }

    const uniqueTargets = this.dedupeUris(targets);
    const pinnedLabels = new Set<string>();

    for (const uri of uniqueTargets) {
      this.monitor.pinFile(uri.toString());
      pinnedLabels.add(vscode.workspace.asRelativePath(uri, false));
    }

    const header = pinnedLabels.size === 1 ? 'Pinned file:' : 'Pinned files:';
    const list = Array.from(pinnedLabels)
      .map(label => `- \`${label}\``)
      .join('\n');

    stream.markdown(`${header}\n${list}\n\nPinned files stay at max relevance and won't be closed by optimize.\n`);
    return {};
  }

  /**
   * /unpin — Unpin a file
   */
  private async handleUnpin(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
  ): Promise<vscode.ChatResult> {
    const promptValue = this.stripQuotes(request.prompt.trim());
    let targets: vscode.Uri[] = [];

    if (!promptValue) {
      const activeUri = vscode.window.activeTextEditor?.document.uri;
      if (!activeUri) {
        stream.markdown('Specify a file to unpin or focus the file you want to unpin. Example: `@tokalator /unpin src/auth.ts`\n');
        return {};
      }
      targets = [activeUri];
    } else {
      targets = await this.resolveUrisFromInput(promptValue);
      if (targets.length === 0) {
        stream.markdown(`No file found matching \`${promptValue}\`\n`);
        return {};
      }
    }

    const uniqueTargets = this.dedupeUris(targets);
    const unpinnedLabels: string[] = [];

    for (const uri of uniqueTargets) {
      this.monitor.unpinFile(uri.toString());
      unpinnedLabels.push(vscode.workspace.asRelativePath(uri, false));
    }

    const header = unpinnedLabels.length === 1 ? 'Unpinned file:' : 'Unpinned files:';
    const list = unpinnedLabels
      .map(label => `- \`${label}\``)
      .join('\n');

    stream.markdown(`${header}\n${list}\n\nThese files will now be scored by normal relevance rules.\n`);
    return {};
  }

  /**
   * /reset — Reset session state (turn counter and optionally pins)
   */
  private async handleReset(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    const turnsBefore = this.monitor.getChatTurnCount();
    this.monitor.resetChatTurns();

    stream.markdown(`## Session Reset\n\n`);
    stream.markdown(`- Chat turns: ${turnsBefore} → 0\n`);
    stream.markdown(`- Context rot tracking cleared\n\n`);
    stream.markdown(`> To also clear pinned files, run \`@tokalator /unpin\` or use the **Clear All Pinned Files** command.\n`);
    return {};
  }

  /**
   * /preview — Preview token cost of the next message before sending
   */
  private async handlePreview(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
  ): Promise<vscode.ChatResult> {
    const preview = await this.monitor.previewNextTurn();
    const model = this.monitor.getActiveModel();

    stream.markdown(`## Next Turn Preview\n\n`);

    // Current state
    const barLen = 20;
    const currentFilled = Math.round(((preview.currentInput / preview.windowCapacity) * 100 / 100) * barLen);
    const nextFilled = Math.round((preview.percentAfterTurn / 100) * barLen);
    const currentBar = '█'.repeat(currentFilled) + '░'.repeat(barLen - currentFilled);
    const nextBar = '█'.repeat(nextFilled) + '░'.repeat(barLen - nextFilled);

    stream.markdown(`| | Tokens | Window |\n|---|---|---|\n`);
    stream.markdown(`| **Now** | ~${this.fmtTokens(preview.currentInput)} | \`${currentBar}\` |\n`);
    stream.markdown(`| **After next turn** | ~${this.fmtTokens(preview.nextTurnEstimate)} | \`${nextBar}\` |\n`);
    stream.markdown(`| **Growth** | +~${this.fmtTokens(preview.conversationGrowth)} | |\n`);
    stream.markdown(`| **Output reserve** | ~${this.fmtTokens(preview.outputReserved)} | |\n`);
    stream.markdown(`| **Remaining** | ~${this.fmtTokens(preview.remainingCapacity)} | |\n\n`);

    // If user typed extra text, count those tokens too
    const userText = request.prompt.trim();
    if (userText) {
      const tokenizer = this.monitor.getTokenizer();
      const textTokens = tokenizer.countTokens(userText, model.provider);
      stream.markdown(`Your message "**${userText.slice(0, 50)}${userText.length > 50 ? '...' : ''}**" ≈ ${this.fmtTokens(textTokens)} tokens\n\n`);
    }

    if (preview.warning) {
      stream.markdown(`> **${preview.warning}**\n\n`);
    } else {
      stream.markdown(`> You have room for ~**${Math.floor(preview.remainingCapacity / 800)}** more turns at current rate\n\n`);
    }

    stream.markdown(`*Model: ${model.label} · Window: ${this.fmtTokens(model.contextWindow)}*\n`);
    return {};
  }

  /**
   * /exit — End session, save summary, clear state
   */
  /**
   * Enterprise tier gate. Checks license, shows upgrade message if blocked.
   */
  private async handleEnterprise(
    command: string,
    stream: vscode.ChatResponseStream,
  ): Promise<vscode.ChatResult> {
    if (!this.license || !this.license.isCommandAllowed(command)) {
      stream.markdown(`## Enterprise Feature\n\n`);
      stream.markdown(`\`/${command}\` requires **Tokalator Enterprise**.\n\n`);
      stream.markdown(`Configure in VS Code settings:\n`);
      stream.markdown(`\`\`\`json\n"tokalator.licenseTier": "enterprise",\n"tokalator.teamId": "<your-team-id>",\n"tokalator.apiEndpoint": "https://tokalator.yourcompany.com"\n\`\`\`\n\n`);
      stream.markdown(`Then run **Tokalator: Set Enterprise API Key** from the command palette.\n`);
      return {};
    }

    if (command === 'team') return this.handleTeam(stream);
    if (command === 'audit') return this.handleAudit(stream);
    return {};
  }

  /**
   * /team — Team usage analytics (Enterprise)
   */
  private async handleTeam(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    stream.progress('Fetching team analytics...');

    if (!this.telemetry) {
      stream.markdown('Enterprise backend not configured.');
      return {};
    }

    try {
      const summary = await this.telemetry.fetchTeamSummary('7d');
      if (!summary) {
        stream.markdown('No team analytics available yet.\n');
        return {};
      }

      stream.markdown(`## Team Analytics\n\n`);
      stream.markdown(`**${summary.teamName || 'Team'}** — last 7 days\n\n`);
      stream.markdown(`| Metric | Value |\n|---|---|\n`);
      stream.markdown(`| Sessions | ${summary.totalSessions} |\n`);
      stream.markdown(`| Total Turns | ${summary.totalTurns} |\n`);
      stream.markdown(`| Avg Tokens/Turn | ${summary.avgTokensPerTurn.toLocaleString()} |\n`);
      stream.markdown(`| Avg Cost/Session | $${summary.avgCostPerSession.toFixed(4)} |\n`);
      stream.markdown(`| Active Developers | ${summary.activeDevelopers} |\n\n`);

      if (summary.modelDistribution && Object.keys(summary.modelDistribution).length > 0) {
        stream.markdown(`**Model Distribution:**\n`);
        for (const [model, count] of Object.entries(summary.modelDistribution)) {
          stream.markdown(`- \`${model}\`: ${count} sessions\n`);
        }
        stream.markdown(`\n`);
      }

      if (summary.topCommands && summary.topCommands.length > 0) {
        stream.markdown(`**Top Commands:**\n`);
        for (const cmd of summary.topCommands) {
          stream.markdown(`- \`/${cmd.command}\`: ${cmd.count} uses\n`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      stream.markdown(`Failed to fetch team analytics: ${msg}\n`);
    }

    return {};
  }

  /**
   * /skills — Browse and publish shared skills (Enterprise)
   */
  private async handleSkills(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
  ): Promise<vscode.ChatResult> {
    if (!this.license || !this.license.isCommandAllowed('skills')) {
      return this.handleEnterprise('skills', stream);
    }

    if (!this.telemetry) {
      stream.markdown('Enterprise backend not configured.');
      return {};
    }

    const arg = request.prompt.trim();

    if (arg.startsWith('publish')) {
      stream.progress('Publishing skill to team catalog...');
      // Look for SKILL.md in workspace root
      const files = await vscode.workspace.findFiles('**/SKILL.md', '**/node_modules/**', 1);
      if (files.length === 0) {
        stream.markdown('No `SKILL.md` found in workspace. Run `@tokalator /skill-gen` first.\n');
        return {};
      }
      const content = (await vscode.workspace.fs.readFile(files[0])).toString();
      const nameMatch = content.match(/^#\s+(.+)/m);
      const descMatch = content.match(/^>\s*(.+)/m);

      try {
        const result = await this.telemetry.publishSkill({
          name: nameMatch?.[1] || path.basename(files[0].fsPath),
          description: descMatch?.[1] || '',
          content,
        });
        stream.markdown(`Skill published to team catalog. ID: \`${(result as {id: string}).id}\`\n`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        stream.markdown(`Failed to publish: ${msg}\n`);
      }
      return {};
    }

    // Default: list skills
    stream.progress('Fetching team skill catalog...');
    try {
      const skills = await this.telemetry.listSkills(arg || undefined);

      if (!skills || skills.length === 0) {
        stream.markdown('No skills in team catalog yet. Use `@tokalator /skills publish` to share a SKILL.md.\n');
        return {};
      }

      stream.markdown(`## Team Skill Catalog\n\n`);
      stream.markdown(`| Skill | Author | Downloads |\n|---|---|---|\n`);
      for (const s of skills) {
        stream.markdown(`| **${s.name}** — ${s.description || ''} | ${s.author} | ${s.downloads} |\n`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      stream.markdown(`Failed to fetch skills: ${msg}\n`);
    }
    return {};
  }

  /**
   * /audit — View team audit log (Enterprise)
   */
  private async handleAudit(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    stream.progress('Fetching audit trail...');

    if (!this.telemetry) {
      stream.markdown('Enterprise backend not configured.');
      return {};
    }

    try {
      const headers = this.telemetry.getHeaders();
      const endpoint = this.telemetry.getEndpoint();
      const res = await fetch(`${endpoint}/api/v1/audit?limit=25`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { entries: Array<{timestamp: string; developer_id: string; action: string; resource_type: string; resource_id: string}> };

      if (!data.entries || data.entries.length === 0) {
        stream.markdown('No audit entries found.\n');
        return {};
      }

      stream.markdown(`## Audit Trail (last 25)\n\n`);
      stream.markdown(`| Time | Developer | Action | Resource |\n|---|---|---|---|\n`);
      for (const e of data.entries) {
        const time = new Date(e.timestamp).toLocaleString();
        stream.markdown(`| ${time} | ${e.developer_id} | ${e.action} | ${e.resource_type || ''} ${e.resource_id ? '`' + e.resource_id.slice(0, 8) + '`' : ''} |\n`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      stream.markdown(`Failed to fetch audit log: ${msg}\n`);
    }

    return {};
  }

  private async handleExit(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    this.monitor.saveSessionSummary();

    const turns = this.monitor.getChatTurnCount();
    this.monitor.resetChatTurns();
    this.monitor.clearPins();

    stream.markdown(`## Session Ended\n\n`);
    stream.markdown(`- ${turns} turns completed\n`);
    stream.markdown(`- All pins cleared\n`);
    stream.markdown(`- Session summary saved\n\n`);
    stream.markdown(`> Start a new session anytime with \`@tokalator /count\`\n`);
    return {};
  }

  /**
   * /secure — Scan workspace and auto-generate AI agent security settings (Pro)
   */
  private async handleSecure(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
  ): Promise<vscode.ChatResult> {
    stream.progress('Scanning workspace security...');

    const scanner = new WorkspaceSecurityScanner();
    const audit = await scanner.audit();

    stream.markdown(`## Workspace Security: ${audit.level.toUpperCase()} (${audit.score}/100)\n\n`);

    // Status table
    stream.markdown(`| Config | Status |\n|---|---|\n`);
    stream.markdown(`| \`.claude/settings.json\` deny rules | ${audit.hasClaudeSettings ? 'Yes' : 'Missing'} |\n`);
    stream.markdown(`| \`.github/instructions/secret-files.instructions.md\` | ${audit.hasCopilotGuard ? 'Yes' : 'Missing'} |\n`);
    stream.markdown(`| \`.vscode/settings.json\` excludes | ${audit.hasVSCodeExcludes ? 'Yes' : 'Missing'} |\n`);
    stream.markdown(`| \`.gitignore\` secret patterns | ${audit.missingGitignore.length === 0 ? 'Yes' : audit.missingGitignore.length + ' missing'} |\n\n`);

    // Secret files found
    if (audit.foundSecrets.length > 0) {
      stream.markdown(`### Secret Files Detected\n\n`);
      for (const f of audit.foundSecrets.slice(0, 10)) {
        stream.markdown(`- \`${f}\`\n`);
      }
      stream.markdown('\n');
    }

    // If already protected
    if (audit.level === 'protected') {
      stream.markdown(`> Your workspace is fully protected. All AI agents (Claude Code, GitHub Copilot, Cursor) are blocked from reading secret files.\n`);
      return {};
    }

    // What it will do
    stream.markdown(`### What Tokalator Pro will generate:\n\n`);
    if (!audit.hasClaudeSettings) {
      stream.markdown(`1. **\`.claude/settings.json\`** — \`Read()\` and \`Grep()\` deny rules for 20 secret patterns\n`);
    }
    if (!audit.hasCopilotGuard) {
      stream.markdown(`2. **\`.github/instructions/secret-files.instructions.md\`** — Copilot \`applyTo\` guard\n`);
    }
    if (!audit.hasVSCodeExcludes) {
      stream.markdown(`3. **\`.vscode/settings.json\`** — \`files.exclude\` + \`chat.excludeFilePatterns\`\n`);
    }
    if (audit.missingGitignore.length > 0) {
      stream.markdown(`4. **\`.gitignore\`** — append missing patterns\n`);
    }

    // Apply action
    const applyArg = request.prompt.trim().toLowerCase();
    if (applyArg === 'apply' || applyArg === 'fix' || applyArg === 'generate') {
      stream.progress('Generating security settings...');
      let applied: string[];
      try {
        applied = await scanner.applyAll();
      } catch (err) {
        stream.markdown(`\nNothing was written. ${err instanceof Error ? err.message : String(err)}.\n`);
        return {};
      }
      stream.markdown(`\n### Applied\n\n`);
      for (const f of applied) {
        stream.markdown(`- Generated: \`${f}\`\n`);
      }
      stream.markdown(`\n> Your workspace is now protected. ${SECRET_FILE_PATTERNS.length} secret patterns blocked across all AI agents.\n`);
    } else {
      stream.markdown(`\n---\n`);
      stream.markdown(`**To apply:** \`@tokalator /secure apply\`\n\n`);
      stream.markdown(`Or use the **Secure Workspace** button in the Tokalator dashboard.\n`);
    }

    return {};
  }

  /**
   * /terminology-gen — Generate compressed terminology glossary (Pro)
   */
  private async handleTerminologyGen(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    stream.progress('Scanning project for terminology sources...');

    const folders = vscode.workspace.workspaceFolders;
    if (!folders) {
      stream.markdown('No workspace open.\n');
      return {};
    }

    const root = folders[0].uri;

    // Check for dictionary.json
    const dictPattern = new vscode.RelativePattern(root, '**/dictionary.json');
    const dictFiles = await vscode.workspace.findFiles(dictPattern, '**/node_modules/**', 5);

    // Check for terminologies.md
    const termPattern = new vscode.RelativePattern(root, '**/terminologies.md');
    const termFiles = await vscode.workspace.findFiles(termPattern, '**/node_modules/**', 5);

    stream.markdown(`## Terminology Generator (Pro)\n\n`);
    stream.markdown(`### Sources Found\n\n`);
    stream.markdown(`| Source | Status |\n|---|---|\n`);
    stream.markdown(`| \`dictionary.json\` | ${dictFiles.length > 0 ? dictFiles.length + ' file(s)' : 'Not found'} |\n`);
    stream.markdown(`| \`terminologies.md\` | ${termFiles.length > 0 ? termFiles.length + ' file(s)' : 'Not found'} |\n\n`);

    if (dictFiles.length === 0 && termFiles.length === 0) {
      stream.markdown(`No terminology sources found. Create a \`content/dictionary.json\` with:\n\n`);
      stream.markdown('```json\n{\n  "terms": [\n    { "term": "Context Rot", "definition": "...", "category": "context-management", "tags": [] }\n  ]\n}\n```\n\n');
      stream.markdown(`Then run \`@tokalator /terminology-gen\` again.\n`);
      return {};
    }

    // Measure source sizes
    let totalSourceTokens = 0;
    for (const uri of [...dictFiles, ...termFiles]) {
      try {
        const doc = await vscode.workspace.openTextDocument(uri);
        const model = this.monitor.getActiveModel();
        const tokenizer = this.monitor.getTokenizer();
        const tokens = tokenizer.countTokens(doc.getText(), model.provider);
        totalSourceTokens += tokens;
        stream.markdown(`- \`${vscode.workspace.asRelativePath(uri)}\`: ~${this.fmtTokens(tokens)} tokens\n`);
      } catch { /* skip */ }
    }

    // Check if output already exists
    const instrPattern = new vscode.RelativePattern(root, '**/.github/instructions/terminology.instructions.md');
    const instrFiles = await vscode.workspace.findFiles(instrPattern, undefined, 1);

    stream.markdown(`\n### Compression Potential\n\n`);
    stream.markdown(`| Metric | Value |\n|---|---|\n`);
    stream.markdown(`| Raw sources | ~${this.fmtTokens(totalSourceTokens)} tokens |\n`);
    stream.markdown(`| Expected compressed | ~${this.fmtTokens(Math.round(totalSourceTokens * 0.11))} tokens (89% compression) |\n`);
    stream.markdown(`| Break-even | ~9 turns (at 3 terms/turn) |\n`);
    stream.markdown(`| 25-turn savings | ~56% terminology overhead |\n\n`);

    if (instrFiles.length > 0) {
      stream.markdown(`> Glossary already exists: \`${vscode.workspace.asRelativePath(instrFiles[0])}\`\n\n`);
      stream.markdown(`To regenerate, run in terminal:\n`);
    } else {
      stream.markdown(`### Generate\n\n`);
      stream.markdown(`Run in terminal:\n`);
    }

    stream.markdown('```bash\nnpx tsx scripts/terminology-scanner.ts --format=instructions\n```\n\n');
    stream.markdown(`Or use the **Generate Glossary** button in the Tokalator Pro panel.\n`);

    return {};
  }

  /**
   * /skill-gen — Auto-generate SKILL.md from project analysis (Pro)
   */
  private async handleSkillGen(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
  ): Promise<vscode.ChatResult> {
    stream.progress('Analyzing project structure...');

    const folders = vscode.workspace.workspaceFolders;
    if (!folders) {
      stream.markdown('No workspace open.\n');
      return {};
    }

    const root = folders[0].uri;
    const rootPath = folders[0].name;

    // Detect project characteristics
    const pkgFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(root, 'package.json'), '**/node_modules/**', 1);
    const pyFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(root, '**/*.py'), '**/node_modules/**', 5);
    const goFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(root, '**/*.go'), '**/node_modules/**', 5);
    const rustFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(root, '**/Cargo.toml'), '**/node_modules/**', 1);
    const readmeFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(root, 'README.md'), undefined, 1);
    const existingSkills = await vscode.workspace.findFiles(new vscode.RelativePattern(root, '**/SKILL.md'), '**/node_modules/**', 5);

    // Detect languages
    const langs: string[] = [];
    if (pkgFiles.length > 0) langs.push('TypeScript/JavaScript');
    if (pyFiles.length > 0) langs.push('Python');
    if (goFiles.length > 0) langs.push('Go');
    if (rustFiles.length > 0) langs.push('Rust');
    if (langs.length === 0) langs.push('Unknown');

    // Detect instruction files
    const instrFiles = await vscode.workspace.findFiles(
      new vscode.RelativePattern(root, '**/*.{instructions.md,prompt.md,agent.md}'),
      '**/node_modules/**', 20,
    );
    const claudeFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(root, '**/CLAUDE.md'), undefined, 1);

    // Count workspace files
    const allSrc = await vscode.workspace.findFiles(
      new vscode.RelativePattern(root, '**/*.{ts,tsx,js,jsx,py,go,rs,java,cs}'),
      '**/node_modules/**', 500,
    );

    stream.markdown(`## SKILL.md Generator (Pro)\n\n`);
    stream.markdown(`### Project Analysis: ${rootPath}\n\n`);
    stream.markdown(`| Metric | Value |\n|---|---|\n`);
    stream.markdown(`| Languages | ${langs.join(', ')} |\n`);
    stream.markdown(`| Source files | ${allSrc.length} |\n`);
    stream.markdown(`| Instruction files | ${instrFiles.length + claudeFiles.length} |\n`);
    stream.markdown(`| Existing SKILL.md | ${existingSkills.length > 0 ? existingSkills.map(f => '`' + vscode.workspace.asRelativePath(f) + '`').join(', ') : 'None'} |\n\n`);

    // Read package.json for project name/description
    let projectName = rootPath;
    let projectDesc = '';
    if (pkgFiles.length > 0) {
      try {
        const doc = await vscode.workspace.openTextDocument(pkgFiles[0]);
        const pkg = JSON.parse(doc.getText());
        if (pkg.name) projectName = pkg.name;
        if (pkg.description) projectDesc = pkg.description;
      } catch { /* skip */ }
    }

    // Generate SKILL.md content
    const toolsList = instrFiles.length > 0 ? 'file system tools (read/write), workspace search' : 'file system tools (read/write)';
    const skillContent = [
      '---',
      `name: ${projectName}`,
      `description: Domain expertise for ${projectName}${projectDesc ? ' - ' + projectDesc : ''}`,
      `applyTo: "**"`,
      '---',
      '',
      `# ${projectName} Skill`,
      '',
      projectDesc ? projectDesc + '\n' : '',
      '## When to Use',
      '',
      `Use this skill when working on the ${projectName} codebase or related tasks.`,
      '',
      '## Project Structure',
      '',
      `- **Languages:** ${langs.join(', ')}`,
      `- **Source files:** ${allSrc.length}`,
      existingSkills.length > 0 ? `- **Related skills:** ${existingSkills.map(f => vscode.workspace.asRelativePath(f)).join(', ')}` : '',
      '',
      '## Key Conventions',
      '',
      '- Follow existing code style and patterns',
      langs.includes('TypeScript/JavaScript') ? '- Use TypeScript strict mode where applicable' : '',
      '- Keep changes minimal and focused',
      '',
      '## Tools',
      '',
      `Invokes: ${toolsList}`,
      '',
    ].filter(Boolean).join('\n');

    // Token cost of the skill
    const tokenizer = this.monitor.getTokenizer();
    const model = this.monitor.getActiveModel();
    const skillTokens = tokenizer.countTokens(skillContent, model.provider);

    stream.markdown(`### Generated SKILL.md Preview\n\n`);
    stream.markdown(`Token cost: ~${this.fmtTokens(skillTokens)} (${((skillTokens / model.contextWindow) * 100).toFixed(2)}% of ${model.label} window)\n\n`);
    stream.markdown('```markdown\n' + skillContent + '```\n\n');

    const arg = request.prompt.trim().toLowerCase();
    if (arg === 'apply' || arg === 'write' || arg === 'generate') {
      stream.progress('Writing SKILL.md...');
      const skillUri = vscode.Uri.joinPath(root, 'SKILL.md');
      await vscode.workspace.fs.writeFile(skillUri, Buffer.from(skillContent, 'utf-8'));
      stream.markdown(`### Written!\n\n- \`SKILL.md\` created at workspace root\n\n`);
    } else {
      stream.markdown(`**To write:** \`@tokalator /skill-gen apply\`\n`);
    }

    return {};
  }

  /**
   * /settings-gen — Generate GitHub and VS Code AI settings files (Pro)
   */
  private async handleSettingsGen(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
  ): Promise<vscode.ChatResult> {
    stream.progress('Scanning workspace configuration...');

    const folders = vscode.workspace.workspaceFolders;
    if (!folders) {
      stream.markdown('No workspace open.\n');
      return {};
    }

    const root = folders[0].uri;

    // Check existing configs
    const copilotInstr = await vscode.workspace.findFiles(new vscode.RelativePattern(root, '.github/copilot-instructions.md'), undefined, 1);
    const vscodeSettings = await vscode.workspace.findFiles(new vscode.RelativePattern(root, '.vscode/settings.json'), undefined, 1);
    const instrFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(root, '.github/instructions/*.instructions.md'), undefined, 10);
    const agentFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(root, '**/*.agent.md'), '**/node_modules/**', 10);
    const claudeFile = await vscode.workspace.findFiles(new vscode.RelativePattern(root, 'CLAUDE.md'), undefined, 1);
    const cursorRules = await vscode.workspace.findFiles(new vscode.RelativePattern(root, '.cursorrules'), undefined, 1);

    stream.markdown(`## AI Settings Generator (Pro)\n\n`);
    stream.markdown(`### Current Configuration\n\n`);
    stream.markdown(`| Config File | Status |\n|---|---|\n`);
    stream.markdown(`| \`.github/copilot-instructions.md\` | ${copilotInstr.length > 0 ? 'Exists' : 'Missing'} |\n`);
    stream.markdown(`| \`.vscode/settings.json\` | ${vscodeSettings.length > 0 ? 'Exists' : 'Missing'} |\n`);
    stream.markdown(`| \`.github/instructions/*.instructions.md\` | ${instrFiles.length > 0 ? instrFiles.length + ' file(s)' : 'None'} |\n`);
    stream.markdown(`| \`*.agent.md\` | ${agentFiles.length > 0 ? agentFiles.length + ' file(s)' : 'None'} |\n`);
    stream.markdown(`| \`CLAUDE.md\` | ${claudeFile.length > 0 ? 'Exists' : 'Missing'} |\n`);
    stream.markdown(`| \`.cursorrules\` | ${cursorRules.length > 0 ? 'Exists' : 'Missing'} |\n\n`);

    // Detect project info for generated content
    let projectName = folders[0].name;
    let projectDesc = '';
    const pkgFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(root, 'package.json'), '**/node_modules/**', 1);
    if (pkgFiles.length > 0) {
      try {
        const doc = await vscode.workspace.openTextDocument(pkgFiles[0]);
        const pkg = JSON.parse(doc.getText());
        if (pkg.name) projectName = pkg.name;
        if (pkg.description) projectDesc = pkg.description;
      } catch { /* skip */ }
    }

    const missing: string[] = [];
    const generated: { path: string; content: string }[] = [];

    // Generate copilot-instructions.md if missing
    if (copilotInstr.length === 0) {
      const content = [
        `# Copilot Instructions for ${projectName}`,
        '',
        projectDesc ? projectDesc + '\n' : '',
        '## Code Style',
        '',
        '- Follow existing patterns in the codebase',
        '- Keep changes minimal and focused',
        '- No over-engineering or speculative abstractions',
        '',
        '## Testing',
        '',
        '- Run existing tests before committing',
        '- Add tests for new functionality',
        '',
      ].filter(Boolean).join('\n');
      missing.push('.github/copilot-instructions.md');
      generated.push({ path: '.github/copilot-instructions.md', content });
    }

    // Generate .vscode/settings.json AI excludes if missing
    if (vscodeSettings.length === 0) {
      const content = JSON.stringify({
        'chat.excludeFilePatterns': [
          '**/.env*', '**/*.pem', '**/*.key', '**/id_rsa*',
          '**/credentials.json', '**/service-account*.json',
          '**/node_modules/**', '**/dist/**', '**/.git/**',
        ],
        'files.exclude': {
          '**/.env': true,
          '**/.env.*': true,
          '**/*.pem': true,
          '**/*.key': true,
        },
      }, null, 2) + '\n';
      missing.push('.vscode/settings.json');
      generated.push({ path: '.vscode/settings.json', content });
    }

    if (missing.length === 0) {
      stream.markdown(`> All core AI settings are configured. Your workspace is ready for AI agents.\n\n`);
      stream.markdown(`### Token Cost of Existing Instructions\n\n`);

      let totalTokens = 0;
      const allInstr = [...instrFiles, ...copilotInstr, ...agentFiles, ...claudeFile];
      for (const uri of allInstr) {
        try {
          const doc = await vscode.workspace.openTextDocument(uri);
          const model = this.monitor.getActiveModel();
          const tokenizer = this.monitor.getTokenizer();
          const tokens = tokenizer.countTokens(doc.getText(), model.provider);
          totalTokens += tokens;
          stream.markdown(`- \`${vscode.workspace.asRelativePath(uri)}\`: ~${this.fmtTokens(tokens)}\n`);
        } catch { /* skip */ }
      }
      if (totalTokens > 0) {
        const model = this.monitor.getActiveModel();
        stream.markdown(`\n**Total:** ~${this.fmtTokens(totalTokens)} (${((totalTokens / model.contextWindow) * 100).toFixed(1)}% of ${model.label} window)\n`);
      }
      return {};
    }

    stream.markdown(`### Will Generate\n\n`);
    for (const m of missing) {
      stream.markdown(`- \`${m}\`\n`);
    }
    stream.markdown('\n');

    const arg = request.prompt.trim().toLowerCase();
    if (arg === 'apply' || arg === 'write' || arg === 'generate') {
      stream.progress('Writing settings files...');
      for (const g of generated) {
        const uri = vscode.Uri.joinPath(root, g.path);
        // Ensure parent directory exists
        const parent = vscode.Uri.joinPath(root, path.dirname(g.path));
        try { await vscode.workspace.fs.createDirectory(parent); } catch { /* exists */ }
        await vscode.workspace.fs.writeFile(uri, Buffer.from(g.content, 'utf-8'));
      }
      stream.markdown(`### Applied!\n\n`);
      for (const g of generated) {
        stream.markdown(`- Generated: \`${g.path}\`\n`);
      }
      stream.markdown('\n');
    } else {
      stream.markdown(`**To apply:** \`@tokalator /settings-gen apply\`\n`);
    }

    return {};
  }

  /**
   * /compaction — Per-turn token growth and compaction recommendations
   */
  private async handleCompaction(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    await this.monitor.refresh();
    const snapshot = this.monitor.getLatestSnapshot();

    if (!snapshot) {
      stream.markdown('Unable to get compaction data.');
      return {};
    }

    const model = this.monitor.getActiveModel();
    const history = snapshot.turnHistory;
    const breakdown = snapshot.budgetBreakdown;

    stream.markdown(`## Context Growth\n\n`);

    // Current budget breakdown
    stream.markdown(`### Budget Breakdown\n\n`);
    stream.markdown(`| Category | Tokens | % of Window |\n|---|---|---|\n`);
    const entries: [string, number][] = [
      ['Files', breakdown.files],
      ['System prompt', breakdown.systemPrompt],
      ['Instructions', breakdown.instructions],
      ['Conversation', breakdown.conversation],
      ['Output reserve', breakdown.outputReservation],
    ];
    for (const [label, tokens] of entries) {
      const pct = ((tokens / snapshot.windowCapacity) * 100).toFixed(1);
      stream.markdown(`| ${label} | ~${this.fmtTokens(tokens)} | ${pct}% |\n`);
    }
    stream.markdown(`| **Total** | **~${this.fmtTokens(snapshot.totalEstimatedTokens)}** | **${snapshot.usagePercent.toFixed(1)}%** |\n\n`);

    // Per-turn history table
    if (history.length > 0) {
      stream.markdown(`### Turn History\n\n`);
      stream.markdown(`| Turn | Input | Files | Overhead | Tabs | Pinned |\n|---|---|---|---|---|---|\n`);

      for (const t of history) {
        stream.markdown(`| ${t.turn} | ~${this.fmtTokens(t.inputTokens)} | ~${this.fmtTokens(t.fileTokens)} | ~${this.fmtTokens(t.overheadTokens)} | ${t.tabCount} | ${t.pinnedCount} |\n`);
      }

      // Growth analysis
      stream.markdown(`\n### Growth Analysis\n\n`);

      const avgGrowth = history.length >= 2
        ? (history[history.length - 1].inputTokens - history[0].inputTokens) / (history.length - 1)
        : 0;

      const firstFile = history[0].fileTokens;
      const lastFile = history[history.length - 1].fileTokens;
      const fileTrend = lastFile > firstFile * 1.1 ? 'growing' : lastFile < firstFile * 0.9 ? 'shrinking' : 'stable';

      stream.markdown(`- **Conversation cost:** ~800 tokens/turn (estimated)\n`);
      if (history.length >= 2) {
        stream.markdown(`- **Input growth rate:** ~${this.fmtTokens(Math.round(avgGrowth))}/turn\n`);
      }
      stream.markdown(`- **File tokens:** ${fileTrend} (${this.fmtTokens(firstFile)} → ${this.fmtTokens(lastFile)})\n`);
      stream.markdown(`- **Output reserved:** ~${this.fmtTokens(model.maxOutput)} per response\n\n`);
    } else {
      stream.markdown(`*No turn history yet.* Use \`@tokalator /pin\`, \`/optimize\`, or \`/unpin\` to start tracking.\n\n`);
    }

    // Actionable suggestions
    const suggestions: string[] = [];

    const config = vscode.workspace.getConfiguration('tokalator');
    const threshold = config.get<number>('relevanceThreshold', 0.3);
    const distractors = snapshot.tabs.filter(t => t.relevanceScore < threshold && !t.isActive && !t.isPinned);
    if (distractors.length > 0) {
      const saveable = distractors.reduce((s, t) => s + t.estimatedTokens, 0);
      suggestions.push(`Close ${distractors.length} low-relevance tabs to save ~${this.fmtTokens(saveable)} tokens`);
    }

    const turnsLeft = model.rotThreshold - snapshot.chatTurnCount;
    if (turnsLeft <= 5 && turnsLeft > 0) {
      suggestions.push(`${turnsLeft} turns until context rot threshold (${model.rotThreshold}) — consider \`/reset\``);
    } else if (turnsLeft <= 0) {
      suggestions.push(`Past context rot threshold (${model.rotThreshold} turns) — run \`/reset\` to clear`);
    }

    const inputPct = snapshot.usagePercent;
    if (inputPct >= 80) {
      suggestions.push(`Input is ${inputPct.toFixed(0)}% of window — compaction point reached`);
    } else if (inputPct >= 60) {
      suggestions.push(`Input is ${inputPct.toFixed(0)}% of window — approaching compaction point`);
    }

    const pinnedCount = snapshot.pinnedFiles.size;
    if (pinnedCount > 5) {
      suggestions.push(`${pinnedCount} files pinned — unpin files you're done with`);
    }

    if (suggestions.length > 0) {
      stream.markdown(`### Recommendations\n\n`);
      for (const s of suggestions) {
        stream.markdown(`- ${s}\n`);
      }
    } else {
      stream.markdown(`> Context looks healthy — no compaction needed yet.\n`);
    }

    return {};
  }

  /**
   * /breakdown — Where are tokens going
   */
  private async handleBreakdown(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    await this.monitor.refresh();
    const snapshot = this.monitor.getLatestSnapshot();

    if (!snapshot) {
      stream.markdown('Unable to get breakdown.');
      return {};
    }

    stream.markdown(`## Token Breakdown\n\n`);

    // Simple bar
    const barLen = 20;
    const filled = Math.round((snapshot.usagePercent / 100) * barLen);
    const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);
    stream.markdown(`\`${bar}\` ${snapshot.budgetLevel}\n\n`);

    // Top files by token usage
    const sorted = [...snapshot.tabs].sort((a, b) => b.estimatedTokens - a.estimatedTokens);

    stream.markdown(`### Largest files\n\n`);
    stream.markdown(`| File | Tokens | Relevance |\n|---|---|---|\n`);

    for (const tab of sorted.slice(0, 8)) {
      const relIcon = this.relevanceLabel(tab.relevanceScore);
      stream.markdown(`| ${tab.label} | ~${this.fmtTokens(tab.estimatedTokens)} | ${relIcon} |\n`);
    }

    // Overhead
    const fileTokens = snapshot.tabs.reduce((s, t) => s + t.estimatedTokens, 0);
    const overhead = snapshot.totalEstimatedTokens - fileTokens;
    stream.markdown(`| *System overhead* | ~${this.fmtTokens(overhead)} | — |\n\n`);

    // Distractors
    const config = vscode.workspace.getConfiguration('tokalator');
    const threshold = config.get<number>('relevanceThreshold', 0.3);
    const distractors = sorted.filter(t => t.relevanceScore < threshold && !t.isActive && !t.isPinned);

    if (distractors.length > 0) {
      const distractorTokens = distractors.reduce((s, t) => s + t.estimatedTokens, 0);
      stream.markdown(`> **${distractors.length} low-relevance files** using ~${this.fmtTokens(distractorTokens)} tokens\n`);
    }

    return {};
  }

  /**
   * Default — show help
   */
  private async handleDefault(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
  ): Promise<vscode.ChatResult> {
    await this.monitor.refresh();
    const snapshot = this.monitor.getLatestSnapshot();

    stream.markdown(`## Tokalator\n\n`);
    stream.markdown(`Enterprise token intelligence for AI teams.\n\n`);
    stream.markdown(`| Command | Description |\n|---|---|\n`);
    stream.markdown(`| \`@tokalator /count\` | Current token count and budget level |\n`);
    stream.markdown(`| \`@tokalator /breakdown\` | See where tokens are going |\n`);
    stream.markdown(`| \`@tokalator /optimize\` | Close low-relevance tabs |\n`);
    stream.markdown(`| \`@tokalator /pin <file>\` | Pin a file as always-relevant |\n`);
    stream.markdown(`| \`@tokalator /unpin <file>\` | Unpin a file |\n`);
    stream.markdown(`| \`@tokalator /instructions\` | List instruction files and their token cost |\n`);
    stream.markdown(`| \`@tokalator /model [name]\` | Show or switch the active model |\n`);
    stream.markdown(`| \`@tokalator /compaction\` | Per-turn growth and compaction advice |\n`);
    stream.markdown(`| \`@tokalator /preview\` | Preview token cost before sending |\n`);
    stream.markdown(`| \`@tokalator /secure\` | Scan and auto-generate security settings (Pro) |\n`);
    stream.markdown(`| \`@tokalator /skill-gen\` | Auto-generate SKILL.md from project analysis (Pro) |\n`);
    stream.markdown(`| \`@tokalator /settings-gen\` | Generate GitHub + VS Code AI settings (Pro) |\n`);
    stream.markdown(`| \`@tokalator /reset\` | Reset session (clear turn counter) |\n`);
    stream.markdown(`| \`@tokalator /exit\` | End session and save summary |\n`);
    stream.markdown(`| \`@tokalator /team\` | Team usage analytics (Enterprise) |\n`);
    stream.markdown(`| \`@tokalator /skills\` | Shared skill catalog (Enterprise) |\n`);
    stream.markdown(`| \`@tokalator /audit\` | Team audit trail (Enterprise) |\n\n`);

    if (snapshot) {
      stream.markdown(`**Current:** ${snapshot.tabs.length} tabs, budget ${snapshot.budgetLevel}\n`);
    }

    return {};
  }

  /**
   * /instructions — List instruction files and their token cost
   */
  private async handleInstructions(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    stream.progress('Scanning instruction files...');

    // Find all instruction-like files
    const patterns = [
      '**/*.instructions.md',
      '**/.github/copilot-instructions.md',
      '**/.copilot/*.md',
      '**/*.prompt.md',
      '**/.cursorrules',
      '**/.claude/**/*.md',
      '**/CLAUDE.md',
      '**/AGENTS.md',
      '**/*.agent.md',
    ];

    const allFiles: { path: string; tokens: number }[] = [];

    for (const pattern of patterns) {
      try {
        const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 50);
        for (const uri of files) {
          try {
            const doc = await vscode.workspace.openTextDocument(uri);
            const model = this.monitor.getActiveModel();
            const tokenizer = this.monitor.getTokenizer();
            const tokens = tokenizer.countTokens(doc.getText(), model.provider);
            allFiles.push({
              path: vscode.workspace.asRelativePath(uri),
              tokens,
            });
          } catch {
            allFiles.push({ path: vscode.workspace.asRelativePath(uri), tokens: 0 });
          }
        }
      } catch {
        // pattern not found
      }
    }

    if (allFiles.length === 0) {
      stream.markdown('No instruction files found in this workspace.\n\n');
      stream.markdown('Instruction files are automatically attached to AI context. Common patterns:\n\n');
      stream.markdown('| File | Used by |\n|---|---|\n');
      stream.markdown('| `.github/copilot-instructions.md` | GitHub Copilot |\n');
      stream.markdown('| `*.instructions.md` | GitHub Copilot |\n');
      stream.markdown('| `*.prompt.md` | Copilot / Claude |\n');
      stream.markdown('| `AGENTS.md` | Claude Code |\n');
      stream.markdown('| `.cursorrules` | Cursor |\n');
      return {};
    }

    // Sort by tokens descending
    allFiles.sort((a, b) => b.tokens - a.tokens);
    const totalTokens = allFiles.reduce((sum, f) => sum + f.tokens, 0);

    stream.markdown(`## Instruction Files\n\n`);
    stream.markdown(`**${allFiles.length} files** using ~${this.fmtTokens(totalTokens)} tokens\n\n`);
    stream.markdown(`| File | Tokens |\n|---|---|\n`);

    for (const f of allFiles) {
      stream.markdown(`| \`${f.path}\` | ~${this.fmtTokens(f.tokens)} |\n`);
    }

    const model = this.monitor.getActiveModel();
    const pct = ((totalTokens / model.contextWindow) * 100).toFixed(1);
    stream.markdown(`\n> Instructions use **${pct}%** of ${model.label}'s ${this.fmtTokens(model.contextWindow)} context window\n`);

    return {};
  }

  /**
   * /model — Show or switch the active model
   */
  private async handleModel(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
  ): Promise<vscode.ChatResult> {
    const query = request.prompt.trim();
    const currentModel = this.monitor.getActiveModel();

    if (!query) {
      // Show current model and list all
      stream.markdown(`## Active Model: ${currentModel.label}\n\n`);
      stream.markdown(`| | |\n|---|---|\n`);
      const tokenizer = this.monitor.getTokenizer();
      stream.markdown(`| **Context window** | ${this.fmtTokens(currentModel.contextWindow)} |\n`);
      stream.markdown(`| **Max output** | ${this.fmtTokens(currentModel.maxOutput)} |\n`);
      stream.markdown(`| **Tokenizer** | ${tokenizer.getTokenizerLabel(currentModel.provider)} |\n`);
      stream.markdown(`| **Rot threshold** | ${currentModel.rotThreshold} turns |\n`);
      stream.markdown(`| **Input price** | $${currentModel.inputCostPerMTok}/MTok |\n`);
      stream.markdown(`| **Output price** | $${currentModel.outputCostPerMTok}/MTok |\n`);
      stream.markdown(`| **Provider** | ${currentModel.provider} |\n\n`);

      stream.markdown(`### Available Models\n\n`);
      const models = this.monitor.getModels();
      for (const m of models) {
        const active = m.id === currentModel.id ? ' ← active' : '';
        stream.markdown(`- **${m.label}** — ${this.fmtTokens(m.contextWindow)}, $${m.inputCostPerMTok}/$${m.outputCostPerMTok} per MTok${active}\n`);
      }
      stream.markdown(`\nSwitch with: \`@tokalator /model claude sonnet 4.5\`\n`);
      return {};
    }

    // Try to find matching model
    const match = findModel(query);

    if (!match) {
      stream.markdown(`No model matching "${query}". Try \`@tokalator /model\` to see all options.\n`);
      return {};
    }

    await this.monitor.setModel(match.id);
    stream.markdown(`Switched to **${match.label}**\n\n`);
    stream.markdown(`| | |\n|---|---|\n`);
    stream.markdown(`| **Context window** | ${this.fmtTokens(match.contextWindow)} |\n`);
    stream.markdown(`| **Max output** | ${this.fmtTokens(match.maxOutput)} |\n`);
    stream.markdown(`| **Input price** | $${match.inputCostPerMTok}/MTok |\n`);
    stream.markdown(`| **Output price** | $${match.outputCostPerMTok}/MTok |\n`);
    stream.markdown(`| **Rot threshold** | ${match.rotThreshold} turns |\n`);

    return {};
  }

  private fmtTokens(n: number): string {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toString();
  }

  private fmtCost(n: number): string {
    if (n < 0.001) return '<$0.001';
    if (n < 0.01) return '$' + n.toFixed(4);
    if (n < 1) return '$' + n.toFixed(3);
    return '$' + n.toFixed(2);
  }

  private relevanceLabel(score: number): string {
    if (score >= 0.6) { return 'high'; }
    if (score >= 0.3) { return 'med'; }
    return 'low';
  }

  private stripQuotes(value: string): string {
    if (value.length >= 2) {
      const first = value[0];
      const last = value[value.length - 1];
      if (first === last && ['"', "'", '`'].includes(first)) {
        return value.slice(1, -1);
      }
    }
    return value;
  }

  private async resolveUrisFromInput(input: string): Promise<vscode.Uri[]> {
    const normalized = this.normalizeInputPath(input);
    if (!normalized) { return []; }

    if (this.isAbsolutePath(normalized)) {
      const absoluteUri = vscode.Uri.file(normalized);
      if (await this.fileExists(absoluteUri)) {
        return [absoluteUri];
      }
    }

    const relativeUri = await this.tryResolveRelative(normalized);
    if (relativeUri) {
      return [relativeUri];
    }

    return this.searchWorkspace(normalized);
  }

  private normalizeInputPath(value: string): string {
    if (!value) { return ''; }
    const expanded = value.startsWith('~')
      ? path.join(os.homedir(), value.slice(1))
      : value;
    return path.normalize(expanded);
  }

  private isAbsolutePath(p: string): boolean {
    return path.isAbsolute(p) || /^[A-Za-z]:[\\/]/.test(p);
  }

  private async tryResolveRelative(relativePath: string): Promise<vscode.Uri | null> {
    const trimmed = relativePath.replace(/^(\.\\|\.\/)+/, '').replace(/^\\+|^\/+/, '');
    if (!trimmed) { return null; }
    const folders = vscode.workspace.workspaceFolders || [];
    for (const folder of folders) {
      const candidate = vscode.Uri.file(path.join(folder.uri.fsPath, trimmed));
      if (await this.fileExists(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  private async searchWorkspace(target: string): Promise<vscode.Uri[]> {
    const globTarget = target.replace(/^[/\\]+/, '').replace(/\\/g, '/');
    if (!globTarget) { return []; }
    try {
      return await vscode.workspace.findFiles(`**/${globTarget}`, '**/node_modules/**', 5);
    } catch {
      return [];
    }
  }

  private async fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      return stat.type === vscode.FileType.File;
    } catch {
      return false;
    }
  }

  private dedupeUris(uris: vscode.Uri[]): vscode.Uri[] {
    const seen = new Set<string>();
    const unique: vscode.Uri[] = [];
    for (const uri of uris) {
      const key = uri.toString();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(uri);
      }
    }
    return unique;
  }

  /**
   * Auto-detect the model from the Copilot chat request and sync Tokalator to it.
   * Tries to match by family → id → name so switching models in the Copilot UI
   * automatically updates context window and tokenizer without any manual step.
   */
  private async syncModelFromRequest(request: vscode.ChatRequest): Promise<void> {
    const lm = request.model;
    if (!lm) { return; }

    const current = this.monitor.getActiveModel();
    // Try family first (most stable identifier), then full id, then display name
    const match = findModel(lm.family) ?? findModel(lm.id) ?? findModel(lm.name);

    if (match) {
      if (match.id !== current.id) {
        await this.monitor.setModel(match.id, 'chat-api');
      }
      return;
    }

    // Unknown model — warn once per session so the user knows counts may be off
    const unknownKey = lm.family || lm.id || lm.name;
    if (!this._warnedUnknownModels.has(unknownKey)) {
      this._warnedUnknownModels.add(unknownKey);
      vscode.window.showWarningMessage(
        `Tokalator: unrecognized model "${lm.name}" (family: "${lm.family}") — token counts may be inaccurate. Add it to models.json and run npm run generate-models.`
      );
    }
  }

  private async handlePriceWatch(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    if (!this.priceWatch) {
      stream.markdown('Price Watch is not available.');
      return {};
    }

    const changelog = this.priceWatch.getChangelog();
    if (changelog.length === 0) {
      stream.markdown('**Price Watch** — No rate changes detected since monitoring began.\n\n');
      stream.markdown('Tokalator tracks model pricing from the remote catalog. When rates change, you will see:\n');
      stream.markdown('- Which models changed and by how much\n');
      stream.markdown('- Dollar impact based on your actual usage\n');
      stream.markdown('- Projected monthly cost difference\n');
      return {};
    }

    const latest = changelog[changelog.length - 1];
    const when = new Date(latest.detectedAt).toLocaleDateString();

    stream.markdown(`**Price Watch** — ${latest.changes.length} rate change(s) detected on ${when}\n\n`);

    const inputChanges = latest.changes.filter(c => c.field === 'input');
    const outputChanges = latest.changes.filter(c => c.field === 'output');
    const cachedChanges = latest.changes.filter(c => c.field === 'cachedInput');

    if (inputChanges.length > 0) {
      stream.markdown('**Input Rate Changes**\n\n');
      stream.markdown('| Model | Old Rate | New Rate | Change |\n');
      stream.markdown('|-------|----------|----------|--------|\n');
      for (const c of inputChanges) {
        const dir = c.pctChange > 0 ? '+' : '';
        stream.markdown(`| ${c.label} | $${c.oldRate.toFixed(2)}/MTok | $${c.newRate.toFixed(2)}/MTok | ${dir}${c.pctChange.toFixed(1)}% |\n`);
      }
      stream.markdown('\n');
    }

    if (outputChanges.length > 0) {
      stream.markdown('**Output Rate Changes**\n\n');
      for (const c of outputChanges) {
        const dir = c.pctChange > 0 ? '+' : '';
        stream.markdown(`- ${c.label}: $${c.oldRate.toFixed(2)} -> $${c.newRate.toFixed(2)}/MTok (${dir}${c.pctChange.toFixed(1)}%)\n`);
      }
      stream.markdown('\n');
    }

    if (cachedChanges.length > 0) {
      stream.markdown('**Cached Input Rate Changes**\n\n');
      for (const c of cachedChanges) {
        const dir = c.pctChange > 0 ? '+' : '';
        stream.markdown(`- ${c.label}: $${c.oldRate.toFixed(2)} -> $${c.newRate.toFixed(2)}/MTok (${dir}${c.pctChange.toFixed(1)}%)\n`);
      }
      stream.markdown('\n');
    }

    const impact = this.priceWatch.getImpact();
    if (impact && impact.affectedTurns > 0) {
      stream.markdown('---\n\n**Your Impact**\n\n');
      const dir = impact.totalHistoricalDelta >= 0 ? '+' : '';
      stream.markdown(`Based on ${impact.affectedTurns} recorded turns with affected models:\n\n`);
      stream.markdown(`- Historical delta: **${dir}$${Math.abs(impact.totalHistoricalDelta).toFixed(4)}**\n`);
      if (impact.projectedMonthlyDelta !== 0) {
        const mdir = impact.projectedMonthlyDelta >= 0 ? '+' : '';
        stream.markdown(`- Projected monthly: **${mdir}$${Math.abs(impact.projectedMonthlyDelta).toFixed(2)}/mo**\n`);
      }
      stream.markdown('\n');
      for (const m of impact.byModel) {
        const d = m.historicalDelta >= 0 ? '+' : '';
        stream.markdown(`  - ${m.label}: ${m.turns} turns, ${d}$${Math.abs(m.historicalDelta).toFixed(4)} ($${m.inputRateOld.toFixed(2)} -> $${m.inputRateNew.toFixed(2)}/MTok)\n`);
      }
    }

    if (changelog.length > 1) {
      stream.markdown(`\n---\n\n*${changelog.length} total rate change events recorded.*\n`);
    }

    this.priceWatch.acknowledge();
    return {};
  }

  dispose(): void {
    this.participant.dispose();
  }
}
