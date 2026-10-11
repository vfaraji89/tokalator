import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { buildAgentsMd, buildChecksSkill, detectProject, planAgentFiles, writePlanned } from '../src/core/workspaceSetup';

const project = (files: Record<string, string>) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tk-setup-'));
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
};

describe('workspaceSetup', () => {
  test('reads commands from package.json with the right package manager', () => {
    const root = project({ 'package.json': JSON.stringify({ name: '@acme/web', scripts: { dev: 'next dev', test: 'vitest', lint: 'eslint .', typecheck: 'tsc --noEmit', deploy: 'x' }, devDependencies: { vitest: '1', typescript: '5' } }), 'pnpm-lock.yaml': '', 'tsconfig.json': '{ // c\n "compilerOptions": { "strict": true, } }', 'src/a.ts': '', 'node_modules/x/y': '' });
    const f = detectProject(root);
    expect(f.install).toBe('pnpm install');
    expect(f.commands).toEqual([{ label: 'Dev', cmd: 'pnpm dev' }, { label: 'Test', cmd: 'pnpm test' }, { label: 'Lint', cmd: 'pnpm lint' }, { label: 'Type check', cmd: 'pnpm typecheck' }]);
    expect(f.tsStrict).toBe(true);
    expect(f.tools).toContain('Vitest');
    expect(f.dirs).toEqual(['src']);
  });

  test('detects Python, Go and Rust commands', () => {
    expect(detectProject(project({ 'pyproject.toml': '[tool.ruff]\n[project]\ndependencies=["pytest"]', 'uv.lock': '' })).commands.map(c => c.cmd)).toEqual(['pytest', 'ruff check .']);
    expect(detectProject(project({ 'go.mod': 'module x' })).commands.map(c => c.cmd)).toEqual(['go build ./...', 'go test ./...', 'go vet ./...']);
    expect(detectProject(project({ 'Cargo.toml': '' })).commands.map(c => c.label)).toEqual(['Build', 'Test', 'Lint']);
  });

  test('AGENTS.md has blank lines between sections and ends with one newline', () => {
    const md = buildAgentsMd(detectProject(project({ 'package.json': JSON.stringify({ name: 'app', scripts: { test: 'jest' } }) })));
    expect(md).toMatch(/^# app\n\n## Stack\n\n- JavaScript\n\n## Commands\n\n- Install: `npm install`\n- Test: `npm test`\n\n## Code style\n/);
    expect(md).toMatch(/## Security\n\n- Never read/);
    expect(md.endsWith('.\n')).toBe(true);
  });

  test('checks skill lists steps in order and needs at least one command', () => {
    const skill = buildChecksSkill(detectProject(project({ 'go.mod': '' })));
    expect(skill?.name).toMatch(/-checks$/);
    expect(skill?.content).toMatch(/1\. Lint: `go vet \.\/\.\.\.`\n2\. Test: `go test \.\/\.\.\.`\n3\. Build: `go build \.\/\.\.\.`/);
    expect(buildChecksSkill(detectProject(project({ 'README.md': '' })))).toBeNull();
  });

  test('never overwrites existing files', () => {
    const root = project({ 'AGENTS.md': '# mine\n', 'package.json': '{"name":"a"}' });
    const plan = planAgentFiles(root, detectProject(root));
    expect(plan.map(p => [p.path, p.exists])).toEqual([['AGENTS.md', true], ['CLAUDE.md', false]]);
    expect(writePlanned(root, plan)).toEqual(['CLAUDE.md']);
    expect(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8')).toBe('# mine\n');
  });
});
