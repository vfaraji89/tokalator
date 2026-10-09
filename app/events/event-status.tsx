"use client";

import { useSyncExternalStore } from "react";
import { eventStatus } from "./event-utils";

const subscribe = () => () => {};

export function useToday(): string | null {
  return useSyncExternalStore(subscribe, () => new Date().toLocaleDateString("en-CA"), () => null);
}

export function EventStatusBadge({ date }: { date: string }) {
  const today = useToday();
  if (!today) return null;
  const status = eventStatus(date, today);
  return (
    <span className={`event-status-badge event-status--${status}`}>{status === "upcoming" ? "Upcoming" : "Past"}</span>
  );
}
