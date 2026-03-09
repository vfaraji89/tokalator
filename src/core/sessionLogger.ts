import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ContextSnapshot } from './types';

/** A single logged event within a session. */
interface SessionEvent {
  timestamp: string;
  type: 'session_start' | 'session_end' | 'snapshot' | 'optimize' | 'command';
  data: Record<string, unknown>;
}

/** Full session log written to disk. */
interface SessionLog {
  sessionId: string;
  startedAt: string;
  endedAt?: string;
  modelId: string;
  events: SessionEvent[];
}

/**
 * Opt-in session logger for controlled experiment data collection.
 * Writes anonymized JSON logs to ~/.tokalator/sessions/.
 * No file contents, no file names — only counts, scores, and timestamps.
 */
export class SessionLogger implements vscode.Disposable {
  private log: SessionLog | null = null;
  private logDir: string;
  private enabled = false;

  constructor() {
    this.logDir = path.join(
      process.env.HOME || process.env.USERPROFILE || '/tmp',
      '.tokalator',
      'sessions'
    );
  }

  /** Check configuration and enable/disable logging. */
  isEnabled(): boolean {
    const config = vscode.workspace.getConfiguration('tokalator');
    return config.get<boolean>('enableSessionLogging', false);
  }

  /** Start a new session log. */
  startSession(modelId: string): void {
    if (!this.isEnabled()) { return; }
    this.enabled = true;

    const sessionId = `session-${Date.now()}`;
    this.log = {
      sessionId,
      startedAt: new Date().toISOString(),
      modelId,
      events: [],
    };

    this.addEvent('session_start', { modelId });
  }

  /** Record a context snapshot (anonymized — no file names or contents). */
  logSnapshot(snapshot: ContextSnapshot): void {
    if (!this.enabled || !this.log) { return; }

    this.addEvent('snapshot', {
      totalEstimatedTokens: snapshot.totalEstimatedTokens,
      windowCapacity: snapshot.windowCapacity,
      usagePercent: snapshot.usagePercent,
      budgetLevel: snapshot.budgetLevel,
      contextHealth: snapshot.contextHealth,
      tabCount: snapshot.tabs.length,
      pinnedCount: snapshot.pinnedFiles.size,
      chatTurnCount: snapshot.chatTurnCount,
      modelId: snapshot.modelId,
      // Per-tab scores only (no names/paths)
      tabScores: snapshot.tabs.map(t => ({
        relevanceScore: t.relevanceScore,
        estimatedTokens: t.estimatedTokens,
        languageId: t.languageId,
        isActive: t.isActive,
        isPinned: t.isPinned,
        diagnosticCount: t.diagnosticCount,
      })),
      budgetBreakdown: snapshot.budgetBreakdown,
    });
  }

  /** Record an /optimize command execution. */
  logOptimize(tabsBefore: number, tokensBefore: number, tabsClosed: number): void {
    if (!this.enabled || !this.log) { return; }

    this.addEvent('optimize', {
      tabsBefore,
      tokensBefore,
      tabsClosed,
    });
  }

  /** Record any chat command invocation. */
  logCommand(command: string): void {
    if (!this.enabled || !this.log) { return; }

    this.addEvent('command', { command });
  }

  /** End the session and write the log to disk. */
  endSession(finalSnapshot?: ContextSnapshot): void {
    if (!this.enabled || !this.log) { return; }

    if (finalSnapshot) {
      this.logSnapshot(finalSnapshot);
    }

    this.log.endedAt = new Date().toISOString();
    this.addEvent('session_end', {});

    this.writeToDisk();
    this.log = null;
    this.enabled = false;
  }

  private addEvent(type: SessionEvent['type'], data: Record<string, unknown>): void {
    if (!this.log) { return; }
    this.log.events.push({
      timestamp: new Date().toISOString(),
      type,
      data,
    });
  }

  private writeToDisk(): void {
    if (!this.log) { return; }
    try {
      fs.mkdirSync(this.logDir, { recursive: true });
      const filePath = path.join(this.logDir, `${this.log.sessionId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(this.log, null, 2), 'utf-8');
    } catch {
      // Silently fail — logging should never break the extension
    }
  }

  dispose(): void {
    if (this.enabled && this.log) {
      this.endSession();
    }
  }
}
