/**
 * GLOSSARY.md and SITE-MAP.md: deterministic, source-linked maps of a codebase, built
 * without a model or network. Port of the tokalator-context generator (same format).
 */
import { createHash } from 'crypto';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const SKIP_DIRS = new Set(['.git', '.venv', 'venv', 'env', 'node_modules', '__pycache__', '.next',
  'dist', 'build', '.tox', '.mypy_cache', '.entire', 'coverage', '.turbo']);
const SUPPORTED = ['.cjs', '.js', '.jsx', '.mjs', '.py', '.ts', '.tsx'];
const MAX_BYTES = 1_000_000;
const GENERATOR = 'tokalator-vscode-codemaps-1';

interface SymbolInfo { type: string; name: string; line: number; info: string }
interface FileInfo { file: string; symbols: SymbolInfo[]; imports: string[]; summary: string; hash: string }
interface PackageInfo { file: string; name: string; scripts: string[]; entry: string }

export function cell(value: unknown): string {
  return String(value).replace(/\|/g, '&#124;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, ' ');
}

export function link(name: string, line?: number): string {
  const label = line ? `L${line}` : cell(name);
  return `[${label}](${name.split('/').map(encodeURIComponent).join('/')}${line ? `#L${line}` : ''})`;
}

function sourcePaths(root: string): string[] {
  let names: string[];
  try {
    const out = execFileSync('git', ['-C', root, 'ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', '.'], { timeout: 15_000, maxBuffer: 64 * 1024 * 1024 });
    names = [...new Set(out.toString('utf8').split('\0').filter(Boolean))].sort();
  } catch {
    names = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
        if (entry.isSymbolicLink()) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith('.')) walk(full);
        } else {
          names.push(path.relative(root, full).split(path.sep).join('/'));
        }
      }
    };
    walk(root);
  }
  return names.filter(name => {
    const parts = name.split('/');
    if (parts.some(p => SKIP_DIRS.has(p) || p.startsWith('.'))) return false;
    if (!SUPPORTED.includes(path.extname(name)) && path.basename(name) !== 'package.json') return false;
    const full = path.join(root, name);
    try {
      return fs.lstatSync(full).isFile() && fs.realpathSync(full).startsWith(fs.realpathSync(root) + path.sep);
    } catch {
      return false;
    }
  });
}

export function pythonDetails(text: string): { symbols: SymbolInfo[]; imports: string[]; summary: string } {
  const lines = text.split('\n');
  const symbols: SymbolInfo[] = [];
  const imports = new Set<string>();
  const stack: { indent: number; name: string }[] = [];
  const docAt = (i: number) => {
    for (let j = i + 1; j < lines.length; j++) {
      const t = lines[j].trim();
      if (!t) continue;
      const m = /^[rRuU]?("""|''')(.*)/.exec(t);
      return m ? m[2].replace(/("""|''').*$/, '').trim() : '';
    }
    return '';
  };
  lines.forEach((line, i) => {
    const def = /^(\s*)(async\s+def|def|class)\s+([A-Za-z_]\w*)/.exec(line);
    if (def) {
      const indent = def[1].length;
      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
      const name = [...stack.map(s => s.name), def[3]].join('.');
      const type = def[2] === 'class' ? 'class' : def[2].startsWith('async') ? 'async function' : 'function';
      symbols.push({ type, name, line: i + 1, info: docAt(i) || 'Read source for behavior' });
      stack.push({ indent, name: def[3] });
      return;
    }
    const imp = /^\s*import\s+([\w.]+(?:\s*,\s*[\w.]+)*)/.exec(line);
    if (imp) imp[1].split(',').forEach(n => imports.add(n.trim()));
    const from = /^\s*from\s+(\.*[\w.]*)\s+import\b/.exec(line);
    if (from) imports.add(from[1]);
  });
  const first = lines.find(l => l.trim() && !l.startsWith('#'))?.trim() ?? '';
  const summary = /^[rRuU]?("""|''')/.test(first) ? first.replace(/^[rRuU]?("""|''')/, '').replace(/("""|''').*$/, '').trim() : '';
  return { symbols, imports: [...imports].sort(), summary };
}

export function jsDetails(text: string): { symbols: SymbolInfo[]; imports: string[]; summary: string } {
  const masked = text.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, m => m.replace(/[^\n]/g, ' '));
  const pattern = /^\s*(?:export\s+)?(?:default\s+)?(?:declare\s+)?(async\s+)?(function|class|interface|type|enum|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
  const comments = [...text.matchAll(/\/\*\*([\s\S]*?)\*\//g)];
  const firstLine = (comment: RegExpMatchArray) =>
    comment[1].split('\n').map(l => l.trim().replace(/^\*+/, '').trim()).find(l => l && !l.startsWith('@')) ?? '';
  const symbols: SymbolInfo[] = [];
  for (const m of masked.matchAll(pattern)) {
    const declaration = m[0].replace(/^\n+/, '');
    if (['const', 'let', 'var'].includes(m[2]) && /^\s/.test(declaration) && !declaration.includes('export')) continue;
    const start = (m.index ?? 0) + m[0].length - m[0].trimStart().length;
    const preceding = [...comments].reverse().find(c => (c.index ?? 0) + c[0].length <= start && !text.slice((c.index ?? 0) + c[0].length, start).trim());
    symbols.push({
      type: (m[1] ? 'async ' : '') + m[2],
      name: m[3],
      line: masked.slice(0, start).split('\n').length,
      info: (preceding && firstLine(preceding)) || 'JS/TS declaration; read source for behavior',
    });
  }
  const imports = new Set<string>();
  for (const m of masked.matchAll(/\bfrom\s+['"]([^'"]+)['"]|\brequire\s*\(\s*['"]([^'"]+)['"]|\bimport\s*(?:\(\s*)?['"]([^'"]+)['"]/g)) {
    const dep = m[1] ?? m[2] ?? m[3];
    if (dep) imports.add(dep);
  }
  const summary = comments.length && !text.slice(0, comments[0].index).trim() ? firstLine(comments[0]) : '';
  return { symbols, imports: [...imports].sort(), summary };
}

function role(name: string): string {
  const parts = name.split('/');
  const base = parts[parts.length - 1];
  if (['page.tsx', 'page.jsx', 'page.ts', 'page.js', 'route.ts', 'route.js'].includes(base) && parts.includes('app')) {
    const route = '/' + parts.slice(parts.indexOf('app') + 1, -1).filter(p => !p.startsWith('(') && !p.startsWith('@')).join('/');
    return `${base.startsWith('route') ? 'HTTP handler' : 'Page'}: ${route} (filesystem route; base paths/rewrites not applied)`;
  }
  if (name.toLowerCase().includes('test') || name.includes('__tests__')) return 'Test/support file (path convention)';
  if (base === 'extension.ts') return 'Editor extension entry point (filename convention)';
  if (['cli.ts', 'cli.js', '__main__.py'].includes(base)) return 'CLI entry point (filename convention)';
  return 'Source module';
}

function resolveImport(name: string, dependency: string, names: Set<string>): string | null {
  if (!dependency.startsWith('.') || name.endsWith('.py')) return null;
  const candidate = path.posix.normalize(path.posix.join(path.posix.dirname(name), dependency));
  const candidates = [candidate, ...SUPPORTED.map(e => candidate + e), ...SUPPORTED.map(e => `${candidate}/index${e}`)];
  if (/\.(m|c)?js$/.test(candidate)) candidates.push(...['.ts', '.tsx'].map(e => candidate.replace(/\.(m|c)?js$/, e)));
  return candidates.find(c => names.has(c)) ?? null;
}

export function renderCodeMaps(root: string): { files: Record<string, string>; fileCount: number; symbolCount: number } {
  const files: FileInfo[] = [];
  const packages: PackageInfo[] = [];
  const warnings: string[] = [];
  const digest = createHash('sha256').update(GENERATOR);
  for (const name of sourcePaths(root)) {
    const full = path.join(root, name);
    if (fs.statSync(full).size > MAX_BYTES) {
      warnings.push(`${name}: exceeds ${MAX_BYTES} bytes; not indexed`);
      continue;
    }
    const raw = fs.readFileSync(full);
    const text = raw.toString('utf8');
    digest.update(name + '\0').update(raw).update('\0');
    if (path.basename(name) === 'package.json') {
      try {
        const data = JSON.parse(text);
        packages.push({ file: name, name: data.name ?? '', scripts: Object.keys(data.scripts ?? {}).sort(), entry: data.main ?? '' });
      } catch {
        warnings.push(`${name}: invalid package manifest`);
      }
      continue;
    }
    const details = name.endsWith('.py') ? pythonDetails(text) : jsDetails(text);
    files.push({ file: name, ...details, hash: createHash('sha256').update(raw).digest('hex').slice(0, 12) });
  }

  const header = [`<!-- tokalator-context: ${digest.digest('hex')} -->`, '',
    'Generated from source; do not edit. Refresh with the context command.',
    'This is a navigation aid, not proof of behavior. Verify source, callers, and tests.', ''];
  const symbolCount = files.reduce((n, f) => n + f.symbols.length, 0);
  const glossary = ['# Codebase Glossary', '', ...header, `${symbolCount} symbols across ${files.length} source files.`, ''];
  const sitemap = ['# Codebase Site Map', '', ...header,
    '## How agents should use these files', '',
    '1. Locate the relevant module below and its declarations in [GLOSSARY.md](GLOSSARY.md).',
    '2. Read the source and its tests before changing behavior. Treat comments as claims to verify.',
    '3. Follow import links to inspect dependencies; aliases and dynamic dependencies may be unresolved.',
    '4. Refresh both documents before review and after edits. Run project checks separately.', '',
    '## Packages and commands', '', '| Manifest | Package | Entry | Script names |', '|---|---|---|---|',
    ...packages.map(p => `| ${link(p.file)} | ${cell(p.name)} | ${cell(p.entry)} | ${cell(p.scripts.join(', '))} |`),
    '', '## Modules and entry points', '', '| File | Role / documented purpose | Source hash |', '|---|---|---|'];
  const names = new Set(files.map(f => f.file));
  for (const f of files) {
    glossary.push(`## ${link(f.file)}`, '', '| Type | Symbol | Source | Documented purpose / limits |', '|---|---|---|---|');
    for (const s of [...f.symbols].sort((a, b) => a.line - b.line)) {
      glossary.push(`| ${cell(s.type)} | ${cell(s.name)} | ${link(f.file, s.line)} | ${cell(s.info)} |`);
    }
    if (!f.symbols.length) glossary.push('| — | No declarations extracted | — | Read source; extraction may be incomplete |');
    glossary.push('');
    sitemap.push(`| ${link(f.file)} | ${cell(f.summary || role(f.file))} | ${f.hash} |`);
  }
  sitemap.push('', '## Imports by module', '');
  for (const f of files) {
    if (!f.imports.length) continue;
    const deps = f.imports.map(d => {
      const target = resolveImport(f.file, d, names);
      return target ? link(target) : `${cell(d)} (external or unresolved)`;
    });
    sitemap.push(`- ${link(f.file)} → ${deps.join(', ')}`);
  }
  const limits = ['', '## Coverage and limitations', '',
    'Python and JS/TS use best-effort line matching for declarations, first-line docstrings or JSDoc, and imports; methods, re-exports, strings and multiline constructs can be missed or misidentified.',
    'Git projects use tracked and unignored files. Dependency/build directories, dot paths, symlinks and oversized files are excluded. Non-Git scans use directory exclusions only.',
    'No model calls, full behavioral summaries, runtime call graph, or complete route resolution are claimed.', '',
    ...(warnings.length ? warnings.map(w => `- ${cell(w)}`) : ['No scan warnings.'])];
  return {
    files: { 'GLOSSARY.md': [...glossary, ...limits].join('\n') + '\n', 'SITE-MAP.md': [...sitemap, ...limits].join('\n') + '\n' },
    fileCount: files.length,
    symbolCount,
  };
}

/** Writes only changed documents, atomically, and never through a symlink. */
export function writeCodeMaps(root: string): { updated: string[]; fileCount: number; symbolCount: number } {
  const { files, fileCount, symbolCount } = renderCodeMaps(root);
  const updated: string[] = [];
  for (const [name, content] of Object.entries(files)) {
    const target = path.join(root, name);
    if (fs.existsSync(target)) {
      if (fs.lstatSync(target).isSymbolicLink()) throw new Error(`Refusing symlink output: ${name}`);
      if (fs.readFileSync(target, 'utf8') === content) continue;
    }
    const temp = path.join(root, `.tokalator-${process.pid}-${name}`);
    fs.writeFileSync(temp, content, 'utf8');
    fs.renameSync(temp, target);
    updated.push(name);
  }
  return { updated, fileCount, symbolCount };
}
