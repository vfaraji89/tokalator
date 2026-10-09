"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import styles from "./claude-code-demo.module.css";

type Step = { kind: "tool"; name: string; arg: string; result?: string } | { kind: "say"; text: string };
type Turn = { prompt: string; steps: Step[]; bump: boolean };

const SCRIPT: Turn[] = [
  {
    prompt: "fix the failing budget test",
    bump: true,
    steps: [
      { kind: "tool", name: "Read", arg: "src/budget.ts" },
      { kind: "tool", name: "Edit", arg: "src/budget.ts", result: "+2 −1" },
      { kind: "tool", name: "Bash", arg: "npm test", result: "✓ 48 passed" },
      { kind: "say", text: "Fixed: budget() now clamps at zero." },
    ],
  },
  {
    prompt: "add a regression test for negative input",
    bump: true,
    steps: [
      { kind: "tool", name: "Write", arg: "__tests__/budget.test.ts", result: "+14" },
      { kind: "tool", name: "Bash", arg: "npm test", result: "✓ 49 passed" },
      { kind: "say", text: "Added the test. Both cases pass." },
    ],
  },
  {
    prompt: "how much has today cost?",
    bump: false,
    steps: [
      { kind: "tool", name: "tokalator · claude_code_usage", arg: "days: 1", result: "14 turns · 99% cache hits" },
      { kind: "say", text: "About $16 API-equivalent today, mostly cache reads." },
    ],
  },
];

type Line = { key: string; node: "prompt" | "tool" | "say"; text: string; arg?: string; result?: string; busy?: boolean };

export function ClaudeCodeDemo() {
  const reduced = useReducedMotion();
  const frame = useRef<HTMLIFrameElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [typing, setTyping] = useState("");
  const [theme, setTheme] = useState("dark");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const read = () => setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    if (root.current) io.observe(root.current);
    return () => { mo.disconnect(); io.disconnect(); };
  }, []);

  useEffect(() => {
    if (reduced) {
      setLines(SCRIPT[0].steps.reduce<Line[]>((acc, s, i) => acc.concat(s.kind === "tool"
        ? { key: `t${i}`, node: "tool", text: s.name, arg: s.arg, result: s.result }
        : { key: `s${i}`, node: "say", text: s.text }), [{ key: "p", node: "prompt", text: SCRIPT[0].prompt }]));
      return;
    }
    if (!visible) return;
    let cancelled = false;
    const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
    const send = (msg: string) => frame.current?.contentWindow?.postMessage({ tokalatorDemo: msg }, "*");

    (async () => {
      while (!cancelled) {
        setLines([]);
        send("reset");
        await wait(900);
        for (const [t, turn] of SCRIPT.entries()) {
          for (let i = 1; i <= turn.prompt.length && !cancelled; i++) {
            setTyping(turn.prompt.slice(0, i));
            await wait(38);
          }
          await wait(350);
          setTyping("");
          setLines(l => [...l, { key: `p${t}`, node: "prompt", text: turn.prompt }]);
          for (const [i, step] of turn.steps.entries()) {
            if (cancelled) return;
            const key = `${t}-${i}`;
            if (step.kind === "tool") {
              setLines(l => [...l, { key, node: "tool", text: step.name, arg: step.arg, busy: true }]);
              await wait(750);
              setLines(l => l.map(x => (x.key === key ? { ...x, busy: false, result: step.result } : x)));
            } else {
              await wait(300);
              setLines(l => [...l, { key, node: "say", text: step.text }]);
            }
            await wait(350);
          }
          if (turn.bump) send("turn");
          await wait(1800);
        }
        await wait(3500);
      }
    })();
    return () => { cancelled = true; };
  }, [reduced, visible]);

  return (
    <div ref={root}>
      <div className={styles.stage}>
        <div className={styles.terminal} aria-label="Claude Code session (demo)">
          <div className={styles.bar}><span className={styles.spark}>✻</span> Claude Code <span>· ~/my-app</span></div>
          <div className={styles.body} aria-live="off">
            {lines.map(l => l.node === "prompt" ? (
              <div key={l.key} className={`${styles.line} ${styles.prompt}`} style={{ marginTop: 10 }}>{l.text}</div>
            ) : l.node === "tool" ? (
              <div key={l.key}>
                <div className={`${styles.line} ${styles.tool}`}>
                  <span className={l.busy ? styles.dotBusy : styles.dot}>⏺</span> <span className={styles.toolName}>{l.text}</span>({l.arg})
                </div>
                {l.result && <div className={`${styles.line} ${styles.result}`}>⎿ <span className={l.result.startsWith("✓") ? styles.ok : undefined}>{l.result}</span></div>}
              </div>
            ) : (
              <div key={l.key} className={`${styles.line} ${styles.say}`}>{l.text}</div>
            ))}
            <div className={`${styles.line} ${styles.prompt}`} style={{ marginTop: 10 }}>{typing}<span className={styles.cursor} aria-hidden /></div>
          </div>
          <div className={styles.status}><span>Opus 5.5 · effort medium</span><span>Tokalator MCP connected</span></div>
        </div>
        <div className={styles.panel}>
          <div className={styles.panelBar}><span className={styles.live} aria-hidden /> TOKALATOR · VS CODE SIDEBAR</div>
          <iframe
            ref={frame}
            key={theme}
            className={styles.frame}
            src={`/extension-preview/dashboard.html?theme=${theme}&compact=1`}
            title="Tokalator dashboard updating as Claude Code works (sample data)"
            loading="lazy"
          />
        </div>
      </div>
      <p className={styles.caption}>Demo with sample data. The sidebar is the extension&apos;s real UI; each finished turn updates the Claude Code card.</p>
    </div>
  );
}
