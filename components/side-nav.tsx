"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import siteContent from "../content/site.json";

type NavItem = { href: string; label: string; badge?: string };
type NavSection = { section: string; items: NavItem[] };

const nav: NavSection[] = siteContent.nav as NavSection[];

export function SideNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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

  return (
    <>
      {/* Mobile header with minimal menu button on right */}
      <div className="mobile-header">
        <Link href="/" className="mobile-logo text-motion" onClick={() => setOpen(false)}>
          {siteContent.name}
        </Link>
        <span className="mobile-version">{siteContent.version}</span>
        <button
          className="menu-btn"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            {open ? (
              <>
                <line x1="4" y1="4" x2="14" y2="14" />
                <line x1="14" y1="4" x2="4" y2="14" />
              </>
            ) : (
              <>
                <line x1="3" y1="7" x2="15" y2="7" />
                <line x1="3" y1="12" x2="15" y2="12" />
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

        {nav.map((section) => (
          <div key={section.section}>
            <div className="nav-section-label">
              {section.section}
            </div>
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? "active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </Link>
              );
            })}
          </div>
        ))}

        <div className="sidebar-footer">
          <span className="sidebar-version">{siteContent.version}</span>
        </div>
      </nav>
    </>
  );
}
