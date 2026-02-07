import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Tokalator — Count Your Tokens";
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
        {/* Abacus icon */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 28 28"
          fill="none"
        >
          <path
            d="M4 4 L4 24 L24 24 L24 4 Z"
            stroke="#888"
            strokeWidth="2"
            fill="none"
            strokeLinejoin="round"
          />
          <line x1="4" y1="9" x2="24" y2="9" stroke="#888" strokeWidth="1.2" />
          <line x1="4" y1="14" x2="24" y2="14" stroke="#888" strokeWidth="1.2" />
          <line x1="4" y1="19" x2="24" y2="19" stroke="#888" strokeWidth="1.2" />
          <circle cx="8" cy="9" r="2.2" fill="#e3120b" />
          <circle cx="13" cy="9" r="2.2" fill="#555" />
          <circle cx="9" cy="14" r="2.2" fill="#555" />
          <circle cx="14" cy="14" r="2.2" fill="#e3120b" />
          <circle cx="19" cy="14" r="2.2" fill="#e3120b" />
          <circle cx="8" cy="19" r="2.2" fill="#e3120b" />
          <circle cx="13" cy="19" r="2.2" fill="#e3120b" />
          <circle cx="18" cy="19" r="2.2" fill="#555" />
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
          Count Your Tokens Like Beads on an Abacus
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
          tokalator.wiki
        </div>
      </div>
    ),
    { ...size }
  );
}
