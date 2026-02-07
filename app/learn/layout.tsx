import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn",
  description: "Free course on token economics and context engineering — 10 lessons covering prompts, context windows, caching, and real-world optimization.",
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
