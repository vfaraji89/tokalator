"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";
import { ThemeToggle } from "./theme-toggle";

export function TopNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <Link href="/" className="topnav-brand">
          <span className="topnav-at">@</span>
          Tokalator
        </Link>

        <button
          className={`topnav-burger${open ? " topnav-burger--open" : ""}`}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>

        <ul className={`topnav-links${open ? " topnav-links--open" : ""}`}>
          <li>
            <Link
              href="/extension"
              className={`topnav-link${path === "/extension" ? " topnav-link--active" : ""}`}
              onClick={() => setOpen(false)}
            >
              Extension
            </Link>
          </li>
          <li>
            <Link
              href="/wiki"
              className={`topnav-link${path?.startsWith("/wiki") ? " topnav-link--active" : ""}`}
              onClick={() => setOpen(false)}
            >
              Wiki
            </Link>
          </li>
          <li>
            <Link
              href="/learn"
              className={`topnav-link${path === "/learn" ? " topnav-link--active" : ""}`}
              onClick={() => setOpen(false)}
            >
              Learn
            </Link>
          </li>
          <li>
            <a
              href="https://tokalator.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="topnav-link"
              onClick={() => setOpen(false)}
            >
              Bead
            </a>
          </li>
          <li>
            <a
              href="https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator"
              target="_blank"
              rel="noopener noreferrer"
              className="topnav-cta"
              onClick={() => { setOpen(false); track("marketplace_click", { location: "top-nav" }); }}
            >
              Install Free <span aria-hidden>→</span>
            </a>
          </li>
          <li>
            <ThemeToggle />
          </li>
        </ul>
      </div>
    </nav>
  );
}
