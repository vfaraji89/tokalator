import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VS Code Extension",
  description: "Tokalator VS Code extension — real-time token budget monitoring, context optimization, and cost tracking for AI coding assistants.",
};

export default function ExtensionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
