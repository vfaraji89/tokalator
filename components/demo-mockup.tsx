"use client";

const P = {
  red: "#e3120b",
  black: "#111",
  g8: "#1a1a1a",
  g7: "#333",
  g6: "#555",
  g5: "#888",
  g3: "#ccc",
  g2: "#ddd",
  g1: "#f0f0f0",
  g05: "#f8f8f8",
  white: "#fff",
};

/** Numbered annotation bubble */
function Annotation({ n, style }: { n: number; style: React.CSSProperties }) {
  return (
    <span
      style={{
        position: "absolute",
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: P.red,
        color: P.white,
        fontSize: 11,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,
        boxShadow: "0 2px 6px rgba(227,18,11,0.3)",
        ...style,
      }}
    >
      {n}
    </span>
  );
}

/** Skeleton bar placeholder */
function Bar({
  w,
  h = 6,
  color = P.g2,
  style,
}: {
  w: string;
  h?: number;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: h / 2,
        background: color,
        ...style,
      }}
    />
  );
}

export function DemoMockup() {
  return (
    <div className="demo-mockup-wrapper">
      {/* Browser chrome */}
      <div className="demo-chrome">
        <div className="demo-dots">
          <span style={{ background: "#ff5f57" }} />
          <span style={{ background: "#febc2e" }} />
          <span style={{ background: "#28c840" }} />
        </div>
        <div className="demo-url">VS Code — project/src</div>
      </div>

      {/* Editor body */}
      <div className="demo-body">
        {/* Sidebar panel — Token Budget */}
        <div className="demo-sidebar">
          <Annotation n={1} style={{ top: -8, right: -8 }} />
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: P.g5,
              marginBottom: 8,
            }}
          >
            Token Budget
          </div>

          {/* Budget bar */}
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: P.g1,
              overflow: "hidden",
              marginBottom: 6,
            }}
          >
            <div
              className="demo-budget-fill"
              style={{
                height: "100%",
                width: "68%",
                borderRadius: 4,
                background: `linear-gradient(90deg, ${P.red}, ${P.black})`,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 8,
              color: P.g5,
            }}
          >
            <span>136K / 200K</span>
            <span style={{ color: P.red, fontWeight: 600 }}>68%</span>
          </div>

          {/* File list */}
          <div style={{ marginTop: 10 }}>
            {[
              { name: "app.tsx", tokens: "12.4K", pct: 62 },
              { name: "utils.ts", tokens: "8.1K", pct: 40 },
              { name: "hooks.ts", tokens: "5.2K", pct: 26 },
              { name: "api.ts", tokens: "3.8K", pct: 19 },
            ].map((f) => (
              <div
                key={f.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 0",
                  fontSize: 8,
                  color: P.g6,
                }}
              >
                <span style={{ flex: 1, fontFamily: "monospace" }}>
                  {f.name}
                </span>
                <span style={{ color: P.g5, fontSize: 7 }}>{f.tokens}</span>
                <div
                  style={{
                    width: 32,
                    height: 4,
                    borderRadius: 2,
                    background: P.g1,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${f.pct}%`,
                      height: "100%",
                      borderRadius: 2,
                      background: f.pct > 50 ? P.red : P.black,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main editor area */}
        <div className="demo-editor">
          {/* Tab bar */}
          <div className="demo-tabs">
            <span className="demo-tab demo-tab--active">app.tsx</span>
            <span className="demo-tab">utils.ts</span>
            <span className="demo-tab">hooks.ts</span>
          </div>

          {/* Code lines */}
          <div className="demo-code">
            <Annotation n={2} style={{ top: 28, right: 8 }} />
            {[
              { num: 1, text: "import { useState } from", trail: "'react';" },
              { num: 2, text: "import { calculate }", trail: "from './utils';" },
              { num: 3, text: "" },
              { num: 4, text: "export function App() {" },
              { num: 5, text: "  const [tokens, set]", trail: "= useState(0);" },
              { num: 6, text: "  const cost =", trail: "calculate(tokens);" },
              { num: 7, text: "  return <div>{cost}", trail: "</div>;" },
              { num: 8, text: "}" },
            ].map((line) => (
              <div key={line.num} className="demo-code-line">
                <span className="demo-line-num">{line.num}</span>
                <span style={{ color: P.g7 }}>
                  {line.text}
                  {line.trail && (
                    <span style={{ color: P.g5 }}> {line.trail}</span>
                  )}
                </span>
              </div>
            ))}

            {/* Inline chat annotation — dashed selection */}
            <div className="demo-inline-chat">
              <Annotation n={3} style={{ top: -10, right: -10 }} />
              <div
                style={{
                  fontSize: 8,
                  color: P.g6,
                  marginBottom: 4,
                  fontFamily: "monospace",
                }}
              >
                @tokens /optimize
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <Bar w="60%" h={5} color={P.g2} />
                <Bar w="30%" h={5} color={P.g2} />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  marginTop: 4,
                }}
              >
                <Bar w="45%" h={5} color={P.g2} />
                <Bar w="35%" h={5} color={P.g2} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating toolbar at bottom — Agentation-style */}
      <div className="demo-toolbar">
        {["||", "\u25CB", "\u25A1", "\u2715"].map((icon, i) => (
          <span key={i} className="demo-toolbar-btn">
            {icon}
          </span>
        ))}
      </div>
    </div>
  );
}
