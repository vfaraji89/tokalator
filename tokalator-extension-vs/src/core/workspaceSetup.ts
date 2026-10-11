import * as fs from 'fs';
import * as path from 'path';

export interface Command { label: string; cmd: string }

export interface ProjectFacts {
  name: string;
  description: string;
  languages: string[];
  tools: string[];
  install: string | null;
  commands: Command[];
  dirs: string[];
  tsStrict: boolean;
  codeMaps: boolean;
}

export interface PlannedFile { path: string; content: string; readBy: string; exists: boolean }

const IGNORED_DIRS = new Set(['node_modules', 'dist', 'build', 'out', 'coverage', 'target', 'venv', '__pycache__', 'vendor', 'tmp']);
const LABELS: [RegExp, string][] = [[/^(dev|start|serve)$/, 'Dev'], [/^build$/, 'Build'], [/^test$/, 'Test'], [/^(lint|lint:check)$/, 'Lint'], [/^(typecheck|type-check|check-types|tsc)$/, 'Type check'], [/^(format|fmt)$/, 'Format']];

const read = (p: string) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const exists = (root: string, ...names: string[]) => names.some(n => fs.existsSync(path.join(root, n)));
const json = (text: string): Record<string, any> => { try { return JSON.parse(text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'])\/\/.*$/gm, '$1').replace(/,(\s*[}\]])/g, '$1')); } catch { return {}; } };

export function slug(name: string): string {
  return name.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'project';
}

/** Facts read from the project's own files; nothing is guessed. */
export function detectProject(root: string): ProjectFacts {
  const pkg = json(read(path.join(root, 'package.json')));
  const facts: ProjectFacts = { name: pkg.name || path.basename(root), description: typeof pkg.description === 'string' ? pkg.description : '', languages: [], tools: [], install: null, commands: [], dirs: [], tsStrict: false, codeMaps: exists(root, 'SITE-MAP.md') };
  const add = (label: string, cmd: string) => { if (!facts.commands.some(c => c.label === label)) facts.commands.push({ label, cmd }); };

  if (pkg.name || exists(root, 'package.json')) {
    const pm = exists(root, 'pnpm-lock.yaml') ? 'pnpm' : exists(root, 'yarn.lock') ? 'yarn' : exists(root, 'bun.lockb', 'bun.lock') ? 'bun' : 'npm';
    const run = (s: string) => pm === 'npm' ? (s === 'test' || s === 'start' ? `npm ${s}` : `npm run ${s}`) : pm === 'bun' ? `bun run ${s}` : `${pm} ${s}`;
    facts.install = pm === 'yarn' ? 'yarn' : `${pm} install`;
    const scripts = Object.keys(pkg.scripts ?? {});
    for (const [re, label] of LABELS) { const s = scripts.find(k => re.test(k)); if (s) add(label, run(s)); }
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (exists(root, 'tsconfig.json') || deps.typescript) facts.languages.push('TypeScript'); else facts.languages.push('JavaScript');
    for (const [dep, tool] of [['eslint', 'ESLint'], ['prettier', 'Prettier'], ['jest', 'Jest'], ['vitest', 'Vitest'], ['@playwright/test', 'Playwright'], ['mocha', 'Mocha'], ['next', 'Next.js'], ['react', 'React']] as const) if (deps[dep]) facts.tools.push(tool);
    facts.tsStrict = json(read(path.join(root, 'tsconfig.json'))).compilerOptions?.strict === true;
  }
  if (exists(root, 'pyproject.toml', 'requirements.txt', 'setup.py')) {
    facts.languages.push('Python');
    const py = read(path.join(root, 'pyproject.toml')) + read(path.join(root, 'requirements.txt')) + read(path.join(root, 'requirements-dev.txt'));
    facts.install ??= exists(root, 'uv.lock') ? 'uv sync' : exists(root, 'poetry.lock') ? 'poetry install' : exists(root, 'requirements.txt') ? 'pip install -r requirements.txt' : 'pip install -e .';
    if (/pytest/.test(py)) { facts.tools.push('pytest'); add('Test', 'pytest'); }
    if (/ruff/.test(py) || exists(root, 'ruff.toml')) { facts.tools.push('Ruff'); add('Lint', 'ruff check .'); }
    if (/mypy/.test(py)) { facts.tools.push('mypy'); add('Type check', 'mypy .'); }
  }
  if (exists(root, 'go.mod')) { facts.languages.push('Go'); add('Build', 'go build ./...'); add('Test', 'go test ./...'); add('Lint', 'go vet ./...'); }
  if (exists(root, 'Cargo.toml')) { facts.languages.push('Rust'); add('Build', 'cargo build'); add('Test', 'cargo test'); add('Lint', 'cargo clippy'); }
  const make = read(path.join(root, 'Makefile'));
  for (const [, target] of make.matchAll(/^([a-zA-Z][\w-]*):(?!=)/gm)) {
    const label = LABELS.find(([re]) => re.test(target))?.[1];
    if (label) add(label, `make ${target}`);
  }

  try {
    facts.dirs = fs.readdirSync(root, { withFileTypes: true })
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && !IGNORED_DIRS.has(e.name))
      .map(e => e.name).sort().slice(0, 15);
  } catch { /* unreadable root */ }
  return facts;
}

const section = (title: string, lines: string[]) => (lines.length ? [`## ${title}`, '', ...lines, ''] : []);
const find = (f: ProjectFacts, label: string) => f.commands.find(c => c.label === label)?.cmd;

/** AGENTS.md: the one instruction file Codex and VS Code read directly and Claude Code reads through CLAUDE.md. */
export function buildAgentsMd(f: ProjectFacts): string {
  const test = find(f, 'Test'), lint = find(f, 'Lint'), types = find(f, 'Type check');
  return [
    `# ${f.name}`,
    '',
    ...(f.description ? [f.description, ''] : []),
    ...section('Stack', f.languages.length ? [`- ${[...f.languages, ...f.tools].join(', ')}`] : []),
    ...section('Project structure', [...f.dirs.map(d => `- \`${d}/\``), ...(f.codeMaps ? ['', 'Read `SITE-MAP.md` (modules, routes, imports) and `GLOSSARY.md` (declarations with source links) before searching the code.'] : [])]),
    ...section('Commands', [...(f.install ? [`- Install: \`${f.install}\``] : []), ...f.commands.map(c => `- ${c.label}: \`${c.cmd}\``)]),
    ...section('Code style', [
      ...(f.tsStrict ? ['- TypeScript strict mode is on. Fix type errors instead of suppressing them.'] : []),
      ...(lint ? [`- Run \`${lint}\` and keep it clean.`] : []),
      '- Match the patterns in nearby files before adding new ones.',
      '- Keep changes small and focused on the task.',
    ]),
    ...section('Testing', [
      ...(test ? [`- Run \`${test}\` after changing code, and add or update tests for changed behavior.`] : ['- Add or update tests for changed behavior.']),
      ...(types ? [`- Run \`${types}\` before finishing.`] : []),
    ]),
    ...section('Security', [
      '- Never read, print, or commit secret files: `.env*`, `*.pem`, `*.key`, credentials and service-account files.',
      '- Do not add dependencies without saying why.',
    ]),
  ].join('\n').replace(/\n+$/, '\n');
}

/** A checks skill: loaded on demand, so the procedure costs nothing until an agent needs it. */
export function buildChecksSkill(f: ProjectFacts): { name: string; content: string } | null {
  const steps = (['Type check', 'Lint', 'Test', 'Build'] as const).map(l => [l, find(f, l)] as const).filter((x): x is readonly [typeof x[0], string] => !!x[1]);
  if (steps.length === 0) return null;
  const name = `${slug(f.name)}-checks`;
  return {
    name,
    content: [
      '---',
      `name: ${name}`,
      `description: Run the ${f.name} checks (${steps.map(([l]) => l.toLowerCase()).join(', ')}) and fix failures. Use after changing code in this repository and before saying the work is done.`,
      '---',
      '',
      `# ${f.name} checks`,
      '',
      'Run these in order from the repository root. Stop at the first failure, fix it, then run that step again.',
      '',
      ...steps.map(([l, cmd], i) => `${i + 1}. ${l}: \`${cmd}\``),
      '',
      '## Fixing failures',
      '',
      '- Fix the cause in the code. Do not skip, disable, or delete checks or tests to make them pass.',
      '- If a failure is unrelated to your change, leave it and say so.',
      '',
      '## Report',
      '',
      '- List the commands you ran and their result.',
      '- Say what you could not verify.',
      '',
    ].join('\n'),
  };
}

export const SKILL_TARGETS = [
  { dir: '.agents/skills', readBy: 'Codex and VS Code' },
  { dir: '.claude/skills', readBy: 'Claude Code and VS Code' },
];

/** Missing agent instruction files. Existing files are never overwritten. */
export function planAgentFiles(root: string, f: ProjectFacts): PlannedFile[] {
  const plan = [
    { path: 'AGENTS.md', content: buildAgentsMd(f), readBy: 'Codex, VS Code Copilot, Cursor and others' },
    { path: 'CLAUDE.md', content: '@AGENTS.md\n', readBy: 'Claude Code (imports AGENTS.md)' },
  ];
  return plan.map(p => ({ ...p, exists: fs.existsSync(path.join(root, p.path)) }));
}

export function planSkill(root: string, f: ProjectFacts): PlannedFile[] {
  const skill = buildChecksSkill(f);
  if (!skill) return [];
  return SKILL_TARGETS.map(t => {
    const p = `${t.dir}/${skill.name}/SKILL.md`;
    return { path: p, content: skill.content, readBy: t.readBy, exists: fs.existsSync(path.join(root, p)) };
  });
}

export function writePlanned(root: string, files: PlannedFile[]): string[] {
  const written: string[] = [];
  for (const file of files) {
    const full = path.join(root, file.path);
    if (fs.existsSync(full)) continue;
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, file.content, 'utf8');
    written.push(file.path);
  }
  return written;
}
