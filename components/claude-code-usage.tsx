"use client";

import { useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATALOG_MODELS } from "@/lib/models";
import { formatCost, formatTokens } from "@/lib/pricing";
import {
  ClaudeCodeUsageCollector,
  type ClaudeCodeTurn,
  type ClaudeCodeUsageRecord,
  type UsageRates,
  cacheHitRate,
  entrypointLabel,
  groupUsage,
  localDay,
  modelKey,
  projectName,
  summarizeUsage,
} from "@/tokalator-extension-vs/src/core/claudeCodeUsage.pure";
import styles from "./claude-code-usage.module.css";

type Range = "all" | "30" | "7";

const RATES = new Map(CATALOG_MODELS.map(m => [modelKey(m.id), m] as const));
const ratesFor = (model: string): UsageRates | undefined => RATES.get(modelKey(model));
const labelFor = (model: string) => RATES.get(modelKey(model))?.label ?? model;

async function readLines(file: File, collector: ClaudeCodeUsageCollector) {
  const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader();
  let partial = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const lines = (partial + value).split("\n");
    partial = lines.pop() ?? "";
    for (const line of lines) collector.addLine(line);
  }
  collector.addLine(partial);
}

async function filesFromEntry(entry: FileSystemEntry, out: File[]): Promise<void> {
  if (entry.isFile) {
    if (entry.name.endsWith(".jsonl")) out.push(await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej)));
    return;
  }
  const reader = (entry as FileSystemDirectoryEntry).createReader();
  for (;;) {
    const batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
    if (!batch.length) break;
    for (const child of batch) await filesFromEntry(child, out);
  }
}

export function ClaudeCodeUsage() {
  const [records, setRecords] = useState<ClaudeCodeUsageRecord[]>([]);
  const [turns, setTurns] = useState<ClaudeCodeTurn[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [range, setRange] = useState<Range>("all");
  const [loadedAt, setLoadedAt] = useState(0);
  const folderInput = useRef<HTMLInputElement>(null);

  async function load(files: File[]) {
    const logs = files.filter(f => f.name.endsWith(".jsonl"));
    setError("");
    if (!logs.length) {
      setError("No .jsonl files found. Choose your ~/.claude/projects folder or a project folder inside it.");
      return;
    }
    const collector = new ClaudeCodeUsageCollector();
    setProgress({ done: 0, total: logs.length });
    try {
      for (let i = 0; i < logs.length; i++) {
        await readLines(logs[i], collector);
        setProgress({ done: i + 1, total: logs.length });
      }
      setRecords(collector.records);
      setTurns(collector.turns);
      setLoadedAt(Date.now());
    } catch (e) {
      setError(`Could not read the logs: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setProgress(null);
    }
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const files: File[] = [];
    for (const item of Array.from(e.dataTransfer.items)) {
      const entry = item.webkitGetAsEntry?.();
      if (entry) await filesFromEntry(entry, files);
    }
    await load(files);
  }

  const view = useMemo(() => {
    const cutoff = range === "all" ? 0 : loadedAt - Number(range) * 86_400_000;
    const inRange = records.filter(r => Date.parse(r.timestamp) >= cutoff);
    const turnsInRange = turns.filter(t => Date.parse(t.timestamp) >= cutoff);
    const cwdBySession = new Map(records.map(r => [r.sessionId, r.cwd]));
    const turnsByProject = new Map<string, number>();
    for (const t of turnsInRange) {
      const project = projectName(cwdBySession.get(t.sessionId) ?? "");
      turnsByProject.set(project, (turnsByProject.get(project) ?? 0) + 1);
    }
    const totals = summarizeUsage(inRange, ratesFor);
    const days = groupUsage(inRange, r => localDay(r.timestamp), ratesFor)
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-60)
      .map(d => ({ day: d.key.slice(5), cost: Number(d.totals.cost.toFixed(4)) }));
    return {
      totals,
      turns: turnsInRange.length,
      hit: cacheHitRate(totals),
      days,
      byModel: groupUsage(inRange, r => r.model, ratesFor),
      byProject: groupUsage(inRange, r => projectName(r.cwd), ratesFor),
      bySource: groupUsage(inRange, r => entrypointLabel(r.entrypoint), ratesFor),
      turnsByProject,
    };
  }, [records, turns, range, loadedAt]);

  const loaded = records.length > 0;

  return (
    <div>
      <div
        className={`${styles.drop} ${dragging ? styles.dropActive : ""}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <p><strong>Drop your Claude Code logs here</strong></p>
        <div className={styles.actions}>
          <button type="button" className={`${styles.button} ${styles.primary}`} onClick={() => folderInput.current?.click()}>
            Choose folder
          </button>
          <label className={styles.button}>
            Choose .jsonl files
            <input
              type="file"
              accept=".jsonl"
              multiple
              hidden
              onChange={e => { void load(Array.from(e.target.files ?? [])); e.target.value = ""; }}
            />
          </label>
          {loaded && (
            <button type="button" className={styles.button} onClick={() => { setRecords([]); setTurns([]); }}>
              Clear
            </button>
          )}
        </div>
        <input
          ref={folderInput}
          type="file"
          hidden
          multiple
          {...{ webkitdirectory: "" }}
          onChange={e => { void load(Array.from(e.target.files ?? [])); e.target.value = ""; }}
        />
        <p className={styles.hint}>
          Logs from both the Claude Code CLI and the VS Code extension live in <code>~/.claude/projects</code> (Windows: <code>%USERPROFILE%\.claude\projects</code>). On macOS press Cmd+Shift+. in the picker to show hidden folders.
        </p>
        <p className={styles.hint}>Files are read in your browser. Nothing is uploaded.</p>
        {progress && (
          <div className={styles.progress} role="progressbar" aria-valuenow={progress.done} aria-valuemax={progress.total} aria-label="Reading logs">
            <div className={styles.progressFill} style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>

      {loaded && (
        <>
          <div className={styles.toolbar}>
            <h2 className="section-header" style={{ margin: 0 }}>Claude Code usage</h2>
            <label className={styles.hint}>
              Range{" "}
              <select className={styles.select} value={range} onChange={e => setRange(e.target.value as Range)}>
                <option value="all">All time</option>
                <option value="30">Last 30 days</option>
                <option value="7">Last 7 days</option>
              </select>
            </label>
          </div>

          <div className={styles.stats}>
            <Stat label="API-equivalent cost" value={formatCost(view.totals.cost)} sub="not your subscription bill" />
            <Stat label="Turns" value={view.turns.toLocaleString("en-US")} sub={`${view.totals.sessions} sessions`} />
            <Stat label="Requests" value={view.totals.messages.toLocaleString("en-US")} sub="API calls incl. subagents" />
            <Stat label="Cache hit" value={`${Math.round(view.hit * 100)}%`} sub={`${formatTokens(view.totals.cacheReadTokens)} read`} />
            <Stat label="Output" value={formatTokens(view.totals.outputTokens)} sub={`${formatTokens(view.totals.inputTokens)} uncached input`} />
          </div>

          {view.days.length > 1 && (
            <div className={styles.chart}>
              <ResponsiveContainer>
                <BarChart data={view.days} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} stroke="var(--border)" />
                  <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 11 }} stroke="var(--border)" tickFormatter={v => `$${v}`} width={48} />
                  <Tooltip
                    formatter={v => [formatCost(Number(v)), "Cost"]}
                    contentStyle={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 12 }}
                  />
                  <Bar dataKey="cost" fill="var(--accent)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <h3>By model</h3>
          <UsageTable rows={view.byModel.map(g => ({ name: labelFor(g.key), totals: g.totals }))} />

          <h3>By project</h3>
          <UsageTable rows={view.byProject.map(g => ({ name: g.key, totals: g.totals, turns: view.turnsByProject.get(g.key) ?? 0 }))} showTurns />

          <h3>By client</h3>
          <UsageTable rows={view.bySource.map(g => ({ name: g.key, totals: g.totals }))} />

          {view.totals.unpricedMessages > 0 && (
            <p className={styles.hint}>
              {view.totals.unpricedMessages} requests used models without catalog prices and are not included in the cost: {view.totals.unpricedModels.join(", ")}.
            </p>
          )}
          <p className={styles.hint}>
            Costs are API-equivalent: what these tokens would cost at API list prices from the Tokalator catalog, including cache writes (5-minute and 1-hour), cache reads, and long-context rates. If you use Claude Code with a Pro, Max, Team, or Enterprise subscription, you are not billed per token; treat the figure as the value of your usage, not your bill.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statSub}>{sub}</div>
    </div>
  );
}

function UsageTable({ rows, showTurns }: {
  rows: { name: string; totals: ReturnType<typeof summarizeUsage>; turns?: number }[];
  showTurns?: boolean;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className="settings-table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            {showTurns && <th scope="col" className={styles.num}>Turns</th>}
            <th scope="col" className={styles.num}>Requests</th>
            <th scope="col" className={styles.num}>Input</th>
            <th scope="col" className={styles.num}>Output</th>
            <th scope="col" className={styles.num}>Cache read</th>
            <th scope="col" className={styles.num}>Cache write</th>
            <th scope="col" className={styles.num}>API-equivalent</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.name}>
              <td>{r.name}</td>
              {showTurns && <td className={styles.num}>{r.turns}</td>}
              <td className={styles.num}>{r.totals.messages.toLocaleString("en-US")}</td>
              <td className={styles.num}>{formatTokens(r.totals.inputTokens)}</td>
              <td className={styles.num}>{formatTokens(r.totals.outputTokens)}</td>
              <td className={styles.num}>{formatTokens(r.totals.cacheReadTokens)}</td>
              <td className={styles.num}>{formatTokens(r.totals.cacheWriteTokens)}</td>
              <td className={styles.num}>{r.totals.unpricedMessages === r.totals.messages ? "unpriced" : formatCost(r.totals.cost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
