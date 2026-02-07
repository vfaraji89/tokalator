"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

type NavItem = { href: string; label: string; labelTr?: string; badge?: string };
type NavSection = { section: string; sectionTr: string; items: NavItem[] };

const nav: NavSection[] = [
  {
    section: "Overview",
    sectionTr: "Genel Bakış",
    items: [
      { href: "/", label: "Overview", labelTr: "Genel Bakış" },
      { href: "/about", label: "About", labelTr: "Hakkında" },
      { href: "/wiki", label: "Wiki", labelTr: "Wiki" },
    ],
  },
  {
    section: "Extension",
    sectionTr: "Uzantı",
    items: [
      { href: "/extension", label: "Install", labelTr: "Kurulum" },
    ],
  },
  {
    section: "Tools",
    sectionTr: "Araçlar",
    items: [
      { href: "/calculator", label: "Cost Calculator", labelTr: "Maliyet Hesaplayıcı" },
      { href: "/context", label: "Context Optimizer", labelTr: "Bağlam Optimize Edici" },
      { href: "/tools/compare", label: "Model Comparison", labelTr: "Model Karşılaştırma" },
      { href: "/tools/caching", label: "Caching ROI", labelTr: "Önbellekleme ROI" },
      { href: "/tools/conversation", label: "Conversation Cost", labelTr: "Konuşma Maliyeti" },
      { href: "/tools/analysis", label: "Economic Analysis", labelTr: "Ekonomik Analiz" },
      { href: "/tools/pricing", label: "Pricing Reference", labelTr: "Fiyat Referansı" },
    ],
  },
];

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
          <span className="sidebar-logo-text">Tokalator</span>
          <span className="sidebar-version">v0.1</span>
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
    <Suspense fallback={<nav className="sidebar"><div className="sidebar-header"><span className="sidebar-logo-text">Tokalator</span></div></nav>}>
      <SideNavContent />
    </Suspense>
  );
}
