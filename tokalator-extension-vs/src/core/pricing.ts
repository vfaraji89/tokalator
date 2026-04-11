import type { ModelProfile } from './modelProfiles';

export interface CostBreakdown {
  modelId: string;
  label: string;
  provider: ModelProfile['provider'];
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  inputCostPerMTok: number;
  outputCostPerMTok: number;
}

export function costForModel(
  p: ModelProfile,
  inputTokens: number,
  outputTokens: number,
): CostBreakdown {
  const inputCost = (inputTokens / 1_000_000) * p.inputCostPerMTok;
  const outputCost = (outputTokens / 1_000_000) * p.outputCostPerMTok;
  return {
    modelId: p.id,
    label: p.label,
    provider: p.provider,
    inputTokens,
    outputTokens,
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    inputCostPerMTok: p.inputCostPerMTok,
    outputCostPerMTok: p.outputCostPerMTok,
  };
}

export function compareAcrossModels(
  profiles: ModelProfile[],
  inputTokens: number,
  outputTokensFor: (p: ModelProfile) => number,
): CostBreakdown[] {
  return profiles
    .map(p => costForModel(p, inputTokens, outputTokensFor(p)))
    .sort((a, b) => a.totalCost - b.totalCost);
}

export function defaultOutputFor(p: ModelProfile): number {
  return Math.floor(p.maxOutput * 0.25);
}
