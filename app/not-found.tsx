import Link from "next/link";

export default function NotFound() {
  return (
    <article className="article">
      <header className="hero" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="10" y1="10" x2="18" y2="18" stroke="#e3120b" strokeWidth="2" strokeLinecap="round" />
            <line x1="18" y1="10" x2="10" y2="18" stroke="#e3120b" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="hero-headline">
          <span className="hero-marker">404</span>
        </h1>
        <p className="hero-description">
          This page doesn&apos;t exist — like tokens that exceeded the context window.
        </p>
        <div style={{ marginTop: "2rem" }}>
          <Link href="/" className="cta-primary">
            Back to Home
          </Link>
        </div>
      </header>
    </article>
  );
}
