/**
 * Model-specific tokenizer service.
 *
 * Uses real BPE tokenizers per provider family:
 *  - Anthropic (Claude): Claude-specific BPE ranks via @anthropic-ai/tokenizer data
 *  - OpenAI (GPT/o-series): o200k_base encoding (GPT-4o, GPT-5.x, o3, o4-mini)
 *  - Google (Gemini): heuristic (~1 token per 4 chars) — no official JS tokenizer
 *
 * Both real tokenizers use js-tiktoken's pure-JS BPE engine (no WASM).
 */

import { Tiktoken } from 'js-tiktoken/lite';

export type TokenizerType = 'claude-bpe' | 'o200k_base' | 'heuristic';

export class TokenizerService {

  private claudeTokenizer: Tiktoken | null = null;
  private openaiTokenizer: Tiktoken | null = null;

  /**
   * Get the tokenizer type used for a given provider.
   */
  getTokenizerType(provider: string): TokenizerType {
    switch (provider) {
      case 'anthropic': return 'claude-bpe';
      case 'openai': return 'o200k_base';
      default: return 'heuristic';
    }
  }

  /**
   * Human-readable label for the tokenizer in use.
   */
  getTokenizerLabel(provider: string): string {
    switch (provider) {
      case 'anthropic': return 'Claude BPE tokenizer';
      case 'openai': return 'o200k_base tokenizer';
      default: return 'Heuristic (~4 chars/token)';
    }
  }

  /**
   * Count tokens in text using the real tokenizer for the given provider.
   * Falls back to heuristic if the tokenizer fails to load.
   */
  countTokens(text: string, provider: string): number {
    try {
      switch (provider) {
        case 'anthropic': return this.countClaude(text);
        case 'openai': return this.countOpenAI(text);
        default: return this.heuristic(text);
      }
    } catch {
      return this.heuristic(text);
    }
  }

  /**
   * Estimate tokens from raw byte size (for workspace scanning without reading files).
   * Uses provider-specific bytes-per-token ratios measured on code corpora.
   */
  estimateFromBytes(bytes: number, provider: string): number {
    switch (provider) {
      case 'anthropic': return Math.ceil(bytes / 3.7);
      case 'openai': return Math.ceil(bytes / 3.5);
      default: return Math.ceil(bytes / 4);
    }
  }

  // --- Anthropic: Claude BPE tokenizer ---

  private countClaude(text: string): number {
    if (!this.claudeTokenizer) {
      // Lazy-load Claude BPE ranks (696 KB JSON) on first use
      const ranks = require('@anthropic-ai/tokenizer/claude.json');
      this.claudeTokenizer = new Tiktoken(ranks);
    }
    return this.claudeTokenizer.encode(text.normalize('NFKC')).length;
  }

  // --- OpenAI: o200k_base tokenizer ---

  private countOpenAI(text: string): number {
    if (!this.openaiTokenizer) {
      // Lazy-load o200k_base ranks on first use
      const ranks = require('js-tiktoken/ranks/o200k_base');
      this.openaiTokenizer = new Tiktoken(ranks);
    }
    return this.openaiTokenizer.encode(text).length;
  }

  // --- Fallback ---

  private heuristic(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Release tokenizer memory.
   */
  dispose(): void {
    this.claudeTokenizer = null;
    this.openaiTokenizer = null;
  }
}
