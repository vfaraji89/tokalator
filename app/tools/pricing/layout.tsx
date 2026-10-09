import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing Reference",
  description: "Dated API pricing references for Claude, GPT and Gemini, with source links, context limits and pricing conditions.",
  alternates: { canonical: "/tools/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
