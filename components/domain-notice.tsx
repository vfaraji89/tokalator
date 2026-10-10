"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const KEY = "tokalator.domainNotice";

export function DomainNotice() {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [swapped, setSwapped] = useState(false);

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(KEY) === "1"; } catch { /* storage unavailable */ }
    if (seen) return;
    const show = setTimeout(() => setOpen(true), 900);
    const swap = setTimeout(() => setSwapped(true), reduced ? 900 : 2100);
    const hide = setTimeout(() => setOpen(false), 11000);
    return () => { clearTimeout(show); clearTimeout(swap); clearTimeout(hide); };
  }, [reduced]);

  const dismiss = () => {
    setOpen(false);
    try { localStorage.setItem(KEY, "1"); } catch { /* storage unavailable */ }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: reduced ? 0 : -14, scale: reduced ? 1 : 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reduced ? 0 : -10 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          style={{
            position: "fixed", top: 18, left: "50%", translateX: "-50%", zIndex: 60,
            display: "flex", alignItems: "center", gap: 10, padding: "8px 8px 8px 14px",
            borderRadius: 999, border: "1px solid var(--border)", background: "var(--bg)",
            boxShadow: "0 12px 32px -18px rgba(0,0,0,.45)", fontSize: 13, whiteSpace: "nowrap",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} aria-hidden />
          <span style={{ fontWeight: 600, letterSpacing: "-0.01em" }}>
            tokalator.
            <span style={{ position: "relative", display: "inline-grid" }}>
              <AnimatePresence mode="popLayout" initial={false}>
                {swapped ? (
                  <motion.span key="ai" initial={{ opacity: 0, y: 8, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 22 }} style={{ color: "var(--accent)" }}>ai</motion.span>
                ) : (
                  <motion.span key="wiki" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} style={{ position: "relative", color: "var(--text-secondary)" }}>
                    wiki
                    <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.7, duration: 0.45 }} style={{ position: "absolute", left: 0, right: 0, top: "52%", height: 1.5, background: "var(--accent)", transformOrigin: "left" }} />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </span>
          <span style={{ color: "var(--text-secondary)" }}>{swapped ? "is our new home" : "is moving"}</span>
          <button type="button" onClick={dismiss} aria-label="Dismiss" style={{ border: 0, background: "var(--bg-subtle)", color: "var(--text-secondary)", width: 24, height: 24, borderRadius: "50%", cursor: "pointer", lineHeight: "24px" }}>×</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
