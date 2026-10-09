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
  it('is non-empty', () => {
    expect(MODEL_PROFILES.length).toBeGreaterThan(0);
  });

  it('covers 3 providers', () => {
    const providers = new Set(MODEL_PROFILES.map((m: ModelProfile) => m.provider));
    expect(providers).toEqual(new Set(['anthropic', 'openai', 'google']));
  });

  it('has at least one model per provider', () => {
    const counts: Record<string, number> = { anthropic: 0, openai: 0, google: 0 };
    MODEL_PROFILES.forEach((m: ModelProfile) => counts[m.provider]++);
    expect(counts.anthropic).toBeGreaterThan(0);
    expect(counts.openai).toBeGreaterThan(0);
    expect(counts.google).toBeGreaterThan(0);
  });

  it('every model has a non-negative cache-read rate at or below its input rate', () => {
    MODEL_PROFILES.forEach((m: ModelProfile) => {
      if (m.cachedInputCostPerMTok === undefined) { return; }
      expect(m.cachedInputCostPerMTok).toBeGreaterThanOrEqual(0);
      expect(m.cachedInputCostPerMTok).toBeLessThanOrEqual(m.inputCostPerMTok);
    });
  });

  it('at least one model is featured', () => {
    expect(MODEL_PROFILES.some((m: ModelProfile) => m.featured)).toBe(true);
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

  it('points at a current Claude model', () => {
    expect(DEFAULT_MODEL_ID).toMatch(/^claude-/);
  });
});

// ============================================
// findModel
// ============================================

describe('findModel', () => {
  it('exact ID match', () => {
    const result = findModel('claude-opus-4.8');
    expect(result?.id).toBe('claude-opus-4.8');
  });

  it('exact label match', () => {
    const result = findModel('Claude Opus 4.8');
    expect(result?.id).toBe('claude-opus-4.8');
  });

  it('case-insensitive match', () => {
    const result = findModel('CLAUDE-OPUS-4.8');
    expect(result?.id).toBe('claude-opus-4.8');
  });

  it('partial match (starts-with)', () => {
    const result = findModel('gpt-5.4-mini');
    expect(result?.id).toBe('gpt-5.4-mini');
  });

  it('contains match (fallback)', () => {
    const result = findModel('opus');
    expect(result?.id).toMatch(/^claude-opus-/);
  });

  it('returns undefined for empty string', () => {
    expect(findModel('')).toBeUndefined();
  });

  it('returns undefined for nonsense', () => {
    expect(findModel('xyzzy')).toBeUndefined();
  });

  it('finds OpenAI models', () => {
    expect(findModel('gpt-5.4-nano')?.provider).toBe('openai');
  });

  it('finds Google models', () => {
    expect(findModel('gemini-2.5-pro')?.provider).toBe('google');
  });

  it('finds GPT-5.5 model', () => {
    expect(findModel('gpt-5.5')?.provider).toBe('openai');
    expect(findModel('gpt-5.5')?.contextWindow).toBe(272_000);
  });

  it('finds Claude Sonnet 4.6', () => {
    expect(findModel('claude-sonnet-4.6')?.provider).toBe('anthropic');
  });

  it('finds Gemini 3.5 Flash model', () => {
    const m = findModel('gemini-3.5-flash');
    expect(m?.provider).toBe('google');
    expect(m?.inputCostPerMTok).toBe(1.5);
    expect(m?.outputCostPerMTok).toBe(9.0);
  });
});

// ============================================
// getModel
// ============================================

describe('getModel', () => {
  it('returns exact model for valid ID', () => {
    const model = getModel('claude-sonnet-4.6');
    expect(model.id).toBe('claude-sonnet-4.6');
    expect(model.provider).toBe('anthropic');
  });

  it('falls back to default for unknown ID', () => {
    const model = getModel('nonexistent');
    expect(model.id).toBe(DEFAULT_MODEL_ID);
  });

  it('returns correct context window', () => {
    const opus = getModel('claude-opus-4.8');
    expect(opus.contextWindow).toBe(1_000_000);

    const sonnet = getModel('claude-sonnet-4.6');
    expect(sonnet.contextWindow).toBe(1_000_000);
  });
});
