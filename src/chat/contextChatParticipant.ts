import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { ContextMonitor } from '../core/contextMonitor';
import { ContextSnapshot, TabInfo, OptimizationPlan, OptimizationAction } from '../core/types';

/**
 * Chat participant `@tokalator` for Tokalator.
 *
 * Commands:
 *  /count        — Show current token count and budget level
 *  /optimize     — Context optimization report with actionable suggestions
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

  constructor(private readonly monitor: ContextMonitor) {
    this.participant = vscode.chat.createChatParticipant(
      'tokalator.tokens',
      this.handleRequest.bind(this),
    );

    this.participant.iconPath = new vscode.ThemeIcon('symbol-numeric');
  }

  private async handleRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
  ): Promise<vscode.ChatResult> {

    // Auto-sync model from Copilot's active chat model
    if (request.model) {
      this.monitor.syncFromChatRequest(request.model);
    }

    // Only count turns for commands that modify state (optimize, pin, unpin)
    // Read-only commands (count, breakdown) don't contribute to context rot
    const isModifyingCommand = request.command === 'optimize' || request.command === 'pin' || request.command === 'unpin';
    if (isModifyingCommand) {
      this.monitor.incrementChatTurns();
    }

    switch (request.command) {
      case 'count':
        return this.handleCount(stream);

      case 'optimize':
        if (request.prompt.trim() === '--apply') {
          return this.handleOptimizeApply(stream);
        }
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

      case 'secrets':
        return this.handleSecrets(stream);

      case 'cost':
        return this.handleCost(stream);

      case 'exit':
        return this.handleExit(stream);

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

    const levelEmoji = snapshot.budgetLevel === 'low' ? '🟢'
      : snapshot.budgetLevel === 'medium' ? '🟡' : '🔴';

    stream.markdown(`## ${levelEmoji} Token Budget: ${snapshot.budgetLevel.toUpperCase()}\n\n`);

    // Simple summary
    stream.markdown(`| | |\n|---|---|\n`);
    stream.markdown(`| **Tabs open** | ${snapshot.tabs.length} |\n`);
    stream.markdown(`| **Tokens used** | ~${this.fmtTokens(snapshot.totalEstimatedTokens)} |\n`);
    stream.markdown(`| **Window size** | ${this.fmtTokens(snapshot.windowCapacity)} |\n`);
    stream.markdown(`| **Tokenizer** | ${snapshot.tokenizerLabel} |\n`);
    stream.markdown(`| **Chat turns** | ${snapshot.chatTurnCount} |\n\n`);

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
   * /optimize — Context optimization report
   */
  private async handleOptimize(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    stream.progress('Analyzing context for optimizations...');

    await this.monitor.refresh();
    const plan = await this.monitor.getOptimizationPlan();

    if (!plan) {
      stream.markdown('Unable to generate optimization plan.\n');
      return {};
    }

    // ── Header with score ──
    const scoreEmoji = plan.score >= 90 ? '🟢'
      : plan.score >= 70 ? '🟡'
      : plan.score >= 50 ? '🟠' : '🔴';

    stream.markdown(`## 🎯 Context Optimization Report\n\n`);
    stream.markdown(`${scoreEmoji} **Score: ${plan.score}/100** — ${plan.verdict}\n\n`);

    // ── Summary bar ──
    if (plan.totalTokenSavings > 0 || plan.totalCostSavingsPerTurn > 0) {
      const parts: string[] = [];
      if (plan.totalTokenSavings > 0) {
        parts.push(`save ~${this.fmtTokens(plan.totalTokenSavings)} tokens`);
      }
      if (plan.totalCostSavingsPerTurn > 0) {
        parts.push(`save $${plan.totalCostSavingsPerTurn.toFixed(4)}/turn`);
      }
      stream.markdown(`> **Quick wins:** ${parts.join(' · ')}\n\n`);
    }

    if (plan.actions.length === 0) {
      stream.markdown('✅ Your context is well-optimized. Nothing to improve.\n');
      return {};
    }

    // ── Group actions by category ──
    const categoryLabels: Record<string, string> = {
      security: '🔐 Security',
      health: '📊 Context Health',
      tokens: '💰 Token Savings',
      cost: '📦 Cost Optimization',
      workflow: '📁 Workflow Suggestions',
    };
    const categoryOrder = ['security', 'health', 'tokens', 'cost', 'workflow'];

    for (const cat of categoryOrder) {
      const catActions = plan.actions.filter(a => a.category === cat);
      if (catActions.length === 0) continue;

      stream.markdown(`### ${categoryLabels[cat] || cat}\n\n`);

      for (const action of catActions) {
        const priorityIcon = action.priority === 'critical' ? '🔴'
          : action.priority === 'high' ? '🟠'
          : action.priority === 'medium' ? '🟡' : '🔵';

        stream.markdown(`${priorityIcon} **${action.title}**\n\n`);

        // Render description lines
        const descLines = action.description.split('\n');
        for (const line of descLines) {
          stream.markdown(`  ${line}\n`);
        }

        // Show savings if applicable
        const savingParts: string[] = [];
        if (action.tokenSavings > 0) {
          savingParts.push(`~${this.fmtTokens(action.tokenSavings)} tokens`);
        }
        if (action.costSavingsPerTurn > 0) {
          savingParts.push(`$${action.costSavingsPerTurn.toFixed(4)}/turn`);
        }
        if (savingParts.length > 0) {
          stream.markdown(`\n  → Save ${savingParts.join(' · ')}\n`);
        }

        stream.markdown(`\n`);
      }
    }

    // ── Quick-action summary ──
    const actionable = plan.actions.filter(a => a.actionable);
    if (actionable.length > 0) {
      stream.markdown(`### ⚡ Available Actions\n\n`);

      const closable = plan.actions.find(a => a.actionKey === 'closeTabs');
      if (closable) {
        stream.markdown(`- Run \`@tokalator /optimize --apply\` to close low-relevance tabs\n`);
      }

      const pinnable = plan.actions.find(a => a.actionKey === 'pinFiles');
      if (pinnable && pinnable.actionData) {
        stream.markdown(`- Run \`@tokalator /pin\` to pin suggested high-relevance files\n`);
      }

      const resettable = plan.actions.find(a => a.actionKey === 'reset');
      if (resettable) {
        stream.markdown(`- Run \`@tokalator /reset\` to clear context rot\n`);
      }

      const secretFiles = plan.actions.find(a => a.actionKey === 'closeSecretFiles');
      if (secretFiles) {
        stream.markdown(`- Run \`@tokalator /secrets\` for detailed security scan\n`);
      }

      stream.markdown(`\n`);
    }

    // ── Category summary ──
    stream.markdown(`---\n`);
    const summaryParts: string[] = [];
    for (const cat of categoryOrder) {
      if (plan.categoryCounts[cat as keyof typeof plan.categoryCounts] > 0) {
        summaryParts.push(`${categoryLabels[cat]}: ${plan.categoryCounts[cat as keyof typeof plan.categoryCounts]}`);
      }
    }
    stream.markdown(`*${summaryParts.join(' · ')}*\n`);

    return {};
  }

  /**
   * /optimize --apply — Execute the close-tabs action from the optimization plan
   */
  private async handleOptimizeApply(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    stream.progress('Closing low-relevance tabs...');

    const closed = await this.monitor.optimizeTabs();

    if (closed.length === 0) {
      stream.markdown('All tabs look relevant. Nothing to close.\n');
    } else {
      stream.markdown(`## ✂️ Closed ${closed.length} tab${closed.length > 1 ? 's' : ''}\n\n`);
      for (const name of closed) {
        stream.markdown(`- ~~${name}~~\n`);
      }
      stream.markdown(`\nRun \`@tokalator /optimize\` to see updated report.\n`);
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

    stream.markdown(`## \uD83D\uDD2E Next Turn Preview\n\n`);

    // Current state
    const barLen = 20;
    const currentFilled = Math.round(((preview.currentInput / preview.windowCapacity) * 100 / 100) * barLen);
    const nextFilled = Math.round((preview.percentAfterTurn / 100) * barLen);
    const currentBar = '\u2588'.repeat(currentFilled) + '\u2591'.repeat(barLen - currentFilled);
    const nextBar = '\u2588'.repeat(nextFilled) + '\u2591'.repeat(barLen - nextFilled);

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
      stream.markdown(`Your message "**${userText.slice(0, 50)}${userText.length > 50 ? '...' : ''}**" \u2248 ${this.fmtTokens(textTokens)} tokens\n\n`);
    }

    if (preview.warning) {
      stream.markdown(`> \u26A0\uFE0F **${preview.warning}**\n\n`);
    } else {
      stream.markdown(`> \u2705 You have room for ~**${Math.floor(preview.remainingCapacity / 800)}** more turns at current rate\n\n`);
    }

    stream.markdown(`*Model: ${model.label} \u00B7 Window: ${this.fmtTokens(model.contextWindow)}*\n`);
    return {};
  }

  /**
   * /secrets \u2014 Scan open files for secrets, credentials, and sensitive data
   */
  private async handleSecrets(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    stream.progress('Scanning open files for secrets...');

    await this.monitor.refresh();
    const secretScan = this.monitor.getLatestSecretScan();

    if (!secretScan || secretScan.totalFindings === 0) {
      stream.markdown(`## \uD83D\uDD12 Secrets Guard\n\n`);
      stream.markdown(`\u2705 **No secrets detected** in open files.\n\n`);
      stream.markdown(`All ${vscode.window.tabGroups.all.flatMap(g => g.tabs).length} open tabs were scanned for:\n\n`);
      stream.markdown(`| Category | Examples |\n|---|---|\n`);
      stream.markdown(`| API Keys | OpenAI, Anthropic, AWS, Google, Stripe, GitHub |\n`);
      stream.markdown(`| Credentials | Passwords, bearer tokens, JWTs |\n`);
      stream.markdown(`| Connection Strings | Database URLs, Redis, MongoDB |\n`);
      stream.markdown(`| Sensitive Files | .env, .pem, .key, credentials |\n`);
      stream.markdown(`| Infrastructure | Private IPs, internal hostnames |\n\n`);
      stream.markdown(`> Your AI context window is clean \u2014 no credentials at risk.\n`);
      return {};
    }

    stream.markdown(`## \uD83D\uDEA8 Secrets Guard \u2014 ${secretScan.totalFindings} Finding(s)\n\n`);

    // Summary badges
    const parts: string[] = [];
    if (secretScan.critical > 0) parts.push(`\uD83D\uDD34 **${secretScan.critical} critical**`);
    if (secretScan.high > 0) parts.push(`\uD83D\uDFE0 **${secretScan.high} high**`);
    if (secretScan.warning > 0) parts.push(`\uD83D\uDFE1 **${secretScan.warning} warning**`);
    stream.markdown(parts.join(' \u00B7 ') + '\n\n');

    // Env files warning
    if (secretScan.envFilesOpen.length > 0) {
      stream.markdown(`> \u26A0\uFE0F **Sensitive files open in editor:** ${secretScan.envFilesOpen.map(f => `\`${f}\``).join(', ')}\n`);
      stream.markdown(`> These files should **never** be in AI context. Close them or add to \`.gitignore\`.\n\n`);
    }

    // Findings table
    stream.markdown(`| Severity | Finding | File | Line |\n|---|---|---|---|\n`);
    for (const f of secretScan.findings) {
      const icon = f.severity === 'critical' ? '\uD83D\uDD34' : f.severity === 'high' ? '\uD83D\uDFE0' : '\uD83D\uDFE1';
      const line = f.line > 0 ? String(f.line) : '\u2014';
      stream.markdown(`| ${icon} ${f.severity} | ${f.description} | \`${f.filePath}\` | ${line} |\n`);
    }

    // Recommendations
    stream.markdown(`\n### Recommendations\n\n`);
    if (secretScan.envFilesOpen.length > 0) {
      stream.markdown(`1. **Close sensitive files** \u2014 \`.env\` files should not be open during AI sessions\n`);
    }
    if (secretScan.critical > 0) {
      stream.markdown(`2. **Move secrets to a vault** \u2014 use \`op run\` (1Password CLI) or macOS Keychain\n`);
      stream.markdown(`3. **Use environment injection** \u2014 \`op run -- python main.py\` instead of \`.env\` files\n`);
    }
    stream.markdown(`4. **Add to .cursorignore / .gitignore** \u2014 prevent AI tools from reading these files\n`);
    stream.markdown(`5. **Use \`.env.example\`** \u2014 keep structure without real values\n\n`);

    stream.markdown(`> Run \`@tokalator /secrets\` anytime to re-scan after closing files.\n`);
    return {};
  }

  /**
   * /exit — End session, save summary, clear state
   */
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
    stream.markdown(`Count your tokens like beads on an abacus.\n\n`);
    stream.markdown(`| Command | Description |\n|---|---|\n`);
    stream.markdown(`| \`@tokalator /count\` | Current token count and budget level |\n`);
    stream.markdown(`| \`@tokalator /breakdown\` | See where tokens are going |\n`);
    stream.markdown(`| \`@tokalator /optimize\` | Context optimization report |
`);
    stream.markdown(`| \`@tokalator /optimize --apply\` | Close low-relevance tabs |
`);
    stream.markdown(`| \`@tokalator /pin <file>\` | Pin a file as always-relevant |\n`);
    stream.markdown(`| \`@tokalator /unpin <file>\` | Unpin a file |\n`);
    stream.markdown(`| \`@tokalator /instructions\` | List instruction files and their token cost |\n`);
    stream.markdown(`| \`@tokalator /model [name]\` | Show or switch the active model |\n`);
    stream.markdown(`| \`@tokalator /compaction\` | Per-turn growth and compaction advice |\n`);
    stream.markdown(`| \`@tokalator /preview\` | Preview token cost before sending |\n`);
    stream.markdown(`| \`@tokalator /secrets\` | Scan open files for exposed secrets |\n`);
    stream.markdown(`| \`@tokalator /cost\` | Cost estimation and caching savings |\n`);
    stream.markdown(`| \`@tokalator /reset\` | Reset session (clear turn counter) |\n`);
    stream.markdown(`| \`@tokalator /exit\` | End session and save summary |\n\n`);

    if (snapshot) {
      const levelEmoji = snapshot.budgetLevel === 'low' ? '🟢'
        : snapshot.budgetLevel === 'medium' ? '🟡' : '🔴';
      stream.markdown(`**Current:** ${levelEmoji} ${snapshot.tabs.length} tabs, budget ${snapshot.budgetLevel}\n`);
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
      stream.markdown(`| **Provider** | ${currentModel.provider} |\n\n`);

      stream.markdown(`### Available Models\n\n`);
      const models = this.monitor.getModels();
      for (const m of models) {
        const active = m.id === currentModel.id ? ' ← active' : '';
        stream.markdown(`- **${m.label}** — ${this.fmtTokens(m.contextWindow)}${active}\n`);
      }
      stream.markdown(`\nSwitch with: \`@tokalator /model claude sonnet 4.5\`\n`);
      return {};
    }

    // Try to find matching model
    const { findModel } = require('../core/modelProfiles');
    const match = findModel(query);

    if (!match) {
      stream.markdown(`No model matching "${query}". Try \`@tokalator /model\` to see all options.\n`);
      return {};
    }

    this.monitor.setModel(match.id);
    stream.markdown(`Switched to **${match.label}**\n\n`);
    stream.markdown(`| | |\n|---|---|\n`);
    stream.markdown(`| **Context window** | ${this.fmtTokens(match.contextWindow)} |\n`);
    stream.markdown(`| **Max output** | ${this.fmtTokens(match.maxOutput)} |\n`);
    stream.markdown(`| **Rot threshold** | ${match.rotThreshold} turns |\n`);

    return {};
  }

  /**
   * /cost — Show cost estimation and caching savings for current context
   */
  private async handleCost(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    stream.progress('Calculating cost estimate...');

    await this.monitor.refresh();
    const snapshot = this.monitor.getLatestSnapshot();
    if (!snapshot || !snapshot.costEstimate) {
      stream.markdown('Unable to get cost estimate.');
      return {};
    }

    const c = snapshot.costEstimate;
    const model = this.monitor.getActiveModel();

    const fmtUSD = (v: number): string => {
      if (v < 0.001) return '<$0.001';
      if (v < 0.01) return '$' + v.toFixed(4);
      if (v < 1) return '$' + v.toFixed(3);
      return '$' + v.toFixed(2);
    };

    stream.markdown(`## \uD83D\uDCB0 Cost Estimate — ${model.label}\n\n`);

    // Per-turn breakdown
    stream.markdown(`### This Turn\n\n`);
    stream.markdown(`| | Tokens | Cost |\n|---|---|---|\n`);
    stream.markdown(`| **Input** | ~${this.fmtTokens(c.inputTokens)} | ${fmtUSD(c.inputCostUSD)} |\n`);
    stream.markdown(`| **Output** (est.) | ~${this.fmtTokens(c.outputTokensEstimate)} | ${fmtUSD(c.outputCostUSD)} |\n`);
    stream.markdown(`| **Total** | | **${fmtUSD(c.totalCostUSD)}** |\n\n`);

    // Pricing rates
    stream.markdown(`*Rates: $${model.inputCostPer1M}/M input · $${model.outputCostPer1M}/M output`);
    if (model.supportsCaching) {
      stream.markdown(` · $${model.cachedInputCostPer1M}/M cached input`);
    }
    stream.markdown(`*\n\n`);

    // Caching section
    if (c.cachingSupported) {
      stream.markdown(`### \uD83D\uDCE6 Caching Analysis\n\n`);
      stream.markdown(`> ${c.cachingDescription}\n\n`);

      stream.markdown(`| | |\n|---|---|\n`);
      stream.markdown(`| **Cacheable tokens** | ~${this.fmtTokens(c.cacheableTokens)} (system + instructions + stable files) |\n`);
      stream.markdown(`| **Volatile tokens** | ~${this.fmtTokens(c.uncacheableTokens)} (conversation + active edits) |\n`);
      stream.markdown(`| **Est. hit ratio** | ${Math.round(c.estimatedHitRatio * 100)}% |\n`);
      stream.markdown(`| **Input w/ caching** | ${fmtUSD(c.cachedCostUSD)} vs ${fmtUSD(c.uncachedCostUSD)} |\n`);
      stream.markdown(`| **Savings/turn** | \uD83D\uDFE2 **${fmtUSD(c.savingsPerTurnUSD)}** (${c.savingsPercent.toFixed(0)}%) |\n\n`);
    }

    // Session projections
    stream.markdown(`### Session Projections\n\n`);
    stream.markdown(`| Turns | Without Cache | With Cache | Savings |\n|---|---|---|---|\n`);
    stream.markdown(`| 10 | ${fmtUSD(c.cost10Turns)} | ${fmtUSD(c.cachedCost10Turns)} | ${fmtUSD(c.cost10Turns - c.cachedCost10Turns)} |\n`);
    stream.markdown(`| 25 | ${fmtUSD(c.cost25Turns)} | ${fmtUSD(c.cachedCost25Turns)} | ${fmtUSD(c.cost25Turns - c.cachedCost25Turns)} |\n`);
    stream.markdown(`| 50 | ${fmtUSD(c.cost50Turns)} | ${fmtUSD(c.cachedCost50Turns)} | ${fmtUSD(c.cost50Turns - c.cachedCost50Turns)} |\n\n`);

    // Monthly projection
    stream.markdown(`### Monthly Projection (8 sessions/day, ~5 turns/session)\n\n`);
    stream.markdown(`| | Daily | Monthly (22 days) |\n|---|---|---|\n`);
    stream.markdown(`| **Uncached** | ${fmtUSD(c.dailyCostUSD)} | ${fmtUSD(c.monthlyCostUSD)} |\n`);
    stream.markdown(`| **With caching** | ${fmtUSD(c.cachedDailyCostUSD)} | ${fmtUSD(c.cachedMonthlyCostUSD)} |\n`);
    stream.markdown(`| **Savings** | \uD83D\uDFE2 ${fmtUSD(c.dailyCostUSD - c.cachedDailyCostUSD)} | \uD83D\uDFE2 **${fmtUSD(c.monthlyCostUSD - c.cachedMonthlyCostUSD)}** |\n\n`);

    // Tips
    stream.markdown(`### \uD83D\uDCA1 Cost Optimization Tips\n\n`);
    if (c.cachingSupported && c.savingsPercent > 20) {
      stream.markdown(`1. **Enable prompt caching** — save ~${c.savingsPercent.toFixed(0)}% on input costs\n`);
    }
    stream.markdown(`2. **Close unused tabs** — fewer file tokens = lower input cost\n`);
    stream.markdown(`3. **Pin only essential files** — pinned files always count toward input\n`);
    stream.markdown(`4. **Reset sessions often** — conversation history grows linearly\n`);
    stream.markdown(`5. **Choose the right model** — use \`/model\` to compare costs\n`);

    return {};
  }

  private fmtTokens(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
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

  dispose(): void {
    this.participant.dispose();
  }
}
