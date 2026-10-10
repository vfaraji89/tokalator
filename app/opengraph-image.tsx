import { ImageResponse } from "next/og";

export const alt = "Tokalator 3.4.0 — Automated Code Maps";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#111",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <svg width="84" height="108" viewBox="0 0 56 72">
          <rect x="1" y="1" width="54" height="70" rx="9" fill="#1d1d24" stroke="#33333d" />
          <rect x="7" y="7" width="42" height="17" rx="3" fill="#062314" />
          <rect x="30" y="12" width="15" height="7" rx="1" fill="#3ee08a" />
          <rect x="9" y="30" width="10" height="7" rx="1.6" fill="#3a3a45" />
          <rect x="22" y="30" width="10" height="7" rx="1.6" fill="#3a3a45" />
          <rect x="35" y="30" width="10" height="7" rx="1.6" fill="#3a3a45" />
          <rect x="9" y="40" width="10" height="7" rx="1.6" fill="#3a3a45" />
          <rect x="22" y="40" width="10" height="7" rx="1.6" fill="#ff4b3e" />
          <rect x="35" y="40" width="10" height="7" rx="1.6" fill="#3a3a45" />
          <rect x="9" y="50" width="10" height="7" rx="1.6" fill="#3a3a45" />
          <rect x="22" y="50" width="10" height="7" rx="1.6" fill="#3a3a45" />
          <rect x="35" y="50" width="10" height="7" rx="1.6" fill="#3a3a45" />
          <rect x="9" y="60" width="36" height="7" rx="1.6" fill="#e3120b" />
        </svg>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 24,
          }}
        >
          <span style={{ color: "#e3120b", fontSize: 64, fontWeight: 800 }}>/</span>
          <span style={{ color: "#fff", fontSize: 56, fontWeight: 700, letterSpacing: "-0.03em" }}>
            Tokalator
          </span>
        </div>

        <div
          style={{
            color: "#888",
            fontSize: 24,
            marginTop: 12,
            fontWeight: 500,
          }}
        >
          GLOSSARY.md + SITE-MAP.md
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 32,
            color: "#ccc",
            fontSize: 16,
          }}
        >
          <span style={{ padding: "6px 16px", border: "1px solid #333", borderRadius: 6 }}>
            Token Calculator
          </span>
          <span style={{ padding: "6px 16px", border: "1px solid #333", borderRadius: 6 }}>
            Context Optimizer
          </span>
          <span style={{ padding: "6px 16px", border: "1px solid #333", borderRadius: 6 }}>
            Model Pricing
          </span>
          <span style={{ padding: "6px 16px", border: "1px solid #333", borderRadius: 6 }}>
            VS Code Extension
          </span>
        </div>

        <div style={{ position: "absolute", bottom: 24, color: "#555", fontSize: 14 }}>
          tokalator.ai
        </div>
      </div>
    ),
    { ...size }
  );
}
