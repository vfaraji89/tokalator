import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Reference",
  description: "Live AI model pricing dashboard — compare token costs for Claude, GPT-4, Gemini, and other LLMs with interactive charts.",
  alternates: { canonical: "/tools/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
