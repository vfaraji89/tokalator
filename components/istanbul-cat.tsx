"use client";

import { useRef, useState, useCallback, useEffect } from "react";

/**
 * Minimal Istanbul Cat — tiny cat face (ears, eyes, nose).
 * Eyes follow cursor on hover. That's it.
 */
export function IstanbulCat() {
  const ref = useRef<HTMLSpanElement>(null);
  const [eye, setEye] = useState({ x: 0, y: 0 });
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  const onMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const m = 1.2;
    setEye({ x: (dx / d) * m, y: (dy / d) * m * 0.6 });
  }, []);

  const onLeave = useCallback(() => setEye({ x: 0, y: 0 }), []);

  const ry = blink ? 0.2 : 1;

  return (
    <span
      ref={ref}
      className="istanbul-cat-wrap"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      aria-hidden="true"
    >
      <svg viewBox="0 0 20 18" width="16" height="14" fill="currentColor">
        {/* Ears */}
        <polygon points="3,8 1,1 7,6" />
        <polygon points="17,8 19,1 13,6" />
        {/* Head */}
        <ellipse cx="10" cy="11" rx="8" ry="7" />
        {/* Eyes */}
        <circle
          cx={7 + eye.x}
          cy={10 + eye.y}
          r="1"
          fill="var(--bg)"
          style={{ transition: "cx 0.15s, cy 0.15s" }}
        />
        <circle
          cx={13 + eye.x}
          cy={10 + eye.y}
          r="1"
          fill="var(--bg)"
          style={{ transition: "cx 0.15s, cy 0.15s" }}
        />
        {/* Blink overlay */}
        {blink && (
          <>
            <line x1="6" y1={10 + eye.y} x2="8" y2={10 + eye.y} stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="12" y1={10 + eye.y} x2="14" y2={10 + eye.y} stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
          </>
        )}
        {/* Nose */}
        <polygon points="10,12.5 9.2,13.5 10.8,13.5" fill="var(--accent)" opacity="0.8" />
      </svg>
    </span>
  );
}
