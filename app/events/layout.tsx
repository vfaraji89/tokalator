import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Events & Talks", template: "%s | Tokalator" },
  description:
    "Talks and workshops on context engineering, token economics, and AI-native software development, with slides and full guides.",
  alternates: { canonical: "/events" },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
