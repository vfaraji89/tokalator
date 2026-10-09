import mcp from "../tokalator-mcp/package.json";
import { motion } from "motion/react";

// Pixel art red abacus mascot — 56×80 viewBox, each "pixel" ≈ 6–7px
// Beads are wrapped in <g> groups so CSS can translateY them along the rods.
//
// Top section (above centre bar at y=37):
//   rod at y=21. Active pos = y=28 (near bar). Inactive pos = y=9 (near top).
//   bead-t1: active → slides UP by -19px then returns (animation: abacus-up)
//   bead-t2: inactive → slides DOWN +19px then returns (animation: abacus-down)
//   bead-t3: active → same as t1, offset delay
//
// Bottom section (below centre bar):
//   rod at y=59. Active pos = y=50 (near bar). Inactive pos = y=62 (near bottom).
//   bead-b1: active → slides DOWN +12px then returns (animation: abacus-down-sm)
//   bead-b2: inactive → slides UP -12px then returns (animation: abacus-up-sm)
//   bead-b3: active → same as b1, offset delay
export function PixelAbacus({ width = 72, height = 103 }: { width?: number; height?: number }) {
  const beadAnim = (yFrom: number, yTo: number, delay: number) => ({
    animate: { y: [0, yTo - yFrom, 0] },
    transition: { duration: 1.6, delay, repeat: Infinity, repeatDelay: 2.4, ease: [0.45, 0, 0.55, 1] as const },
  });

  return (
    <motion.svg
      viewBox="0 0 56 80"
      width={width}
      height={height}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }}
    >
      {/* Body */}
      <rect width="56" height="80" fill="#0d0505" />

      {/* Frame */}
      <rect x="0" y="0" width="56" height="6" fill="#8b1208" />
      <rect x="0" y="74" width="56" height="6" fill="#8b1208" />
      <rect x="0" y="0" width="6" height="80" fill="#8b1208" />
      <rect x="50" y="0" width="6" height="80" fill="#8b1208" />

      {/* Centre divider */}
      <rect x="0" y="37" width="56" height="5" fill="#8b1208" />

      {/* Rods */}
      <rect x="6" y="21" width="44" height="2" fill="#444" />
      <rect x="6" y="59" width="44" height="2" fill="#444" />

      {/* ── Top beads ── */}
      <motion.g {...beadAnim(28, 9, 0.2)}>
        <rect x="10" y="28" width="8" height="8" rx="1" fill="#e3120b" />
        <rect x="11" y="29" width="2" height="2" fill="#ff4433" opacity="0.6" />
      </motion.g>
      <motion.g {...beadAnim(9, 28, 0.5)}>
        <rect x="24" y="9" width="8" height="8" rx="1" fill="#7a1208" />
      </motion.g>
      <motion.g {...beadAnim(28, 9, 0.8)}>
        <rect x="38" y="28" width="8" height="8" rx="1" fill="#e3120b" />
        <rect x="39" y="29" width="2" height="2" fill="#ff4433" opacity="0.6" />
      </motion.g>

      {/* ── Bottom beads ── */}
      <motion.g {...beadAnim(50, 62, 0.3)}>
        <rect x="10" y="50" width="8" height="8" rx="1" fill="#e3120b" />
        <rect x="11" y="51" width="2" height="2" fill="#ff4433" opacity="0.6" />
      </motion.g>
      <motion.g {...beadAnim(62, 50, 0.6)}>
        <rect x="24" y="62" width="8" height="8" rx="1" fill="#7a1208" />
      </motion.g>
      <motion.g {...beadAnim(50, 62, 0.9)}>
        <rect x="38" y="50" width="8" height="8" rx="1" fill="#e3120b" />
        <rect x="39" y="51" width="2" height="2" fill="#ff4433" opacity="0.6" />
      </motion.g>
    </motion.svg>
  );
}

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
          <PixelAbacus width={26} height={37} />
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