"use client";

import { useRef, useState, useCallback, useEffect } from "react";

/**
 * Interactive Istanbul Cat — a cat sitting on a mosque silhouette.
 * Eyes track the mouse cursor, tail sways, ears twitch on hover.
 * Inspired by agentation.dev mascot interaction style.
 */
export function IstanbulCat() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const rafRef = useRef<number>(0);

  // Blink periodically
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    const id = setInterval(blink, 3200 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = containerRef.current!.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.35;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxMove = 2.5;
      const factor = Math.min(maxMove / (dist * 0.02 + 1), maxMove);
      setEyeOffset({
        x: (dx / (dist || 1)) * factor,
        y: (dy / (dist || 1)) * factor * 0.7,
      });
    });
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setEyeOffset({ x: 0, y: 0 });
  }, []);

  const eyeRy = isBlinking ? 0.3 : 1.4;

  return (
    <div
      ref={containerRef}
      className="istanbul-cat-wrap"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 120 56"
        width="80"
        height="38"
        fill="currentColor"
        className={`istanbul-cat-svg${isHovered ? " istanbul-cat-svg--hover" : ""}`}
      >
        {/* === ISTANBUL SKYLINE (background) === */}
        <g opacity="0.2">
          {/* Galata Tower */}
          <rect x="4" y="32" width="5" height="24" rx="1" />
          <polygon points="6.5,26 3,32 10,32" />
          {/* Dome */}
          <ellipse cx="60" cy="38" rx="14" ry="10" />
          <rect x="52" y="38" width="16" height="18" rx="1" />
          {/* Left minaret */}
          <rect x="38" y="28" width="2" height="28" rx="0.5" />
          <circle cx="39" cy="27" r="1.2" />
          {/* Right minaret */}
          <rect x="80" y="28" width="2" height="28" rx="0.5" />
          <circle cx="81" cy="27" r="1.2" />
          {/* Bridge hint */}
          <path
            d="M0,52 Q15,46 30,52 Q45,58 60,52 Q75,46 90,52 Q105,58 120,52"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.5"
          />
        </g>

        {/* === CAT === */}
        <g className="istanbul-cat-body">
          {/* Body */}
          <ellipse cx="60" cy="38" rx="13" ry="8" opacity="0.9" />

          {/* Head */}
          <circle cx="48" cy="28" r="8.5" opacity="0.9" />

          {/* Left ear */}
          <polygon
            className={`istanbul-cat-ear istanbul-cat-ear--left${isHovered ? " istanbul-cat-ear--perked" : ""}`}
            points="42,21 38,10 46,18"
            opacity="0.9"
          />
          {/* Right ear */}
          <polygon
            className={`istanbul-cat-ear istanbul-cat-ear--right${isHovered ? " istanbul-cat-ear--perked" : ""}`}
            points="52,18 54,8 58,20"
            opacity="0.9"
          />

          {/* Inner ears */}
          <polygon points="42.5,20 39.5,13 45,18" fill="var(--accent)" opacity="0.25" />
          <polygon points="52.5,18 54,11 56.5,19.5" fill="var(--accent)" opacity="0.25" />

          {/* Eyes — follow cursor */}
          <g>
            {/* Eye whites */}
            <ellipse cx="44.5" cy="27" rx="2.8" ry="2.2" fill="var(--bg)" opacity="0.95" />
            <ellipse cx="52.5" cy="27" rx="2.8" ry="2.2" fill="var(--bg)" opacity="0.95" />
            {/* Pupils */}
            <ellipse
              cx={44.5 + eyeOffset.x}
              cy={27 + eyeOffset.y}
              rx="1.5"
              ry={eyeRy}
              fill="var(--text-primary)"
              style={{ transition: "ry 0.1s ease" }}
            />
            <ellipse
              cx={52.5 + eyeOffset.x}
              cy={27 + eyeOffset.y}
              rx="1.5"
              ry={eyeRy}
              fill="var(--text-primary)"
              style={{ transition: "ry 0.1s ease" }}
            />
            {/* Eye shine */}
            <circle cx={44 + eyeOffset.x * 0.5} cy={26 + eyeOffset.y * 0.3} r="0.6" fill="white" opacity="0.7" />
            <circle cx={52 + eyeOffset.x * 0.5} cy={26 + eyeOffset.y * 0.3} r="0.6" fill="white" opacity="0.7" />
          </g>

          {/* Nose */}
          <polygon points="48,30.5 47,31.8 49,31.8" fill="var(--accent)" opacity="0.7" />

          {/* Whiskers — appear on hover */}
          <g className={`istanbul-cat-whiskers${isHovered ? " istanbul-cat-whiskers--show" : ""}`}>
            <line x1="40" y1="30" x2="32" y2="28" stroke="currentColor" strokeWidth="0.5" />
            <line x1="40" y1="31" x2="31" y2="31.5" stroke="currentColor" strokeWidth="0.5" />
            <line x1="40" y1="32" x2="32" y2="34" stroke="currentColor" strokeWidth="0.5" />
            <line x1="56" y1="30" x2="64" y2="28" stroke="currentColor" strokeWidth="0.5" />
            <line x1="56" y1="31" x2="65" y2="31.5" stroke="currentColor" strokeWidth="0.5" />
            <line x1="56" y1="32" x2="64" y2="34" stroke="currentColor" strokeWidth="0.5" />
          </g>

          {/* Mouth — subtle smile on hover */}
          <path
            d={isHovered ? "M46,33 Q48,35.5 50,33" : "M46.5,33 Q48,34 49.5,33"}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeLinecap="round"
            opacity="0.5"
            style={{ transition: "d 0.3s ease" }}
          />

          {/* Front paws */}
          <ellipse cx="52" cy="45" rx="3.5" ry="2" opacity="0.7" />
          <ellipse cx="58" cy="45.5" rx="3.5" ry="2" opacity="0.7" />

          {/* Tail — animated sway */}
          <path
            className="istanbul-cat-tail"
            d="M73,37 Q82,26 88,30 Q94,34 90,38"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.75"
          />
        </g>
      </svg>
    </div>
  );
}
