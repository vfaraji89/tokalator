// Launches an isolated VS Code (fresh profile, temp workspace, no other extensions) and runs e2e/suite.js.
// Usage: npm run test:e2e   (VSCODE_BIN overrides the VS Code executable; TOKALATOR_EXT_PATH tests an unpacked VSIX)
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const bin = process.env.VSCODE_BIN || {
  darwin: '/Applications/Visual Studio Code.app/Contents/MacOS/Code',
  linux: '/usr/share/code/code',
  win32: path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'Code.exe'),
}[process.platform];

const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'tokalator-e2e-')));
const ws = path.join(tmp, 'workspace');
const write = (rel, text) => {
  fs.mkdirSync(path.dirname(path.join(ws, rel)), { recursive: true });
  fs.writeFileSync(path.join(ws, rel), text);
};
write('src/main.ts', "import { add } from './util';\nimport { budget } from './budget';\n\nexport const total = add(budget(1000), 24);\n");
write('src/util.ts', 'export function add(a: number, b: number): number {\n  return a + b;\n}\n');
write('src/budget.ts', 'export function budget(n: number): number {\n  return Math.max(0, n - 128);\n}\n');
write('notes/unrelated.txt', 'Grocery list: apples, bread, coffee.\n'.repeat(20));
write('big/corpus.txt', 'The context window holds every token the model reads on a turn. '.repeat(30000));
write('.env', 'API_KEY=placeholder\n');
write('package.json', JSON.stringify({ name: 'e2e-app', description: 'Fixture app for Tokalator e2e.', scripts: { build: 'tsc -p .', test: 'node --test', lint: 'eslint src' }, devDependencies: { typescript: '5.9.3', eslint: '10.0.0' } }, null, 2));
write('tsconfig.json', JSON.stringify({ compilerOptions: { strict: true } }));

const claudeDir = path.join(tmp, 'claude');
const projectDir = path.join(claudeDir, 'projects', ws.replace(/[^a-zA-Z0-9]/g, '-'));
fs.mkdirSync(projectDir, { recursive: true });
const t = Date.now() - 10 * 60_000;
const at = s => new Date(t + s * 1000).toISOString();
const sessionLog = path.join(projectDir, 'e2e.jsonl');
const line = o => JSON.stringify({ sessionId: 'e2e', cwd: ws, entrypoint: 'claude-vscode', isSidechain: false, ...o });
fs.writeFileSync(sessionLog, [
  line({ type: 'user', uuid: 'u1', timestamp: at(0), origin: { kind: 'human' }, message: { role: 'user', content: 'first prompt' } }),
  line({ type: 'assistant', uuid: 'a1', timestamp: at(2), message: { id: 'msg_1', model: 'claude-opus-5-5', usage: { input_tokens: 5, output_tokens: 400, cache_read_input_tokens: 0, cache_creation_input_tokens: 20000, cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 20000 } } } }),
  line({ type: 'assistant', uuid: 'a1b', timestamp: at(2), message: { id: 'msg_1', model: 'claude-opus-5-5', usage: { input_tokens: 5, output_tokens: 400, cache_read_input_tokens: 0, cache_creation_input_tokens: 20000, cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 20000 } } } }),
  line({ type: 'user', uuid: 'r1', timestamp: at(3), message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: 'ok' }] } }),
  line({ type: 'assistant', uuid: 'a2', timestamp: at(4), message: { id: 'msg_2', model: 'claude-opus-5-5', usage: { input_tokens: 3, output_tokens: 200, cache_read_input_tokens: 20005, cache_creation_input_tokens: 600 } } }),
  line({ type: 'user', uuid: 'u2', timestamp: at(60), origin: { kind: 'human' }, message: { role: 'user', content: 'second prompt' } }),
  line({ type: 'assistant', uuid: 'a3', timestamp: at(62), message: { id: 'msg_3', model: 'claude-opus-5-5', usage: { input_tokens: 4, output_tokens: 300, cache_read_input_tokens: 20605, cache_creation_input_tokens: 900 } } }),
].join('\n') + '\n');

const codexDir = path.join(tmp, 'codex');
const now = new Date();
const dayDir = path.join(codexDir, 'sessions', String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0'));
fs.mkdirSync(dayDir, { recursive: true });
const ct = Date.now() - 20 * 60_000;
const cat = s => new Date(ct + s * 1000).toISOString();
const cx = (type, payload, s) => JSON.stringify({ timestamp: cat(s), type, payload });
const cu = (input, cached, output) => ({ input_tokens: input, cached_input_tokens: cached, cache_write_input_tokens: 0, output_tokens: output, reasoning_output_tokens: 0, total_tokens: input + output });
fs.writeFileSync(path.join(dayDir, 'rollout-e2e.jsonl'), [
  cx('session_meta', { id: 'codex-e2e', cwd: ws, cli_version: '0.0.0', model_provider: 'openai', originator: 'codex_cli' }, 0),
  cx('turn_context', { model: 'gpt-6-astra', effort: 'high', cwd: ws }, 0),
  cx('event_msg', { type: 'user_message', message: 'synthetic' }, 1),
  cx('event_msg', { type: 'token_count', info: { last_token_usage: cu(4000, 0, 300), total_token_usage: cu(4000, 0, 300), model_context_window: 1050000 } }, 3),
  cx('event_msg', { type: 'user_message', message: 'synthetic' }, 30),
  cx('event_msg', { type: 'token_count', info: { last_token_usage: cu(5000, 4000, 200), total_token_usage: cu(9000, 4000, 500), model_context_window: 1050000 } }, 33),
].join('\n') + '\n');

const extPath = process.env.TOKALATOR_EXT_PATH || path.resolve(__dirname, '..');
const suite = path.join(extPath, 'e2e', 'suite.js');
if (extPath !== path.resolve(__dirname, '..')) {
  fs.mkdirSync(path.dirname(suite), { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'suite.js'), suite);
}
const report = path.join(tmp, 'report.json');
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('VSCODE_') && !k.startsWith('ELECTRON_')));
Object.assign(env, { CODEX_HOME: codexDir, CLAUDE_CONFIG_DIR: claudeDir, TOKALATOR_E2E_REPORT: report, TOKALATOR_E2E_SESSION_LOG: sessionLog });

const result = spawnSync(bin, [
  ws,
  `--extensionDevelopmentPath=${extPath}`,
  `--extensionTestsPath=${suite}`,
  `--user-data-dir=${path.join(tmp, 'user')}`,
  `--extensions-dir=${path.join(tmp, 'extensions')}`,
  '--disable-extensions',
  '--disable-workspace-trust',
  '--skip-welcome',
  '--skip-release-notes',
  '--disable-telemetry',
  '--new-window',
], { env, stdio: 'inherit', timeout: 300_000 });

if (!fs.existsSync(report)) {
  console.error(`No report written (exit ${result.status}${result.error ? ', ' + result.error.message : ''}). Workspace: ${tmp}`);
  process.exit(1);
}
const results = JSON.parse(fs.readFileSync(report, 'utf8'));
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name} (${r.ms} ms)${r.ok ? '' : '\n      ' + r.error.split('\n').slice(0, 3).join('\n      ')}`);
const failed = results.filter(r => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
