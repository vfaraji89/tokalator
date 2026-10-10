"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

const READOUTS = ["1,024", "32K", "128K", "200K", "1.0M"];
const KEY = (i: number) => ({ x: 9 + (i % 3) * 13, y: 30 + Math.floor(i / 3) * 10, width: 10, height: 7, rx: 1.6 });
const BEAD = (i: number, shift: number) => ({ x: 9 + (i % 3) * 9 + shift, y: 15 + Math.floor(i / 3) * 16, width: 8, height: 8, rx: 4 });
const RODS = [19, 35, 51];

/**
 * The Tokalator mark: an abacus whose beads slide, then become calculator keys,
 * then keys press in turn while "=" updates the token readout.
 */
export function CalculatorMark({ size = 48, label = "Tokalator" }: { size?: number; label?: string }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<"abacus" | "slide" | "calc">(reduced ? "calc" : "abacus");
  const [step, setStep] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (reduced) { setPhase("calc"); return; }
    const a = setTimeout(() => setPhase("slide"), 500);
    const b = setTimeout(() => setPhase("calc"), 1500);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [reduced]);

  useEffect(() => {
    if (reduced || phase !== "calc") return;
    const t = setInterval(() => setStep(s => s + 1), hover ? 160 : 420);
    return () => clearInterval(t);
  }, [reduced, phase, hover]);

  const calc = phase === "calc";
  const active = calc && !reduced ? step % 11 : -1;
  const readout = READOUTS[Math.floor(step / 11) % READOUTS.length];
  const spring = { type: "spring" as const, stiffness: 260, damping: 24 };

  return (
    <svg
      viewBox="0 0 56 72"
      width={size}
      height={(size * 72) / 56}
      role="img"
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ cursor: "pointer", flexShrink: 0, overflow: "visible" }}
    >
      <motion.rect
        x="1" y="1" width="54" height="70"
        initial={false}
        animate={{ rx: calc ? 9 : 4, fill: calc ? "#1d1d24" : "#140707" }}
        stroke={calc ? "#33333d" : "#8b1208"}
        strokeWidth={calc ? 1 : 3}
        transition={spring}
      />
      {RODS.map(y => (
        <motion.rect key={y} x="5" y={y} width="46" height="1.5" fill="#5a3a30" initial={false} animate={{ opacity: calc ? 0 : 1 }} transition={{ duration: 0.3 }} />
      ))}
      <motion.rect x="7" y="7" width="42" height="17" rx="3" fill="#062314" initial={false} animate={{ opacity: calc ? 1 : 0, scaleY: calc ? 1 : 0.2 }} style={{ transformOrigin: "28px 15px" }} transition={spring} />
      <motion.text
        x="45" y="19.5" textAnchor="end" fontFamily="ui-monospace, 'SF Mono', Menlo, monospace" fontSize="9" fontWeight="700" fill="#3ee08a"
        initial={false} animate={{ opacity: calc ? 1 : 0 }} transition={{ delay: calc ? 0.25 : 0 }}
      >
        {readout}
      </motion.text>
      {Array.from({ length: 9 }, (_, i) => {
        const target = calc ? KEY(i) : BEAD(i, phase === "slide" && i % 3 === 2 ? 12 : 0);
        const pressed = active === i;
        return (
          <motion.rect
            key={i}
            initial={false}
            animate={{ ...target, y: target.y + (pressed ? 0.8 : 0), fill: calc ? (pressed ? "#ff4b3e" : "#3a3a45") : i % 2 ? "#7a1208" : "#e3120b" }}
            transition={calc && step > 0 ? { duration: 0.12 } : { ...spring, delay: calc ? i * 0.03 : 0 }}
          />
        );
      })}
      <motion.rect
        x="9" width="36" height="7" rx="1.6"
        initial={false}
        animate={{ y: 60 + (active >= 9 ? 0.8 : 0), opacity: calc ? 1 : 0, fill: active >= 9 ? "#ff4b3e" : "#e3120b" }}
        transition={{ duration: 0.2, delay: calc && step === 0 ? 0.3 : 0 }}
      />
      <motion.text x="27" y="65.6" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="6" fontWeight="700" fill="#fff" initial={false} animate={{ opacity: calc ? 1 : 0 }}>=</motion.text>
    </svg>
  );
}
