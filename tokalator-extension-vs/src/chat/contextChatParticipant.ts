import * as vscode from 'vscode';
import { ContextMonitor } from '../core/contextMonitor';
import { ContextSnapshot, TabInfo } from '../core/types';

/**
 * Chat participant `@tokalator` for Tokalator.
 *
 * Commands:
 *  /count        — Show current token count and budget level
 *  /optimize     — Close low-relevance tabs
 *  /pin          — Pin a file as always-relevant
 *  /breakdown    — Show where tokens are going
 *  /instructions — List and estimate tokens for instruction files
 *  /model        — Show or switch the active AI model
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

    // Only count turns for commands that modify state (optimize, pin)
    // Read-only commands (count, breakdown) don't contribute to context rot
    const isModifyingCommand = request.command === 'optimize' || request.command === 'pin';
    if (isModifyingCommand) {
      this.monitor.incrementChatTurns();
    }

    switch (request.command) {
      case 'count':
        return this.handleCount(stream);

      case 'optimize':
        return this.handleOptimize(stream);

      case 'pin':
        return this.handlePin(request, stream);

      case 'breakdown':
        return this.handleBreakdown(stream);

      case 'instructions':
        return this.handleInstructions(stream);

      case 'model':
        return this.handleModel(request, stream);

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
      stream.markdown(`\n> **${distractors.length} low-relevance tabs** — run \`@tokens /optimize\` to close them\n`);
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
    const filePath = request.prompt.trim();

    if (!filePath) {
      stream.markdown('Specify a file to pin. Example: `@tokens /pin src/auth.ts`\n');
      return {};
    }

    const matches = await vscode.workspace.findFiles(`**/${filePath}`, '**/node_modules/**', 5);

    if (matches.length === 0) {
      stream.markdown(`No file found matching \`${filePath}\`\n`);
      return {};
    }

    for (const uri of matches) {
      this.monitor.pinFile(uri.toString());
      stream.markdown(`Pinned: \`${vscode.workspace.asRelativePath(uri)}\`\n`);
    }

    stream.markdown(`\nPinned files stay at max relevance and won't be closed by optimize.\n`);
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
    stream.markdown(`| \`@tokalator /optimize\` | Close low-relevance tabs |\n`);
    stream.markdown(`| \`@tokalator /pin <file>\` | Pin a file as always-relevant |\n`);
    stream.markdown(`| \`@tokalator /instructions\` | List instruction files and their token cost |\n`);
    stream.markdown(`| \`@tokalator /model [name]\` | Show or switch the active model |\n\n`);

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

  private fmtTokens(n: number): string {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n.toString();
  }

  private relevanceLabel(score: number): string {
    if (score >= 0.6) { return 'high'; }
    if (score >= 0.3) { return 'med'; }
    return 'low';
  }

  dispose(): void {
    this.participant.dispose();
  }
}
