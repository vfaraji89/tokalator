import { claudeReadDenyGlobs, globToRegExp, isSecretFile, matchesAny } from '../src/core/workspaceSecurityScanner';

describe('secret file detection', () => {
  it('flags real secret files and skips templates', () => {
    expect(isSecretFile('.env')).toBe(true);
    expect(isSecretFile('.env.local')).toBe(true);
    expect(isSecretFile('server.pem')).toBe(true);
    expect(isSecretFile('.env.example')).toBe(false);
    expect(isSecretFile('README.md')).toBe(false);
  });
});

describe('coverage matching', () => {
  it('follows gitignore-style globs', () => {
    expect(globToRegExp('**/.env').test('.env')).toBe(true);
    expect(globToRegExp('**/.env').test('apps/web/.env')).toBe(true);
    expect(globToRegExp('**/.env.*').test('apps/web/.env.production')).toBe(true);
    expect(globToRegExp('*.pem').test('certs/server.pem')).toBe(true);
    expect(globToRegExp('./secrets/**').test('secrets/a/b.json')).toBe(true);
    expect(globToRegExp('**/.env').test('.envrc')).toBe(false);
  });

  it('reads only Read(...) deny rules, which also cover Grep and Glob in Claude Code', () => {
    expect(claudeReadDenyGlobs(['Read(**/.env)', 'Bash(rm:*)', 'Grep(**/.env)', 'Read(./secrets/**)'])).toEqual(['**/.env', './secrets/**']);
    expect(claudeReadDenyGlobs(undefined)).toEqual([]);
  });

  it('checks a file against any of several rules', () => {
    expect(matchesAny('config/.env.local', ['**/*.pem', '**/.env.*'])).toBe(true);
    expect(matchesAny('config/.env.local', ['**/*.pem'])).toBe(false);
  });
});
