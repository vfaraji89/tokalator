import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events & Talks",
  description:
    "Talks, workshops, and events on context engineering, token economics, and AI-native software development by the Tokalator team.",
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
