import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SideNav } from "@/components/side-nav";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { WebVitals } from "./_components/web-vitals";
import { SiteFooter } from "@/components/site-footer";

const siteUrl = "https://tokalator.ai";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}/#author`,
      name: "Vahid Farajijobehdar",
      alternateName: "vfaraji89",
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
      logo: `${siteUrl}/apple-touch-icon.png`,
      description: "Open-source context engineering tools for AI coding assistants.",
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
      description: "Context engineering for AI coding: living code maps (GLOSSARY.md and SITE-MAP.md) for agents, a VS Code extension that tracks context budgets and Claude Code turns with API-equivalent cost, and token and pricing tools for 32 Claude, GPT, and Gemini models. Free and open source.",
      inLanguage: "en",
      dateModified: "2026-10-10",
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
    default: "Tokalator: Context Engineering for AI Coding",
    template: "%s | Tokalator",
  },
  description: "Context engineering for AI coding: living code maps (GLOSSARY.md and SITE-MAP.md) for agents, a VS Code extension that tracks context budgets and Claude Code turns with API-equivalent cost, and token and pricing tools for 32 Claude, GPT, and Gemini models. Free and open source.",
  applicationName: "Tokalator",
  keywords: [
    "Claude Code cost",
    "Claude Code usage",
    "Claude Code tokens",
    "token counter",
    "context window calculator",
    "Claude Opus 5.5 pricing",
    "GPT-6 pricing",
    "Gemini 3.8 Flash pricing",
    "GitHub Copilot context",
    "MCP server",
    "AGENTS.md",
    "CLAUDE.md",
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
  authors: [{ name: "Vahid Farajijobehdar", url: "https://vfaraji89.github.io" }],
  creator: "Vahid Farajijobehdar",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Tokalator",
    title: "Tokalator: Context Engineering for AI Coding",
    description: "Context engineering for AI coding: living code maps (GLOSSARY.md and SITE-MAP.md) for agents, a VS Code extension that tracks context budgets and Claude Code turns with API-equivalent cost, and token and pricing tools for 32 Claude, GPT, and Gemini models. Free and open source.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tokalator: Context Engineering for AI Coding",
    description: "Context engineering for AI coding: living code maps (GLOSSARY.md and SITE-MAP.md) for agents, a VS Code extension that tracks context budgets and Claude Code turns with API-equivalent cost, and token and pricing tools for 32 Claude, GPT, and Gemini models. Free and open source.",
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
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <link rel="alternate" type="text/plain" title="LLM summary" href="/llms.txt" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.setAttribute('data-theme','light');}}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
      </head>
      <body>
        <div className="layout">
          <SideNav />
          <main className="main-content">{children}<SiteFooter /></main>
        </div>
        <div className="pixel-grid-bg" aria-hidden="true" />
        <WebVitals />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
