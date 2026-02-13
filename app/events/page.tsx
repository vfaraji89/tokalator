"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import eventsData from "../../content/events.json";

type EventItem = (typeof eventsData.events)[number];

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
];

const TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "talk", label: "Talks" },
  { id: "workshop", label: "Workshops" },
  { id: "panel", label: "Panels" },
];

/* ── Icons ── */
const SlidesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const PdfIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const events = eventsData.events as EventItem[];

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.speaker.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [events, search, statusFilter, typeFilter]);

  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="4" y="6" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="9" y1="3" x2="9" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="19" y1="3" x2="19" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="4" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="1" />
            <circle cx="10" cy="17" r="1.5" fill="#e3120b" />
            <circle cx="14" cy="17" r="1.5" fill="currentColor" opacity="0.4" />
            <circle cx="18" cy="17" r="1.5" fill="currentColor" opacity="0.4" />
          </svg>
        </div>
        <h1 className="hero-headline">
          Events &amp; Talks
        </h1>
        <p className="hero-description">
          <span className="accent-highlight">{eventsData.stats.total} event{eventsData.stats.total !== 1 ? "s" : ""}</span>{" "}
          — talks, workshops, and panels on context engineering, token economics, and AI-native development.
        </p>
      </header>

      {/* Search */}
      <div className="wiki-search">
        <input
          type="text"
          placeholder="Search events, speakers, tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="wiki-search-input"
        />
        <span className="wiki-search-count">
          {filtered.length} of {events.length}
        </span>
      </div>

      {/* Filters */}
      <div className="wiki-filters">
        <div className="wiki-filter-row">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.id}
              className={`source-pill ${statusFilter === s.id ? "active" : ""}`}
              onClick={() => setStatusFilter(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="wiki-filter-row">
          {TYPE_FILTERS.filter(
            (t) => t.id === "all" || events.some((e) => e.type === t.id)
          ).map((t) => (
            <button
              key={t.id}
              className={`category-pill ${typeFilter === t.id ? "active" : ""}`}
              onClick={() => setTypeFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event Cards */}
      <div className="events-list">
        {filtered.map((event) => (
          <EventCard key={event.slug} event={event} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="wiki-empty">
          <p>No events match your filters.</p>
          <button
            className="cta-secondary"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setTypeFilter("all");
            }}
          >
            Clear all filters
          </button>
        </div>
      )}
    </article>
  );
}

function EventCard({ event }: { event: EventItem }) {
  return (
    <div className="event-card">
      {/* Event Image / Banner */}
      {event.series && (
        <div className="event-banner">
          <div className="event-banner-content">
            <span className="event-banner-title">AI-NATIVE</span>
            <span className="event-banner-subtitle">SOFTWARE DEV.</span>
            <span className="event-banner-badge">ONLY BUILDERS CLUB</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="event-card-header">
        <span className={`event-status-badge event-status--${event.status}`}>
          {event.status === "upcoming" ? "Upcoming" : "Past"}
        </span>
        <span className="category-badge">{event.type}</span>
        {event.series && (
          <span className="event-series-badge">
            Part {event.part} — {event.series}
          </span>
        )}
      </div>

      {/* Title & Speaker */}
      <h2 className="event-card-title">
        <Link href={`/events/${event.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
          {event.title}
        </Link>
      </h2>
      <p className="event-card-speaker">
        <strong>{event.speaker}</strong> · {event.speakerRole}
      </p>

      {/* Meta */}
      <div className="event-card-meta">
        <span className="event-meta-item">
          <CalendarIcon />
          {new Date(event.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
        <span className="event-meta-item">
          <LocationIcon />
          {event.location}
        </span>
      </div>

      {/* Description */}
      <p className="event-card-desc">{event.description}</p>

      {/* Topics */}
      <div className="event-card-section">
        <h3>Topics Covered</h3>
        <ul className="event-topics-list">
          {event.topics.map((topic, i) => (
            <li key={i}>{topic}</li>
          ))}
        </ul>
      </div>

      {/* Takeaways */}
      <div className="event-card-section">
        <h3>Practical Takeaways</h3>
        <ul className="event-topics-list">
          {event.takeaways.map((tw, i) => (
            <li key={i}>{tw}</li>
          ))}
        </ul>
      </div>

      {/* Slides Links */}
      <div className="event-card-actions">
        {event.slidesUrl && (
          <a
            href={event.slidesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="event-action-btn"
          >
            <SlidesIcon />
            View Slides
          </a>
        )}
        {event.slidesPdfUrl && (
          <a
            href={event.slidesPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="event-action-btn event-action-btn--secondary"
          >
            <PdfIcon />
            Export PDF
          </a>
        )}
        <Link
          href={`/events/${event.slug}`}
          className="event-action-btn event-action-btn--secondary"
        >
          Read Full Guide →
        </Link>
      </div>

      {/* Tags */}
      {event.tags.length > 0 && (
        <div className="wiki-card-tags" style={{ marginTop: "1rem" }}>
          {event.tags.map((tag) => (
            <span key={tag} className="wiki-tag">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
