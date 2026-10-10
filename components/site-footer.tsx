"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import styles from "./site-footer.module.css";
import { CalculatorMark } from "./calculator-mark";

const MARKETPLACE = "https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator";

type Stats = { installs: number | null; downloads: number | null; version: string | null };

export function SiteFooter() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    fetch("/api/marketplace").then(r => (r.ok ? r.json() : null)).then(setStats).catch(() => undefined);
  }, []);
  const n = (v: number | null | undefined) => (v == null ? "…" : v.toLocaleString("en-US"));

  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><CalculatorMark size={30} /><Link href="/" className={styles.brand}><span>@</span> tokalator</Link></div>
          <a href="https://vfaraji89.github.io/" target="_blank" rel="noopener noreferrer" className={styles.by}>by Vahid Faraji</a>
          <p className={styles.tagline}>Open-source context engineering for AI coding. Free, AGPL-3.0.</p>
          <a href={MARKETPLACE} target="_blank" rel="noopener noreferrer" className={styles.stats} onClick={() => track("marketplace_click", { location: "footer" })}>
            <span className={styles.live} aria-hidden />
            VS Code Marketplace <b>{n(stats?.installs)}</b> installs <b>{n(stats?.downloads)}</b> downloads
          </a>
        </div>
        <div className={styles.col}>
          <h4>TOKALATOR</h4>
          <ul>
            <li><Link href="/extension">VS Code extension</Link></li>
            <li><Link href="/tools/usage">Claude Code usage</Link></li>
            <li><Link href="/tools">Tools</Link></li>
            <li><Link href="/wiki">Papers</Link></li>
            <li><Link href="/dictionary">Dictionary</Link></li>
          </ul>
        </div>
        <div className={styles.col}>
          <h4>APPLIED AI BY VAHID</h4>
          <ul>
            <li><a href="https://vfaraji89.github.io/awesome-applied-ai/" target="_blank" rel="noopener noreferrer">awesome-applied-ai<small>A working map of applied AI for enterprise</small></a></li>
            <li><a href="https://vimeo.com/1173321359" target="_blank" rel="noopener noreferrer">Multi-agent job classification<small>MCP-based, 14K+ positions (demo)</small></a></li>
            <li><a href="https://vfaraji89.github.io/" target="_blank" rel="noopener noreferrer">All projects →</a></li>
          </ul>
        </div>
        <div className={styles.col}>
          <h4>ABOUT</h4>
          <ul>
            <li>Vahid Faraji<small>Senior Applied AI Specialist, building agent systems for production</small></li>
            <li><a href="https://github.com/vfaraji89" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><a href="https://www.linkedin.com/in/vahid-faraji-jobehdar/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            <li><a href="https://arxiv.org/abs/2604.08290" target="_blank" rel="noopener noreferrer">Tokalator paper (arXiv)</a></li>
          </ul>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>© 2026 Tokalator · Made in Istanbul</span>
        <span className={styles.links}>
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="https://github.com/vfaraji89/tokalator" target="_blank" rel="noopener noreferrer">Source</a>
        </span>
      </div>
    </footer>
  );
}
