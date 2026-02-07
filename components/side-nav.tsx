"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import siteContent from "../content/site.json";

type NavItem = { href: string; label: string; badge?: string };
type NavSection = { section: string; items: NavItem[]; collapsible?: boolean };

const nav: NavSection[] = siteContent.nav as NavSection[];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: "transform 0.2s ease",
        transform: open ? "rotate(90deg)" : "rotate(0deg)",
      }}
    >
      <polyline points="3,2 7,5 3,8" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function SideNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Track which collapsible sections are open
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Auto-expand sections containing the active route
  useEffect(() => {
    const expanded: Record<string, boolean> = {};
    nav.forEach((section) => {
      if (section.collapsible) {
        const hasActive = section.items.some(
          (item) =>
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))
        );
        if (hasActive) expanded[section.section] = true;
      }
    });
    setCollapsed((prev) => ({ ...prev, ...expanded }));
  }, [pathname]);

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const toggleSection = (section: string) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <>
      {/* Mobile header — Agentation style: icon + /name left, = right */}
      <div className="mobile-header">
        <Link href="/" className="mobile-logo" onClick={() => setOpen(false)}>
          <svg className="mobile-logo-icon" width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M4 4 L4 24 L24 24 L24 4 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
            <line x1="4" y1="9" x2="24" y2="9" stroke="currentColor" strokeWidth="1" />
            <line x1="4" y1="14" x2="24" y2="14" stroke="currentColor" strokeWidth="1" />
            <line x1="4" y1="19" x2="24" y2="19" stroke="currentColor" strokeWidth="1" />
            <circle cx="8" cy="9" r="2" fill="var(--accent)" />
            <circle cx="13" cy="9" r="2" fill="var(--grey-600)" />
            <circle cx="9" cy="14" r="2" fill="var(--accent)" />
            <circle cx="14" cy="14" r="2" fill="var(--grey-600)" />
            <circle cx="8" cy="19" r="2" fill="var(--accent)" />
            <circle cx="13" cy="19" r="2" fill="var(--grey-600)" />
          </svg>
          <span className="mobile-logo-text">/Tokalator</span>
        </Link>
        <button
          className="menu-btn"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            {open ? (
              <>
                <line x1="5" y1="5" x2="15" y2="15" />
                <line x1="15" y1="5" x2="5" y2="15" />
              </>
            ) : (
              <>
                <line x1="3" y1="7" x2="17" y2="7" />
                <line x1="3" y1="13" x2="17" y2="13" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Overlay */}
      <div
        className={`overlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <nav className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-header">
          <Link href="/" className="sidebar-logo" onClick={() => setOpen(false)}>
            <span className="sidebar-slash">/</span>
            <span className="sidebar-logo-text text-motion">{siteContent.name.replace("@", "")}</span>
          </Link>
        </div>

        {nav.map((section) => {
          const isCollapsible = section.collapsible;
          const isOpen = !isCollapsible || collapsed[section.section];

          return (
            <div key={section.section}>
              {isCollapsible ? (
                <button
                  className="nav-section-label nav-section-toggle"
                  onClick={() => toggleSection(section.section)}
                  type="button"
                >
                  <span>{section.section}</span>
                  <ChevronIcon open={!!isOpen} />
                </button>
              ) : (
                <div className="nav-section-label">
                  {section.section}
                </div>
              )}
              {isOpen && (
                <div className={isCollapsible ? "nav-submenu" : ""}>
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`nav-link ${isActive ? "active" : ""} ${isCollapsible ? "nav-link--nested" : ""}`}
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                        {item.badge && <span className="nav-badge">{item.badge}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="sidebar-footer">
          <div className="sidebar-footer-row">
            <span className="sidebar-version">{siteContent.version}</span>
            <a
              href={siteContent.authorGithub}
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-github-link"
              aria-label="GitHub Profile"
            >
              <GitHubIcon />
            </a>
          </div>
          <div className="sidebar-made-by">
            Made by{" "}
            <a href={siteContent.authorGithub} target="_blank" rel="noopener noreferrer">
              Vahid Faraji
            </a>
            {" "}with <span className="sidebar-heart">&hearts;</span> from Istanbul
          </div>
        </div>
      </nav>
    </>
  );
}
