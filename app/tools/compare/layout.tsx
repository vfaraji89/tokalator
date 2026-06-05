import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Model Comparison",
  description: "Compare AI models side-by-side — context windows, token pricing, and capabilities for Claude, GPT-4, Gemini, and more.",
  alternates: { canonical: "/tools/compare" },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
