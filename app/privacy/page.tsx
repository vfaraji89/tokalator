import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Tokalator's website and VS Code extension process, the opt-in telemetry and its controls, and your rights under GDPR, UK GDPR, and KVKK.",
  alternates: { canonical: "/privacy" },
};

const LAST_UPDATED = "October 10, 2026";
const CONTACT = "vfaraji89@gmail.com";

export default function PrivacyPage() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <path d="M14 3L5 7v7c0 5 4 9 9 10 5-1 9-5 9-10V7L14 3z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M10 14l2.5 2.5L18 11" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="hero-headline"><span className="hero-marker">Privacy Policy</span></h1>
        <p className="hero-description">Last updated {LAST_UPDATED}</p>
      </header>

      <div className="eco-prose">
        <section>
          <h2>The short version</h2>
          <ul>
            <li>No accounts, no cookies, no advertising, and nothing is sold.</li>
            <li>The website uses cookieless Vercel Web Analytics for aggregate page statistics.</li>
            <li>The website tools, including the Claude Code log import, run entirely in your browser. Your files are never uploaded.</li>
            <li>The VS Code extension works locally. It fetches the public pricing catalog from GitHub and nothing else, unless you turn on telemetry.</li>
            <li>Telemetry is <strong>off by default</strong>. If you opt in, the extension sends anonymous daily counts. It never sends code, file names, paths, or prompts. You can see, export, and delete that data at any time.</li>
          </ul>
        </section>

        <section>
          <h2>Who is responsible</h2>
          <p>
            The data controller is Vahid Farajijobehdar, Istanbul, Turkey, the maintainer of Tokalator. Contact: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </p>
        </section>

        <section>
          <h2>Website (tokalator.ai)</h2>
          <h3>Vercel Web Analytics and Speed Insights</h3>
          <p>
            We use <a href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel Web Analytics</a> and Speed Insights to understand aggregate traffic and performance. They record the page visited, the referrer, country, device and browser type, and performance metrics. No cookies are set, visitors are not tracked across sites, and the data cannot identify you. The legal basis is our legitimate interest in running and improving the site (GDPR Art. 6(1)(f)).
          </p>
          <h3>Tools and the Claude Code log import</h3>
          <p>
            Calculators, price comparisons, and the <Link href="/tools/usage">Claude Code usage import</Link> run in your browser. When you choose Claude Code log files, they are read locally to compute token, turn, and cost totals. They are not uploaded or stored anywhere.
          </p>
          <h3>Hosting logs</h3>
          <p>
            Our host, Vercel, processes IP addresses in short-lived request logs to deliver the site and protect it from abuse. We do not store IP addresses in our database.
          </p>
        </section>

        <section>
          <h2>VS Code extension</h2>
          <h3>Local by default</h3>
          <p>
            Token counting, tab relevance, budget tracking, and Secure Workspace run on your machine. The Claude Code card reads Claude Code session logs from <code>~/.claude/projects</code> on your machine to show turns and API-equivalent cost. It never sends that content anywhere, and you can turn it off with <code>tokalator.claudeCode.enabled</code>. Optional session logging (<code>tokalator.enableSessionLogging</code>) also writes aggregate counts to local files only.
          </p>
          <h3>Pricing catalog</h3>
          <p>
            Once a day the extension downloads the public model catalog from <code>raw.githubusercontent.com</code>. Like any web request, this exposes your IP address to GitHub. No usage data is sent.
          </p>

          <h3 id="telemetry">Opt-in telemetry</h3>
          <p>
            Telemetry helps decide what to improve next. It is only active when <strong>both</strong> of these are true: you turned on <code>tokalator.telemetry.enabled</code> (the extension asks once, and the answer defaults to no), and VS Code&apos;s own telemetry setting is on. The legal basis is your consent (GDPR Art. 6(1)(a)). You can withdraw it at any time by turning the setting off. Doing so stops sending immediately and deletes anything buffered locally.
          </p>
          <p>When telemetry is on, the extension sends one record per day containing:</p>
          <ul>
            <li>A random installation ID, generated on your machine and not linked to your name, email, account, or IP address</li>
            <li>The date, extension version, VS Code version, and operating system family (for example, <code>darwin</code>)</li>
            <li>How many times each feature was used (for example, <code>cmd:optimize: 2</code>, <code>chat:count: 5</code>) and the catalog model IDs selected</li>
            <li>Claude Code daily totals: number of turns, requests, and sessions, cache hit rate, and the split between the CLI and the VS Code extension</li>
            <li>Answers to short fixed-choice questions (for example, &ldquo;what do you mainly use Tokalator for?&rdquo;), only if you answer them</li>
          </ul>
          <p>It never sends source code, file or folder names, paths, repository names, prompts or chat content, environment variables, or credentials. Event names are restricted by the extension so that paths cannot be included.</p>
          <p>
            Run <strong>Tokalator: Show Telemetry Data</strong> to see exactly what the next upload contains, <strong>Tokalator: Export My Telemetry Data</strong> to download everything stored for your installation, and <strong>Tokalator: Delete My Telemetry Data</strong> to erase it from the server and start over with a new ID.
          </p>
          <h3>Storage and retention</h3>
          <p>
            Telemetry and survey answers are stored in a Prisma Postgres database operated by Prisma Data, Inc., reached through our API on Vercel. Both act as processors on our behalf. Records are deleted automatically 13 months after their last update, or immediately when you use the delete command. Where data is processed outside your country, including in the United States, transfers rely on the providers&apos; standard contractual clauses.
          </p>
          <h3>Feedback through GitHub</h3>
          <p>
            &ldquo;Suggest an improvement&rdquo; opens a prefilled GitHub issue that you review and submit yourself. What you post is public and governed by <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub&apos;s privacy statement</a>.
          </p>
        </section>

        <section>
          <h2>Your rights</h2>
          <p>
            Under the GDPR, UK GDPR, and Turkey&apos;s KVKK, you can access, export, correct, or delete your data, object to processing, and withdraw consent at any time without affecting earlier processing. The extension commands above handle access, portability, and erasure directly. You can also email <a href={`mailto:${CONTACT}`}>{CONTACT}</a> with your installation ID, which is shown by Show Telemetry Data. You may lodge a complaint with your local data protection authority; in Turkey, that is the Personal Data Protection Authority (KVKK). We do not sell or share personal information, and we make no automated decisions or profiles about you.
          </p>
        </section>

        <section>
          <h2>Third-party services</h2>
          <div style={{ overflowX: "auto" }}>
            <table className="settings-table">
              <thead>
                <tr><th>Service</th><th>Purpose</th><th>Data</th></tr>
              </thead>
              <tbody>
                <tr><td>Vercel</td><td>Website hosting, API, Web Analytics, Speed Insights</td><td>Aggregate page metrics; short-lived request logs</td></tr>
                <tr><td>Prisma Data (Prisma Postgres)</td><td>Storage for opt-in telemetry and survey answers</td><td>Anonymous daily counts keyed by a random ID</td></tr>
                <tr><td>GitHub</td><td>Source code, issues, pricing catalog file</td><td>Governed by GitHub&apos;s privacy statement</td></tr>
                <tr><td>Visual Studio Marketplace</td><td>Extension distribution</td><td>Governed by Microsoft&apos;s privacy statement</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Children</h2>
          <p>Tokalator is a developer tool and is not directed at children under 16.</p>
        </section>

        <section>
          <h2>Changes</h2>
          <p>
            Material changes will be announced in the extension changelog and reflected in the date at the top of this page. Telemetry stays off unless you turn it on, and a change in what is collected will ask for your consent again.
          </p>
        </section>

        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          Also see the <Link href="/terms">Terms of Service</Link>.
        </div>
      </div>
    </article>
  );
}
