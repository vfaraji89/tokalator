import mcp from "../tokalator-mcp/package.json";
import { CalculatorMark } from "./calculator-mark";

const SESSION = [
  {
    cmd: "tokalator count src/core/claudeCodeUsage.pure.ts",
    out: "Model:      Claude Opus 5.5\nTokenizer:  Claude BPE tokenizer (approximate)\nTokens:     2,745\nCharacters: 9,315",
  },
  {
    cmd: "tokalator preview 182000",
    out: "Now:              ~182.0K  [████░░░░░░░░░░░░░░░░░░░░]\nAfter next turn:  ~182.8K  (18.3%)\nOutput reserve:   ~128.0K\nRemaining:        ~689.2K  (~861 turns left)",
  },
];

export function CliTerminal() {
  const mcpVersion = mcp.version;
  return (
    <div className="cli-terminal">
      {/* ── macOS-style title bar ── */}
      <div className="cli-bar">
        <span className="cli-dot" style={{ background: "#ff5f57" }} />
        <span className="cli-dot" style={{ background: "#ffbd2e" }} />
        <span className="cli-dot" style={{ background: "#28c840" }} />
        <span className="cli-bar-title">tokalator — cli</span>
      </div>

      {/* ── Terminal body ── */}
      <div className="cli-body">
        <div className="cli-brand">
          <CalculatorMark size={26} />
          <span className="cli-wordmark">tokalator</span>
          <span className="cli-badge">CLI {mcpVersion}</span>
        </div>
        {SESSION.map((block, i) => (
          <div key={i} style={{ marginTop: i ? "0.75rem" : "0.25rem" }}>
            <div className="cli-shell-line">
              <span className="cli-shell-user">~/my-repo</span>
              <span className="cli-shell-cmd"> $ {block.cmd}</span>
            </div>
            <pre style={{ margin: "0.25rem 0 0", background: "none", border: "none", padding: 0, fontSize: "0.75rem", lineHeight: 1.5, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{block.out}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}