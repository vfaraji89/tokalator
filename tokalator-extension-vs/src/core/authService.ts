import * as vscode from 'vscode';

const API_KEY_SECRET = 'tokalator.apiKey';

export interface AuthState {
  apiKey: string | null;
  teamId: string | null;
  apiEndpoint: string;
  isConfigured: boolean;
}

/**
 * Manages API key (in SecretStorage) and team identity for enterprise features.
 * API key is never logged or exposed to webviews.
 */
export class AuthService implements vscode.Disposable {
  private apiKey: string | null = null;
  private disposables: vscode.Disposable[] = [];

  constructor(private readonly secrets: vscode.SecretStorage) {
    this.disposables.push(
      secrets.onDidChange(e => {
        if (e.key === API_KEY_SECRET) {
          void this.loadKey();
        }
      }),
    );
  }

  async initialize(): Promise<void> {
    await this.loadKey();
  }

  private async loadKey(): Promise<void> {
    this.apiKey = (await this.secrets.get(API_KEY_SECRET)) ?? null;
  }

  getState(): AuthState {
    const cfg = vscode.workspace.getConfiguration('tokalator');
    const teamId = cfg.get<string>('teamId', '') || null;
    const apiEndpoint = cfg.get<string>('apiEndpoint', '');
    return {
      apiKey: this.apiKey,
      teamId,
      apiEndpoint,
      isConfigured: !!(this.apiKey && teamId && apiEndpoint),
    };
  }

  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'tokalator-pro-vscode',
      'X-Tokalator-Machine': vscode.env.machineId,
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    const state = this.getState();
    if (state.teamId) {
      headers['X-Tokalator-Team'] = state.teamId;
    }
    return headers;
  }

  async setApiKey(key: string): Promise<void> {
    await this.secrets.store(API_KEY_SECRET, key);
    this.apiKey = key;
  }

  async clearApiKey(): Promise<void> {
    await this.secrets.delete(API_KEY_SECRET);
    this.apiKey = null;
  }

  dispose(): void {
    this.disposables.forEach(d => d.dispose());
  }
}
