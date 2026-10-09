import catalog from '../tokalator-extension-vs/models.json';

export type Provider = 'anthropic' | 'openai' | 'google';

export interface LongContext {
  threshold: number;
  inputMultiplier: number;
  outputMultiplier: number;
}

export interface CatalogModel {
  id: string;
  label: string;
  provider: Provider;
  contextWindow: number;
  maxOutput: number;
  rotThreshold: number;
  inputCostPerMTok: number;
  outputCostPerMTok: number;
  cachedInputCostPerMTok: number;
  cacheWriteCostPerMTok?: number;
  longContext?: LongContext;
  verifiedAt: string;
  featured?: boolean;
  notes?: string;
}

export const CATALOG_MODELS = catalog.models as CatalogModel[];
export const DEFAULT_MODEL_ID = catalog.defaultModelId;
export const CATALOG_UPDATED_AT = catalog.updatedAt.slice(0, 10);

export const PRICING_SOURCES: Record<Provider, string> = {
  anthropic: 'https://platform.claude.com/docs/en/about-claude/pricing',
  openai: 'https://developers.openai.com/api/docs/pricing',
  google: 'https://ai.google.dev/gemini-api/docs/pricing',
};

export function catalogModel(id: string): CatalogModel | undefined {
  return CATALOG_MODELS.find(m => m.id === id);
}
