import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SideNav } from "@/components/side-nav";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { WebVitals } from "./_components/web-vitals";

const siteUrl = "https://tokalator.wiki";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}/#author`,
      name: "vfaraji89",
      url: "https://vfaraji89.github.io",
      sameAs: [
        "https://vfaraji89.github.io",
        "https://github.com/vfaraji89",
      ],
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Tokalator",
      url: siteUrl,
      logo: `${siteUrl}/favicon.svg`,
      founder: { "@id": `${siteUrl}/#author` },
      sameAs: [
        "https://vfaraji89.github.io",
        "https://github.com/vfaraji89/tokalator",
        "https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Tokalator",
      description:
        "Generate GLOSSARY.md and SITE-MAP.md locally, with Claude Code review and stop hooks. Source-linked context for coding agents, plus token and pricing tools.",
      publisher: { "@id": `${siteUrl}/#organization` },
      author: { "@id": `${siteUrl}/#author` },
    },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e3120b",
};

export const metadata: Metadata = {
  title: {
    default: "Tokalator 3.4.0 — Give Your Agents a Map of Your Code",
    template: "%s | Tokalator",
  },
  description:
    "Generate GLOSSARY.md and SITE-MAP.md locally, with Claude Code review and stop hooks. Source-linked context for coding agents, plus token and pricing tools.",
  keywords: [
    "token calculator",
    "context engineering",
    "AI cost optimizer",
    "LLM pricing",
    "prompt caching",
    "VS Code extension",
    "Claude",
    "GPT",
    "context window",
    "token budget",
  ],
  authors: [{ name: "vfaraji89", url: "https://vfaraji89.github.io" }],
  creator: "vfaraji89",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Tokalator",
    title: "Tokalator 3.4.0 — Give Your Agents a Map of Your Code",
    description:
      "Generate GLOSSARY.md and SITE-MAP.md locally, with Claude Code review and stop hooks. Source-linked context for coding agents, plus token and pricing tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tokalator 3.4.0 — Give Your Agents a Map of Your Code",
    description:
      "Generate GLOSSARY.md and SITE-MAP.md locally, with Claude Code review and stop hooks. Source-linked context for coding agents, plus token and pricing tools.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Recursive:CASL,CRSV,MONO,slnt,wght@0,0,0..1,0,300..1000&amp;family=Sora:wght@100..800&amp;display=swap" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=Space+Mono:wght@400;700&family=Instrument+Serif:ital@0;1&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.setAttribute('data-theme','light');}}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
      </head>
      <body>
        <div className="layout">
          <SideNav />
          <main className="main-content">{children}</main>
        </div>
        <div className="pixel-grid-bg" aria-hidden="true" />
        <WebVitals />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
