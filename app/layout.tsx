import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SideNav } from "@/components/side-nav";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { WebVitals } from "./_components/web-vitals";

const siteUrl = "https://tokalator.wiki";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e3120b",
};

export const metadata: Metadata = {
  title: {
    default: "Tokalator — Count Your Tokens",
    template: "%s | Tokalator",
  },
  description:
    "Count your tokens like beads on an abacus. Token calculator, context optimizer, caching ROI tools, and VS Code extension for AI coding assistants.",
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
  authors: [{ name: "vfaraji89", url: "https://github.com/vfaraji89" }],
  creator: "vfaraji89",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Tokalator",
    title: "Tokalator — Count Your Tokens",
    description:
      "Count your tokens like beads on an abacus. Token calculator, context optimizer, and VS Code extension for AI coding assistants.",
  },
  twitter: {
    card: "summary",
    title: "Tokalator — Count Your Tokens",
    description:
      "Token calculator, context optimizer, and VS Code extension for AI coding assistants.",
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
