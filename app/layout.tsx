import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SideNav } from "@/components/side-nav";

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
    <html lang="en">
      <body>
        <div className="layout">
          <SideNav />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
