import type { Metadata } from "next";
import "./globals.css";
import { SideNav } from "@/components/side-nav";

export const metadata: Metadata = {
  title: "Tokalator",
  description:
    "Context engineering tools for AI coding assistants. Token calculator, context optimizer, and VS Code extension.",
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
