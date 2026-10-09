import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Model Comparison",
  description: "Rank Claude, GPT and Gemini models by request cost and compare context windows and output limits, using dated catalog pricing.",
  alternates: { canonical: "/tools/compare" },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
