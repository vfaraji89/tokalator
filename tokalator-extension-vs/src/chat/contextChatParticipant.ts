import type { Telemetry } from '../core/telemetry';
import { writeCodeMaps } from '../core/codeMaps';
import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { ContextMonitor } from '../core/contextMonitor';
import { findModel } from '../core/modelProfiles';
import { WorkspaceSecurityScanner, SECRET_FILE_PATTERNS } from '../core/workspaceSecurityScanner';
import { priceWatchReport, type PriceWatchService } from '../core/priceWatch';
import { AGENT_LABELS } from '../core/agents/types';
import { detectProject, planAgentFiles, planSkill, writePlanned, type PlannedFile } from '../core/workspaceSetup';

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
  private priceWatch: PriceWatchService | null = null;

  constructor(private readonly monitor: ContextMonitor) {
    this.participant = vscode.chat.createChatParticipant(
      'tokalator.tokens',
      this.handleRequest.bind(this),
    );

    this.participant.iconPath = new vscode.ThemeIcon('symbol-numeric');
  }

  setPriceWatch(pw: PriceWatchService): void { this.priceWatch = pw; }

  private telemetry: Telemetry | null = null;
  setTelemetry(t: Telemetry): void { this.telemetry = t; }

  // Cached history length from the last request for context comparison
  private lastHistoryLength = 0;

  private async handleRequest(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    _token: vscode.CancellationToken,
  ): Promise<vscode.ChatResult> {

    this.telemetry?.count('chat:' + (request.command ?? 'prompt'));

    // Auto-sync Tokalator's model to match the active Copilot model
    await this.syncModelFromRequest(request);

    const READONLY_COMMANDS = new Set(['count', 'breakdown', 'preview', 'pricewatch']);
    const historyTurns = context.history.filter(
      h => h instanceof vscode.ChatRequestTurn && !READONLY_COMMANDS.has(h.command ?? '')
    ).length;
    this.lastHistoryLength = context.history.length;
    this.monitor.syncChatTurns(historyTurns);

    const isReadOnly = READONLY_COMMANDS.has(request.command ?? '');
    if (!isReadOnly) {
      await this.monitor.incrementChatTurns();
    }

    switch (request.command) {
      case 'count':
        return this.handleCount(stream);

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

      case 'skill-gen':
        return this.handleSkillGen(request, stream);

      case 'settings-gen':
        return this.handleSettingsGen(request, stream);

      case 'exit':
        return this.handleExit(stream);

      case 'codemap':
        return this.handleCodeMap(stream);
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
    const clampBar = (n: number) => Math.min(barLen, Math.max(0, Number.isFinite(n) ? n : 0));
    const currentFilled = clampBar(Math.round((preview.currentInput / preview.windowCapacity) * barLen));
    const nextFilled = clampBar(Math.round((preview.percentAfterTurn / 100) * barLen));
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
   * /secure — Scan workspace and auto-generate AI agent security settings
   */
  private async handleSecure(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
  ): Promise<vscode.ChatResult> {
    stream.progress('Scanning workspace security...');

    const scanner = new WorkspaceSecurityScanner();
    const audit = await scanner.audit();

    stream.markdown(`## Workspace Security: ${audit.level.toUpperCase()} (${audit.score}/100)\n\n`);

    if (audit.foundSecrets.length === 0) {
      stream.markdown(`No secret files found in this workspace, so there is nothing to protect.\n`);
      return {};
    }

    const yes = (v: boolean) => (v ? 'covered' : '**not covered**');
    stream.markdown(`| Secret file | Claude Code deny rule | VS Code search exclusion | Git ignored |\n|---|---|---|---|\n`);
    for (const c of audit.coverage.slice(0, 15)) {
      stream.markdown(`| \`${c.file}\` | ${yes(c.claude)} | ${yes(c.search)} | ${yes(c.gitignored)} |\n`);
    }
    if (audit.coverage.length > 15) stream.markdown(`\n${audit.coverage.length - 15} more not shown.\n`);
    stream.markdown(`\nCopilot instruction guard: ${audit.hasCopilotGuard ? 'present' : 'missing'} (advisory; Copilot agent mode can still open files directly).\n\n`);

    if (audit.level === 'protected') {
      stream.markdown(`> Every secret file is covered: Claude Code is denied reads, VS Code search and agent grep skip it, and git ignores it.\n`);
      return {};
    }

    stream.markdown(`### What Secure Workspace will add\n\n`);
    if (!audit.coverage.every(c => c.claude)) {
      stream.markdown(`- **\`.claude/settings.json\`**: \`Read()\` deny rules for ${SECRET_FILE_PATTERNS.length} secret patterns\n`);
    }
    if (!audit.hasCopilotGuard) {
      stream.markdown(`- **\`.github/instructions/secret-files.instructions.md\`**: an \`applyTo\` instruction asking Copilot not to read them\n`);
    }
    if (!audit.coverage.every(c => c.search)) {
      stream.markdown(`- **\`.vscode/settings.json\`**: \`search.exclude\` entries, so text search and agent grep skip them\n`);
    }
    if (audit.missingGitignore.length > 0) {
      stream.markdown(`- **\`.gitignore\`**: patterns for ${audit.missingGitignore.length} file(s) git does not ignore yet\n`);
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
   * /skill-gen — Auto-generate SKILL.md from project analysis
   */
  private async handleSkillGen(
    request: vscode.ChatRequest,
    stream: vscode.ChatResponseStream,
  ): Promise<vscode.ChatResult> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) {
      stream.markdown('No workspace open.\n');
      return {};
    }
    const plan = planSkill(root, detectProject(root));
    if (plan.length === 0) {
      stream.markdown('## Checks skill\n\nNo build, test, lint or type check commands found (package.json scripts, pyproject, go.mod, Cargo.toml or Makefile). Add them first, then generate the skill.\n');
      return {};
    }
    stream.markdown('## Checks skill\n\nAn Agent Skill that runs this project\'s checks before an agent says it is done. Skills load on demand, so it costs no tokens until it is used.\n\n');
    this.streamPlan(stream, plan);
    stream.markdown('```markdown\n' + plan[0].content + '```\n\n');
    if (/^(apply|write|generate)/.test(request.prompt.trim().toLowerCase())) {
      const written = writePlanned(root, plan);
      stream.markdown(written.length ? `Written: ${written.map(w => '`' + w + '`').join(', ')}\n` : 'Nothing to write; the skill already exists.\n');
    } else {
      stream.markdown('**To write:** `@tokalator /skill-gen apply`, or the Generate SKILL.md button in the Tokalator sidebar.\n');
    }
    return {};
  }

  private streamPlan(stream: vscode.ChatResponseStream, plan: PlannedFile[]): void {
    stream.markdown('| File | Read by | Status |\n|---|---|---|\n');
    for (const f of plan) stream.markdown(`| \`${f.path}\` | ${f.readBy} | ${f.exists ? 'Exists, kept' : 'Will create'} |\n`);
    stream.markdown('\n');
  }

  /**
   * /settings-gen — Generate GitHub and VS Code AI settings files
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
    const agentsFile = await vscode.workspace.findFiles(new vscode.RelativePattern(root, 'AGENTS.md'), undefined, 1);
    const claudeSettings = await vscode.workspace.findFiles(new vscode.RelativePattern(root, '.claude/settings.json'), undefined, 1);
    const promptFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(root, '.github/prompts/*.prompt.md'), undefined, 10);
    const skills = await vscode.workspace.findFiles(new vscode.RelativePattern(root, '{.claude,.agents,.github}/skills/*/SKILL.md'), undefined, 20);
    const cursorRules = await vscode.workspace.findFiles(new vscode.RelativePattern(root, '{.cursor/rules/*.mdc,.cursorrules}'), undefined, 10);
    const geminiFile = await vscode.workspace.findFiles(new vscode.RelativePattern(root, 'GEMINI.md'), undefined, 1);
    const mcpFile = await vscode.workspace.findFiles(new vscode.RelativePattern(root, '{.mcp.json,.vscode/mcp.json}'), undefined, 2);

    stream.markdown(`## AI Settings Generator\n\n`);
    stream.markdown(`### Current Configuration\n\n`);
    const row = (file: string, tools: string, n: number) => stream.markdown(`| \`${file}\` | ${tools} | ${n > 0 ? (n > 1 ? n + ' files' : 'Exists') : 'Missing'} |\n`);
    stream.markdown(`| File | Read by | Status |\n|---|---|---|\n`);
    row('AGENTS.md', 'Codex, Copilot, Cursor, Gemini CLI (configurable), Claude Code when there is no CLAUDE.md', agentsFile.length);
    row('CLAUDE.md', 'Claude Code', claudeFile.length);
    row('.claude/settings.json', 'Claude Code permissions and hooks', claudeSettings.length);
    row('.github/copilot-instructions.md', 'GitHub Copilot', copilotInstr.length);
    row('.github/instructions/*.instructions.md', 'GitHub Copilot (path-scoped with applyTo)', instrFiles.length);
    row('.github/prompts/*.prompt.md', 'VS Code prompt files (slash commands)', promptFiles.length);
    row('*.agent.md', 'VS Code custom agents', agentFiles.length);
    row('{.claude,.agents,.github}/skills/*/SKILL.md', 'Agent Skills (Claude Code, Codex, VS Code)', skills.length);
    row('.cursor/rules/*.mdc', 'Cursor', cursorRules.length);
    row('GEMINI.md', 'Gemini CLI', geminiFile.length);
    row('.mcp.json or .vscode/mcp.json', 'MCP servers for Claude Code or VS Code', mcpFile.length);
    row('.vscode/settings.json', 'VS Code search exclusion', vscodeSettings.length);
    stream.markdown('\n');

    const plan = planAgentFiles(root.fsPath, detectProject(root.fsPath));
    stream.markdown('### Agent instructions\n\n`AGENTS.md` is the single source: Codex and VS Code Copilot read it directly, and `CLAUDE.md` imports it for Claude Code. A copy in `.github/copilot-instructions.md` is not needed, since VS Code would load both.\n\n');
    this.streamPlan(stream, plan);
    const missing = plan.filter(f => !f.exists);
    if (missing.length === 0) {
      stream.markdown('> All agent instruction files exist. Nothing to generate.\n');
      return {};
    }
    const agents = plan.find(f => f.path === 'AGENTS.md');
    if (agents && !agents.exists) stream.markdown('```markdown\n' + agents.content + '```\n\n');
    if (/^(apply|write|generate)$/.test(request.prompt.trim().toLowerCase())) {
      const written = writePlanned(root.fsPath, plan);
      stream.markdown(`### Applied\n\n${written.map(w => '- Created `' + w + '`').join('\n')}\n`);
    } else {
      stream.markdown('**To apply:** `@tokalator /settings-gen apply`, or the Agent Instructions button in the Tokalator sidebar.\n');
    }
    return {};
  }

  private async handleCodeMap(stream: vscode.ChatResponseStream): Promise<vscode.ChatResult> {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) {
      stream.markdown('No workspace open.\n');
      return {};
    }
    stream.progress('Mapping the codebase...');
    const r = writeCodeMaps(root);
    stream.markdown(`## Code maps\n\n${r.symbolCount} symbols across ${r.fileCount} source files. ${r.updated.length ? 'Updated ' + r.updated.map(f => '`' + f + '`').join(' and ') + '.' : 'Both files are already current.'}\n\n`);
    stream.markdown('- `GLOSSARY.md`: every declaration with a source link and its documented purpose\n- `SITE-MAP.md`: packages and scripts, modules and routes, and imports by module\n\nAgents can read them to find the right files before opening source. Built locally with no model calls.\n');
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
    const filled = Math.min(barLen, Math.max(0, Math.round((snapshot.usagePercent / 100) * barLen) || 0));
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
    stream.markdown(`Open-source context engineering for AI coding assistants.\n\n`);
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
    stream.markdown(`| \`@tokalator /secure\` | Scan and auto-generate security settings |\n`);
    stream.markdown(`| \`@tokalator /skill-gen\` | Auto-generate SKILL.md from project analysis |\n`);
    stream.markdown(`| \`@tokalator /settings-gen\` | Generate GitHub + VS Code AI settings |\n`);
    stream.markdown(`| \`@tokalator /reset\` | Reset session (clear turn counter) |\n`);
    stream.markdown(`| \`@tokalator /pricewatch\` | Model price changes and their impact |\n`);
    stream.markdown(`| \`@tokalator /exit\` | End session and save summary |\n\n`);

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
      '**/*.prompt.md',
      '**/*.agent.md',
      '**/*.chatmode.md',
      '**/.claude/**/*.md',
      '**/CLAUDE.md',
      '**/CLAUDE.local.md',
      '**/AGENTS.md',
      '**/AGENTS.override.md',
      '**/GEMINI.md',
      '**/.cursor/rules/*.mdc',
      '**/.cursorrules',
    ];

    const allFiles: { path: string; tokens: number }[] = [];
    const seen = new Set<string>();

    for (const pattern of patterns) {
      try {
        const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**', 50);
        for (const uri of files) {
          if (seen.has(uri.toString())) continue;
          seen.add(uri.toString());
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
      stream.markdown('| `AGENTS.md` | Codex, Copilot, Cursor, Claude Code when there is no CLAUDE.md |\n');
      stream.markdown('| `CLAUDE.md`, `.claude/rules/*.md` | Claude Code |\n');
      stream.markdown('| `.github/copilot-instructions.md`, `*.instructions.md` | GitHub Copilot |\n');
      stream.markdown('| `*.prompt.md`, `*.agent.md` | VS Code prompt files and custom agents |\n');
      stream.markdown('| `GEMINI.md` | Gemini CLI |\n');
      stream.markdown('| `.cursor/rules/*.mdc` | Cursor |\n');
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
    stream.markdown(priceWatchReport(this.priceWatch, AGENT_LABELS));
    this.priceWatch.acknowledge();
    return {};
  }

  dispose(): void {
    this.participant.dispose();
  }
}
