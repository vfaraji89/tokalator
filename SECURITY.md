# Security Policy

## Supported Versions

Security fixes are applied to the latest released line of each component.

| Component | Supported |
| --- | --- |
| Web platform (`app/`, `components/`, `lib/`) | latest `main` |
| VS Code extension | latest published 3.1.x |
| MCP server | latest published |
| Older releases | not supported |

## Reporting a Vulnerability

Do not open a public issue for security reports.

- Use GitHub private vulnerability reporting: https://github.com/vfaraji89/tokalator/security/advisories/new
- Or email vfaraji89@gmail.com with subject `SECURITY: tokalator`.

Please include affected component and version, reproduction steps, and impact.
Expect an initial response within 5 business days. Accepted reports are
patched on the supported lines above and disclosed after a fix ships.

## Scope

In scope: the web platform, VS Code extension, and MCP server in this repo.
Out of scope: the FastAPI service in `api/` (not deployed publicly), forks,
and third-party dependencies (report those upstream).
