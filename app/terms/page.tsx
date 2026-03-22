import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of use for Tokalator — free open-source token calculator and VS Code extension.",
};

const LAST_UPDATED = "March 22, 2026";

export default function TermsPage() {
  return (
    <article className="article">
      <header className="hero">
        <div className="hero-outline-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 28 28" fill="none">
            <rect x="5" y="3" width="18" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="9" y1="9" x2="19" y2="9" stroke="#e3120b" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="9" y1="13" x2="19" y2="13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <line x1="9" y1="17" x2="15" y2="17" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="hero-headline"><span className="hero-marker">Terms of Service</span></h1>
        <p className="hero-description">Last updated {LAST_UPDATED}</p>
      </header>

      <div className="eco-prose">

        <section>
          <h2>Overview</h2>
          <p>
            Tokalator is a free, open-source project. By using this website or the VS Code extension
            you agree to these terms. If you disagree, please stop using the service.
          </p>
        </section>

        <section>
          <h2>The service</h2>
          <p>
            Tokalator provides token counting calculators, cost estimators, context budget tools,
            a VS Code extension, an MCP server, and educational content about context engineering.
            All tools are provided free of charge.
          </p>
          <p>
            Pricing and model data shown on this site are estimates based on publicly available
            provider documentation. They may be out of date. Always verify costs directly with
            Anthropic, OpenAI, or Google before making financial decisions.
          </p>
        </section>

        <section>
          <h2>Open source licence</h2>
          <p>
            The source code for Tokalator is released under the{" "}
            <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer">
              MIT Licence
            </a>
            . You are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
            copies of the software, subject to the conditions of that licence.
          </p>
          <p>
            The full source is available at{" "}
            <a href="https://github.com/vfaraji89/tokalator" target="_blank" rel="noopener noreferrer">
              github.com/vfaraji89/tokalator
            </a>.
          </p>
        </section>

        <section>
          <h2>No warranty</h2>
          <p>
            The service is provided <strong>&ldquo;as is&rdquo;</strong>, without warranty of any kind,
            express or implied. This includes, but is not limited to, warranties of merchantability,
            fitness for a particular purpose, and non-infringement.
          </p>
          <p>
            In no event shall the authors or copyright holders be liable for any claim, damages, or
            other liability arising from the use of the service.
          </p>
        </section>

        <section>
          <h2>Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use automated scripts to scrape or overload the service</li>
            <li>Attempt to reverse-engineer, decompile, or disassemble any part of the service beyond what the open-source licence already permits</li>
            <li>Use the service in any way that violates applicable laws or regulations</li>
            <li>Misrepresent your affiliation with Tokalator or its author</li>
          </ul>
        </section>

        <section>
          <h2>Third-party links</h2>
          <p>
            This site contains links to external websites (Vercel, Anthropic, OpenAI, Google,
            GitHub, VS Code Marketplace). We are not responsible for the content or privacy
            practices of those sites.
          </p>
        </section>

        <section>
          <h2>VS Code extension</h2>
          <p>
            The Tokalator VS Code extension is distributed through the Visual Studio Marketplace
            and is subject to Microsoft&apos;s Marketplace Terms in addition to these terms.
            Extension use is governed by the MIT Licence included in the extension package.
          </p>
        </section>

        <section>
          <h2>Changes to the service</h2>
          <p>
            We reserve the right to modify, suspend, or discontinue any part of the service at
            any time without notice. We are not liable for any modification, suspension, or
            discontinuation.
          </p>
        </section>

        <section>
          <h2>Changes to these terms</h2>
          <p>
            We may update these terms from time to time. The &ldquo;Last updated&rdquo; date at
            the top of this page reflects when changes were last made. Continued use of the
            service after changes constitutes your acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2>Governing law</h2>
          <p>
            These terms are governed by the laws of Turkey. Any disputes shall be resolved in
            the courts of Istanbul, Turkey.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            For questions about these terms, open an issue on{" "}
            <a href="https://github.com/vfaraji89/tokalator" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>{" "}
            or contact via{" "}
            <a href="https://www.linkedin.com/in/vahid-faraji-jobehdar/" target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>.
          </p>
        </section>

        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          Also see our <Link href="/privacy">Privacy Policy</Link>.
        </div>
      </div>
    </article>
  );
}
