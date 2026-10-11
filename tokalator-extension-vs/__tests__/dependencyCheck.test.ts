import { bumpType, fixedVersion, parseBunLock, parseComposerLock, parseGemfileLock, parseGoMod, parsePackageLock, parsePipfileLock, parsePnpmLock, parseRequirements, parseTomlPackages, parseYarnLock, runtimeStatus, severityOf } from '../src/core/dependencyCheck';

const d = new Set(['next', '@types/node']);
const pick = (p: { name: string; version: string; direct: boolean }[]) => p.map(x => `${x.name}@${x.version}${x.direct ? '*' : ''}`);

describe('lockfile parsers', () => {
  test('package-lock v3 marks direct dependencies and nested copies', () => {
    const lock = JSON.stringify({ packages: { '': { name: 'app' }, 'node_modules/next': { version: '16.0.1' }, 'node_modules/@types/node': { version: '24.1.0' }, 'node_modules/a/node_modules/next': { version: '15.0.0' }, 'node_modules/linked': { link: true } } });
    expect(pick(parsePackageLock(lock, d))).toEqual(['next@16.0.1*', '@types/node@24.1.0*', 'next@15.0.0']);
  });
  test('pnpm-lock v9 packages section', () => {
    const lock = "lockfileVersion: '9.0'\nimporters:\n  .:\n    dependencies:\n      next: 16.0.1\npackages:\n  next@16.0.1:\n    resolution: {}\n  '@types/node@24.1.0':\n    resolution: {}\n  react-dom@19.0.0(react@19.0.0):\n    resolution: {}\nsnapshots:\n  x@1.0.0: {}\n";
    expect(pick(parsePnpmLock(lock, d))).toEqual(['next@16.0.1*', '@types/node@24.1.0*', 'react-dom@19.0.0']);
  });
  test('yarn v1 and berry', () => {
    expect(pick(parseYarnLock('# yarn lockfile v1\n\n"@types/node@^24":\n  version "24.1.0"\n\nnext@^16, next@16.0.1:\n  version "16.0.1"\n', d))).toEqual(['@types/node@24.1.0*', 'next@16.0.1*']);
    expect(pick(parseYarnLock('__metadata:\n  version: 8\n\n"next@npm:^16":\n  version: 16.0.1\n\n"app@workspace:.":\n  version: 0.0.0\n', d))).toEqual(['next@16.0.1*']);
  });
  test('bun.lock text format', () => {
    expect(pick(parseBunLock('{\n  "packages": {\n    "next": ["next@16.0.1", "", {}, "sha"],\n    "@types/node": ["@types/node@24.1.0", "", {}, "sha"],\n  }\n}', d))).toEqual(['next@16.0.1*', '@types/node@24.1.0*']);
  });
  test('uv, poetry and Cargo lockfiles', () => {
    const uv = '[[package]]\nname = "app"\nversion = "0.1.0"\nsource = { editable = "." }\n\n[[package]]\nname = "requests"\nversion = "2.31.0"\nsource = { registry = "https://pypi.org/simple" }\n';
    expect(pick(parseTomlPackages(uv, 'PyPI', n => n === 'requests'))).toEqual(['requests@2.31.0*']);
    const cargo = '[[package]]\nname = "app"\nversion = "0.1.0"\n\n[[package]]\nname = "serde"\nversion = "1.0.200"\nsource = "registry+https://github.com/rust-lang/crates.io-index"\n';
    expect(pick(parseTomlPackages(cargo, 'crates.io', () => false))).toEqual(['serde@1.0.200']);
  });
  test('requirements pins and Pipfile.lock', () => {
    expect(pick(parseRequirements('django==5.0.1\nrequests[socks]==2.31.0 ; python_version>"3"\nflask>=3\n# c\n'))).toEqual(['django@5.0.1*', 'requests@2.31.0*']);
    expect(pick(parsePipfileLock(JSON.stringify({ default: { django: { version: '==5.0.1' } }, develop: { pytest: { version: '==8.0.0' } } })))).toEqual(['django@5.0.1*', 'pytest@8.0.0*']);
  });
  test('go.mod, Gemfile.lock and composer.lock', () => {
    expect(pick(parseGoMod('module x\n\nrequire github.com/a/b v1.2.3\n\nrequire (\n\tgolang.org/x/net v0.20.0 // indirect\n\tgithub.com/c/d v2.0.0+incompatible\n)\n'))).toEqual(['github.com/a/b@v1.2.3*', 'golang.org/x/net@v0.20.0', 'github.com/c/d@v2.0.0+incompatible*']);
    expect(pick(parseGemfileLock('GEM\n  remote: https://rubygems.org/\n  specs:\n    rails (7.1.3)\n      actionpack (= 7.1.3)\n    nokogiri (1.16.0-arm64-darwin)\n\nDEPENDENCIES\n  rails\n'))).toEqual(['rails@7.1.3*', 'nokogiri@1.16.0']);
    expect(pick(parseComposerLock(JSON.stringify({ packages: [{ name: 'laravel/framework', version: 'v11.0.0' }], 'packages-dev': [{ name: 'x/y', version: 'dev-main' }] }), new Set(['laravel/framework'])))).toEqual(['laravel/framework@11.0.0*']);
  });
});

describe('advisories and runtimes', () => {
  const vuln = { database_specific: { severity: 'MODERATE' }, affected: [{ package: { ecosystem: 'npm', name: 'minimist' }, ranges: [{ events: [{ introduced: '0' }, { fixed: '0.2.1' }] }, { events: [{ introduced: '1.0.0' }, { fixed: '1.2.3' }] }] }] };
  test('picks the lowest fixed version above the installed one', () => {
    expect(fixedVersion(vuln, 'npm', 'minimist', '1.2.0')).toBe('1.2.3');
    expect(fixedVersion(vuln, 'npm', 'minimist', '0.0.8')).toBe('0.2.1');
    expect(fixedVersion(vuln, 'npm', 'other', '0.0.8')).toBeNull();
    expect(severityOf(vuln)).toBe('moderate');
    expect(bumpType('0.0.8', '1.2.3')).toBe('major');
    expect(bumpType('1.2.0', '1.2.3')).toBe('patch');
    expect(bumpType('1.2.3', '1.2.3')).toBeNull();
  });
  test('runtime support from endoflife.date cycles', () => {
    const cycles = [
      { cycle: '26', releaseDate: '2026-05-05', lts: '2026-10-28', eol: '2029-04-30', support: '2027-10-27' },
      { cycle: '25', releaseDate: '2025-10-15', lts: false, eol: '2026-06-01', support: '2026-04-01' },
      { cycle: '24', releaseDate: '2025-05-06', lts: '2025-10-28', eol: '2028-04-30', support: '2026-10-20' },
    ];
    expect(runtimeStatus('Node.js', 'v25.2.1', '25', cycles, '2026-10-11')).toMatchObject({ status: 'eol', eol: '2026-06-01', recommended: '24' });
    expect(runtimeStatus('Node.js', 'v24.1.0', '24', cycles, '2026-10-11')).toMatchObject({ status: 'supported' });
    expect(runtimeStatus('Node.js', 'v24.1.0', '24', cycles, '2026-11-01')).toMatchObject({ status: 'security', recommended: '26' });
  });
});
