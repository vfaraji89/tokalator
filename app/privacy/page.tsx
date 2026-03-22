import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Tokalator collects and handles data. We keep it simple: no accounts, no cookies, anonymous analytics only.",
};

const LAST_UPDATED = "March 22, 2026";

export default function PrivacyPage() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <path d="M14 3L5 7v7c0 5 4 9 9 10 5-1 9-5 9-10V7L14 3z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M10 14l2.5 2.5L18 11" stroke="#e3120b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="hero-headline"><span className="hero-marker">Privacy Policy</span></h1>
        <p className="hero-description">Last updated {LAST_UPDATED}</p>
      </header>

      <div className="eco-prose">

        <section>
          <h2>The short version</h2>
          <p>
            Tokalator does not collect personal information. There are no accounts, no login, no cookies,
            and no tracking pixels. We use Vercel Analytics to understand aggregate page traffic — it
            records <em>what pages were visited</em>, not who visited them.
          </p>
        </section>

        <section>
          <h2>What we collect</h2>

          <h3>Vercel Analytics</h3>
          <p>
            This site uses{" "}
            <a href="https://vercel.com/docs/analytics" target="_blank" rel="noopener noreferrer">
              Vercel Analytics
            </a>{" "}
            and Vercel Speed Insights. These services collect:
          </p>
          <ul>
            <li>Page URL visited</li>
            <li>Referrer URL (where you came from)</li>
            <li>Country and region (derived from IP address — IP is not stored)</li>
            <li>Device type, operating system, browser</li>
            <li>Web performance metrics (LCP, FCP, CLS, INP)</li>
          </ul>
          <p>
            No cookies are set. No personal identifiers are stored. Data is aggregated and
            cannot be used to identify individual users. Vercel&apos;s data processing is
            described in their{" "}
            <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            .
          </p>

          <h3>Calculator and tools</h3>
          <p>
            All calculations (token counts, cost estimates, Cobb-Douglas quality model) happen
            entirely in your browser. No token counts, model selections, or usage inputs are
            sent to any server.
          </p>

          <h3>VS Code extension</h3>
          <p>
            The Tokalator VS Code extension has an opt-in research logging feature
            (<code>tokalator.researchLogging</code>). When enabled, it sends anonymised aggregate
            counts (number of tabs open, estimated total tokens) to help improve the scoring
            algorithm. No file names, code content, or editor content is ever transmitted.
            This feature is <strong>disabled by default</strong>.
          </p>
        </section>

        <section>
          <h2>What we do not collect</h2>
          <ul>
            <li>Names, email addresses, or any contact information</li>
            <li>API keys or authentication tokens</li>
            <li>Code content or file contents</li>
            <li>IP addresses (Vercel derives country from IP but does not store it)</li>
            <li>Persistent identifiers or fingerprints</li>
          </ul>
        </section>

        <section>
          <h2>Third-party services</h2>
          <table className="eco-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Purpose</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Vercel Analytics</td>
                <td>Page view statistics</td>
                <td>Anonymous — no cookies</td>
              </tr>
              <tr>
                <td>Vercel Speed Insights</td>
                <td>Web performance monitoring</td>
                <td>Performance metrics only</td>
              </tr>
              <tr>
                <td>GitHub</td>
                <td>Source code hosting</td>
                <td>Subject to GitHub&apos;s privacy policy</td>
              </tr>
              <tr>
                <td>VS Code Marketplace</td>
                <td>Extension distribution</td>
                <td>Subject to Microsoft&apos;s privacy policy</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>Data retention</h2>
          <p>
            Vercel retains analytics data for 90 days on the free plan. No other data is stored by
            Tokalator.
          </p>
        </section>

        <section>
          <h2>Your rights</h2>
          <p>
            Because we do not collect personal data, there is nothing to access, correct, or delete.
            If you want to prevent even anonymous analytics, you can use a content blocker that
            blocks <code>va.vercel-scripts.com</code> and <code>vitals.vercel-insights.com</code>.
          </p>
        </section>

        <section>
          <h2>Children</h2>
          <p>
            Tokalator is not directed at children under 13. We do not knowingly collect any
            information from children.
          </p>
        </section>

        <section>
          <h2>Changes</h2>
          <p>
            If this policy changes materially, the &ldquo;Last updated&rdquo; date at the top of this
            page will be updated. Continued use of the site after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions? Open an issue on{" "}
            <a href="https://github.com/vfaraji89/tokalator" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>{" "}
            or reach out via{" "}
            <a href="https://www.linkedin.com/in/vahid-faraji-jobehdar/" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>.
          </p>
        </section>

        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          Also see our <Link href="/terms">Terms of Service</Link>.
        </div>
      </div>
    </article>
  );
}
