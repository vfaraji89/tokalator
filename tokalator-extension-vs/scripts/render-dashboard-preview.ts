/**
 * Renders the real sidebar dashboard HTML with sample data for the website.
 *
 * Usage:
 *   npm run preview:dashboard
 *
 * Writes ../public/extension-preview/dashboard.html. Pass ?theme=light for the light theme.
 */

import * as fs from 'fs';
import * as path from 'path';
import Module = require('module');

const stub: any = new Proxy(function () {}, {
  get: (_t, key) => (key === Symbol.toPrimitive ? () => '' : stub),
  apply: () => stub,
  construct: () => stub,
});
const vscodeApi = Object.fromEntries(
  ['ConfigurationTarget', 'DiagnosticSeverity', 'Disposable', 'EventEmitter', 'FileType', 'RelativePattern',
    'StatusBarAlignment', 'TabInputText', 'ThemeIcon', 'Uri', 'chat', 'commands', 'languages', 'lm', 'window', 'workspace']
    .map(name => [name, stub]),
);
const resolve = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function (request: string, ...rest: unknown[]) {
  return request === 'vscode' ? 'vscode-stub' : resolve.call(this, request, ...rest);
};
require.cache['vscode-stub'] = { id: 'vscode-stub', filename: 'vscode-stub', loaded: true, exports: vscodeApi } as any;

const { ContextDashboardProvider } = require('../src/webview/contextDashboardProvider');
const { MODEL_PROFILES, getFeaturedModels, DEFAULT_MODEL_ID } = require('../src/core/modelProfiles');

const featured = getFeaturedModels(MODEL_PROFILES).map((m: any) => ({
  id: m.id, label: m.label, provider: m.provider, contextWindow: m.contextWindow,
  inputCostPerMTok: m.inputCostPerMTok, outputCostPerMTok: m.outputCostPerMTok,
}));

const tabs = [
  ['contextMonitor.ts', 'src/core/contextMonitor.ts', 9800, 1, true, false, false],
  ['modelProfiles.ts', 'src/core/modelProfiles.ts', 4600, 1, false, true, false],
  ['tokenBudgetEstimator.ts', 'src/core/tokenBudgetEstimator.ts', 3100, 0.82, false, false, false],
  ['contextDashboardProvider.ts', 'src/webview/contextDashboardProvider.ts', 7900, 0.71, false, false, true],
  ['modelProfiles.test.ts', '__tests__/modelProfiles.test.ts', 2200, 0.64, false, false, false],
  ['README.md', 'README.md', 2400, 0.22, false, false, false],
  ['CHANGELOG.md', 'CHANGELOG.md', 3000, 0.18, false, false, false],
  ['package-lock.json', 'package-lock.json', 41300, 0.08, false, false, false],
].map(([label, rel, tokens, score, active, pinned, dirty]) => ({
  uri: `file:///workspace/tokalator/${rel}`, label, relativePath: rel, languageId: 'typescript',
  estimatedTokens: tokens, relevanceScore: score, relevanceReason: '', isActive: active,
  isPinned: pinned, isDirty: dirty, diagnosticCount: 0, lastEditTimestamp: 0,
}));

const turnHistory = [61, 64, 66, 70, 73, 75, 79, 82, 84, 88, 91, 95, 99, 104].map((k, i) => ({
  turn: i + 1, timestamp: 0, inputTokens: k * 1000, outputReserved: 0, fileTokens: 0,
  overheadTokens: 0, tabCount: tabs.length, pinnedCount: 1,
}));

const sample = {
  modelId: DEFAULT_MODEL_ID,
  models: featured,
  detectedModels: ['claude-opus-5-5', 'claude-sonnet-5-5', 'gpt-6.1-sol', 'gemini-3.8-flash'],
  tabs,
  chatTurnCount: turnHistory.length,
  turnHistory,
  tokenizerLabel: 'Claude BPE',
  workspaceFileCount: 214,
  diagnosticsSummary: { errors: 0 },
  modelUsageLog: [{ source: 'chat-api', modelId: DEFAULT_MODEL_ID }],
  security: { found: 2, uncovered: 0, level: 'protected' },
};

const lastSession = {
  endedAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
  modelLabel: 'Claude Sonnet 5.5', totalTurns: 22, peakTokens: 188_000,
};

const VSCODE_THEMES = {
  dark: {
    '--vscode-sideBar-background': '#181818', '--vscode-sideBar-foreground': '#cccccc',
    '--vscode-foreground': '#cccccc', '--vscode-sideBarSectionHeader-border': '#2b2b2b',
    '--vscode-charts-green': '#89d185', '--vscode-charts-yellow': '#cca700', '--vscode-charts-red': '#f14c4c',
    '--vscode-button-background': '#0078d4', '--vscode-button-foreground': '#ffffff',
    '--vscode-button-hoverBackground': '#026ec1', '--vscode-list-hoverBackground': '#2a2d2e',
    '--vscode-focusBorder': '#0078d4', '--vscode-descriptionForeground': '#9d9d9d',
    '--vscode-textLink-foreground': '#4daafc',
  },
  light: {
    '--vscode-sideBar-background': '#f8f8f8', '--vscode-sideBar-foreground': '#3b3b3b',
    '--vscode-foreground': '#3b3b3b', '--vscode-sideBarSectionHeader-border': '#e5e5e5',
    '--vscode-charts-green': '#388a34', '--vscode-charts-yellow': '#bf8803', '--vscode-charts-red': '#e51400',
    '--vscode-button-background': '#005fb8', '--vscode-button-foreground': '#ffffff',
    '--vscode-button-hoverBackground': '#0258a8', '--vscode-list-hoverBackground': '#f2f2f2',
    '--vscode-focusBorder': '#005fb8', '--vscode-descriptionForeground': '#3b3b3b',
    '--vscode-textLink-foreground': '#005fb8',
  },
};
const themeCss = Object.entries(VSCODE_THEMES).map(([name, vars]) =>
  `html[data-theme="${name}"] { ${Object.entries(vars).map(([k, v]) => `${k}: ${v};`).join(' ')} }`,
).join('\n') + `
html { --vscode-font-family: -apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", system-ui, sans-serif; --vscode-font-size: 13px; }
html, body { min-height: 100%; }`;

const harness = `<script>
var PARAMS = new URLSearchParams(location.search);
document.documentElement.dataset.theme = PARAMS.get('theme') === 'light' ? 'light' : 'dark';
var DEMO = PARAMS.has('demo') ? Number(PARAMS.get('demo')) : -1;
var CAPTIONS = [
  'Live context budget for the active model',
  'Switch models in one tap',
  'Pin a file to keep it at full relevance',
  'Close low-relevance tabs in one click',
  'Claude Code turns and API-equivalent cost update on their own',
  'Collapse the sections you do not need',
];
var EXTRA_TURN = false;
var BUMP = 0;
var COMPACT = PARAMS.get('compact') === '1';
var PROFILES = ${JSON.stringify(MODEL_PROFILES)};
var SAMPLE = ${JSON.stringify(sample)};
var LAST_SESSION = ${JSON.stringify(lastSession)};
var BREAKDOWN = { systemPrompt: 2800, instructions: 1900, conversation: 18400 };
function build() {
  var model = PROFILES.find(function (m) { return m.id === SAMPLE.modelId; });
  var files = SAMPLE.tabs.reduce(function (n, t) { return n + t.estimatedTokens; }, 0);
  var out = Math.min(model.maxOutput, 16000);
  var bd = { files: files, systemPrompt: BREAKDOWN.systemPrompt, instructions: BREAKDOWN.instructions, conversation: BREAKDOWN.conversation, outputReservation: out };
  var tot = files + bd.systemPrompt + bd.instructions + bd.conversation + out;
  var lc = model.longContext, long = !!lc && tot > lc.threshold;
  var rate = model.inputCostPerMTok * (long ? lc.inputMultiplier : 1);
  var outRate = model.outputCostPerMTok * (long ? lc.outputMultiplier : 1);
  var pct = tot / model.contextWindow;
  var level = pct >= 0.8 ? 'high' : pct >= 0.5 ? 'medium' : 'low';
  var low = SAMPLE.tabs.filter(function (t) { return t.relevanceScore < 0.3 && !t.isActive && !t.isPinned; });
  var reasons = [];
  if (SAMPLE.chatTurnCount > 10) reasons.push(SAMPLE.chatTurnCount + ' chat turns \\u2014 context may be stale');
  if (low.length) reasons.push(low.length + ' low-relevance tabs open');
  if (!reasons.length) reasons.push('Token budget looks good');
  var hist = SAMPLE.turnHistory, n = hist.length;
  var avgIn = n ? Math.round(hist.reduce(function (s, h) { return s + h.inputTokens; }, 0) / n) : 0;
  var cost = function (t) { return t / 1e6 * rate; };
  return Object.assign({}, SAMPLE, {
    budgetLevel: level, totalEstimatedTokens: tot, windowCapacity: model.contextWindow,
    pinnedFiles: SAMPLE.tabs.filter(function (t) { return t.isPinned; }).map(function (t) { return t.uri; }),
    healthReasons: reasons, budgetBreakdown: bd,
    costEstimate: { inputTokens: tot, outputTokens: 0, inputCost: cost(tot), outputCost: 0, totalCost: cost(tot), effectiveCost: cost(tot), inputCostPerMTok: +rate.toFixed(4), outputCostPerMTok: +outRate.toFixed(4), cachedInputCostPerMTok: model.cachedInputCostPerMTok },
    claudeCode: claudeCode(),
    usageInsights: n ? { totalTurns: n, avgInputTokens: avgIn, avgCostPerTurn: cost(avgIn), totalCost: cost(avgIn) * n, lastTurn: { inputTokens: hist[n - 1].inputTokens, effectiveCost: cost(hist[n - 1].inputTokens) } } : null,
  });
}
function claudeCode() {
  var m = PROFILES.find(function (x) { return x.id === 'claude-opus-5-5'; });
  function totals(input, output, read, write, messages) {
    var cost = (input * m.inputCostPerMTok + read * m.cachedInputCostPerMTok + write * m.inputCostPerMTok * 2 + output * m.outputCostPerMTok) / 1e6;
    return { messages: messages, sessions: 1, inputTokens: input, outputTokens: output, cacheReadTokens: read, cacheWriteTokens: write, cost: cost, unpricedMessages: 0, unpricedModels: [] };
  }
  var sizes = [61, 72, 80, 95, 104, 118, 126, 139, 151, 163, 171, 182].concat(EXTRA_TURN ? [194] : []);
  for (var b = 1; b <= BUMP; b++) sizes.push(182 + b * 9);
  var turns = sizes.map(function (k, i) {
    return { turn: i + 1, timestamp: '', requests: 14, contextTokens: k * 1000, outputTokens: 8000, cost: 1.1 };
  });
  var today = EXTRA_TURN ? totals(2300, 104000, 44800000, 640000, 199) : totals(2100 + BUMP * 60, 96000 + BUMP * 4200, 41200000 + BUMP * 1900000, 610000 + BUMP * 26000, 184 + BUMP * 7);
  var week = totals(9800, 402000, 176000000, 2480000, 812);
  var session = Object.assign(totals(1600, 71000, 30100000, 450000, 141), {
    model: m.label, startedAt: '', lastAt: '', turns: turns, turnCount: turns.length,
    contextTokens: sizes[sizes.length - 1] * 1000, contextWindow: m.contextWindow, avgGrowthPerTurn: 11000, turnsLeft: Math.floor((m.contextWindow - sizes[sizes.length - 1] * 1000) / 11000),
  });
  return {
    logDirs: [], today: today, todayTurns: (EXTRA_TURN ? 13 : 12) + BUMP, week: week, session: session,
    cacheHitRate: week.cacheReadTokens / (week.inputTokens + week.cacheReadTokens + week.cacheWriteTokens),
    byEntrypoint: [{ label: 'VS Code extension', cost: week.cost * 0.82, messages: 666 }, { label: 'CLI', cost: week.cost * 0.18, messages: 146 }],
    lastActivityAt: new Date(Date.now() - (EXTRA_TURN || BUMP ? 5000 : 40000)).toISOString(),
  };
}
function post() { window.postMessage({ type: 'snapshot', data: build(), lastSession: LAST_SESSION }, '*'); }
function applyDemo() {
  if (DEMO >= 1) { SAMPLE.modelId = 'claude-sonnet-5-5'; SAMPLE.modelUsageLog = [{ source: 'chat-api', modelId: 'claude-sonnet-5-5' }]; }
  if (DEMO >= 2) SAMPLE.tabs.forEach(function (t) { if (t.label === 'README.md') { t.isPinned = true; t.relevanceScore = 1; } });
  if (DEMO >= 3) SAMPLE.tabs = SAMPLE.tabs.filter(function (t) { return t.relevanceScore >= 0.3 || t.isActive || t.isPinned; });
  if (DEMO >= 4) EXTRA_TURN = true;
  if (DEMO >= 0 && PARAMS.get('caption') !== '0') {
    var bar = document.createElement('div');
    bar.textContent = (DEMO + 1) + '/' + CAPTIONS.length + '  ' + CAPTIONS[Math.min(DEMO, CAPTIONS.length - 1)];
    bar.style.cssText = 'position:sticky;top:0;z-index:5;margin:-10px -10px 10px;padding:8px 10px;font:600 12px/1.3 -apple-system,system-ui,sans-serif;background:#e3120b;color:#fff;letter-spacing:0.01em';
    document.body.insertBefore(bar, document.body.firstChild);
  }
  if (DEMO >= 0) {
    var still = document.createElement('style');
    still.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(still);
  }
}
window.acquireVsCodeApi = function () {
  return { getState: function () { return DEMO >= 5 ? { collapsed: { budget: true, files: true } } : undefined; }, setState: function () {}, postMessage: function (msg) {
    var byUri = function (u) { return SAMPLE.tabs.find(function (t) { return t.uri === u; }); };
    switch (msg.command) {
      case 'pin': var p = byUri(msg.uri); p.base = p.base == null ? p.relevanceScore : p.base; p.isPinned = true; p.relevanceScore = 1; break;
      case 'unpin': var u = byUri(msg.uri); u.isPinned = false; if (u.base != null && !u.isActive) u.relevanceScore = u.base; break;
      case 'closeTab': SAMPLE.tabs = SAMPLE.tabs.filter(function (t) { return t.uri !== msg.uri; }); break;
      case 'optimize': SAMPLE.tabs = SAMPLE.tabs.filter(function (t) { return t.relevanceScore >= 0.3 || t.isActive || t.isPinned; }); break;
      case 'switchModel': SAMPLE.modelId = msg.modelId; SAMPLE.modelUsageLog = [{ source: 'chat-api', modelId: msg.modelId }]; break;
      case 'resetTurns': SAMPLE.chatTurnCount = 0; SAMPLE.turnHistory = []; break;
      case 'openFile': SAMPLE.tabs.forEach(function (t) { if (t.base == null) t.base = t.relevanceScore; t.isActive = t.uri === msg.uri; t.relevanceScore = t.isActive || t.isPinned ? 1 : t.base; }); break;
    }
    parent.postMessage({ tokalatorPreview: msg.command }, '*');
    setTimeout(post, 0);
  } };
};
window.addEventListener('message', function (e) {
  if (!e.data || !e.data.tokalatorDemo) return;
  if (e.data.tokalatorDemo === 'turn') BUMP++;
  if (e.data.tokalatorDemo === 'reset') BUMP = 0;
  post();
});
window.addEventListener('load', function () {
  if (COMPACT) {
    var hide = document.createElement('style');
    hide.textContent = '[data-k=pills],[data-k=turns],[data-k=cost],[data-k=tools],[data-k=budget],[data-k=files],[data-k=low],[data-k=last],[data-k=health],[data-k=growth],[data-k=reset],[data-k=foot]{display:none}';
    document.head.appendChild(hide);
  }
  applyDemo();
  post();
});
</script>`;

const html: string = ContextDashboardProvider.prototype.getHtml.call({}, {});
const preview = html
  .replace(/<meta http-equiv="Content-Security-Policy"[\s\S]*?>\s*/, '')
  .replace('<title>Tokalator</title>', `<title>Tokalator dashboard preview</title>\n  <meta name="robots" content="noindex">\n  <style>${themeCss}</style>`)
  .replace(/<script nonce="[^"]*">/, `${harness}\n  <script>`);

if (preview === html || !preview.includes('acquireVsCodeApi = function')) {
  console.error('Dashboard HTML layout changed; update render-dashboard-preview.ts');
  process.exit(1);
}

const outDir = path.join(__dirname, '..', '..', 'public', 'extension-preview');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'dashboard.html'), preview);
console.log(`Wrote ${path.relative(process.cwd(), path.join(outDir, 'dashboard.html'))}`);
