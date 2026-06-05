"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const TOKEN_TARGET = 147328;
const COUNT_DURATION = 1100;
const STAGE_HOLD = 1500;

type Stage = "abacus" | "calc" | "eng";

const labels: Record<Stage, string> = {
  abacus: "Free Extension",
  calc: "Pro",
  eng: "Enterprise",
};

const labelColors: Record<Stage, string> = {
  abacus: "var(--text-muted)",
  calc: "var(--accent)",
  eng: "var(--green)",
};

export function HeroMorph() {
  const [stage, setStage] = useState<Stage>("abacus");
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t1 = window.setTimeout(() => setStage("calc"), STAGE_HOLD);
    const t2 = window.setTimeout(() => setStage("eng"), STAGE_HOLD * 2);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (stage !== "eng") return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / COUNT_DURATION);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(TOKEN_TARGET * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  return (
    <div className="hero-morph" aria-hidden>
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: -8, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.92 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="hero-morph-label"
          style={{ color: labelColors[stage] }}
        >
          {labels[stage]}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {stage === "abacus" ? (
          <motion.svg
            key="abacus"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88, filter: "blur(2px)" }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            width="48"
            height="48"
            viewBox="0 0 28 28"
            fill="none"
            className="hero-abacus"
          >
            <path d="M4 4 L4 24 L24 24 L24 4 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            <line x1="4" y1="9" x2="24" y2="9" stroke="currentColor" strokeWidth="1" />
            <line x1="4" y1="14" x2="24" y2="14" stroke="currentColor" strokeWidth="1" />
            <line x1="4" y1="19" x2="24" y2="19" stroke="currentColor" strokeWidth="1" />
            <motion.circle className="hero-bead hero-bead-1" cx="8" cy="9" r="2" animate={{ cx: [8, 13] }} transition={{ duration: 0.55, ease: "easeOut" }} />
            <motion.circle className="hero-bead hero-bead-2" cx="13" cy="9" r="2" animate={{ cx: [13, 18] }} transition={{ duration: 0.55, ease: "easeOut" }} />
            <motion.circle className="hero-bead hero-bead-3" cx="9" cy="14" r="2" animate={{ cx: [9, 14] }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }} />
            <motion.circle className="hero-bead hero-bead-4" cx="14" cy="14" r="2" animate={{ cx: [14, 19] }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }} />
            <motion.circle className="hero-bead hero-bead-5" cx="19" cy="14" r="2" animate={{ cx: [19, 9] }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.05 }} />
            <motion.circle className="hero-bead hero-bead-6" cx="8" cy="19" r="2" animate={{ cx: [8, 18] }} transition={{ duration: 0.65, ease: "easeOut", delay: 0.1 }} />
            <motion.circle className="hero-bead hero-bead-7" cx="13" cy="19" r="2" animate={{ cx: [13, 8] }} transition={{ duration: 0.65, ease: "easeOut", delay: 0.1 }} />
            <motion.circle className="hero-bead hero-bead-8" cx="18" cy="19" r="2" animate={{ cx: [18, 13] }} transition={{ duration: 0.65, ease: "easeOut", delay: 0.1 }} />
          </motion.svg>
        ) : stage === "calc" ? (
          <motion.div
            key="calc"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88, filter: "blur(2px)" }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="hero-calc"
          >
            <div className="hero-calc-screen">
              <span className="hero-calc-count">$9</span>
              <span className="hero-calc-unit">once</span>
            </div>
            <div className="hero-calc-keys">
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} className="hero-calc-key" />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="eng"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className="hero-calc hero-calc--eng"
          >
            <div className="hero-calc-screen hero-calc-screen--wide">
              <span className="hero-calc-count">{count.toLocaleString()}</span>
              <span className="hero-calc-unit">tok</span>
            </div>
            <div className="hero-calc-keys hero-calc-keys--eng">
              {Array.from({ length: 15 }).map((_, i) => (
                <span key={i} className={`hero-calc-key${i < 3 ? " hero-calc-key--fn" : ""}`} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
