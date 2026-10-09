import { randomUUID } from 'crypto';
import * as vscode from 'vscode';
import {
  ClaudeCodeDaily,
  DayRecord,
  MAX_DAYS_KEPT,
  TelemetryDayPayload,
  addEvent,
  completedDays,
  dayKey,
  prune,
  setClaudeCodeDaily,
} from './telemetry.pure';

const API = 'https://tokalator.ai/api';
const DAYS_KEY = 'tokalator.telemetry.days';
const ID_KEY = 'tokalator.telemetry.installId';
const ASKED_KEY = 'tokalator.telemetry.asked';
export const PRIVACY_URL = 'https://tokalator.ai/privacy#telemetry';

export class Telemetry {
  constructor(
    private readonly state: vscode.Memento,
    private readonly version: string,
  ) {}

  get enabled(): boolean {
    return vscode.env.isTelemetryEnabled
      && vscode.workspace.getConfiguration('tokalator').get<boolean>('telemetry.enabled', false);
  }

  private get days(): Record<string, DayRecord> {
    return this.state.get<Record<string, DayRecord>>(DAYS_KEY) ?? {};
  }

  private installId(): string {
    let id = this.state.get<string>(ID_KEY);
    if (!id) {
      id = randomUUID();
      void this.state.update(ID_KEY, id);
    }
    return id;
  }

  count(event: string): void {
    if (!this.enabled) return;
    void this.state.update(DAYS_KEY, addEvent(this.days, dayKey(new Date()), event));
  }

  recordClaudeCode(cc: ClaudeCodeDaily): void {
    if (!this.enabled) return;
    void this.state.update(DAYS_KEY, setClaudeCodeDaily(this.days, dayKey(new Date()), cc));
  }

  /** Exactly what the next flush would send, for the Show Telemetry Data command. */
  pending(): TelemetryDayPayload[] {
    const days = this.days;
    return Object.keys(days).sort().map(day => ({
      installId: this.installId(),
      day,
      extVersion: this.version,
      vscodeVersion: vscode.version,
      platform: process.platform,
      payload: days[day],
    }));
  }

  async flush(): Promise<void> {
    if (!this.enabled) return;
    const days = this.days;
    const ready = completedDays(days, dayKey(new Date()));
    if (!ready.length) return;
    const body = { schema: 1, days: this.pending().filter(p => ready.includes(p.day)) };
    const res = await fetch(`${API}/telemetry`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      await this.state.update(DAYS_KEY, prune(this.days, Object.keys(this.days).filter(d => !ready.includes(d)).slice(-MAX_DAYS_KEPT)));
    }
  }

  /** Consent withdrawn: stop and drop anything buffered locally. */
  async clearLocal(): Promise<void> {
    await this.state.update(DAYS_KEY, {});
  }

  /** Everything the server holds for this install (GDPR access and portability). */
  async exportData(): Promise<unknown> {
    const id = this.state.get<string>(ID_KEY);
    if (!id) return { installId: null, stored: [] };
    const res = await fetch(`${API}/telemetry?installId=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`server returned ${res.status}`);
    return res.json();
  }

  async answer(question: string, answer: string): Promise<void> {
    if (!this.enabled) return;
    await fetch(`${API}/feedback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ installId: this.installId(), question, answer: answer.slice(0, 500), extVersion: this.version }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => undefined);
  }

  /** Deletes everything stored for this install on the server, then starts over with a new ID. */
  async deleteData(): Promise<boolean> {
    const id = this.state.get<string>(ID_KEY);
    await this.state.update(DAYS_KEY, {});
    await this.state.update(ID_KEY, undefined);
    if (!id) return true;
    const res = await fetch(`${API}/telemetry?installId=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);
    return !!res?.ok;
  }

  async maybeAskConsent(): Promise<void> {
    if (!vscode.env.isTelemetryEnabled || this.enabled || this.state.get<boolean>(ASKED_KEY)) return;
    const choice = await vscode.window.showInformationMessage(
      'Help improve Tokalator? Share anonymous daily usage counts. No code, file names, paths, or prompts are ever sent, and you can turn it off anytime.',
      'Share anonymous usage',
      'No thanks',
      'What is shared?',
    );
    if (choice === 'What is shared?') {
      await vscode.env.openExternal(vscode.Uri.parse(PRIVACY_URL));
      return;
    }
    if (!choice) return;
    await this.state.update(ASKED_KEY, true);
    if (choice === 'Share anonymous usage') {
      await vscode.workspace.getConfiguration('tokalator').update('telemetry.enabled', true, vscode.ConfigurationTarget.Global);
      this.count('consent:granted');
    }
  }
}
