import { MODEL_PROFILES } from '../core/modelProfiles.js';

export function listModels(): string {
  const fmtK = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}M` : `${(n / 1_000).toFixed(0)}K`;

  const header = 'Available Claude models:\n';
  const rows = MODEL_PROFILES.map(m =>
    [
      `  ${m.id.padEnd(22)}`,
      `ctx: ${fmtK(m.contextWindow).padStart(4)}`,
      `out: ${fmtK(m.maxOutput).padStart(3)}`,
      `rot: ${m.rotThreshold} turns`,
    ].join('  ')
  );

  return header + rows.join('\n');
}
