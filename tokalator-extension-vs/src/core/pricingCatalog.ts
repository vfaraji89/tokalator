import * as https from 'https';
import * as vscode from 'vscode';
import {
  applyRemotePayload,
  recordFetchError,
  RemoteCatalogPayload,
} from './catalogStore';

const CATALOG_URL = 'https://raw.githubusercontent.com/vfaraji89/tokalator/main/tokalator-extension-vs/models.json';
const CACHE_KEY = 'tokalator.pricingCatalog.v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5000;

interface CacheEntry {
  fetchedAt: number;
  etag: string | null;
  payload: RemoteCatalogPayload;
}

/**
 * Load the pricing catalog. Applies cached payload instantly, then refreshes
 * in the background if the cache is stale or force=true.
 */
export async function loadPricingCatalog(
  context: vscode.ExtensionContext,
  force = false,
): Promise<void> {
  const cached = context.globalState.get<CacheEntry>(CACHE_KEY);
  if (cached?.payload) {
    applyRemotePayload(cached.payload);
  }

  const fresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;
  if (fresh && !force) {
    return;
  }

  try {
    const result = await fetchCatalog(cached?.etag ?? null);
    if (result === 'not-modified') {
      // Cache is still valid on the server; just bump fetchedAt
      if (cached) {
        await context.globalState.update(CACHE_KEY, {
          ...cached,
          fetchedAt: Date.now(),
        });
      }
      return;
    }

    if (!validatePayload(result.payload)) {
      throw new Error('invalid payload shape');
    }

    await context.globalState.update(CACHE_KEY, {
      fetchedAt: Date.now(),
      etag: result.etag,
      payload: result.payload,
    } satisfies CacheEntry);
    applyRemotePayload(result.payload);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    recordFetchError(msg);
  }
}

export async function refreshPricingCatalog(
  context: vscode.ExtensionContext,
): Promise<void> {
  await loadPricingCatalog(context, true);
}

// ── Internals ───────────────────────────────────────────────────────────────

type FetchResult =
  | { payload: RemoteCatalogPayload; etag: string | null }
  | 'not-modified';

function fetchCatalog(etag: string | null): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      'User-Agent': 'tokalator-vscode',
      'Accept': 'application/json',
    };
    if (etag) headers['If-None-Match'] = etag;

    const req = https.get(CATALOG_URL, { headers, timeout: FETCH_TIMEOUT_MS }, res => {
      if (res.statusCode === 304) {
        res.resume();
        resolve('not-modified');
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const text = Buffer.concat(chunks).toString('utf8');
          const payload = JSON.parse(text) as RemoteCatalogPayload;
          resolve({
            payload,
            etag: (res.headers.etag as string) ?? null,
          });
        } catch (err) {
          reject(err);
        }
      });
      res.on('error', reject);
    });

    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
    req.on('error', reject);
  });
}

function validatePayload(p: unknown): p is RemoteCatalogPayload {
  if (!p || typeof p !== 'object') return false;
  const obj = p as Record<string, unknown>;
  if (typeof obj.schemaVersion !== 'number') return false;
  if (typeof obj.updatedAt !== 'string') return false;
  if (!Array.isArray(obj.models)) return false;
  return obj.models.every(m =>
    m && typeof m === 'object' && typeof (m as Record<string, unknown>).id === 'string'
  );
}
