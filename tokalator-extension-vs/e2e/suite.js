// Runs inside a real VS Code extension host. Launched by e2e/run.js.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

const results = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function test(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
  } catch (e) {
    results.push({ name, ok: false, ms: Date.now() - t0, error: String((e && e.stack) || e) });
  }
}

async function until(fn, ms = 15000, step = 250) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() - t0 > ms) throw new Error('timed out waiting for condition');
    await sleep(step);
  }
}

function fakeStream() {
  const out = { md: '', calls: [] };
  const stream = new Proxy({}, {
    get: (_t, key) => (...args) => {
      out.calls.push(String(key));
      if (key === 'markdown') out.md += typeof args[0] === 'string' ? args[0] : args[0].value;
    },
  });
  return { out, stream };
}

async function snapshot(api) {
  await api.monitor.refresh();
  return api.monitor.getLatestSnapshot();
}

function settle(api, cond, ms) {
  return until(async () => {
    const s = await snapshot(api);
    return s && cond(s) ? s : null;
  }, ms);
}

exports.run = async function run() {
  const ext = vscode.extensions.getExtension('vfaraji89.tokalator');
  const api = await ext.activate();
  const root = vscode.workspace.workspaceFolders[0].uri.fsPath;
  const file = rel => vscode.Uri.file(path.join(root, rel));
  const open = async rel => vscode.window.showTextDocument(await vscode.workspace.openTextDocument(file(rel)), { preview: false });
  const pkg = ext.packageJSON;

  await test('activates and returns its API', async () => {
    assert.ok(api && api.monitor && api.dashboard && api.chat && api.claudeCode && api.agents);
  });

  await test('registers every contributed command', async () => {
    const all = await vscode.commands.getCommands(true);
    for (const c of pkg.contributes.commands) assert.ok(all.includes(c.command), c.command);
  });

  await test('counts tokens and scores tab relevance for open files', async () => {
    await open('src/budget.ts');
    await open('src/util.ts');
    await open('notes/unrelated.txt');
    await open('src/main.ts');
    const s = await until(async () => {
      const snap = await snapshot(api);
      return snap && snap.tabs.length >= 4 ? snap : null;
    });
    const main = s.tabs.find(t => t.label === 'main.ts');
    const util = s.tabs.find(t => t.label === 'util.ts');
    const notes = s.tabs.find(t => t.label === 'unrelated.txt');
    assert.ok(main.isActive && main.relevanceScore === 1, 'active file scores 1');
    assert.ok(util.relevanceScore > notes.relevanceScore, 'imported file outranks unrelated text');
    assert.ok(s.tabs.every(t => t.estimatedTokens > 0), 'every tab has a token estimate');
    assert.ok(s.totalEstimatedTokens > 0 && ['low', 'medium', 'high'].includes(s.budgetLevel));
  });

  await test('pins and clears pins', async () => {
    const uri = file('notes/unrelated.txt').toString();
    api.monitor.pinFile(uri);
    const pinned = await settle(api, s => s.tabs.some(t => t.label === 'unrelated.txt' && t.isPinned));
    assert.strictEqual(pinned.tabs.find(t => t.label === 'unrelated.txt').relevanceScore, 1, 'pinned file scores 1');
    await vscode.commands.executeCommand('tokalator.clearPins');
    await settle(api, s => Array.from(s.pinnedFiles).length === 0 && !s.tabs.some(t => t.isPinned));
  });

  await test('switching models updates window and input rate', async () => {
    await api.monitor.setModel('claude-haiku-4.5');
    let s = await settle(api, x => x.modelId === 'claude-haiku-4.5');
    assert.strictEqual(s.windowCapacity, 200000);
    assert.strictEqual(s.costEstimate.inputCostPerMTok, 1);
    await api.monitor.setModel('claude-opus-5-5');
    s = await settle(api, x => x.modelId === 'claude-opus-5-5');
    assert.strictEqual(s.windowCapacity, 1000000);
    assert.strictEqual(s.costEstimate.inputCostPerMTok, 4);
  });

  await test('Haiku 5.5 long-context rate applies above 100K input tokens', async () => {
    await api.monitor.setModel('claude-haiku-5-5');
    await open('big/corpus.txt');
    const s = await settle(api, x => x.modelId === 'claude-haiku-5-5' && x.totalEstimatedTokens > 100000);
    assert.strictEqual(s.costEstimate.inputCostPerMTok, 0.5, 'input rate is 5x the 0.10 base');
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    await api.monitor.setModel('claude-opus-5-5');
    await settle(api, x => x.modelId === 'claude-opus-5-5');
  });

  await test('optimize closes low-relevance tabs only', async () => {
    await open('src/main.ts');
    const before = await settle(api, x => x.tabs.some(t => t.label === 'main.ts' && t.isActive));
    const low = before.tabs.filter(t => t.relevanceScore < 0.3 && !t.isActive && !t.isPinned).map(t => t.label);
    assert.ok(low.length > 0, 'fixture has a low-relevance tab: ' + JSON.stringify(before.tabs.map(t => [t.label, t.relevanceScore])));
    await vscode.commands.executeCommand('tokalator.optimize');
    const after = await settle(api, x => low.every(l => !x.tabs.some(t => t.label === l)));
    assert.ok(after.tabs.some(t => t.label === 'main.ts'), 'active file stays open');
  });

  const posted = [];
  await test('dashboard webview resolves and receives snapshots', async () => {
    await vscode.commands.executeCommand('tokalator.dashboard.focus');
    const view = await until(() => api.dashboard.view);
    const original = view.webview.postMessage.bind(view.webview);
    view.webview.postMessage = msg => { posted.push(msg); return original(msg); };
    await api.monitor.refresh();
    const msg = await until(() => posted.find(m => m.type === 'snapshot'));
    assert.ok(msg.data.tabs.length > 0);
    assert.ok(msg.data.models.some(m => m.id === 'claude-opus-5-5'), 'featured models include Opus 5.5');
    assert.ok(msg.data.costEstimate.inputCostPerMTok > 0);
    assert.ok(msg.data.catalogMeta && msg.data.catalogMeta.updatedAt);
  });

  await test('reads Claude Code turns, tokens and API-equivalent cost for this workspace', async () => {
    const s = await api.claudeCode.refresh(true);
    assert.ok(s, 'summary exists');
    assert.strictEqual(s.session.turnCount, 2);
    assert.strictEqual(s.week.messages, 3);
    assert.strictEqual(s.todayTurns, 2);
    assert.ok(s.week.cost > 0 && s.week.unpricedMessages === 0);
    assert.strictEqual(s.session.contextWindow, 1000000);
    assert.strictEqual(s.byEntrypoint[0].label, 'VS Code extension');
  });

  await test('reads Codex CLI usage for this workspace', async () => {
    await api.agents.refresh(true);
    const s = api.agents.getSummaries().codex;
    assert.ok(s, 'expected a Codex summary');
    assert.strictEqual(s.week.messages, 2);
    assert.strictEqual(s.todayTurns, 2);
    assert.strictEqual(s.session.modelId, 'gpt-6-astra');
    assert.strictEqual(s.week.cacheReadTokens, 4000);
    assert.strictEqual(s.week.inputTokens, 5000);
    assert.ok(s.week.cost > 0);
  });

  await test('dashboard picks up new Claude Code activity without any chat mention', async () => {
    const log = process.env.TOKALATOR_E2E_SESSION_LOG;
    const now = Date.now();
    fs.appendFileSync(log, [
      JSON.stringify({ type: 'user', uuid: 'u3', timestamp: new Date(now - 2000).toISOString(), sessionId: 'e2e', isSidechain: false, origin: { kind: 'human' }, message: { role: 'user', content: 'third prompt' } }),
      JSON.stringify({ type: 'assistant', uuid: 'a4', timestamp: new Date(now - 1000).toISOString(), sessionId: 'e2e', cwd: root, entrypoint: 'claude-vscode', isSidechain: false, message: { id: 'msg_4', model: 'claude-opus-5-5', usage: { input_tokens: 3, output_tokens: 120, cache_read_input_tokens: 30000, cache_creation_input_tokens: 0 } } }),
    ].join('\n') + '\n');
    posted.length = 0;
    const msg = await until(() => posted.find(m => m.data && m.data.claudeCode && m.data.claudeCode.session && m.data.claudeCode.session.turnCount === 3), 40000);
    assert.strictEqual(msg.data.claudeCode.week.messages, 4);
  });

  await test('agent tabs show agents with activity even without their extension', async () => {
    const msg = await until(() => posted.slice().reverse().find(m => m.data && Array.isArray(m.data.visibleAgents) && m.data.visibleAgents.includes('codex')), 40000);
    assert.ok(msg.data.visibleAgents.includes('claude-code'), 'Claude Code has activity in this workspace');
    assert.ok(!msg.data.visibleAgents.includes('copilot-cli'), 'no Copilot CLI activity here');
  });

  await test('a companion extension can show and clear a header chip', async () => {
    posted.length = 0;
    api.setCompanionBadge({ label: 'TEAM', detail: 'Example team, sharing', tone: 'active', command: 'workbench.action.showCommands' });
    const shown = await until(() => posted.slice().reverse().find(m => m.data && m.data.companion));
    assert.strictEqual(shown.data.companion.label, 'TEAM');
    assert.strictEqual(shown.data.companion.tone, 'active');
    posted.length = 0;
    api.setCompanionBadge({ label: '<img src=x>', detail: 'bad' });
    const rejected = await until(() => posted.slice().reverse().find(m => m.data && 'companion' in m.data));
    assert.strictEqual(rejected.data.companion, null);
    api.setCompanionBadge(null);
  });

  const chatCommands = pkg.contributes.chatParticipants[0].commands.map(c => c.name).filter(c => c !== 'exit').concat('exit');
  const prompts = { pin: 'src/util.ts', unpin: 'src/util.ts', model: 'sonnet 5.5' };
  for (const command of chatCommands) {
    await test(`@tokalator /${command} responds without a language model`, async () => {
      const { out, stream } = fakeStream();
      const token = new vscode.CancellationTokenSource().token;
      await api.chat.handleRequest({ command, prompt: prompts[command] || '', references: [], toolReferences: [] }, { history: [] }, stream, token);
      assert.ok(out.md.trim().length > 0 || out.calls.length > 0, 'produced output');
      assert.ok(!/undefined|NaN/.test(out.md), 'no undefined or NaN in output: ' + out.md.slice(0, 300));
    });
  }

  await test('/model switched to Sonnet 5.5', async () => {
    assert.strictEqual(api.monitor.getActiveModel().id, 'claude-sonnet-5-5');
  });

  await test('Secure Workspace detects uncovered secrets, applies, and verifies coverage', async () => {
    const before = await until(() => posted.slice().reverse().find(m => m.data && m.data.security));
    assert.ok(before.data.security.found >= 1 && before.data.security.uncovered >= 1, 'the .env fixture starts uncovered');
    const original = vscode.window.showWarningMessage;
    vscode.window.showWarningMessage = async (...args) => (args.includes('Apply All') ? 'Apply All' : undefined);
    posted.length = 0;
    try {
      await vscode.commands.executeCommand('tokalator.secure');
    } finally {
      vscode.window.showWarningMessage = original;
    }
    const after = await until(() => posted.slice().reverse().find(m => m.data && m.data.security && m.data.security.uncovered === 0), 10000);
    assert.strictEqual(after.data.security.level, 'protected');
    const claude = JSON.parse(fs.readFileSync(path.join(root, '.claude/settings.json'), 'utf8'));
    assert.ok(claude.permissions.deny.includes('Read(**/.env)'));
    assert.ok(!claude.permissions.deny.some(r => r.startsWith('Grep(')), 'no undocumented Grep rules');
    const vs = JSON.parse(fs.readFileSync(path.join(root, '.vscode/settings.json'), 'utf8'));
    assert.strictEqual(vs['search.exclude']['**/.env'], true);
    assert.ok(!('chat.excludeFilePatterns' in vs), 'no undocumented settings');
    assert.ok(fs.readFileSync(path.join(root, '.gitignore'), 'utf8').includes('.env*'));
    assert.ok(fs.existsSync(path.join(root, '.github/instructions/secret-files.instructions.md')));
  });

  await test('telemetry is off by default and records nothing', async () => {
    assert.strictEqual(api.telemetry.enabled, false);
    api.telemetry.count('cmd:e2e');
    assert.deepStrictEqual(api.telemetry.pending(), []);
  });

  await test('telemetry stays off when VS Code telemetry is off, even if the setting is on', async () => {
    assert.strictEqual(vscode.env.isTelemetryEnabled, false, 'launched with --disable-telemetry');
    await vscode.workspace.getConfiguration('tokalator').update('telemetry.enabled', true, vscode.ConfigurationTarget.Global);
    try {
      assert.strictEqual(api.telemetry.enabled, false);
      api.telemetry.count('cmd:e2e');
      assert.deepStrictEqual(api.telemetry.pending(), []);
    } finally {
      await vscode.workspace.getConfiguration('tokalator').update('telemetry.enabled', undefined, vscode.ConfigurationTarget.Global);
    }
  });

  await test('Show Telemetry Data opens exactly what would be sent', async () => {
    await vscode.commands.executeCommand('tokalator.telemetryShow');
    const doc = vscode.window.activeTextEditor.document;
    const shown = JSON.parse(doc.getText());
    assert.strictEqual(doc.languageId, 'json');
    assert.strictEqual(shown.enabled, false);
    assert.deepStrictEqual(shown.pending, []);
    assert.ok(shown.privacy.startsWith('https://tokalator.ai/privacy'));
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  await test('Export My Telemetry Data shows an empty export when nothing was ever sent', async () => {
    await vscode.commands.executeCommand('tokalator.telemetryExport');
    const doc = vscode.window.activeTextEditor.document;
    assert.deepStrictEqual(JSON.parse(doc.getText()), { installId: null, stored: [] });
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  await test('Delete My Telemetry Data confirms deletion without contacting the server', async () => {
    const original = vscode.window.showInformationMessage;
    let shown = '';
    vscode.window.showInformationMessage = async msg => { shown = msg; return undefined; };
    try {
      await vscode.commands.executeCommand('tokalator.telemetryDelete');
    } finally {
      vscode.window.showInformationMessage = original;
    }
    assert.ok(shown.includes('was deleted'), shown);
  });

  await test('Survey asks for telemetry consent first and sends nothing when declined', async () => {
    const info = vscode.window.showInformationMessage;
    const pick = vscode.window.showQuickPick;
    let asked = '';
    let picks = 0;
    vscode.window.showInformationMessage = async msg => { asked = msg; return 'Cancel'; };
    vscode.window.showQuickPick = async () => { picks++; return undefined; };
    try {
      await vscode.commands.executeCommand('tokalator.survey');
    } finally {
      vscode.window.showInformationMessage = info;
      vscode.window.showQuickPick = pick;
    }
    assert.ok(asked.includes('needs telemetry consent'), asked);
    assert.strictEqual(picks, 0);
  });

  await test('Send Feedback offers topics and sends nothing when dismissed', async () => {
    const original = vscode.window.showQuickPick;
    let offered = [];
    vscode.window.showQuickPick = async items => { offered = items; return undefined; };
    try {
      await vscode.commands.executeCommand('tokalator.feedback');
    } finally {
      vscode.window.showQuickPick = original;
    }
    assert.ok(offered.length >= 4 && offered.some(i => i.label === 'Claude Code tracking'));
  });

  await test('Price Watch detects a price change and reports it in chat and the dashboard', async () => {
    assert.ok(api.priceWatch, 'price watch is running');
    const before = api.priceWatch.getChangelog().length;
    posted.length = 0;
    api.applyCatalog({ schemaVersion: 2, updatedAt: '2026-10-11T00:00:00Z', models: [{ id: 'claude-opus-5-5', inputCostPerMTok: 3.2 }] });
    const changeset = await until(() => api.priceWatch.getChangelog().length > before && api.priceWatch.getLatestChangeset());
    const change = changeset.changes.find(c => c.modelId === 'claude-opus-5-5' && c.field === 'input');
    assert.ok(change && change.oldRate === 4 && change.newRate === 3.2 && Math.round(change.pctChange) === -20, JSON.stringify(changeset));
    const { out, stream } = fakeStream();
    await api.chat.handleRequest({ command: 'pricewatch', prompt: '', references: [], toolReferences: [] }, { history: [] }, stream, new vscode.CancellationTokenSource().token);
    assert.ok(/Opus 5\.5/.test(out.md) && /3\.2/.test(out.md), out.md.slice(0, 400));
    const msg = await until(() => posted.find(m => m.data && m.data.priceWatchData && m.data.priceWatchData.latest));
    assert.ok(msg.data.models.length > 0);
    api.applyCatalog({ schemaVersion: 2, updatedAt: '2026-10-11T00:00:01Z', models: [{ id: 'claude-opus-5-5', inputCostPerMTok: 4 }] });
  });

  await test('/skill-gen apply writes a discoverable Agent Skill', async () => {
    const { stream } = fakeStream();
    await api.chat.handleRequest({ command: 'skill-gen', prompt: 'apply', references: [], toolReferences: [] }, { history: [] }, stream, new vscode.CancellationTokenSource().token);
    const dir = path.join(root, '.claude', 'skills');
    const [name] = fs.readdirSync(dir);
    const skill = fs.readFileSync(path.join(dir, name, 'SKILL.md'), 'utf8');
    assert.match(name, /^[a-z0-9-]+$/);
    assert.match(skill, /^---\nname: [a-z0-9-]+\ndescription: .+Use when/m);
    assert.ok(!skill.includes('applyTo'));
  });

  await test('/settings-gen apply writes AGENTS.md and a CLAUDE.md that imports it', async () => {
    const { stream } = fakeStream();
    await api.chat.handleRequest({ command: 'settings-gen', prompt: 'apply', references: [], toolReferences: [] }, { history: [] }, stream, new vscode.CancellationTokenSource().token);
    assert.ok(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8').includes('## Conventions'));
    assert.strictEqual(fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8').trim(), '@AGENTS.md');
    assert.ok(fs.existsSync(path.join(root, '.github', 'copilot-instructions.md')));
  });

  await test('Generate Code Maps writes GLOSSARY.md and SITE-MAP.md from source', async () => {
    const original = vscode.window.showInformationMessage;
    vscode.window.showInformationMessage = async () => undefined;
    try {
      await vscode.commands.executeCommand('tokalator.codeMaps');
    } finally {
      vscode.window.showInformationMessage = original;
    }
    const glossary = fs.readFileSync(path.join(root, 'GLOSSARY.md'), 'utf8');
    const sitemap = fs.readFileSync(path.join(root, 'SITE-MAP.md'), 'utf8');
    assert.match(glossary, /\| function \| add \| \[L1\]\(src\/util\.ts#L1\)/);
    assert.match(glossary, /\| const \| total \|/);
    assert.match(sitemap, /\[src\/main\.ts\]\(src\/main\.ts\) → \[src\/budget\.ts\]\(src\/budget\.ts\), \[src\/util\.ts\]\(src\/util\.ts\)/);
  });

  await test('refresh pricing command completes', async () => {
    await vscode.commands.executeCommand('tokalator.refreshPricing');
  });

  fs.writeFileSync(process.env.TOKALATOR_E2E_REPORT, JSON.stringify(results, null, 2));
  const failed = results.filter(r => !r.ok);
  if (failed.length) throw new Error(`${failed.length} e2e test(s) failed: ${failed.map(f => f.name).join('; ')}`);
};
