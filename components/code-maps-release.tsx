export function CodeMapsRelease() {
  return (
    <section id="code-maps" className="code-maps-release" aria-labelledby="code-maps-title">
      <p className="code-maps-eyebrow">NEW IN 3.4.0 · LOCAL · MODEL-INDEPENDENT GENERATION</p>
      <h2 id="code-maps-title" className="section-header">Two files. A clearer starting point.</h2>
      <p>Keep project knowledge alongside your code. Any coding agent can read the Markdown; the generator works without waiting for a smarter model.</p>
      <div className="code-maps-grid">
        <article className="code-map-file">
          <h3>GLOSSARY.md</h3>
          <p>Find the names that matter: declarations, documented purpose, and links back to source.</p>
          <pre aria-label="Illustrative glossary excerpt"><code>{`# Codebase Glossary\n\nSymbol         Kind       Source\nestimateCost   function   src/cost.ts:12\nBudget         interface  src/types.ts:4`}</code></pre>
          <small>Illustrative excerpt · Python AST and best-effort JS/TS extraction.</small>
        </article>
        <article className="code-map-file">
          <h3>SITE-MAP.md</h3>
          <p>Navigate modules, imports, package entry points and filesystem routes, with source hashes and extraction warnings.</p>
          <pre aria-label="Illustrative site map excerpt"><code>{`# Codebase Site Map\n\nModule             Role\napp/page.tsx       Page: /\napp/api/route.ts   API: /api\nsrc/cost.ts        Source module`}</code></pre>
          <small>A map of the codebase, including routes where detected.</small>
        </article>
      </div>
      <h3>Fresh context, built into the workflow.</h3>
      <ol className="how-to-steps">
        <li><strong>Start:</strong> Claude Code’s SessionStart hook refreshes both files.</li>
        <li><strong>Review:</strong> review prompts and <code>/code-review</code> refresh the maps before inspecting changes, callers and tests.</li>
        <li><strong>Finish:</strong> the Stop hook refreshes after a completed turn, without requesting another model turn.</li>
      </ol>
      <div className="code-map-install">
        <h3>Install into your repository</h3>
        <p><a href="/downloads/tokalator-context-3.4.0.zip" download>Download the 3.4.0 automation kit ↓</a>, extract it, then run these commands with your project path. Requires Python 3.10+.</p>
        <pre><code>{`python3 tokalator-context-3.4.0/bin/tokalator-install /path/to/project\ncd /path/to/project\npython3 scripts/tokalator-context.py .\npython3 scripts/tokalator-context.py . --check`}</code></pre>
        <p>The kit includes source, tests and an MIT license. Installation merges Claude Code hooks and adds review and refresh commands, preserving unrelated settings. Reload your Claude Code session and inspect <code>/hooks</code>.</p>
      </div>
      <p className="code-map-note">Other agents can use the CLI and Markdown directly; automatic lifecycle hooks are for Claude Code. Maps help agents locate code, but do not prove behavior. JS/TS extraction is heuristic. Read the source and run project tests; <code>--check</code> verifies document freshness only.</p>
    </section>
  );
}
