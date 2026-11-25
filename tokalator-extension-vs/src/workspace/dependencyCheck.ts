import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export type Ecosystem = 'npm' | 'PyPI' | 'Go' | 'crates.io' | 'RubyGems' | 'Packagist';
export type Severity = 'critical' | 'high' | 'moderate' | 'low' | 'unrated';

export interface Pkg { ecosystem: Ecosystem; name: string; version: string; direct: boolean }
export interface Lockfile { file: string; dir: string; ecosystem: Ecosystem; tool: string; packages: Pkg[] }
export interface Vulnerability { id: string; ecosystem: Ecosystem; name: string; version: string; direct: boolean; severity: Severity; summary: string; url: string; fixed: string | null; fix: 'safe' | 'major' | 'none'; lockfile: string }
export interface OutdatedPackage { ecosystem: Ecosystem; name: string; current: string; latest: string; bump: 'patch' | 'minor' | 'major'; lockfile: string }
export interface RuntimeStatus { name: string; version: string; cycle: string; status: 'supported' | 'security' | 'eol' | 'unknown'; eol?: string; recommended?: string; wants?: string }
export interface SafeCommand { dir: string; cmd: string; what: string }
export interface DependencyReport { lockfiles: Lockfile[]; vulnerabilities: Vulnerability[]; outdated: OutdatedPackage[]; runtimes: RuntimeStatus[]; commands: SafeCommand[]; notes: string[]; checkedAt: string }

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', 'vendor', 'target', '.next', 'coverage', '.venv', 'venv', '__pycache__']);
const SEVERITIES: Severity[] = ['critical', 'high', 'moderate', 'low', 'unrated'];

// ---------- lockfile parsers (pure) ----------

const jsonOf = (text: string): any => { try { return JSON.parse(text); } catch { return null; } };
const splitName = (spec: string) => { const at = spec.lastIndexOf('@'); return at > 0 ? [spec.slice(0, at), spec.slice(at + 1)] : [spec, '']; };

export function parsePackageLock(text: string, direct: Set<string>): Pkg[] {
  const j = jsonOf(text);
  const out: Pkg[] = [];
  for (const [key, v] of Object.entries<any>(j?.packages ?? {})) {
    if (!key || !v?.version || v.link) continue;
    const name = key.slice(key.lastIndexOf('node_modules/') + 13);
    out.push({ ecosystem: 'npm', name, version: v.version, direct: key === `node_modules/${name}` && direct.has(name) });
  }
  if (!out.length) for (const [name, v] of Object.entries<any>(j?.dependencies ?? {})) if (v?.version) out.push({ ecosystem: 'npm', name, version: v.version, direct: direct.has(name) });
  return out;
}

export function parsePnpmLock(text: string, direct: Set<string>): Pkg[] {
  const section = text.split(/^packages:\s*$/m)[1]?.split(/^\S/m)[0] ?? '';
  return [...section.matchAll(/^ {2}['"]?\/?((?:@[^/@\s'"]+\/)?[^@\s'"/]+)[@/]([0-9][^('":\s]*)/gm)]
    .map(([, name, version]) => ({ ecosystem: 'npm' as const, name, version, direct: direct.has(name) }));
}

export function parseYarnLock(text: string, direct: Set<string>): Pkg[] {
  const out: Pkg[] = [];
  for (const block of text.split(/\n(?=\S)/)) {
    const header = block.split('\n')[0].replace(/:$/, '').split(',')[0].trim().replace(/^"|"$/g, '');
    const version = block.match(/\n\s+version:? "?([^"\n]+)"?/)?.[1];
    if (!version || header.startsWith('#') || header.startsWith('__') || /@(workspace|patch|file|link):/.test(header)) continue;
    const name = splitName(header.replace(/@npm:/, '@'))[0];
    if (name) out.push({ ecosystem: 'npm', name, version, direct: direct.has(name) });
  }
  return out;
}

export function parseBunLock(text: string, direct: Set<string>): Pkg[] {
  return [...text.matchAll(/^\s+"[^"]+": \["((?:@[^@"/]+\/)?[^@"]+)@([0-9][^"]*)"/gm)]
    .map(([, name, version]) => ({ ecosystem: 'npm' as const, name, version, direct: direct.has(name) }));
}

export function parseTomlPackages(text: string, ecosystem: 'PyPI' | 'crates.io', direct: (n: string) => boolean): Pkg[] {
  return text.split(/^\[\[package\]\]\s*$/m).slice(1).flatMap(block => {
    const name = block.match(/^name = "([^"]+)"/m)?.[1], version = block.match(/^version = "([^"]+)"/m)?.[1];
    if (!name || !version) return [];
    if (ecosystem === 'crates.io' && !/^source = "registry\+/m.test(block)) return [];
    if (ecosystem === 'PyPI' && /^source = \{ (editable|virtual) =/m.test(block)) return [];
    return [{ ecosystem, name, version, direct: direct(name) }];
  });
}

export function parseRequirements(text: string): Pkg[] {
  return [...text.matchAll(/^([A-Za-z0-9_.-]+)(?:\[[^\]]*\])?==([^\s;#]+)/gm)].map(([, name, version]) => ({ ecosystem: 'PyPI' as const, name, version, direct: true }));
}

export function parsePipfileLock(text: string): Pkg[] {
  const j = jsonOf(text);
  return ['default', 'develop'].flatMap(s => Object.entries<any>(j?.[s] ?? {}).filter(([, v]) => typeof v?.version === 'string').map(([name, v]) => ({ ecosystem: 'PyPI' as const, name, version: v.version.replace(/^==/, ''), direct: true })));
}

export function parseGoMod(text: string): Pkg[] {
  const lines = [...text.matchAll(/^require\s+(\S+)\s+(v\S+)(.*)$/gm), ...[...text.matchAll(/^require\s*\(([\s\S]*?)^\)/gm)].flatMap(m => [...m[1].matchAll(/^\s+(\S+)\s+(v\S+)(.*)$/gm)])];
  return lines.map(([, name, version, rest]) => ({ ecosystem: 'Go' as const, name, version, direct: !/\/\/ indirect/.test(rest) }));
}

export function parseGemfileLock(text: string): Pkg[] {
  const deps = new Set([...(text.split(/^DEPENDENCIES\s*$/m)[1] ?? '').matchAll(/^ {2}([^\s!(]+)/gm)].map(m => m[1]));
  return [...text.matchAll(/^ {4}([^\s(]+) \(([0-9][^)\s]*)\)$/gm)].map(([, name, v]) => ({ ecosystem: 'RubyGems' as const, name, version: v.replace(/-[a-z].*$/, ''), direct: deps.has(name) }));
}

export function parseComposerLock(text: string, direct: Set<string>): Pkg[] {
  const j = jsonOf(text);
  return [...(j?.packages ?? []), ...(j?.['packages-dev'] ?? [])].filter((p: any) => p?.name && p?.version && !String(p.version).startsWith('dev-'))
    .map((p: any) => ({ ecosystem: 'Packagist' as const, name: p.name, version: String(p.version).replace(/^v/, ''), direct: direct.has(p.name) }));
}

// ---------- discovery ----------

const read = (p: string) => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const keysOf = (o: unknown) => (o && typeof o === 'object' ? Object.keys(o as object) : []);

function lockfilesIn(root: string, dir: string): Lockfile[] {
  const has = (f: string) => fs.existsSync(path.join(dir, f));
  const rel = (f: string) => path.relative(root, path.join(dir, f)) || f;
  const pkg = jsonOf(read(path.join(dir, 'package.json')));
  const jsDirect = new Set([...keysOf(pkg?.dependencies), ...keysOf(pkg?.devDependencies), ...keysOf(pkg?.optionalDependencies)]);
  const out: Lockfile[] = [];
  const add = (file: string, ecosystem: Ecosystem, tool: string, packages: Pkg[]) => { if (packages.length) out.push({ file: rel(file), dir, ecosystem, tool, packages }); };
  if (has('package-lock.json')) add('package-lock.json', 'npm', 'npm', parsePackageLock(read(path.join(dir, 'package-lock.json')), jsDirect));
  else if (has('pnpm-lock.yaml')) add('pnpm-lock.yaml', 'npm', 'pnpm', parsePnpmLock(read(path.join(dir, 'pnpm-lock.yaml')), jsDirect));
  else if (has('yarn.lock')) add('yarn.lock', 'npm', 'yarn', parseYarnLock(read(path.join(dir, 'yarn.lock')), jsDirect));
  else if (has('bun.lock')) add('bun.lock', 'npm', 'bun', parseBunLock(read(path.join(dir, 'bun.lock')), jsDirect));
  const pyproject = read(path.join(dir, 'pyproject.toml')).toLowerCase();
  const pyDirect = (n: string) => new RegExp(`["'\\s]${n.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[<>=~!;"'\\[]`).test(pyproject);
  if (has('uv.lock')) add('uv.lock', 'PyPI', 'uv', parseTomlPackages(read(path.join(dir, 'uv.lock')), 'PyPI', pyDirect));
  else if (has('poetry.lock')) add('poetry.lock', 'PyPI', 'poetry', parseTomlPackages(read(path.join(dir, 'poetry.lock')), 'PyPI', pyDirect));
  else if (has('Pipfile.lock')) add('Pipfile.lock', 'PyPI', 'pipenv', parsePipfileLock(read(path.join(dir, 'Pipfile.lock'))));
  else if (has('requirements.txt')) add('requirements.txt', 'PyPI', 'pip', parseRequirements(read(path.join(dir, 'requirements.txt'))));
  if (has('go.mod')) add('go.mod', 'Go', 'go', parseGoMod(read(path.join(dir, 'go.mod'))));
  if (has('Cargo.lock')) {
    const cargo = read(path.join(dir, 'Cargo.toml'));
    add('Cargo.lock', 'crates.io', 'cargo', parseTomlPackages(read(path.join(dir, 'Cargo.lock')), 'crates.io', n => new RegExp(`^${n.replace(/[-_]/g, '[-_]')}\\s*=`, 'm').test(cargo)));
  }
  if (has('Gemfile.lock')) add('Gemfile.lock', 'RubyGems', 'bundler', parseGemfileLock(read(path.join(dir, 'Gemfile.lock'))));
  if (has('composer.lock')) {
    const c = jsonOf(read(path.join(dir, 'composer.json')));
    add('composer.lock', 'Packagist', 'composer', parseComposerLock(read(path.join(dir, 'composer.lock')), new Set([...keysOf(c?.require), ...keysOf(c?.['require-dev'])])));
  }
  return out;
}

/** Every supported lockfile in the workspace, down to three folder levels. */
export function findLockfiles(root: string, depth = 3): Lockfile[] {
  const out = lockfilesIn(root, root);
  if (depth > 0) {
    let entries: fs.Dirent[] = [];
    try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { /* unreadable */ }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
      for (const lf of findLockfilesFrom(root, path.join(root, e.name), depth - 1)) out.push(lf);
    }
  }
  return out;
}

function findLockfilesFrom(root: string, dir: string, depth: number): Lockfile[] {
  const out = lockfilesIn(root, dir);
  if (depth <= 0) return out;
  let entries: fs.Dirent[] = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) if (e.isDirectory() && !e.name.startsWith('.') && !SKIP_DIRS.has(e.name)) out.push(...findLockfilesFrom(root, path.join(dir, e.name), depth - 1));
  return out;
}

// ---------- versions ----------

const nums = (v: string) => (v.replace(/^v/, '').match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/) ?? []).slice(1).map(x => Number(x ?? 0));
export function compareVersions(a: string, b: string): number {
  const [x, y] = [nums(a), nums(b)];
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
}
export function bumpType(from: string, to: string): 'patch' | 'minor' | 'major' | null {
  const [a, b] = [nums(from), nums(to)];
  if (!a.length || !b.length || compareVersions(to, from) <= 0) return null;
  return a[0] !== b[0] ? 'major' : a[1] !== b[1] ? 'minor' : 'patch';
}
const isPrerelease = (v: string) => /-(alpha|beta|rc|canary|next|pre|dev)/i.test(v);

/** Lowest fixed version above the installed one, from OSV affected ranges for this package. */
export function fixedVersion(vuln: any, ecosystem: string, name: string, current: string): string | null {
  const fixes = (vuln?.affected ?? [])
    .filter((a: any) => a.package?.ecosystem === ecosystem && a.package?.name?.toLowerCase() === name.toLowerCase())
    .flatMap((a: any) => (a.ranges ?? []).flatMap((r: any) => (r.events ?? []).map((e: any) => e.fixed).filter(Boolean)))
    .filter((v: string) => compareVersions(v, current) > 0)
    .sort(compareVersions);
  return fixes[0] ?? null;
}

export function severityOf(vuln: any): Severity {
  const s = String(vuln?.database_specific?.severity ?? '').toLowerCase();
  return s === 'critical' || s === 'high' || s === 'moderate' || s === 'low' ? s : s === 'medium' ? 'moderate' : 'unrated';
}

// ---------- network ----------

async function getJson(url: string, init?: RequestInit): Promise<any> {
  try {
    const res = await fetch(url, { ...init, headers: { 'User-Agent': 'tokalator-vscode (https://tokalator.ai)', ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(10_000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function pool<T, R>(items: T[], size: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]); }
  }));
  return out;
}

const goEscape = (m: string) => m.replace(/[A-Z]/g, c => '!' + c.toLowerCase());
async function latestVersion(p: Pkg): Promise<string | null> {
  switch (p.ecosystem) {
    case 'npm': return (await getJson(`https://registry.npmjs.org/${p.name.replace('/', '%2F')}/latest`))?.version ?? null;
    case 'PyPI': return (await getJson(`https://pypi.org/pypi/${encodeURIComponent(p.name)}/json`))?.info?.version ?? null;
    case 'crates.io': return (await getJson(`https://crates.io/api/v1/crates/${encodeURIComponent(p.name)}`))?.crate?.max_stable_version ?? null;
    case 'Go': return (await getJson(`https://proxy.golang.org/${goEscape(p.name)}/@latest`))?.Version ?? null;
    case 'RubyGems': return (await getJson(`https://rubygems.org/api/v1/versions/${encodeURIComponent(p.name)}/latest.json`))?.version ?? null;
    case 'Packagist': {
      const list = (await getJson(`https://repo.packagist.org/p2/${p.name}.json`))?.packages?.[p.name] ?? [];
      return list.map((x: any) => String(x.version).replace(/^v/, '')).find((v: string) => !isPrerelease(v)) ?? null;
    }
  }
}

function run(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise(resolve => execFile(cmd, args, { cwd, timeout: 10_000, shell: process.platform === 'win32' }, (_e, stdout, stderr) => resolve(`${stdout ?? ''}${stderr ?? ''}`)));
}

const RUNTIMES: { eco: Ecosystem; name: string; product: string; cmd: string; args: string[]; cycle: (out: string) => string | null }[] = [
  { eco: 'npm', name: 'Node.js', product: 'nodejs', cmd: 'node', args: ['--version'], cycle: o => o.match(/v(\d+)\./)?.[1] ?? null },
  { eco: 'PyPI', name: 'Python', product: 'python', cmd: 'python3', args: ['--version'], cycle: o => o.match(/Python (\d+\.\d+)/)?.[1] ?? null },
  { eco: 'Go', name: 'Go', product: 'go', cmd: 'go', args: ['version'], cycle: o => o.match(/go(\d+\.\d+)/)?.[1] ?? null },
  { eco: 'RubyGems', name: 'Ruby', product: 'ruby', cmd: 'ruby', args: ['--version'], cycle: o => o.match(/ruby (\d+\.\d+)/)?.[1] ?? null },
  { eco: 'Packagist', name: 'PHP', product: 'php', cmd: 'php', args: ['--version'], cycle: o => o.match(/PHP (\d+\.\d+)/)?.[1] ?? null },
];

/** Support status from an endoflife.date product list. */
export function runtimeStatus(name: string, version: string, cycle: string, cycles: any[] | null, today: string): RuntimeStatus {
  const c = cycles?.find(x => String(x.cycle) === cycle);
  const supported = (cycles ?? []).filter(x => typeof x.eol !== 'string' || x.eol > today).filter(x => !x.releaseDate || x.releaseDate <= today);
  const lts = supported.filter(x => typeof x.lts === 'string' && x.lts <= today);
  const recommended = String((lts[0] ?? supported[0])?.cycle ?? '') || undefined;
  if (!c) return { name, version, cycle, status: 'unknown', recommended };
  const eol = typeof c.eol === 'string' ? c.eol : undefined;
  const status = c.eol === true || (eol && eol <= today) ? 'eol' : typeof c.support === 'string' && c.support <= today ? 'security' : 'supported';
  return { name, version, cycle, status, eol, recommended };
}

const SAFE: Record<string, { cmd: string; what: string; fixOnly?: boolean }[]> = {
  npm: [{ cmd: 'npm audit fix', what: 'applies vulnerability fixes that stay within your version ranges', fixOnly: true }, { cmd: 'npm update', what: 'updates to the newest versions your ranges allow' }],
  pnpm: [{ cmd: 'pnpm update', what: 'updates to the newest versions your ranges allow' }],
  yarn: [{ cmd: 'yarn upgrade', what: 'updates to the newest versions your ranges allow (Yarn 1; use `yarn up` on Yarn 2+)' }],
  bun: [{ cmd: 'bun update', what: 'updates to the newest versions your ranges allow' }],
  uv: [{ cmd: 'uv lock --upgrade', what: 're-resolves to the newest versions your constraints allow' }],
  poetry: [{ cmd: 'poetry update', what: 'updates within your pyproject constraints' }],
  cargo: [{ cmd: 'cargo update', what: 'updates to the newest semver-compatible versions' }],
  go: [{ cmd: 'go get -u=patch ./... && go mod tidy', what: 'takes patch releases of your modules' }],
  bundler: [{ cmd: 'bundle update --conservative --patch', what: 'takes patch releases, keeping other gems where they are' }],
  composer: [{ cmd: 'composer update', what: 'updates within your composer.json constraints' }],
};

/**
 * Reads every lockfile, asks OSV.dev for known vulnerabilities and each registry for the latest version
 * of direct dependencies, and checks installed runtimes against endoflife.date. Package names and versions
 * are sent to those public services; nothing goes to Tokalator.
 */
export async function runDependencyCheck(root: string, today = new Date().toISOString().slice(0, 10)): Promise<DependencyReport> {
  const lockfiles = findLockfiles(root);
  const report: DependencyReport = { lockfiles, vulnerabilities: [], outdated: [], runtimes: [], commands: [], notes: [], checkedAt: new Date().toISOString() };
  if (!lockfiles.length) {
    report.notes.push('No lockfiles found (package-lock.json, pnpm-lock.yaml, yarn.lock, bun.lock, uv.lock, poetry.lock, Pipfile.lock, requirements.txt with pins, go.mod, Cargo.lock, Gemfile.lock, composer.lock).');
  }

  const unique = new Map<string, { pkg: Pkg; lockfile: string }>();
  for (const lf of lockfiles) for (const p of lf.packages) {
    const k = `${p.ecosystem}|${p.name}|${p.version}`;
    const prev = unique.get(k);
    if (!prev || (p.direct && !prev.pkg.direct)) unique.set(k, { pkg: p, lockfile: lf.file });
  }
  const entries = [...unique.values()];

  const hits: { entry: (typeof entries)[number]; ids: string[] }[] = [];
  for (let i = 0; i < entries.length; i += 1000) {
    const batch = entries.slice(i, i + 1000);
    const res = await getJson('https://api.osv.dev/v1/querybatch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ queries: batch.map(e => ({ package: { name: e.pkg.name, ecosystem: e.pkg.ecosystem }, version: e.pkg.version })) }) });
    if (!res) { report.notes.push('OSV.dev could not be reached, so vulnerabilities were not checked.'); break; }
    res.results?.forEach((r: any, j: number) => { if (r?.vulns?.length) hits.push({ entry: batch[j], ids: r.vulns.map((v: any) => v.id) }); });
  }
  const ids = [...new Set(hits.flatMap(h => h.ids))].slice(0, 300);
  const details = new Map((await pool(ids, 10, async id => [id, await getJson(`https://api.osv.dev/v1/vulns/${id}`)] as const)).filter(([, d]) => d));
  for (const h of hits) {
    const seen = new Set<string>();
    for (const id of h.ids) {
      const d = details.get(id);
      if (!d) continue;
      const alias = [d.id, ...(d.aliases ?? [])].find((a: string) => a.startsWith('GHSA-')) ?? d.id;
      if (seen.has(alias)) continue;
      seen.add(alias);
      const { pkg } = h.entry;
      const fixed = fixedVersion(d, pkg.ecosystem, pkg.name, pkg.version);
      report.vulnerabilities.push({
        id: alias, ecosystem: pkg.ecosystem, name: pkg.name, version: pkg.version, direct: pkg.direct,
        severity: severityOf(d), summary: d.summary ?? d.details?.split('\n')[0]?.slice(0, 140) ?? id,
        url: `https://osv.dev/vulnerability/${d.id}`, fixed, fix: !fixed ? 'none' : bumpType(pkg.version, fixed) === 'major' ? 'major' : 'safe', lockfile: h.entry.lockfile,
      });
    }
  }
  report.vulnerabilities.sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity) || a.name.localeCompare(b.name));

  const direct = entries.filter(e => e.pkg.direct).slice(0, 250);
  const latest = await pool(direct, 10, e => latestVersion(e.pkg));
  direct.forEach((e, i) => {
    const l = latest[i];
    const bump = l && !isPrerelease(l) ? bumpType(e.pkg.version, l) : null;
    if (l && bump) report.outdated.push({ ecosystem: e.pkg.ecosystem, name: e.pkg.name, current: e.pkg.version, latest: l, bump, lockfile: e.lockfile });
  });
  report.outdated.sort((a, b) => ['major', 'minor', 'patch'].indexOf(a.bump) - ['major', 'minor', 'patch'].indexOf(b.bump) || a.name.localeCompare(b.name));

  const ecos = new Set(lockfiles.map(l => l.ecosystem));
  for (const rt of RUNTIMES.filter(r => ecos.has(r.eco))) {
    const out = await run(rt.cmd, rt.args, root);
    const cycle = rt.cycle(out);
    if (!cycle) { report.notes.push(`${rt.name} was not found on PATH.`); continue; }
    const status = runtimeStatus(rt.name, out.trim().split('\n')[0], cycle, await getJson(`https://endoflife.date/api/${rt.product}.json`), today);
    if (rt.eco === 'npm') status.wants = jsonOf(read(path.join(root, 'package.json')))?.engines?.node;
    report.runtimes.push(status);
  }

  for (const lf of lockfiles) {
    const safeFix = report.vulnerabilities.some(v => v.lockfile === lf.file && v.fix === 'safe');
    const needsUpdate = safeFix || report.vulnerabilities.some(v => v.lockfile === lf.file && !v.direct) || report.outdated.some(o => o.lockfile === lf.file && o.bump !== 'major');
    for (const { fixOnly, ...cmd } of SAFE[lf.tool] ?? []) if (fixOnly ? safeFix : needsUpdate) report.commands.push({ dir: lf.dir, ...cmd });
  }
  return report;
}

export function severityCounts(v: Vulnerability[]): Record<Severity, number> {
  const c: Record<Severity, number> = { critical: 0, high: 0, moderate: 0, low: 0, unrated: 0 };
  for (const x of v) c[x.severity]++;
  return c;
}

export function dependencySummary(r: DependencyReport): string {
  const c = severityCounts(r.vulnerabilities);
  const bits = SEVERITIES.filter(s => c[s] > 0).map(s => `${c[s]} ${s}`);
  if (r.outdated.length) bits.push(`${r.outdated.length} outdated`);
  for (const rt of r.runtimes.filter(x => x.status === 'eol')) bits.push(`${rt.name} ${rt.cycle} end of life`);
  if (bits.length) return bits.join(' · ');
  return r.lockfiles.length ? `${r.lockfiles.reduce((n, l) => n + l.packages.length, 0)} packages checked, nothing to fix` : 'No lockfiles found';
}

export function dependencyReportMarkdown(r: DependencyReport, root: string): string {
  const total = r.lockfiles.reduce((n, l) => n + l.packages.length, 0);
  const out = ['# Dependency Check', '', `${total} packages in ${r.lockfiles.length} lockfile(s), checked ${new Date(r.checkedAt).toLocaleString()}.`, ''];
  if (r.lockfiles.length) out.push(...r.lockfiles.map(l => `- \`${l.file}\` (${l.tool}, ${l.ecosystem}): ${l.packages.length} packages, ${l.packages.filter(p => p.direct).length} direct`), '');
  if (r.runtimes.length) {
    out.push('## Runtimes', '');
    for (const rt of r.runtimes) {
      const state = { supported: 'supported', security: 'security fixes only', eol: '**end of life, no more security fixes**', unknown: 'support status unknown' }[rt.status];
      out.push(`- ${rt.name} ${rt.cycle} (\`${rt.version}\`): ${state}${rt.eol ? `, until ${rt.eol}` : ''}.${rt.recommended && rt.recommended !== rt.cycle && rt.status !== 'supported' ? ` Recommended: ${rt.name} ${rt.recommended}.` : ''}${rt.wants ? ` The project asks for \`${rt.wants}\`.` : ''}`);
    }
    out.push('', 'Source: endoflife.date.', '');
  }
  const c = severityCounts(r.vulnerabilities);
  out.push('## Security', '');
  if (r.vulnerabilities.length) {
    out.push(SEVERITIES.filter(s => c[s]).map(s => `${c[s]} ${s}`).join(', ') + ' (OSV.dev).', '', '| Package | Lockfile | Installed | Severity | Advisory | Fix |', '|---|---|---|---|---|---|');
    for (const v of r.vulnerabilities) {
      const fix = v.fix === 'safe' ? `Upgrade to ${v.fixed}` : v.fix === 'major' ? `${v.fixed} is a major change; upgrade by hand and test` : 'No fixed version yet';
      out.push(`| ${v.name}${v.direct ? '' : ' (indirect)'} | \`${v.lockfile}\` | ${v.version} | ${v.severity} | [${v.id}](${v.url}): ${v.summary.replace(/\|/g, '/')} | ${fix} |`);
    }
    if (r.vulnerabilities.some(v => !v.direct)) out.push('', 'Indirect packages are fixed by updating the package that depends on them, or by your package manager\'s update command below.');
  } else {
    out.push(r.lockfiles.length && !r.notes.some(n => n.startsWith('OSV')) ? 'No known vulnerabilities.' : 'Not checked.');
  }
  out.push('', '## Outdated direct dependencies', '');
  if (r.outdated.length) {
    out.push('| Package | Lockfile | Current | Latest | Change |', '|---|---|---|---|---|');
    for (const o of r.outdated) out.push(`| ${o.name} | \`${o.lockfile}\` | ${o.current} | ${o.latest} | ${o.bump} |`);
  } else {
    out.push(r.lockfiles.length ? 'All direct dependencies are on their latest release.' : 'Not checked.');
  }
  out.push('', '## Safe next steps', '');
  if (r.commands.length) for (const s of r.commands) out.push(`- In \`${path.relative(root, s.dir) || '.'}\`: \`${s.cmd}\` ${s.what}.`);
  const majors = r.outdated.filter(o => o.bump === 'major');
  if (majors.length) out.push(`- Major upgrades (${majors.slice(0, 8).map(o => `${o.name} ${o.current} to ${o.latest}`).join(', ')}${majors.length > 8 ? ', …' : ''}): read each changelog, upgrade one at a time, and run your tests.`);
  out.push('- Never force-apply fixes (for example `npm audit fix --force`): that can install a different major version, sometimes an older one.');
  if (r.notes.length) out.push('', ...r.notes.map(n => `> ${n}`));
  out.push('', '_Package names and versions were sent to OSV.dev, the package registries and endoflife.date to run this check. Nothing was sent to Tokalator._');
  return out.join('\n') + '\n';
}
