# Tokalator Claude Code plugin 4.1.2

Requires Python 3.10+ and Claude Code. After extracting the archive, open your project directory and run:

```sh
claude --plugin-dir /absolute/path/to/tokalator-claude-plugin-4.1.2
```

Run `/tokalator-glossary:refresh-context` or `/tokalator-glossary:code-review`. Inspect `/hooks` to verify registration. SessionStart refreshes context; prompts containing review refresh before review; Stop refreshes after a completed turn. User interrupts do not fire Stop. Do not also enable the standalone project's hooks: use one installation method per repository.

GLOSSARY.md contains declarations, documented purpose and source links. SITE-MAP.md contains modules, package entries, imports, filesystem routes, hashes and warnings. Generation runs locally without model APIs. Python uses AST; JS/TS is heuristic. Read source and tests to verify behavior. The code-review command asks the agent to perform a review; generation itself does not run a model or code tests.

Direct use:

```sh
python3 /absolute/path/to/tokalator-claude-plugin-4.1.2/bin/tokalator-generate .
python3 /absolute/path/to/tokalator-claude-plugin-4.1.2/bin/tokalator-generate . --check
```

Check exits 1 if files are missing or stale. Ignored untracked files, hidden paths, dependencies, build outputs, symlinks and files over 1 MB are excluded. Avoid concurrent source edits during a scan. To stop loading this local plugin, restart Claude without --plugin-dir. Generated Markdown can be retained.

Run included tests with `python3 -m unittest discover -s /absolute/path/to/tokalator-claude-plugin-4.1.2/tests -v`.

MIT license; source included. See https://code.claude.com/docs/en/plugins-reference for Claude plugin documentation.
