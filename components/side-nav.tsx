"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import siteContent from "../content/site.json";

type NavItem = { href: string; label: string; badge?: string; icon?: string };
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
      {/* Mobile header with hamburger */}
      <div className="mobile-header">
        <button
          className="menu-btn"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </>
            ) : (
              <>
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </>
            )}
          </svg>
        </button>
        <Link href="/" className="mobile-logo" onClick={() => setOpen(false)}>
          {siteContent.name}
        </Link>
        <span className="mobile-version">{siteContent.version}</span>
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
            <span className="sidebar-logo-text">{siteContent.name}</span>
            <span className="sidebar-version">{siteContent.version}</span>
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
                  {item.icon && <span className="nav-icon">{item.icon}</span>}
                  {item.label}
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </>
  );
}
