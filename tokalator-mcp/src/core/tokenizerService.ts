/**
 * Token counting service using real BPE tokenizers.
 *
 * Claude (Anthropic): Claude-specific BPE ranks via @anthropic-ai/tokenizer
 * Fallback: heuristic (~1 token per 4 chars)
 *
 * Uses createRequire for lazy JSON loading (compatible with ESM).
 */

import { createRequire } from 'module';
import { Tiktoken } from 'js-tiktoken/lite';

const require = createRequire(import.meta.url);

export type TokenizerType = 'claude-bpe' | 'heuristic';

export class TokenizerService {

  private claudeTokenizer: Tiktoken | null = null;

  getTokenizerType(): TokenizerType {
    return 'claude-bpe';
  }

  getTokenizerLabel(): string {
    return 'Claude BPE tokenizer';
  }

  /**
   * Count tokens in text using the real Claude BPE tokenizer.
   * Falls back to heuristic if the tokenizer fails to load.
   */
  countTokens(text: string): number {
    try {
      return this.countClaude(text);
    } catch {
      return this.heuristic(text);
    }
  }

  /**
   * Estimate tokens from raw byte size.
   * Useful for workspace scanning without reading file contents.
   */
  estimateFromBytes(bytes: number): number {
    return Math.ceil(bytes / 3.7);
  }

  private countClaude(text: string): number {
    if (!this.claudeTokenizer) {
      // Lazy-load Claude BPE ranks (696 KB JSON) on first use
      const ranks = require('@anthropic-ai/tokenizer/claude.json');
      this.claudeTokenizer = new Tiktoken(ranks);
    }
    return this.claudeTokenizer.encode(text.normalize('NFKC')).length;
  }

  private heuristic(text: string): number {
    return Math.ceil(text.length / 4);
  }

  dispose(): void {
    this.claudeTokenizer = null;
  }
}
