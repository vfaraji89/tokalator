#!/usr/bin/env python3
"""Build deterministic, source-backed context documents without a model or network."""
from __future__ import annotations

import argparse
import ast
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib.parse import quote

SKIP_DIRS = {'.git', '.venv', 'venv', 'env', 'node_modules', '__pycache__', '.next',
             'dist', 'build', '.tox', '.mypy_cache', '.entire', 'coverage', '.turbo'}
SUPPORTED = {'.py', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'}
MAX_BYTES = 1_000_000


def cell(value):
    return str(value).replace('|', '&#124;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', ' ')


def link(name, line=None):
    label = f'L{line}' if line else cell(name)
    return f'[{label}]({quote(name, safe="/")}' + (f'#L{line}' if line else '') + ')'


def source_paths(root):
    try:
        result = subprocess.run(['git', '-C', str(root), 'ls-files', '-z', '--cached', '--others',
                                 '--exclude-standard', '--', '.'], capture_output=True, timeout=15)
        if result.returncode:
            raise ValueError('not a repository')
        names = sorted(set(os.fsdecode(p) for p in result.stdout.split(b'\0') if p))
    except (OSError, ValueError, subprocess.TimeoutExpired):
        names = []
        for base, dirs, files in os.walk(root, followlinks=False):
            dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS and not d.startswith('.')
                             and not (Path(base) / d).is_symlink())
            names.extend(str((Path(base) / f).relative_to(root)) for f in sorted(files))
    for name in sorted(names):
        rel = Path(name)
        if any(p in SKIP_DIRS or p.startswith('.') for p in rel.parts):
            continue
        if rel.suffix not in SUPPORTED and rel.name != 'package.json' and rel.name != 'tokalator-generate':
            continue
        path = root / rel
        if not path.is_file() or any(p.is_symlink() for p in [path, *path.parents] if p != root.parent):
            continue
        if root not in path.resolve().parents:
            continue
        yield path


def python_details(text):
    tree = ast.parse(text)
    symbols, imports = [], []

    def visit(node, parents=()):
        for child in ast.iter_child_nodes(node):
            scope = parents
            if isinstance(child, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)):
                name = '.'.join((*parents, child.name))
                kind = 'class' if isinstance(child, ast.ClassDef) else 'async function' if isinstance(child, ast.AsyncFunctionDef) else 'function'
                doc = ast.get_docstring(child) or ''
                symbols.append({'type': kind, 'name': name, 'line': child.lineno,
                                'info': doc.splitlines()[0] if doc else 'Read source for behavior'})
                scope = (*parents, child.name)
            visit(child, scope)
    visit(tree)
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imports.extend(n.name for n in node.names)
        elif isinstance(node, ast.ImportFrom):
            imports.append('.' * node.level + (node.module or ''))
    return symbols, sorted(set(imports)), (ast.get_docstring(tree) or '').split('\n')[0]


def js_details(text):
    # Best-effort declarations, not a TS parser or a complete call graph.
    masked = re.sub(r'/\*.*?\*/|//[^\n]*', lambda m: ''.join('\n' if c == '\n' else ' ' for c in m[0]), text, flags=re.S)
    pattern = re.compile(r'^\s*(?:export\s+)?(?:default\s+)?(?:declare\s+)?(async\s+)?'
                         r'(function|class|interface|type|enum|const|let|var)\s+([A-Za-z_$][\w$]*)', re.M)
    comments = list(re.finditer(r'/\*\*([\s\S]*?)\*/', text))

    def first_line(comment):
        lines = [line.strip().lstrip('*').strip() for line in comment[1].splitlines()]
        return next((line for line in lines if line and not line.startswith('@')), '')

    symbols = []
    for match in pattern.finditer(masked):
        declaration = match[0].lstrip('\n')
        if match[2] in {'const', 'let', 'var'} and declaration[:1].isspace() and 'export' not in declaration:
            continue
        start = match.start() + len(match[0]) - len(match[0].lstrip())
        preceding = next((c for c in reversed(comments) if c.end() <= start and not text[c.end():start].strip()), None)
        documentation = first_line(preceding) if preceding else ''
        symbols.append({'type': ('async ' if match[1] else '') + match[2], 'name': match[3],
                        'line': masked.count('\n', 0, start) + 1,
                        'info': documentation or 'JS/TS declaration; read source for behavior'})
    imports = re.findall(r'\bfrom\s+[\'\"]([^\'\"]+)[\'\"]|\brequire\s*\(\s*[\'\"]([^\'\"]+)[\'\"]|\bimport\s*(?:\(\s*)?[\'\"]([^\'\"]+)[\'\"]', masked)
    summary = first_line(comments[0]) if comments and not text[:comments[0].start()].strip() else ''
    return symbols, sorted({s for group in imports for s in group if s}), summary


def scan(root):
    files, packages, warnings = [], [], []
    digest = hashlib.sha256(Path(__file__).read_bytes())
    for path in source_paths(root):
        name = path.relative_to(root).as_posix()
        if path.stat().st_size > MAX_BYTES:
            warnings.append(f'{name}: exceeds {MAX_BYTES} bytes; not indexed')
            continue
        try:
            raw = path.read_bytes()
            text = raw.decode('utf-8')
        except (OSError, UnicodeError) as error:
            warnings.append(f'{name}: {type(error).__name__}; not indexed')
            continue
        digest.update(name.encode() + b'\0' + raw + b'\0')
        if path.name == 'package.json':
            try:
                data = json.loads(text)
                packages.append({'file': name, 'name': data.get('name', ''),
                                 'scripts': sorted(data.get('scripts', {})),
                                 'entry': data.get('main', '')})
            except (ValueError, AttributeError, TypeError):
                warnings.append(f'{name}: invalid package manifest')
            continue
        try:
            symbols, imports, summary = python_details(text) if path.suffix == '.py' or path.name == 'tokalator-generate' else js_details(text)
        except SyntaxError as error:
            symbols, imports, summary = [], [], 'Parse failed; read source'
            warnings.append(f'{name}:{error.lineno}: Python syntax error; symbols unavailable')
        files.append({'file': name, 'symbols': symbols, 'imports': imports, 'summary': summary,
                      'hash': hashlib.sha256(raw).hexdigest()[:12]})
    return files, packages, warnings, digest.hexdigest()


def role(name):
    path = Path(name)
    if path.name in {'page.tsx', 'page.jsx', 'page.ts', 'page.js', 'route.ts', 'route.js'} and 'app' in path.parts:
        index = path.parts.index('app')
        route = '/' + '/'.join(p for p in path.parts[index + 1:-1] if not p.startswith(('(', '@')))
        return f'{"HTTP handler" if path.stem == "route" else "Page"}: {route} (filesystem route; base paths/rewrites not applied)'
    if 'test' in name.lower() or '__tests__' in name:
        return 'Test/support file (path convention)'
    if path.name == 'extension.ts':
        return 'Editor extension entry point (filename convention)'
    if path.name in {'cli.ts', 'cli.js', '__main__.py'}:
        return 'CLI entry point (filename convention)'
    return 'Source module'


def resolve_import(name, dependency, names):
    if not dependency.startswith('.') or name.endswith('.py'):
        return None
    candidate = os.path.normpath(str(Path(name).parent / dependency)).replace(os.sep, '/')
    candidates = [candidate] + [candidate + ext for ext in sorted(SUPPORTED)]
    candidates += [candidate + '/index' + ext for ext in sorted(SUPPORTED)]
    if candidate.endswith(('.js', '.mjs', '.cjs')):
        candidates += [str(Path(candidate).with_suffix(ext)) for ext in ('.ts', '.tsx')]
    return next((c for c in candidates if c in names), None)


def render(root):
    files, packages, warnings, fingerprint = scan(root)
    header = [f'<!-- tokalator-context: {fingerprint} -->', '',
              'Generated from source; do not edit. Refresh with the context command.',
              'This is a navigation aid, not proof of behavior. Verify source, callers, and tests.', '']
    glossary = ['# Codebase Glossary', '', *header,
                f'{sum(len(f["symbols"]) for f in files)} symbols across {len(files)} source files.', '']
    sitemap = ['# Codebase Site Map', '', *header,
               '## How agents should use these files', '',
               '1. Locate the relevant module below and its declarations in [GLOSSARY.md](GLOSSARY.md).',
               '2. Read the source and its tests before changing behavior. Treat comments as claims to verify.',
               '3. Follow import links to inspect dependencies; aliases and dynamic dependencies may be unresolved.',
               '4. Refresh both documents before review and after edits. Run project checks separately.', '',
               '## Packages and commands', '', '| Manifest | Package | Entry | Script names |', '|---|---|---|---|']
    for package in packages:
        sitemap.append(f'| {link(package["file"])} | {cell(package["name"])} | {cell(package["entry"])} | {cell(", ".join(package["scripts"]))} |')
    sitemap += ['', '## Modules and entry points', '', '| File | Role / documented purpose | Source hash |', '|---|---|---|']
    names = {f['file'] for f in files}
    for file in files:
        name = file['file']
        glossary += [f'## {link(name)}', '', '| Type | Symbol | Source | Documented purpose / limits |', '|---|---|---|---|']
        for symbol in sorted(file['symbols'], key=lambda s: s['line']):
            glossary.append(f'| {cell(symbol["type"])} | {cell(symbol["name"])} | {link(name, symbol["line"])} | {cell(symbol["info"])} |')
        if not file['symbols']:
            glossary.append('| — | No declarations extracted | — | Read source; extraction may be incomplete |')
        glossary.append('')
        sitemap.append(f'| {link(name)} | {cell(file["summary"] or role(name))} | {file["hash"]} |')
    sitemap += ['', '## Imports by module', '']
    for file in files:
        if file['imports']:
            dependencies = []
            for dependency in file['imports']:
                target = resolve_import(file['file'], dependency, names)
                dependencies.append(link(target) if target else f'{cell(dependency)} (external or unresolved)')
            sitemap.append(f'- {link(file["file"])} → ' + ', '.join(dependencies))
    limits = ['', '## Coverage and limitations', '',
              'Python uses AST declarations and first-line docstrings. JS/TS uses best-effort declaration/import matching; methods, re-exports, strings and multiline constructs can be missed or misidentified.',
              'Git projects use tracked and unignored files. Dependency/build directories, dot paths, symlinks and oversized files are excluded. Non-Git scans use directory exclusions only.',
              'No model calls, full behavioral summaries, runtime call graph, or complete route resolution are claimed.', '']
    limits += [f'- {cell(w)}' for w in warnings] or ['No scan warnings.']
    return {'GLOSSARY.md': '\n'.join(glossary + limits) + '\n',
            'SITE-MAP.md': '\n'.join(sitemap + limits) + '\n'}, files


def write_changed(path, content):
    if path.is_symlink():
        raise ValueError(f'Refusing symlink output: {path}')
    if path.exists() and path.read_text(encoding='utf-8') == content:
        return False
    fd, temporary = tempfile.mkstemp(prefix='.tokalator-', dir=path.parent)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as stream:
            stream.write(content)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('root', nargs='?', default='.')
    parser.add_argument('--format', choices=['markdown', 'json'], default='markdown')
    parser.add_argument('--output', '-o')
    parser.add_argument('--check', action='store_true', help='Exit 1 when generated documents are stale; no writes')
    parser.add_argument('--hook', action='store_true', help='Read Claude Code hook JSON from stdin')
    args = parser.parse_args()
    event = {}
    if args.hook:
        event = json.load(sys.stdin)
        event_name = event.get('hook_event_name')
        if event_name == 'UserPromptSubmit' and not re.search(r'\breview\b', event.get('prompt', ''), re.I):
            return 0
        if event_name not in {'Stop', 'UserPromptSubmit', 'SessionStart'}:
            return 0
        args.root = os.environ.get('CLAUDE_PROJECT_DIR') or event.get('cwd') or args.root
    root = Path(args.root).resolve()
    if not root.is_dir():
        raise ValueError(f'Not a directory: {root}')
    outputs, files = render(root)
    if args.format == 'json':
        symbols = [dict(s, file=f['file']) for f in files for s in f['symbols']]
        outputs = {args.output or 'glossary.json': json.dumps(symbols, indent=2) + '\n'}
    elif args.output:
        outputs = {args.output: outputs['GLOSSARY.md']}
    stale = []
    for name, content in outputs.items():
        target = Path(name) if args.output else root / name
        if not target.exists() or target.read_text(encoding='utf-8') != content:
            stale.append(name)
        if not args.check:
            write_changed(target, content)
    if args.hook:
        if event.get('hook_event_name') in {'UserPromptSubmit', 'SessionStart'}:
            print('Tokalator: GLOSSARY.md and SITE-MAP.md refreshed. Use them to locate source and tests; verify behavior in code.')
    else:
        print(('Stale: ' if args.check else 'Updated: ') + ', '.join(stale) if stale else 'Context documents are current.')
    return 1 if args.check and stale else 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError, ValueError) as error:
        print(f'Tokalator: {error}', file=sys.stderr)
        sys.exit(1)
