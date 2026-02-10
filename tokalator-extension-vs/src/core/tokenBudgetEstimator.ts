import * as vscode from 'vscode';
import { TabInfo, BudgetBreakdown } from './types';
import { TokenizerService } from './tokenizerService';

/**
 * Estimates token counts for files and tracks total context budget usage.
 *
 * Uses model-specific tokenizers via TokenizerService:
 *  - Anthropic: Claude BPE tokenizer (real token counts)
 *  - OpenAI: o200k_base tokenizer (real token counts)
 *  - Google/other: heuristic (~1 token per 4 chars)
 */
export class TokenBudgetEstimator {

  // Cached token counts by URI string
  private cache = new Map<string, { tokens: number; version: number; provider: string }>();

  constructor(private readonly tokenizer: TokenizerService) {}

  /**
   * Set which provider's tokenizer to use for counting.
   */
  private provider: string = 'anthropic';

  setProvider(provider: string): void {
    // If provider changed, invalidate cache (different tokenizer = different counts)
    if (provider !== this.provider) {
      this.cache.clear();
      this.provider = provider;
    }
  }

  /**
   * Estimate tokens for a single document using the real tokenizer.
   */
  async estimateFileTokens(doc: vscode.TextDocument): Promise<number> {
    const key = doc.uri.toString();
    const cached = this.cache.get(key);

    // Use cache if document version and provider haven't changed
    if (cached && cached.version === doc.version && cached.provider === this.provider) {
      return cached.tokens;
    }

    const tokens = this.tokenizer.countTokens(doc.getText(), this.provider);

    this.cache.set(key, { tokens, version: doc.version, provider: this.provider });
    return tokens;
  }

  /**
   * Estimate tokens for all tabs.
   */
  async estimateAllTabs(tabs: TabInfo[]): Promise<TabInfo[]> {
    const results: TabInfo[] = [];

    for (const tab of tabs) {
      try {
        // Use already-open documents to avoid force-opening tabs
        const openDoc = vscode.workspace.textDocuments.find(
          d => d.uri.toString() === tab.uri.toString()
        );
        if (openDoc) {
          const tokens = await this.estimateFileTokens(openDoc);
          results.push({ ...tab, estimatedTokens: tokens });
        } else {
          // For tabs without a loaded document, estimate from cache or use 0
          const cached = this.cache.get(tab.uri.toString());
          results.push({ ...tab, estimatedTokens: cached?.tokens ?? 0 });
        }
      } catch {
        results.push({ ...tab, estimatedTokens: 0 });
      }
    }

    return results;
  }

  /**
   * Estimate overhead tokens for non-file context (system prompt, instructions, conversation).
   */
  estimateOverhead(chatTurnCount: number, instructionFiles: number): number {
    const systemPrompt = 2000;              // ~2K tokens for Copilot system prompt
    const instructionsCost = instructionFiles * 500;  // ~500 tokens per instruction file
    const conversationCost = chatTurnCount * 800;     // ~800 tokens per turn (user+assistant)
    const outputReservation = 4000;          // tokens reserved for response

    return systemPrompt + instructionsCost + conversationCost + outputReservation;
  }

  /**
   * Compute total budget usage.
   */
  computeBudget(
    tabs: TabInfo[],
    chatTurnCount: number,
    instructionFiles: number,
    windowCapacity: number
  ): { used: number; capacity: number; percent: number; breakdown: BudgetBreakdown } {
    const fileTokens = tabs.reduce((sum, t) => sum + t.estimatedTokens, 0);
    const overhead = this.estimateOverhead(chatTurnCount, instructionFiles);
    const used = fileTokens + overhead;

    return {
      used,
      capacity: windowCapacity,
      percent: windowCapacity > 0 ? Math.min((used / windowCapacity) * 100, 100) : 0,
      breakdown: {
        files: fileTokens,
        systemPrompt: 2000,
        instructions: instructionFiles * 500,
        conversation: chatTurnCount * 800,
        outputReservation: 4000,
      },
    };
  }

  /**
   * Clear the entire cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for a specific URI (when document closes).
   */
  clearCacheFor(uri: string): void {
    this.cache.delete(uri);
  }
}

// BudgetBreakdown is defined in types.ts
