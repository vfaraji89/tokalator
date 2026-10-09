"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import pkg from "../tokalator-extension-vs/package.json";
import mcp from "../tokalator-mcp/package.json";
import { CATALOG_MODELS, CATALOG_UPDATED_AT } from "@/lib/models";
import styles from "./news-chips.module.css";

const NEWS = [
  {
    tag: "NEW HOME",
    title: "tokalator.ai is the home of Tokalator",
    summary: "tokalator.wiki now redirects here. One site for everything.",
    points: ["Old links keep working"],
    href: "/about",
    cta: "About the project",
  },
  {
    tag: `EXTENSION ${pkg.version}`,
    title: "Claude Code turns and cost, tracked automatically",
    summary: "Turns, cache hits, and API-equivalent cost from Claude Code, updated on their own.",
    points: ["Copilot: model detection; cost is an estimate"],
    href: "/extension",
    cta: "See the extension",
  },
  {
    tag: "FREE",
    title: "Everything is open source, at no cost",
    summary: "Every former Pro feature is free under AGPL-3.0. No paid tier.",
    points: [],
    href: "/extension",
    cta: "What is included",
  },
  {
    tag: `${CATALOG_MODELS.length} MODELS`,
    title: `Every current model, prices checked ${CATALOG_UPDATED_AT}`,
    summary: "Claude 5.5 family, Fable 5.1, GPT-6, and Gemini 3.8, with long-context rates.",
    points: [],
    href: "/tools/pricing",
    cta: "Pricing reference",
  },
  {
    tag: "TOOL",
    title: "Claude Code usage in your browser",
    summary: "Drop your Claude Code logs. See cost by model, project, and day.",
    points: ["Nothing is uploaded"],
    href: "/tools/usage",
    cta: "Open the usage tool",
  },
  {
    tag: "SECURITY",
    title: "Secure Workspace verifies every secret file",
    summary: "Checks each secret file is hidden from agents, fixes gaps, then verifies.",
    points: [],
    href: "/extension",
    cta: "How it works",
  },
  {
    tag: `MCP ${mcp.version}`,
    title: "MCP server and CLI with Claude Code usage",
    summary: "Claude Code usage as an MCP tool and a live terminal view.",
    points: [],
    href: "/extension#mcp",
    cta: "MCP and CLI",
  },
  {
    tag: "LEARN",
    title: "Papers, terms, and lessons refreshed",
    summary: "New arXiv papers, dictionary terms, and lessons, all sourced.",
    points: [],
    href: "/wiki",
    cta: "Read the papers",
  },
  {
    tag: "PRIVACY",
    title: "Opt-in telemetry you control",
    summary: "Off by default. Show, export, or delete your data anytime.",
    points: [],
    href: "/privacy#telemetry",
    cta: "Privacy policy",
  },
];

export function NewsChips() {
  const [open, setOpen] = useState(1);
  const reduced = useReducedMotion();
  const item = NEWS[open];
  return (
    <section className={styles.wrap} aria-label="What's new">
      <div className={styles.label}><span className={styles.dot} aria-hidden /> WHAT&apos;S NEW · OCTOBER 10, 2026</div>
      <div className={styles.chips}>
        {NEWS.map((n, i) => (
          <button key={n.tag} type="button" className={styles.chip} aria-pressed={open === i} onClick={() => setOpen(i)}>
            <span className={styles.tag}>{n.tag}</span>
            {n.title.length > 38 ? n.title.slice(0, 36) + "…" : n.title}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={open}
          className={styles.card}
          initial={{ opacity: 0, y: reduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : -6 }}
          transition={{ duration: reduced ? 0 : 0.22 }}
        >
          <span className={styles.tag}>{item.tag}</span>
          <h3>{item.title}</h3>
          <p>{item.summary}</p>
          {item.points.length > 0 && <ul>{item.points.map(p => <li key={p}>{p}</li>)}</ul>}
          <Link href={item.href}>{item.cta} →</Link>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
