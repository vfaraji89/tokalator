"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import siteContent from "../content/site.json";

type NavItem = { href: string; label: string; labelTr?: string; badge?: string; icon?: string };
type NavSection = { section: string; sectionTr: string; items: NavItem[] };

const nav: NavSection[] = siteContent.nav as NavSection[];

function SideNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "tr" ? "tr" : "en";

  const getLangHref = (targetLang: string) => {
    if (targetLang === "en") {
      return pathname;
    }
    return `${pathname}?lang=tr`;
  };

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-logo">
          <span className="sidebar-logo-text">{siteContent.name}</span>
          <span className="sidebar-version">{siteContent.version}</span>
        </Link>
        <div className="lang-toggle">
          <Link
            href={getLangHref("en")}
            className={`lang-btn ${lang === "en" ? "active" : ""}`}
          >
            EN
          </Link>
          <Link
            href={getLangHref("tr")}
            className={`lang-btn ${lang === "tr" ? "active" : ""}`}
          >
            TR
          </Link>
        </div>
      </div>

      {nav.map((section) => (
        <div key={section.section}>
          <div className="nav-section-label">
            {lang === "tr" ? section.sectionTr : section.section}
          </div>
          {section.items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const href = lang === "tr" ? `${item.href}?lang=tr` : item.href;
            return (
              <Link
                key={item.href}
                href={href}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                {item.icon && <span className="nav-icon">{item.icon}</span>}
                {lang === "tr" && item.labelTr ? item.labelTr : item.label}
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function SideNav() {
  return (
    <Suspense fallback={<nav className="sidebar"><div className="sidebar-header"><span className="sidebar-logo-text">{siteContent.name}</span></div></nav>}>
      <SideNavContent />
    </Suspense>
  );
}
