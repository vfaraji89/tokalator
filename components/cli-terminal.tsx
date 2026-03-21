import { motion } from "motion/react";

// ASCII block art: TOKALATOR (5 rows × 5-wide letters, single-space separated)
const LOGO_LINES = [
  "█████  ███  █   █   █   █       █   █████  ███  ████ ",
  "  █   █   █ █  █   █ █  █     █ █    █   █   █ █   █",
  "  █   █   █ ███   █████ █     █████   █   █   █ ████ ",
  "  █   █   █ █  █  █   █ █     █   █   █   █   █ █ █  ",
  "  █    ███  █   █ █   █ █████ █   █   █    ███  █  █ ",
];

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

export function CliTerminal() {
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
        {/* Shell prompt line */}
        <div className="cli-shell-line">
          <span className="cli-shell-symbol">○</span>
          <span className="cli-shell-user">user@machine</span>
          <span className="cli-shell-sep"> ~/my-repo</span>
          <span className="cli-shell-cmd"> $ tokalator</span>
        </div>

        {/* Welcome text */}
        <div className="cli-welcome">Welcome to Tokalator</div>

        {/* Logo + mascot row */}
        <div className="cli-logo-row">
          <div className="cli-logo-col">
            <pre className="cli-logo">{LOGO_LINES.join("\n")}</pre>
            <div className="cli-version-tag">CLI Version</div>
          </div>
          <PixelAbacus />
        </div>

        {/* ── Status bar ── */}
        <div className="cli-status-bar">
          <span className="cli-status-path">~/my-repo</span>
          <span className="cli-status-model cli-status-model--red">claude-opus-4.6 (3×)</span>
        </div>

        {/* ── Prompt ── */}
        <div className="cli-prompt-row">
          <span className="cli-prompt-caret">&gt;</span>
          <span className="cli-cursor" aria-hidden="true">█</span>
          <span className="cli-prompt-hint">
            Type @ to mention files, / for commands, or ? for shortcuts
          </span>
        </div>
        <div className="cli-hint-row">
          <kbd>shift+tab</kbd> switch mode
        </div>
      </div>
    </div>
  );
}