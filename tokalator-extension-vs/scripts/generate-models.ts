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

interface ModelEntry {
  id: string;
  label: string;
  provider: 'anthropic' | 'openai' | 'google' | 'other';
  contextWindow: number;
  maxOutput: number;
  rotThreshold: number;
}

interface ModelsConfig {
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
  console.error(`❌  defaultModelId "${defaultModelId}" not found in models array`);
  process.exit(1);
}

// ─── Generate modelProfiles.ts ───────────────────────────────────────────────

function padId(s: string, width = 24): string {
  return `'${s}'`.padEnd(width + 2);
}

function padLabel(s: string, width = 24): string {
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

let profileLines = '';
for (const provider of providerOrder) {
  const group = byProvider[provider];
  if (!group?.length) continue;

  profileLines += `\n  // ${providerNames[provider]}\n`;
  for (const m of group) {
    const id    = padId(m.id, longestId);
    const label = padLabel(m.label, longestLabel);
    const prov  = `'${m.provider}'`.padEnd(13);
    const cw    = String(m.contextWindow).padStart(7);
    const mo    = String(m.maxOutput).padStart(6);
    profileLines += `  { id: ${id}, label: ${label}, provider: ${prov}, contextWindow: ${cw}, maxOutput: ${mo}, rotThreshold: ${m.rotThreshold} },\n`;
  }
}

const tsContent = `/**
 * Known AI model profiles with context window sizes and metadata.
 * Used to auto-detect the active model and set the correct budget.
 *
 * ⚠️  DO NOT EDIT BY HAND — generated from models.json
 *     Run: npm run generate-models
 */

export interface ModelProfile {
  id: string;
  label: string;
  provider: 'anthropic' | 'openai' | 'google' | 'other';
  contextWindow: number;   // tokens
  maxOutput: number;        // max output tokens
  rotThreshold: number;     // chat turns before context rot risk
}

/**
 * Built-in model profiles.
 * Context windows and rot thresholds based on published benchmarks.
 */
export const MODEL_PROFILES: ModelProfile[] = [${profileLines}];

/** Default model when nothing is detected */
export const DEFAULT_MODEL_ID = '${defaultModelId}';

/**
 * Try to find a matching model profile by partial ID or label match.
 * Priority: exact id → exact label → startsWith → contains.
 */
export function findModel(query: string): ModelProfile | undefined {
  const q = query.toLowerCase().replace(/[^a-z0-9.]/g, '');
  if (!q) return undefined;

  // 1. Exact match on normalized id
  const exact = MODEL_PROFILES.find(m =>
    m.id.toLowerCase().replace(/[^a-z0-9.]/g, '') === q
  );
  if (exact) return exact;

  // 2. Exact match on normalized label
  const labelExact = MODEL_PROFILES.find(m =>
    m.label.toLowerCase().replace(/[^a-z0-9.]/g, '') === q
  );
  if (labelExact) return labelExact;

  // 3. Starts-with on id or label
  const startsWith = MODEL_PROFILES.find(m => {
    const mid = m.id.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const mlabel = m.label.toLowerCase().replace(/[^a-z0-9.]/g, '');
    return mid.startsWith(q) || mlabel.startsWith(q);
  });
  if (startsWith) return startsWith;

  // 4. Contains match (fallback)
  return MODEL_PROFILES.find(m => {
    const mid = m.id.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const mlabel = m.label.toLowerCase().replace(/[^a-z0-9.]/g, '');
    return mid.includes(q) || mlabel.includes(q) || q.includes(mid);
  });
}

/**
 * Get a model profile by exact ID, falling back to default.
 */
export function getModel(id: string): ModelProfile {
  return MODEL_PROFILES.find(m => m.id === id)
    || MODEL_PROFILES.find(m => m.id === DEFAULT_MODEL_ID)!;
}
`;

fs.writeFileSync(profilesTsPath, tsContent, 'utf8');
console.log(`✅  Wrote ${path.relative(root, profilesTsPath)} (${models.length} models)`);

// ─── Update package.json enum ─────────────────────────────────────────────────

function fmtWindowShort(n: number): string {
  if (n >= 900000) return `${Math.round(n / 100000) / 10}M`;
  if (n >= 1000)   return `${Math.round(n / 1000)}K`;
  return `${n}`;
}

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const modelConfig = pkg.contributes?.configuration?.properties?.['tokalator.model'];
if (!modelConfig) {
  console.error('❌  Could not find tokalator.model in package.json contributes.configuration');
  process.exit(1);
}

modelConfig.default         = defaultModelId;
modelConfig.enum            = models.map(m => m.id);
modelConfig.enumDescriptions = models.map(m =>
  `${m.label} — ${fmtWindowShort(m.contextWindow)} tokens`
);

fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`✅  Updated package.json enum (${models.length} entries)`);

// ─── Summary ──────────────────────────────────────────────────────────────────

const byProv = models.reduce<Record<string, number>>((acc, m) => {
  acc[m.provider] = (acc[m.provider] ?? 0) + 1;
  return acc;
}, {});

console.log(`\nModel breakdown:`);
for (const [prov, count] of Object.entries(byProv)) {
  console.log(`  ${providerNames[prov] ?? prov}: ${count}`);
}
console.log(`  Total: ${models.length}`);
