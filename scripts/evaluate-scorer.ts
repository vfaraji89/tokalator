/**
 * Relevance Scorer Evaluation Script
 *
 * Loads snapshots from evaluation/snapshots/, runs the pure scorer,
 * and compares against human ground-truth labels from evaluation/labels/.
 *
 * Outputs: Precision, Recall, F1 at multiple thresholds + LaTeX table.
 *
 * Usage:
 *   npx ts-node scripts/evaluate-scorer.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  scoreAllPure,
  ActiveFileContext,
  TabInfoPlain,
  DEFAULT_WEIGHTS,
  ScoringWeights,
} from '../tokalator-extension-vs/src/core/tabRelevanceScorer.pure';

// ── Types ──

interface SnapshotFile {
  snapshotId: string;
  project: string;
  activeFile: {
    relativePath: string;
    languageId: string;
    content: string;
  } | null;
  tabs: Array<{
    relativePath: string;
    languageId: string;
    lastEditMinutesAgo: number;
    diagnosticCount: number;
    isPinned: boolean;
    estimatedTokens: number;
  }>;
}

interface LabelFile {
  labeler: string;
  labels: Record<string, Record<string, 'relevant' | 'irrelevant'>>;
}

interface EvaluationResult {
  threshold: number;
  tp: number;  // scorer says distractor, human says irrelevant
  fp: number;  // scorer says distractor, human says relevant (false alarm)
  tn: number;  // scorer says keep, human says relevant
  fn: number;  // scorer says keep, human says irrelevant (missed distractor)
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
}

// ── Main ──

const ROOT = path.resolve(__dirname, '..');
const SNAPSHOT_DIR = path.join(ROOT, 'evaluation', 'snapshots');
const LABEL_DIR = path.join(ROOT, 'evaluation', 'labels');
const RESULTS_DIR = path.join(ROOT, 'evaluation', 'results');

function loadSnapshots(): SnapshotFile[] {
  const files = fs.readdirSync(SNAPSHOT_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, f), 'utf-8')));
}

function loadLabels(): LabelFile[] {
  const files = fs.readdirSync(LABEL_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => JSON.parse(fs.readFileSync(path.join(LABEL_DIR, f), 'utf-8')));
}

/**
 * Compute majority-vote ground truth from multiple labelers.
 * Returns { snapshotId -> { relativePath -> 'relevant' | 'irrelevant' } }
 */
function computeGroundTruth(labels: LabelFile[]): Record<string, Record<string, 'relevant' | 'irrelevant'>> {
  const groundTruth: Record<string, Record<string, 'relevant' | 'irrelevant'>> = {};

  // Collect all snapshot IDs across labelers
  const allSnapshotIds = new Set<string>();
  for (const lf of labels) {
    for (const sid of Object.keys(lf.labels)) {
      allSnapshotIds.add(sid);
    }
  }

  for (const sid of allSnapshotIds) {
    groundTruth[sid] = {};

    // Collect all tab paths for this snapshot
    const allPaths = new Set<string>();
    for (const lf of labels) {
      if (lf.labels[sid]) {
        for (const p of Object.keys(lf.labels[sid])) {
          allPaths.add(p);
        }
      }
    }

    for (const tabPath of allPaths) {
      let relevantVotes = 0;
      let irrelevantVotes = 0;
      for (const lf of labels) {
        const vote = lf.labels[sid]?.[tabPath];
        if (vote === 'relevant') { relevantVotes++; }
        else if (vote === 'irrelevant') { irrelevantVotes++; }
      }
      groundTruth[sid][tabPath] = relevantVotes >= irrelevantVotes ? 'relevant' : 'irrelevant';
    }
  }

  return groundTruth;
}

/**
 * Run the scorer on a snapshot and evaluate against ground truth at a given threshold.
 */
function evaluateAtThreshold(
  snapshots: SnapshotFile[],
  groundTruth: Record<string, Record<string, 'relevant' | 'irrelevant'>>,
  threshold: number,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): EvaluationResult {
  let tp = 0, fp = 0, tn = 0, fn = 0;

  for (const snap of snapshots) {
    const gt = groundTruth[snap.snapshotId];
    if (!gt || !snap.activeFile) { continue; }

    const activeFile: ActiveFileContext = {
      text: snap.activeFile.content,
      languageId: snap.activeFile.languageId,
      fsPath: snap.activeFile.relativePath,
    };

    const now = Date.now();
    const plainTabs: TabInfoPlain[] = snap.tabs.map(t => ({
      relativePath: t.relativePath,
      languageId: t.languageId,
      fsPath: t.relativePath,
      estimatedTokens: t.estimatedTokens,
      relevanceScore: 0,
      relevanceReason: '',
      isActive: t.relativePath === snap.activeFile!.relativePath,
      isDirty: false,
      isPinned: t.isPinned,
      diagnosticCount: t.diagnosticCount,
      lastEditTimestamp: now - t.lastEditMinutesAgo * 60000,
      label: path.basename(t.relativePath),
    }));

    const scored = scoreAllPure(plainTabs, activeFile, weights, now);

    for (const tab of scored) {
      const humanLabel = gt[tab.relativePath];
      if (!humanLabel) { continue; }

      // Skip active file (always scored 1.0, not interesting)
      if (tab.isActive) { continue; }

      const scorerSaysDistractor = tab.relevanceScore < threshold;
      const humanSaysIrrelevant = humanLabel === 'irrelevant';

      if (scorerSaysDistractor && humanSaysIrrelevant) { tp++; }
      else if (scorerSaysDistractor && !humanSaysIrrelevant) { fp++; }
      else if (!scorerSaysDistractor && !humanSaysIrrelevant) { tn++; }
      else { fn++; }
    }
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
  const accuracy = tp + fp + tn + fn > 0 ? (tp + tn) / (tp + fp + tn + fn) : 0;

  return { threshold, tp, fp, tn, fn, precision, recall, f1, accuracy };
}

function formatPercent(v: number): string {
  return (v * 100).toFixed(1) + '%';
}

function generateLatexTable(results: EvaluationResult[]): string {
  const rows = results.map(r =>
    `    ${r.threshold.toFixed(1)} & ${r.tp + r.fp + r.tn + r.fn} & ${formatPercent(r.precision)} & ${formatPercent(r.recall)} & ${formatPercent(r.f1)} & ${formatPercent(r.accuracy)} \\\\`
  ).join('\n');

  return `\\begin{table}[htp!]
\\centering
\\small
\\caption{Relevance scorer evaluation at multiple distractor thresholds. Precision measures the fraction of flagged tabs that humans agreed were irrelevant; recall measures the fraction of human-labeled irrelevant tabs the scorer caught.}
\\label{tab:scorer-eval}
\\begin{tabular}{@{} c r r r r r @{}}
\\toprule
\\textbf{Threshold} & \\textbf{Judgments} & \\textbf{Precision} & \\textbf{Recall} & \\textbf{F1} & \\textbf{Accuracy} \\\\
\\midrule
${rows}
\\bottomrule
\\end{tabular}
\\end{table}`;
}

// ── Execute ──

function main(): void {
  console.log('=== Tokalator Relevance Scorer Evaluation ===\n');

  const snapshots = loadSnapshots();
  console.log(`Loaded ${snapshots.length} snapshots from ${SNAPSHOT_DIR}`);

  const labels = loadLabels();
  console.log(`Loaded ${labels.length} labeler files from ${LABEL_DIR}`);

  if (snapshots.length === 0 || labels.length === 0) {
    console.error('\nNo data found. Collect snapshots and labels first.');
    console.log('  1. Run collect-snapshots.ts in VS Code to capture workspace state');
    console.log('  2. Have labelers create JSON files in evaluation/labels/');
    process.exit(1);
  }

  const groundTruth = computeGroundTruth(labels);
  const totalJudgments = Object.values(groundTruth).reduce(
    (sum, snp) => sum + Object.keys(snp).length, 0
  );
  console.log(`Ground truth: ${totalJudgments} tab judgments across ${Object.keys(groundTruth).length} snapshots`);
  console.log(`Labelers: ${labels.map(l => l.labeler).join(', ')}\n`);

  // Evaluate at multiple thresholds
  const thresholds = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
  const results: EvaluationResult[] = [];

  for (const t of thresholds) {
    const result = evaluateAtThreshold(snapshots, groundTruth, t);
    results.push(result);
    console.log(
      `Threshold ${t.toFixed(1)}: P=${formatPercent(result.precision)} R=${formatPercent(result.recall)} ` +
      `F1=${formatPercent(result.f1)} Acc=${formatPercent(result.accuracy)} ` +
      `(TP=${result.tp} FP=${result.fp} TN=${result.tn} FN=${result.fn})`
    );
  }

  // Highlight default threshold
  const default03 = results.find(r => r.threshold === 0.3);
  if (default03) {
    console.log(`\n>>> Default threshold (0.3): Precision=${formatPercent(default03.precision)}, Recall=${formatPercent(default03.recall)}, F1=${formatPercent(default03.f1)}`);
  }

  // Generate LaTeX table
  const latex = generateLatexTable(results);

  // Save results
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(RESULTS_DIR, 'scorer-evaluation.json'), JSON.stringify(results, null, 2), 'utf-8');
  fs.writeFileSync(path.join(RESULTS_DIR, 'scorer-table.tex'), latex, 'utf-8');

  console.log(`\nResults saved to ${RESULTS_DIR}/`);
  console.log('  scorer-evaluation.json  — raw metrics');
  console.log('  scorer-table.tex        — LaTeX table for paper');
}

main();
