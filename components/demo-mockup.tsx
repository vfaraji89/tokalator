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
        <div className="demo-url">VS Code &mdash; tokalator</div>
      </div>

      {/* Editor body — 3 columns: explorer | editor | chat panel */}
      <div className="demo-body">
        {/* Left: File Explorer */}
        <div className="demo-sidebar demo-explorer-col">
          <Annotation n={1} style={{ top: -8, right: -8 }} />
          <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: P.g5, marginBottom: 6 }}>
            Explorer
          </div>
          <div style={{ fontSize: 7.5, fontWeight: 600, color: P.g6, marginBottom: 4 }}>TOKALATOR</div>
          {[
            { name: "app/", indent: 0, isDir: true },
            { name: "page.tsx", indent: 1, active: true },
            { name: "layout.tsx", indent: 1 },
            { name: "globals.css", indent: 1 },
            { name: "components/", indent: 0, isDir: true },
            { name: "demo-mockup.tsx", indent: 1 },
            { name: "navigation.tsx", indent: 1 },
            { name: "content/", indent: 0, isDir: true },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                padding: "2px 0",
                paddingLeft: f.indent ? 12 : 0,
                fontSize: 7,
                fontFamily: "monospace",
                color: f.active ? P.red : f.isDir ? P.g6 : P.g5,
                fontWeight: f.active ? 600 : 400,
                background: f.active ? "rgba(227,18,11,0.06)" : "transparent",
                borderRadius: 2,
              }}
            >
              {f.isDir ? "\u25BE " : "  "}{f.name}
            </div>
          ))}

          {/* Token Budget mini panel */}
          <div style={{ marginTop: 8, borderTop: `1px solid ${P.g1}`, paddingTop: 6 }}>
            <div style={{ fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: P.g5, marginBottom: 4 }}>
              Token Budget
            </div>
            <div style={{ height: 6, borderRadius: 3, background: P.g1, overflow: "hidden", marginBottom: 3 }}>
              <div className="demo-budget-fill" style={{ height: "100%", width: "68%", borderRadius: 3, background: `linear-gradient(90deg, ${P.red}, ${P.black})` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: P.g5 }}>
              <span>136K / 200K</span>
              <span style={{ color: P.red, fontWeight: 600 }}>68%</span>
            </div>
          </div>
        </div>

        {/* Center: Code editor */}
        <div className="demo-editor">
          <div className="demo-tabs">
            <span className="demo-tab demo-tab--active">page.tsx</span>
            <span className="demo-tab">layout.tsx</span>
            <span className="demo-tab">globals.css</span>
          </div>

          <div className="demo-code">
            <Annotation n={2} style={{ top: 26, right: 8 }} />
            {[
              { num: 1, parts: [{ t: '"use client"', c: P.red }, { t: ";", c: P.g5 }] },
              { num: 2, parts: [] },
              { num: 3, parts: [{ t: "import", c: P.red }, { t: " Link ", c: P.g7 }, { t: "from", c: P.red }, { t: " 'next/link';", c: P.g5 }] },
              { num: 4, parts: [{ t: "import", c: P.red }, { t: " { useState } ", c: P.g7 }, { t: "from", c: P.red }, { t: " 'react';", c: P.g5 }] },
              { num: 5, parts: [{ t: "import", c: P.red }, { t: " content ", c: P.g7 }, { t: "from", c: P.red }, { t: " '../content/homepage.json';", c: P.g5 }] },
              { num: 6, parts: [] },
              { num: 7, parts: [{ t: "export default function", c: P.red }, { t: " HomePage() {", c: P.g7 }] },
              { num: 8, parts: [{ t: "  const", c: P.red }, { t: " { hero } = content;", c: P.g5 }] },
              { num: 9, parts: [{ t: "  return", c: P.red }, { t: " (", c: P.g5 }] },
              { num: 10, parts: [{ t: '    <article className=', c: P.g7 }, { t: '"article"', c: P.red }, { t: ">", c: P.g7 }] },
            ].map((line) => (
              <div key={line.num} className="demo-code-line">
                <span className="demo-line-num">{line.num}</span>
                <span>
                  {line.parts.map((p, j) => (
                    <span key={j} style={{ color: p.c }}>{p.t}</span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Chat / Claude Code Panel */}
        <div className="demo-chat-panel">
          <Annotation n={3} style={{ top: -8, left: -8 }} />

          {/* Panel tabs: Chat | Claude Code */}
          <div style={{ display: "flex", borderBottom: `1px solid ${P.g2}`, fontSize: 8 }}>
            <div style={{ padding: "5px 8px", fontWeight: 600, color: P.g5 }}>Chat</div>
            <div style={{ padding: "5px 8px", fontWeight: 700, color: P.red, borderBottom: `2px solid ${P.red}` }}>Claude Code</div>
          </div>

          {/* Model selector */}
          <div style={{ padding: "5px 8px", borderBottom: `1px solid ${P.g1}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 7.5, color: P.g6 }}>
              <span style={{ fontWeight: 600 }}>Agent</span>
              <span style={{ color: P.g3 }}>&rsaquo;</span>
              <span style={{ fontWeight: 700, color: P.black }}>Claude Opus 4.6</span>
              <span style={{ marginLeft: "auto", color: P.g3, fontSize: 7 }}>{"\u25BE"}</span>
            </div>
          </div>

          {/* Sessions */}
          <div style={{ padding: "4px 8px", borderBottom: `1px solid ${P.g1}` }}>
            <div style={{ fontSize: 6.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: P.g5, marginBottom: 3 }}>Sessions</div>
            {[
              { label: "Pushing Changes to Repo...", active: true, time: "4 min" },
              { label: "Context Engineering Exten...", active: false, time: "7 hrs" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 0", fontSize: 7 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.active ? P.red : P.g3, flexShrink: 0 }} />
                <span style={{ flex: 1, color: s.active ? P.black : P.g5, fontWeight: s.active ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                <span style={{ fontSize: 6, color: P.g5, flexShrink: 0 }}>{s.time}</span>
              </div>
            ))}
          </div>

          {/* Chat content */}
          <div style={{ padding: "5px 8px", flex: 1, overflow: "hidden" }}>
            <div style={{ marginBottom: 5 }}>
              <div style={{ fontSize: 6.5, fontWeight: 600, color: P.g5, marginBottom: 2 }}>Claude</div>
              <div style={{ fontSize: 7, color: P.g6, lineHeight: 1.5 }}>
                Checked for pending changes and confirmed deployment.
              </div>
            </div>
            <div style={{ background: P.g05, borderRadius: 3, padding: "3px 5px", marginBottom: 5, fontSize: 6.5, fontFamily: "monospace", color: P.g6, border: `1px solid ${P.g1}` }}>
              <div style={{ color: P.g5, marginBottom: 1 }}>$ git status</div>
              <div style={{ color: P.g7 }}>On branch main</div>
              <div style={{ color: P.g7 }}>nothing to commit</div>
            </div>
            <div style={{ fontSize: 7, color: P.g5, lineHeight: 1.5 }}>
              Auto-deploying to{" "}
              <span style={{ color: P.red, fontWeight: 600 }}>tokalator.wiki</span>
            </div>
          </div>

          {/* Input bar */}
          <div style={{ padding: "4px 8px", borderTop: `1px solid ${P.g2}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: P.g05, borderRadius: 4, padding: "3px 6px", border: `1px solid ${P.g2}` }}>
              <span style={{ fontSize: 7, color: P.g3, flex: 1 }}>Describe what to build next</span>
              <span style={{ fontSize: 8, color: P.g3 }}>&rsaquo;</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="demo-toolbar">
        <span className="demo-toolbar-btn" style={{ fontSize: 7 }}>{"\u25CB"} main</span>
        <span className="demo-toolbar-btn" style={{ fontSize: 7 }}>{"\u26A0"} 0</span>
        <span className="demo-toolbar-btn" style={{ fontSize: 7 }}>{"\u24D8"} 312</span>
        <span style={{ flex: 1 }} />
        <span className="demo-toolbar-btn" style={{ fontSize: 7 }}>TypeScript JSX</span>
        <span className="demo-toolbar-btn" style={{ fontSize: 7 }}>Prettier</span>
      </div>
    </div>
  );
}
