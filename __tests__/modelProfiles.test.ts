/**
 * Unit tests for extension: core/modelProfiles.ts
 * Tests: model lookup, profile data integrity, provider coverage
 */
import {
  MODEL_PROFILES,
  DEFAULT_MODEL_ID,
  findModel,
  getModel,
  ModelProfile,
} from '../src/core/modelProfiles';

// ============================================
// MODEL_PROFILES data integrity
// ============================================

describe('MODEL_PROFILES', () => {
  it('contains 14 model profiles', () => {
    expect(MODEL_PROFILES).toHaveLength(14);
  });

  it('covers 3 providers', () => {
    const providers = new Set(MODEL_PROFILES.map((m: ModelProfile) => m.provider));
    expect(providers).toEqual(new Set(['anthropic', 'openai', 'google']));
  });

  it('has 4 Anthropic, 7 OpenAI, 3 Google models', () => {
    const counts: Record<string, number> = { anthropic: 0, openai: 0, google: 0 };
    MODEL_PROFILES.forEach((m: ModelProfile) => counts[m.provider]++);
    expect(counts.anthropic).toBe(4);
    expect(counts.openai).toBe(7);
    expect(counts.google).toBe(3);
  });

  it('all models have positive context window', () => {
    MODEL_PROFILES.forEach((m: ModelProfile) => {
      expect(m.contextWindow).toBeGreaterThan(0);
    });
  });

  it('all models have positive max output', () => {
    MODEL_PROFILES.forEach((m: ModelProfile) => {
      expect(m.maxOutput).toBeGreaterThan(0);
    });
  });

  it('maxOutput < contextWindow for all models', () => {
    MODEL_PROFILES.forEach((m: ModelProfile) => {
      expect(m.maxOutput).toBeLessThanOrEqual(m.contextWindow);
    });
  });

  it('all models have a positive rot threshold', () => {
    MODEL_PROFILES.forEach((m: ModelProfile) => {
      expect(m.rotThreshold).toBeGreaterThan(0);
    });
  });

  it('all model IDs are unique', () => {
    const ids = MODEL_PROFILES.map((m: ModelProfile) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all model labels are unique', () => {
    const labels = MODEL_PROFILES.map((m: ModelProfile) => m.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

// ============================================
// DEFAULT_MODEL_ID
// ============================================

describe('DEFAULT_MODEL_ID', () => {
  it('exists in MODEL_PROFILES', () => {
    const found = MODEL_PROFILES.find((m: ModelProfile) => m.id === DEFAULT_MODEL_ID);
    expect(found).toBeDefined();
  });

  it('is claude-opus-4.6', () => {
    expect(DEFAULT_MODEL_ID).toBe('claude-opus-4.6');
  });
});

// ============================================
// findModel
// ============================================

describe('findModel', () => {
  it('exact ID match', () => {
    const result = findModel('claude-opus-4.6');
    expect(result?.id).toBe('claude-opus-4.6');
  });

  it('exact label match', () => {
    const result = findModel('Claude Opus 4.6');
    expect(result?.id).toBe('claude-opus-4.6');
  });

  it('case-insensitive match', () => {
    const result = findModel('CLAUDE-OPUS-4.6');
    expect(result?.id).toBe('claude-opus-4.6');
  });

  it('partial match (starts-with)', () => {
    const result = findModel('gpt-5');
    expect(result?.id).toBe('gpt-5.2');
  });

  it('contains match (fallback)', () => {
    const result = findModel('opus');
    expect(result?.id).toBe('claude-opus-4.6');
  });

  it('returns undefined for empty string', () => {
    expect(findModel('')).toBeUndefined();
  });

  it('returns undefined for nonsense', () => {
    expect(findModel('xyzzy')).toBeUndefined();
  });

  it('finds OpenAI models', () => {
    expect(findModel('o4-mini')?.provider).toBe('openai');
  });

  it('finds Google models', () => {
    expect(findModel('gemini-3-pro')?.provider).toBe('google');
  });
});

// ============================================
// getModel
// ============================================

describe('getModel', () => {
  it('returns exact model for valid ID', () => {
    const model = getModel('claude-sonnet-4.5');
    expect(model.id).toBe('claude-sonnet-4.5');
    expect(model.provider).toBe('anthropic');
  });

  it('falls back to default for unknown ID', () => {
    const model = getModel('nonexistent');
    expect(model.id).toBe(DEFAULT_MODEL_ID);
  });

  it('returns correct context window', () => {
    const opus = getModel('claude-opus-4.6');
    expect(opus.contextWindow).toBe(1_000_000);

    const sonnet = getModel('claude-sonnet-4.5');
    expect(sonnet.contextWindow).toBe(200_000);
  });
});

// ============================================
// Copilot model auto-detection (findModel with Copilot-style names)
// ============================================

describe('findModel — Copilot chat model name matching', () => {
  it('matches Copilot-style "claude-3.5-sonnet" → claude-sonnet-4.5 via contains', () => {
    // Copilot may expose models with different naming conventions
    const result = findModel('sonnet 4.5');
    expect(result?.id).toBe('claude-sonnet-4.5');
  });

  it('matches "gpt-4.1" exactly', () => {
    const result = findModel('gpt-4.1');
    expect(result?.id).toBe('gpt-4.1');
  });

  it('matches "Claude Opus" partial label', () => {
    const result = findModel('Claude Opus');
    expect(result?.id).toBe('claude-opus-4.6');
  });

  it('matches "gemini" partial to first Gemini model', () => {
    const result = findModel('gemini');
    expect(result?.provider).toBe('google');
  });

  it('matches "o3" exactly', () => {
    const result = findModel('o3');
    expect(result?.id).toBe('o3');
    expect(result?.provider).toBe('openai');
  });

  it('matches "o4-mini" exactly', () => {
    const result = findModel('o4-mini');
    expect(result?.id).toBe('o4-mini');
  });

  it('matches "haiku" partial', () => {
    const result = findModel('haiku');
    expect(result?.id).toBe('claude-haiku-4.5');
  });

  it('matches "GPT-5 Mini" label', () => {
    const result = findModel('GPT-5 Mini');
    expect(result?.id).toBe('gpt-5-mini');
  });

  it('handles model name with extra spaces and dashes', () => {
    const result = findModel('Claude - Sonnet - 4');
    expect(result?.id).toBe('claude-sonnet-4');
  });

  it('handles model name from Copilot with vendor prefix', () => {
    // e.g. "copilot-claude-opus-4.6" — contains "claude-opus-4.6"
    const result = findModel('copilot-claude-opus-4.6');
    expect(result?.id).toBe('claude-opus-4.6');
  });
});
