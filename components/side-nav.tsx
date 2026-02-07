"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; badge?: string };
type NavSection = { section: string; items: NavItem[] };

const nav: NavSection[] = [
  {
    section: "Overview",
    items: [
      { href: "/", label: "Overview" },
      { href: "/about", label: "About" },
    ],
  },
  {
    section: "Extension",
    items: [
      { href: "/extension", label: "Install" },
    ],
  },
  {
    section: "Tools",
    items: [
      { href: "/calculator", label: "Cost Calculator" },
      { href: "/context", label: "Context Optimizer" },
      { href: "/tools/compare", label: "Model Comparison" },
      { href: "/tools/caching", label: "Caching ROI" },
      { href: "/tools/conversation", label: "Conversation Cost" },
      { href: "/tools/analysis", label: "Economic Analysis" },
      { href: "/tools/pricing", label: "Pricing Reference" },
    ],
  },
  {
    section: "Context Engineering",
    items: [
      { href: "/context-engineering", label: "Collection", badge: "PR" },
    ],
  },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="sidebar">
      <Link href="/" className="sidebar-logo">
        <span className="sidebar-logo-text">Tokalator</span>
        <span className="sidebar-version">v0.1</span>
      </Link>

      {nav.map((section) => (
        <div key={section.section}>
          <div className="nav-section-label">{section.section}</div>
          {section.items.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                {item.label}
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
