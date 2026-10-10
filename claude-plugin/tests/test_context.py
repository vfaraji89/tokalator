import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

GENERATOR = Path(__file__).resolve().parents[1] / 'bin/tokalator-generate'
INSTALLER = GENERATOR.with_name('tokalator-install')

class ContextTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='context tests ')
        self.root = Path(self.temp.name)
        (self.root / 'sample.py').write_text('"""Example module."""\nasync def fetch():\n    """Fetch a record."""\n    pass\n')

    def tearDown(self):
        self.temp.cleanup()

    def run_generator(self, *args, event=None):
        env = {k: v for k, v in os.environ.items() if k != 'CLAUDE_PROJECT_DIR'}
        return subprocess.run([sys.executable, str(GENERATOR), str(self.root), *args],
                              input=json.dumps(event) if event else None,
                              capture_output=True, text=True, env=env)

    def test_symbols_routes_imports_and_stable_output(self):
        route = self.root / 'app/api/items'
        route.mkdir(parents=True)
        (route / 'route.ts').write_text('import { db } from "../../../db";\nexport async function GET() {}\n')
        (self.root / 'db.ts').write_text('export const db = {};\n')
        self.assertEqual(self.run_generator().returncode, 0)
        glossary = (self.root / 'GLOSSARY.md').read_text()
        self.assertIn('Fetch a record.', glossary)
        self.assertIn('async function', glossary)
        site = (self.root / 'SITE-MAP.md').read_text()
        self.assertIn('/api/items', site)
        self.assertIn('[db.ts](db.ts)', site)
        before = (self.root / 'GLOSSARY.md').stat().st_mtime_ns
        self.assertEqual(self.run_generator().returncode, 0)
        self.assertEqual(before, (self.root / 'GLOSSARY.md').stat().st_mtime_ns)

    def test_check_and_deleted_files(self):
        self.assertEqual(self.run_generator('--check').returncode, 1)
        self.assertFalse((self.root / 'GLOSSARY.md').exists())
        self.run_generator()
        self.assertEqual(self.run_generator('--check').returncode, 0)
        (self.root / 'sample.py').unlink()
        self.assertEqual(self.run_generator('--check').returncode, 1)
        self.run_generator()
        self.assertNotIn('sample.py', (self.root / 'GLOSSARY.md').read_text())

    def test_gitignored_untracked_and_symlink(self):
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True)
        (self.root / '.gitignore').write_text('ignored.py\n')
        (self.root / 'ignored.py').write_text('def ignored_secret(): pass\n')
        (self.root / 'alias.py').symlink_to(self.root / 'sample.py')
        self.run_generator()
        glossary = (self.root / 'GLOSSARY.md').read_text()
        self.assertIn('sample.py', glossary)
        self.assertNotIn('ignored_secret', glossary)
        self.assertNotIn('alias.py', glossary)

    def test_stop_silent_even_when_stop_hook_active(self):
        result = self.run_generator('--hook', event={'hook_event_name': 'Stop', 'cwd': str(self.root), 'stop_hook_active': True})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, '')
        self.assertTrue((self.root / 'SITE-MAP.md').exists())

    def test_review_prompt_only(self):
        self.run_generator('--hook', event={'hook_event_name': 'UserPromptSubmit', 'cwd': str(self.root), 'prompt': 'hello'})
        self.assertFalse((self.root / 'GLOSSARY.md').exists())
        result = self.run_generator('--hook', event={'hook_event_name': 'UserPromptSubmit', 'cwd': str(self.root), 'prompt': '/code-review'})
        self.assertEqual(result.returncode, 0)
        self.assertIn('GLOSSARY.md', result.stdout)

    def test_syntax_error_is_visible(self):
        (self.root / 'sample.py').write_text('def broken(\n')
        self.run_generator()
        self.assertIn('Python syntax error', (self.root / 'GLOSSARY.md').read_text())

    def test_js_docstrings(self):
        (self.root / 'module.ts').write_text('/** Retrieve a user record. */\nexport async function getUser() {}\n')
        self.run_generator()
        self.assertIn('Retrieve a user record.', (self.root / 'GLOSSARY.md').read_text())
        self.assertIn('Retrieve a user record.', (self.root / 'SITE-MAP.md').read_text())

    def test_legacy_json(self):
        self.assertEqual(self.run_generator('--format=json').returncode, 0)
        self.assertEqual(json.loads((self.root / 'glossary.json').read_text())[0]['name'], 'fetch')

    def test_install_preserves_unrelated_hooks_and_permissions(self):
        (self.root / '.claude').mkdir()
        settings = self.root / '.claude/settings.json'
        settings.write_text(json.dumps({'permissions': {'deny': ['Read(.env)']}, 'hooks': {'Stop': [{'hooks': [{'type': 'command', 'command': 'existing-hook'}]}]}}))
        for _ in range(2):
            subprocess.run([sys.executable, str(INSTALLER), str(self.root)], check=True, capture_output=True)
        data = json.loads(settings.read_text())
        self.assertEqual(data['permissions']['deny'], ['Read(.env)'])
        self.assertEqual(len(data['hooks']['Stop']), 2)
        self.assertEqual(data['hooks']['Stop'][0]['hooks'][0]['command'], 'existing-hook')
        self.assertTrue((self.root / '.claude/commands/code-review.md').exists())

if __name__ == '__main__':
    unittest.main()
