/**
 * Opt-in telemetry payloads: daily counters and aggregates only.
 * Event names are restricted so paths, file names, or prompts cannot slip in.
 */

export interface ClaudeCodeDaily {
  turns: number;
  requests: number;
  sessions: number;
  cacheHitRate: number;
  clients: Record<string, number>;
}

export interface DayRecord {
  events: Record<string, number>;
  claudeCode?: ClaudeCodeDaily;
}

export interface TelemetryDayPayload {
  installId: string;
  day: string;
  extVersion: string;
  vscodeVersion: string;
  platform: string;
  payload: DayRecord;
}

const EVENT = /^[a-z0-9][a-z0-9:._-]{0,59}$/;
const MAX_EVENTS_PER_DAY = 200;
export const MAX_DAYS_KEPT = 14;

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isValidEvent(name: string): boolean {
  return EVENT.test(name);
}

export function addEvent(days: Record<string, DayRecord>, day: string, name: string): Record<string, DayRecord> {
  if (!isValidEvent(name)) return days;
  const record = days[day] ?? { events: {} };
  if (!(name in record.events) && Object.keys(record.events).length >= MAX_EVENTS_PER_DAY) return days;
  return { ...days, [day]: { ...record, events: { ...record.events, [name]: (record.events[name] ?? 0) + 1 } } };
}

export function setClaudeCodeDaily(days: Record<string, DayRecord>, day: string, cc: ClaudeCodeDaily): Record<string, DayRecord> {
  const clients = Object.fromEntries(Object.entries(cc.clients).filter(([k]) => /^[A-Za-z ]{1,30}$/.test(k)));
  const record = days[day] ?? { events: {} };
  return { ...days, [day]: { ...record, claudeCode: { ...cc, cacheHitRate: Math.round(cc.cacheHitRate * 100) / 100, clients } } };
}

/** Completed days ready to send, oldest first; today keeps accumulating. */
export function completedDays(days: Record<string, DayRecord>, today: string): string[] {
  return Object.keys(days).filter(d => d < today).sort().slice(-MAX_DAYS_KEPT);
}

export function prune(days: Record<string, DayRecord>, keep: string[]): Record<string, DayRecord> {
  return Object.fromEntries(Object.entries(days).filter(([d]) => keep.includes(d)));
}
