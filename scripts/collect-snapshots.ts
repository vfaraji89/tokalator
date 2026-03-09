/**
 * Snapshot Collector for Relevance Scorer Evaluation
 *
 * Run inside VS Code via the Debug Console or as a VS Code command:
 *   - Opens a quick-pick to name the snapshot
 *   - Captures all open tabs + active file content
 *   - Saves JSON to evaluation/snapshots/
 *
 * Usage: Register as a VS Code command or run via extension development host.
 * For standalone collection without the extension, use the CLI alternative below.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface SnapshotTab {
  relativePath: string;
  languageId: string;
  lastEditMinutesAgo: number;
  diagnosticCount: number;
  isPinned: boolean;
  estimatedTokens: number;
}

interface Snapshot {
  snapshotId: string;
  project: string;
  collector: string;
  timestamp: string;
  activeFile: {
    relativePath: string;
    languageId: string;
    content: string;
  } | null;
  tabs: SnapshotTab[];
}

/**
 * Collect a snapshot of the current VS Code workspace state.
 * Call from a VS Code extension context.
 */
export async function collectSnapshot(
  collector: string = 'anon',
  outputDir?: string
): Promise<Snapshot | null> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder open');
    return null;
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  const project = path.basename(rootPath);
  const now = Date.now();

  // Capture active file
  const activeEditor = vscode.window.activeTextEditor;
  let activeFile: Snapshot['activeFile'] = null;
  if (activeEditor) {
    const doc = activeEditor.document;
    activeFile = {
      relativePath: vscode.workspace.asRelativePath(doc.uri),
      languageId: doc.languageId,
      content: doc.getText(),
    };
  }

  // Capture all open tabs
  const tabs: SnapshotTab[] = [];
  const seenUris = new Set<string>();

  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      if (!(tab.input instanceof vscode.TabInputText)) { continue; }
      const uri = tab.input.uri;
      const uriKey = uri.toString();
      if (seenUris.has(uriKey)) { continue; }
      seenUris.add(uriKey);

      const relativePath = vscode.workspace.asRelativePath(uri);
      const openDoc = vscode.workspace.textDocuments.find(d => d.uri.toString() === uriKey);
      const languageId = openDoc?.languageId || guessLanguage(uri.fsPath);
      const diagnostics = vscode.languages.getDiagnostics(uri);

      // Estimate tokens (~4 chars per token)
      let estimatedTokens = 0;
      if (openDoc) {
        estimatedTokens = Math.ceil(openDoc.getText().length / 4);
      } else {
        try {
          const stat = await vscode.workspace.fs.stat(uri);
          estimatedTokens = Math.ceil(stat.size / 4);
        } catch {
          estimatedTokens = 0;
        }
      }

      tabs.push({
        relativePath,
        languageId,
        lastEditMinutesAgo: 999, // placeholder — will be enriched if edit timestamps available
        diagnosticCount: diagnostics.length,
        isPinned: false, // Will be enriched from Tokalator state if available
        estimatedTokens,
      });
    }
  }

  const snapshotId = `snap-${Date.now()}`;
  const snapshot: Snapshot = {
    snapshotId,
    project,
    collector,
    timestamp: new Date().toISOString(),
    activeFile,
    tabs,
  };

  // Write to evaluation/snapshots/
  const dir = outputDir || path.join(rootPath, 'evaluation', 'snapshots');
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${snapshotId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');

  vscode.window.showInformationMessage(
    `Snapshot saved: ${snapshotId} (${tabs.length} tabs)`
  );

  return snapshot;
}

function guessLanguage(fsPath: string): string {
  const ext = fsPath.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescriptreact', js: 'javascript', jsx: 'javascriptreact',
    py: 'python', go: 'go', rs: 'rust', java: 'java', rb: 'ruby',
    md: 'markdown', json: 'json', yml: 'yaml', yaml: 'yaml',
    css: 'css', html: 'html', sh: 'shellscript', sql: 'sql',
  };
  return map[ext] || ext;
}
