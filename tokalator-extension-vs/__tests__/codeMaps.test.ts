import { jsDetails, link, pythonDetails } from '../src/core/codeMaps';

describe('code maps extraction', () => {
  it('finds JS/TS declarations, JSDoc first lines, and imports', () => {
    const r = jsDetails("/** Budget helpers. */\nimport { a } from './a';\n\n/** Add two numbers. */\nexport function add(x: number, y: number) { return x + y; }\nexport const total = 1;\nconst local = 2;\nexport interface Budget { n: number }\n");
    expect(r.summary).toBe('Budget helpers.');
    expect(r.imports).toEqual(['./a']);
    expect(r.symbols.map(s => [s.type, s.name, s.line])).toEqual([['function', 'add', 5], ['const', 'total', 6], ['const', 'local', 7], ['interface', 'Budget', 8]]);
    expect(r.symbols[0].info).toBe('Add two numbers.');
  });

  it('finds nested Python definitions, docstrings, and imports', () => {
    const r = pythonDetails('"""Module doc."""\nimport os, sys\nfrom .core import x\n\nclass Store:\n    """Holds items."""\n    def get(self):\n        return 1\n\nasync def fetch():\n    pass\n');
    expect(r.summary).toBe('Module doc.');
    expect(r.imports).toEqual(['.core', 'os', 'sys']);
    expect(r.symbols.map(s => [s.type, s.name, s.line, s.info])).toEqual([
      ['class', 'Store', 5, 'Holds items.'],
      ['function', 'Store.get', 7, 'Read source for behavior'],
      ['async function', 'fetch', 10, 'Read source for behavior'],
    ]);
  });

  it('links files and lines with encoded paths', () => {
    expect(link('src/my file.ts', 3)).toBe('[L3](src/my%20file.ts#L3)');
  });
});
