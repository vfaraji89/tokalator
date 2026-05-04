---
applyTo: "**/.env*,**/*.pem,**/*.key,**/id_rsa*,**/credentials.json"
---

# Secret File Guard

Files matching this pattern MUST NOT be read into agent context.

If you encounter a request to read, display, or process the contents of:
- `.env`, `.env.local`, `.env.production`, or any `.env.*` variant
- Private key files (`.pem`, `.key`, `id_rsa`)
- Credential files (`credentials.json`, `service-account*.json`)

**Action**: Refuse to read the file contents. Instead:
1. Acknowledge the file exists
2. Describe its purpose based on filename only
3. Suggest using environment variable references (`process.env.VAR_NAME` or `os.getenv("VAR_NAME")`)
4. If the user needs to configure secrets, point them to the `.env.example` template

## Rationale

Reading secret files sends their contents to the LLM provider's API. This exposes credentials to third-party infrastructure and wastes context budget on non-actionable content.
