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
export class TokenizerService {
    claudeTokenizer = null;
    getTokenizerType() {
        return 'claude-bpe';
    }
    getTokenizerLabel() {
        return 'Claude BPE tokenizer';
    }
    /**
     * Count tokens in text using the real Claude BPE tokenizer.
     * Falls back to heuristic if the tokenizer fails to load.
     */
    countTokens(text) {
        try {
            return this.countClaude(text);
        }
        catch {
            return this.heuristic(text);
        }
    }
    /**
     * Estimate tokens from raw byte size.
     * Useful for workspace scanning without reading file contents.
     */
    estimateFromBytes(bytes) {
        return Math.ceil(bytes / 3.7);
    }
    countClaude(text) {
        if (!this.claudeTokenizer) {
            // Lazy-load Claude BPE ranks (696 KB JSON) on first use
            const ranks = require('@anthropic-ai/tokenizer/claude.json');
            this.claudeTokenizer = new Tiktoken(ranks);
        }
        return this.claudeTokenizer.encode(text.normalize('NFKC')).length;
    }
    heuristic(text) {
        return Math.ceil(text.length / 4);
    }
    dispose() {
        this.claudeTokenizer = null;
    }
}
