import * as https from 'https';
import * as http from 'http';
import * as url from 'url';
import { AuthService } from './authService';

export interface TeamSummary {
  teamId: string;
  teamName: string;
  totalSessions: number;
  totalTurns: number;
  avgTokensPerTurn: number;
  avgCostPerSession: number;
  modelDistribution: Record<string, number>;
  activeDevelopers: number;
  topCommands: Array<{ command: string; count: number }>;
  periodStart: string;
  periodEnd: string;
}

export interface SkillEntry {
  id: string;
  name: string;
  description: string;
  content: string;
  teamId: string;
  author: string;
  downloads: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * HTTP client for Tokalator Pro enterprise backend.
 * All requests are authenticated via AuthService headers.
 * Telemetry payloads contain no file names or contents.
 */
export class TelemetrySync {
  constructor(private readonly auth: AuthService) {}

  /** Expose auth headers for direct fetch calls (e.g. audit). */
  getHeaders(): Record<string, string> {
    return this.auth.getHeaders();
  }

  /** Expose the configured API endpoint. */
  getEndpoint(): string {
    return this.auth.getState().apiEndpoint;
  }

  /** POST a completed session log to the backend. */
  async pushSession(sessionLog: Record<string, unknown>): Promise<boolean> {
    const state = this.auth.getState();
    if (!state.isConfigured) return false;

    try {
      await this.post(`${state.apiEndpoint}/api/v1/telemetry/sessions`, sessionLog);
      return true;
    } catch {
      return false;
    }
  }

  /** GET aggregated team metrics. */
  async fetchTeamSummary(period: '7d' | '30d' | '90d' = '30d'): Promise<TeamSummary | null> {
    const state = this.auth.getState();
    if (!state.isConfigured) return null;

    try {
      return await this.get(`${state.apiEndpoint}/api/v1/telemetry/summary?period=${period}`) as TeamSummary;
    } catch {
      return null;
    }
  }

  /** POST a SKILL.md to the shared catalog. */
  async publishSkill(skill: { name: string; description: string; content: string }): Promise<SkillEntry | null> {
    const state = this.auth.getState();
    if (!state.isConfigured) return null;

    try {
      return await this.post(`${state.apiEndpoint}/api/v1/skills`, skill) as SkillEntry;
    } catch {
      return null;
    }
  }

  /** GET shared skills catalog. */
  async listSkills(query?: string): Promise<SkillEntry[]> {
    const state = this.auth.getState();
    if (!state.isConfigured) return [];

    try {
      const qs = query ? `?q=${encodeURIComponent(query)}` : '';
      const result = await this.get(`${state.apiEndpoint}/api/v1/skills${qs}`);
      return (result as { skills: SkillEntry[] }).skills ?? [];
    } catch {
      return [];
    }
  }

  /** GET a single skill by ID. */
  async fetchSkill(id: string): Promise<SkillEntry | null> {
    const state = this.auth.getState();
    if (!state.isConfigured) return null;

    try {
      return await this.get(`${state.apiEndpoint}/api/v1/skills/${encodeURIComponent(id)}`) as SkillEntry;
    } catch {
      return null;
    }
  }

  /** Verify the API key is valid. */
  async verifyAuth(): Promise<{ valid: boolean; teamName?: string }> {
    const state = this.auth.getState();
    if (!state.isConfigured) return { valid: false };

    try {
      const result = await this.post(`${state.apiEndpoint}/api/v1/auth/verify`, {}) as { valid: boolean; teamName?: string };
      return result;
    } catch {
      return { valid: false };
    }
  }

  // ── HTTP helpers ──

  private post(endpoint: string, body: unknown): Promise<unknown> {
    return this.request('POST', endpoint, body);
  }

  private get(endpoint: string): Promise<unknown> {
    return this.request('GET', endpoint);
  }

  private request(method: string, endpoint: string, body?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const parsed = new url.URL(endpoint);
      const isHttps = parsed.protocol === 'https:';
      const transport = isHttps ? https : http;
      const headers = this.auth.getHeaders();
      const payload = body ? JSON.stringify(body) : undefined;
      if (payload) {
        headers['Content-Length'] = Buffer.byteLength(payload).toString();
      }

      const opts = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method,
        headers,
        timeout: 10_000,
      };

      const req = transport.request(opts, res => {
        if (!res.statusCode || res.statusCode >= 400) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          try {
            const text = Buffer.concat(chunks).toString('utf8');
            resolve(text ? JSON.parse(text) : {});
          } catch (err) {
            reject(err);
          }
        });
        res.on('error', reject);
      });

      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  }
}
