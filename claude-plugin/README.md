# Tokalator Claude Code plugin

Writes `GLOSSARY.md` (declarations, purpose, source links) and `SITE-MAP.md` (modules, entry points, imports,
routes) so agents find the right files first, and keeps them fresh with Claude Code hooks.
Runs locally: no model calls. Requires Python 3.10+ and Claude Code.

## Use

```sh
claude --plugin-dir /path/to/tokalator/claude-plugin
```

From a release archive, point `--plugin-dir` at the extracted folder instead.

| Command | What it does |
|---|---|
| `/tokalator-glossary:refresh-context` | Regenerate both files now |
| `/tokalator-glossary:code-review` | Refresh, then ask the agent for a review |

Hooks (check them with `/hooks`): **SessionStart** refreshes; a prompt mentioning review refreshes first;
**Stop** refreshes after a completed turn (not after an interrupt). Use one installation per repository:
don't also enable a standalone copy of these hooks.

## Without Claude Code

```sh
python3 claude-plugin/bin/tokalator-generate .           # write the files
python3 claude-plugin/bin/tokalator-generate . --check   # exit 1 if missing or stale
```

Skipped: ignored untracked files, hidden paths, dependencies, build outputs, symlinks and files over 1 MB.
Python is parsed with its AST; JS/TS is heuristic, so read the source and tests to confirm behaviour.

## Test

```sh
python3 -m unittest discover -s claude-plugin/tests -v
```

## License

MIT (see [LICENSE](LICENSE)), unlike the rest of the repository. Plugin reference:
[code.claude.com/docs/en/plugins-reference](https://code.claude.com/docs/en/plugins-reference).
