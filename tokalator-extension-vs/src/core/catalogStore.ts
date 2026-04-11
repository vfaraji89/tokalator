import * as vscode from 'vscode';
import {
  ModelProfile,
  MODEL_PROFILES,
  DEFAULT_MODEL_ID,
  BUNDLED_UPDATED_AT,
  findModel as findInList,
  getModel as getFromList,
} from './modelProfiles';

export interface CatalogMeta {
  updatedAt: string;
  source: 'bundled' | 'remote';
  lastSyncAt: string | null;
  lastFetchError: string | null;
}

let activeCatalog: ModelProfile[] = MODEL_PROFILES;
let meta: CatalogMeta = {
  updatedAt: BUNDLED_UPDATED_AT,
  source: 'bundled',
  lastSyncAt: null,
  lastFetchError: null,
};

const emitter = new vscode.EventEmitter<CatalogMeta>();
export const onDidChangeCatalog = emitter.event;

export function getActiveCatalog(): ModelProfile[] {
  return activeCatalog;
}

export function getCatalogMeta(): CatalogMeta {
  return { ...meta };
}

export function getModel(id: string): ModelProfile {
  return getFromList(id, activeCatalog);
}

export function findModel(query: string): ModelProfile | undefined {
  return findInList(query, activeCatalog);
}

export { DEFAULT_MODEL_ID };

/**
 * Merge a remote payload onto the bundled catalog.
 * Bundled profiles are the baseline; remote entries override matching ids
 * and can introduce new ids. Unknown ids from remote are added with required
 * fields filled from the remote payload itself.
 */
export function applyRemotePayload(payload: RemoteCatalogPayload): void {
  const byId = new Map<string, ModelProfile>();
  for (const m of MODEL_PROFILES) {
    byId.set(m.id, m);
  }

  for (const r of payload.models) {
    const base = byId.get(r.id);
    const merged: ModelProfile = {
      id: r.id,
      label: r.label ?? base?.label ?? r.id,
      provider: r.provider ?? base?.provider ?? 'other',
      contextWindow: r.contextWindow ?? base?.contextWindow ?? 200000,
      maxOutput: r.maxOutput ?? base?.maxOutput ?? 4096,
      rotThreshold: r.rotThreshold ?? base?.rotThreshold ?? 20,
      inputCostPerMTok: r.inputCostPerMTok ?? base?.inputCostPerMTok ?? 0,
      outputCostPerMTok: r.outputCostPerMTok ?? base?.outputCostPerMTok ?? 0,
      cachedInputCostPerMTok: r.cachedInputCostPerMTok ?? base?.cachedInputCostPerMTok,
      priceSource: r.priceSource ?? base?.priceSource ?? 'verified',
      verifiedAt: r.verifiedAt ?? base?.verifiedAt ?? payload.updatedAt,
    };
    byId.set(r.id, merged);
  }

  activeCatalog = Array.from(byId.values());
  meta = {
    updatedAt: payload.updatedAt,
    source: 'remote',
    lastSyncAt: new Date().toISOString(),
    lastFetchError: null,
  };
  emitter.fire(meta);
}

export function recordFetchError(error: string): void {
  meta = {
    ...meta,
    lastSyncAt: new Date().toISOString(),
    lastFetchError: error,
  };
  emitter.fire(meta);
}

export function resetToBundled(): void {
  activeCatalog = MODEL_PROFILES;
  meta = {
    updatedAt: BUNDLED_UPDATED_AT,
    source: 'bundled',
    lastSyncAt: null,
    lastFetchError: null,
  };
  emitter.fire(meta);
}

export interface RemoteCatalogPayload {
  schemaVersion: number;
  updatedAt: string;
  source?: string;
  defaultModelId?: string;
  models: RemoteModelEntry[];
}

export interface RemoteModelEntry {
  id: string;
  label?: string;
  provider?: ModelProfile['provider'];
  contextWindow?: number;
  maxOutput?: number;
  rotThreshold?: number;
  inputCostPerMTok?: number;
  outputCostPerMTok?: number;
  cachedInputCostPerMTok?: number;
  priceSource?: ModelProfile['priceSource'];
  verifiedAt?: string;
}
