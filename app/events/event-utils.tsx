export function eventStatus(date: string, today: string): "upcoming" | "past" {
  return date >= today ? "upcoming" : "past";
}

export function formatEventDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function EventBanner({ subtitle }: { subtitle: string }) {
  const [title, badge] = subtitle.split(" — ");
  return (
    <div className="event-banner-content" aria-hidden>
      <span className="event-banner-title">{title}</span>
      {badge && <span className="event-banner-badge">{badge}</span>}
    </div>
  );
}
