/**
 * Codegen: reads models.json → writes modelProfiles.ts + updates package.json enum.
 *
 * Usage:
 *   npm run generate-models
 *
 * When a model is deprecated or a new one is released:
 *   1. Edit models.json
 *   2. Run: npm run generate-models
 *   3. Commit both files
 */

import * as fs from 'fs';
import * as path from 'path';

type PriceSource = 'verified' | 'pending' | 'stale';

interface ModelEntry {
  id: string;
  label: string;
  provider: 'anthropic' | 'openai' | 'google' | 'other';
  contextWindow: number;
  maxOutput: number;
  rotThreshold: number;
  inputCostPerMTok: number;
  outputCostPerMTok: number;
  cachedInputCostPerMTok?: number;
  priceSource?: PriceSource;
  verifiedAt?: string;
}

interface ModelsConfig {
  schemaVersion?: number;
  updatedAt?: string;
  source?: string;
  defaultModelId: string;
  models: ModelEntry[];
}

const root = path.join(__dirname, '..');
const modelsJsonPath = path.join(root, 'models.json');
const profilesTsPath = path.join(root, 'src', 'core', 'modelProfiles.ts');
const packageJsonPath = path.join(root, 'package.json');

// ─── Load source of truth ────────────────────────────────────────────────────

const config: ModelsConfig = JSON.parse(fs.readFileSync(modelsJsonPath, 'utf8'));
const { models, defaultModelId } = config;

if (!models.find(m => m.id === defaultModelId)) {
  console.error(`defaultModelId "${defaultModelId}" not found in models array`);
  process.exit(1);
}

// Validate every model has required cost fields
for (const m of models) {
  if (typeof m.inputCostPerMTok !== 'number' || typeof m.outputCostPerMTok !== 'number') {
    console.error(`Model "${m.id}" is missing inputCostPerMTok or outputCostPerMTok`);
    process.exit(1);
  }
}

// ─── Generate modelProfiles.ts ───────────────────────────────────────────────

function quote(s: string, width: number): string {
  return `'${s}'`.padEnd(width + 2);
}

const longestId    = Math.max(...models.map(m => m.id.length));
const longestLabel = Math.max(...models.map(m => m.label.length));

const byProvider = models.reduce<Record<string, ModelEntry[]>>((acc, m) => {
  (acc[m.provider] ??= []).push(m);
  return acc;
}, {});

const providerOrder = ['anthropic', 'openai', 'google', 'other'];
const providerNames: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  other: 'Other',
};

function fmtPrice(n: number): string {
  return n.toFixed(n < 1 ? 3 : 2);
}

let profileLines = '';
for (const provider of providerOrder) {
  const group = byProvider[provider];
  if (!group?.length) continue;

  profileLines += `\n  // ${providerNames[provider]}\n`;
  for (const m of group) {
    const id    = quote(m.id, longestId);
    const label = quote(m.label, longestLabel);
    const prov  = `'${m.provider}'`.padEnd(13);
    const cw    = String(m.contextWindow).padStart(7);
    const mo    = String(m.maxOutput).padStart(6);
    const rot   = String(m.rotThreshold).padStart(2);
    const inC   = fmtPrice(m.inputCostPerMTok).padStart(6);
    const outC  = fmtPrice(m.outputCostPerMTok).padStart(6);
    const ps    = m.priceSource ?? 'verified';
    const va    = m.verifiedAt ?? '';
    profileLines += `  { id: ${id}, label: ${label}, provider: ${prov}, contextWindow: ${cw}, maxOutput: ${mo}, rotThreshold: ${rot}, inputCostPerMTok: ${inC}, outputCostPerMTok: ${outC}, priceSource: '${ps}', verifiedAt: '${va}' },\n`;
  }
}

const schemaVersion = config.schemaVersion ?? 1;
const updatedAt = config.updatedAt ?? new Date().toISOString();

const tsContent = `/**
 * Known AI model profiles with context window, pricing, and metadata.
 * DO NOT EDIT BY HAND — generated from models.json.
 * Run: npm run generate-models
 */

export type PriceSource = 'verified' | 'pending' | 'stale';

export interface ModelProfile {
  id: string;
  label: string;
  provider: 'anthropic' | 'openai' | 'google' | 'other';
  contextWindow: number;
  maxOutput: number;
  rotThreshold: number;
  inputCostPerMTok: number;
  outputCostPerMTok: number;
  cachedInputCostPerMTok?: number;
  priceSource: PriceSource;
  verifiedAt: string;
}

export const BUNDLED_SCHEMA_VERSION = ${schemaVersion};
export const BUNDLED_UPDATED_AT = '${updatedAt}';

export const MODEL_PROFILES: ModelProfile[] = [${profileLines}];

export const DEFAULT_MODEL_ID = '${defaultModelId}';

/**
 * Find a model by partial ID or label match.
 * Priority: exact id → exact label → startsWith → contains.
 */
export function findModel(
  query: string,
  catalog: ModelProfile[] = MODEL_PROFILES,
): ModelProfile | undefined {
  const q = query.toLowerCase().replace(/[^a-z0-9.]/g, '');
  if (!q) return undefined;

  const exact = catalog.find(m =>
    m.id.toLowerCase().replace(/[^a-z0-9.]/g, '') === q
  );
  if (exact) return exact;

  const labelExact = catalog.find(m =>
    m.label.toLowerCase().replace(/[^a-z0-9.]/g, '') === q
  );
  if (labelExact) return labelExact;

  const startsWith = catalog.find(m => {
    const mid = m.id.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const mlabel = m.label.toLowerCase().replace(/[^a-z0-9.]/g, '');
    return mid.startsWith(q) || mlabel.startsWith(q);
  });
  if (startsWith) return startsWith;

  return catalog.find(m => {
    const mid = m.id.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const mlabel = m.label.toLowerCase().replace(/[^a-z0-9.]/g, '');
    return mid.includes(q) || mlabel.includes(q) || q.includes(mid);
  });
}

/**
 * Get a model profile by exact ID, falling back to default.
 */
export function getModel(
  id: string,
  catalog: ModelProfile[] = MODEL_PROFILES,
): ModelProfile {
  return catalog.find(m => m.id === id)
    || catalog.find(m => m.id === DEFAULT_MODEL_ID)
    || MODEL_PROFILES.find(m => m.id === DEFAULT_MODEL_ID)!;
}
`;

fs.writeFileSync(profilesTsPath, tsContent, 'utf8');
console.log(`Wrote ${path.relative(root, profilesTsPath)} (${models.length} models)`);

// ─── Update package.json enum ────────────────────────────────────────────────

function fmtWindowShort(n: number): string {
  if (n >= 900000) return `${Math.round(n / 100000) / 10}M`;
  if (n >= 1000)   return `${Math.round(n / 1000)}K`;
  return `${n}`;
}

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const modelConfig = pkg.contributes?.configuration?.properties?.['tokalator.model'];
if (!modelConfig) {
  console.error('Could not find tokalator.model in package.json contributes.configuration');
  process.exit(1);
}

modelConfig.default         = defaultModelId;
modelConfig.enum            = models.map(m => m.id);
modelConfig.enumDescriptions = models.map(m =>
  `${m.label} — ${fmtWindowShort(m.contextWindow)} tokens — $${fmtPrice(m.inputCostPerMTok)}/$${fmtPrice(m.outputCostPerMTok)} per MTok`
);

fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`Updated package.json enum (${models.length} entries)`);

// ─── Summary ─────────────────────────────────────────────────────────────────

const byProv = models.reduce<Record<string, number>>((acc, m) => {
  acc[m.provider] = (acc[m.provider] ?? 0) + 1;
  return acc;
}, {});

console.log(`\nModel breakdown:`);
for (const [prov, count] of Object.entries(byProv)) {
  console.log(`  ${providerNames[prov] ?? prov}: ${count}`);
}
console.log(`  Total: ${models.length}`);
