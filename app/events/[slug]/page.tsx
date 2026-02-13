import Link from "next/link";
import eventsData from "../../../content/events.json";
import type { Metadata } from "next";

type EventItem = (typeof eventsData.events)[number];

export function generateStaticParams() {
  return eventsData.events.map((e) => ({ slug: e.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = eventsData.events.find((e) => e.slug === slug);
  return {
    title: event ? `${event.title} — Events` : "Event",
    description: event
      ? `${event.title} by ${event.speaker} — ${event.description}`
      : "Event details",
  };
}

/* ── Concept sections content ── */
const SECTIONS = [
  {
    id: "attention-budget",
    title: "The Attention Budget",
    icon: "◈",
    body: `Every AI model has a fixed-size "window" it can look at — the context window. Think of it like a desk: you can only spread out so many papers before things start falling off the edge. Every word you send (system instructions, chat history, code files, tool outputs) takes up space on that desk. The total capacity is measured in tokens — roughly ¾ of a word each. When the desk is full, the model starts forgetting things.`,
    example: `GPT-4o has a 128K token window. A typical VS Code workspace with 15 open tabs, linter output, and chat history can easily reach 60K tokens — already half the budget before you even ask your question.`,
  },
  {
    id: "context-rot",
    title: "Information Overload (Context Rot)",
    icon: "◈",
    body: `As the context window fills up, the model's ability to find and use specific information degrades — even if the task itself stays the same. This is "Context Rot." It happens because the model's internal attention spreads thinner across more tokens. The result: it misses details, repeats itself, or confidently gives wrong answers.`,
    example: `Imagine searching for a single sentence in a 10-page document vs. a 500-page book. The sentence hasn't changed, but your ability to find it has. The same happens inside the model. Research shows accuracy drops most when the relevant fact blends semantically into surrounding text — and related-but-wrong information causes more errors than random noise.`,
  },
  {
    id: "trimming",
    title: "Strategy: Trimming",
    icon: "◈",
    body: `The simplest fix: drop older messages. A "Last-N" approach keeps only the most recent conversation turns. It has zero added latency and gives perfect recall for recent context. The trade-off? The model completely forgets early instructions or long-term goals — what you might call "conversation amnesia."`,
    example: `You start a coding session by saying "always use TypeScript strict mode." After 20 turns of back-and-forth, the trimmer drops that early instruction. The model starts generating plain JavaScript. The fix: pin critical instructions in the system prompt where they won't get trimmed.`,
  },
  {
    id: "compaction",
    title: "Strategy: Compaction & Summarisation",
    icon: "◈",
    body: `Instead of throwing away old messages entirely, summarise them. A "shadow prompt" — a compressed XML or Markdown block — replaces the raw history with a synthetic summary. This preserves the gist while freeing up token space. The risk is "Context Poisoning": if the summary contains a hallucination or error, it becomes permanent truth for every future turn.`,
    example: `After 30 turns of debugging a React component, the system compresses the history into: "<summary>User is fixing a useEffect cleanup bug in Dashboard.tsx. Attempted solutions: dependency array fix (failed), ref-based approach (partial success).</summary>" — now the model has room for the next attempt without losing the thread.`,
  },
  {
    id: "jit-navigation",
    title: "Strategy: Just-in-Time Retrieval",
    icon: "◈",
    body: `Instead of dumping everything into the context window upfront ("context stuffing"), let the agent discover what it needs layer by layer. It uses tools like grep, ls, and read_file to pull in only the relevant code when it needs it. Think of it this way: the agent shouldn't memorise the whole library — it should know how to use the card catalogue.`,
    example: `You ask the AI to refactor a payment module. Instead of opening all 30 files at once, the agent first reads the directory structure, then opens only the payment service file, discovers it imports a validator, opens that too — building understanding step by step, keeping the context window clean.`,
  },
  {
    id: "subagents",
    title: "Strategy: Context Isolation (Sub-agents)",
    icon: "◈",
    body: `Complex tasks get delegated to sub-agents that run in their own isolated context windows. The detailed search results, tool logs, and intermediate steps stay in the sub-agent's window — only the final answer flows back to the main agent. This prevents the main context from getting cluttered with noise.`,
    example: `You ask the main agent to refactor authentication across your app. It spawns a Search Sub-agent that reads 40 files, greps for auth patterns, and builds a dependency map — all in its own context. The main agent only receives: "Auth is handled in 3 files: auth.ts, middleware.ts, session.ts. Here are the entry points." Clean.`,
  },
  {
    id: "ide-context-engine",
    title: "Your IDE Is the Context Engine",
    icon: "◈",
    body: `"Your environment is the prompt." In modern AI-assisted coding, the IDE itself feeds signals into the context window — open files, linter errors, terminal output, project structure, git diffs. The quality of these signals (high signal-to-noise ratio) directly determines the quality of the AI's output. Managing what your IDE sends is context engineering in practice.`,
    example: `VS Code's Copilot agent reads your active file, related imports, linter errors, and terminal output. If you have 25 irrelevant tabs open, those dilute the signal. Closing unrelated files is literally improving your AI's reasoning — this is why the Tokalator extension shows a "Budget Level" indicator (Low/Medium/High) so you can see the impact in real time.`,
  },
  {
    id: "plan-agent",
    title: "The Plan Agent Workflow",
    icon: "◈",
    body: `Modern AI coding agents follow a structured 4-phase workflow instead of jumping straight to writing code. Discovery: the agent explores your codebase to understand the structure. Alignment: it asks clarifying questions so it doesn't guess wrong. Design: it writes a step-by-step plan with specific file locations. Refinement: it double-checks decisions and adds verification criteria.`,
    example: `You type /plan "add dark mode support". The agent first discovers your CSS architecture (Tailwind? CSS modules?), then asks: "Should dark mode be system-preference-based or toggle-based?" — preventing a wrong assumption that would waste 20 minutes. Only after your answer does it produce a file-by-file implementation plan.`,
  },
  {
    id: "message-steering",
    title: "Message Steering & Thinking Tokens",
    icon: "◈",
    body: `You don't have to wait for the AI to finish if it's heading in the wrong direction. "Message Steering" lets you send a correction mid-task. Combined with "Thinking Tokens" — where the model shows its internal reasoning process as it works — you can see exactly when and why the model goes off track, and redirect immediately.`,
    example: `The agent starts refactoring your auth module and you see in the thinking tokens: "I'll convert this to a class-based approach..." — but you prefer functions. You send "keep it functional, no classes" while it's still working. The agent adjusts course without starting over.`,
  },
  {
    id: "product-brain",
    title: "The Product Brain",
    icon: "◈",
    body: `Treat product requirements like a living codebase, not a static document. Unstructured inputs (Slack messages, emails, user feedback) flow through an agentic synthesis process that updates a living spec. That spec then drives structured actions: generating PRs, updating roadmaps, assigning tasks. The "Product Brain" is a sidecar repository that captures the reasoning behind every decision.`,
    example: `A customer support ticket says "users can't find the export button." The Product Brain agent processes this, updates the spec with a new requirement ("move export to top-level toolbar"), and generates a draft PR with the proposed UI change — all tracked in a reasoning log you can audit.`,
  },
  {
    id: "tokalator",
    title: "Real-Time Budget Tracking: The Tokalator",
    icon: "◈",
    body: `The Tokalator is a VS Code extension that acts as a real-time context budget calculator. It shows how many tokens your current session is consuming, previews the cost of your next turn, and provides one-click cleanup of low-relevance tabs to prevent attention dilution. It turns the invisible "attention budget" into something you can see and manage.`,
    example: `Your Tokalator dashboard shows: Budget Level: HIGH (warning). 85K of 128K tokens used. Top consumers: 3 test files (22K tokens, low relevance). One click on "Clean low-relevance tabs" drops you to 63K tokens — Medium budget — and the model's next response is noticeably sharper.`,
  },
  {
    id: "golden-rules",
    title: "The Context Engineering Checklist",
    icon: "◈",
    body: `Five rules for effective context management. Altitude: keep system instructions specific enough to be useful, flexible enough not to conflict with varied tasks. Hygiene: trim redundant tool outputs and stale messages regularly. Structure: use XML/Markdown tags to section your context so the model can navigate it. Memory: use just-in-time retrieval for large datasets instead of dumping everything upfront. The golden rule: treat context as a finite resource, because it is.`,
    example: `Before a complex refactoring session: (1) Pin your coding standards in the system prompt. (2) Close all unrelated tabs. (3) Structure your request with clear sections: "## Goal", "## Constraints", "## Files to modify". (4) Let the agent discover dependencies via search instead of pasting code. (5) Check your Tokalator budget level before each major prompt.`,
  },
];

/* ── Resource links ── */
const RESOURCES = [
  {
    title: "Awesome Copilot — Collections",
    description: "Community-curated agents, prompts, and instructions for GitHub Copilot.",
    url: "https://github.com/github/awesome-copilot",
    badge: "GitHub",
    badgeColor: "#24292e",
  },
  {
    title: "VS Code v1.109 Release Notes",
    description: "Latest agentic features: Plan Agent, Message Steering, Sub-agents, Copilot Memory, and more.",
    url: "https://code.visualstudio.com/updates/v1_109",
    badge: "VS Code",
    badgeColor: "#007acc",
  },
  {
    title: "Context7",
    description: "Up-to-date documentation and code examples pulled directly into your prompt. No stale training data.",
    url: "https://context7.com/",
    badge: "Tool",
    badgeColor: "#10a37f",
  },
  {
    title: "OneContext",
    description: "Open-source context management lab — tools and research for building context-aware AI systems.",
    url: "https://github.com/TheAgentContextLab/OneContext",
    badge: "GitHub",
    badgeColor: "#24292e",
  },
  {
    title: "Agentation",
    description: "Platform and patterns for building production-grade autonomous agents with structured context flows.",
    url: "https://agentation.dev/",
    badge: "Platform",
    badgeColor: "#d97706",
  },
];

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = eventsData.events.find(
    (e) => e.slug === slug
  ) as EventItem | undefined;

  if (!event) {
    return (
      <article className="article">
        <h1>Event not found</h1>
        <p>
          <Link href="/events">Back to Events</Link>
        </p>
      </article>
    );
  }

  return (
    <article className="article">
      {/* Breadcrumb */}
      <nav className="wiki-breadcrumb">
        <Link href="/events">Events &amp; Talks</Link>
        <span className="wiki-breadcrumb-sep">/</span>
        <span>{event.title}</span>
      </nav>

      {/* Banner */}
      <div className="event-banner" style={{ marginBottom: "2rem" }}>
        <div className="event-banner-content">
          <span className="event-banner-title">AI-NATIVE</span>
          <span className="event-banner-subtitle">SOFTWARE DEV.</span>
          <span className="event-banner-badge">ONLY BUILDERS CLUB</span>
        </div>
      </div>

      {/* Header */}
      <header>
        <div className="event-card-header" style={{ marginBottom: "0.5rem" }}>
          <span className={`event-status-badge event-status--${event.status}`}>
            {event.status === "upcoming" ? "Upcoming" : "Past"}
          </span>
          <span className="category-badge">{event.type}</span>
          {event.series && (
            <span className="event-series-badge">Part {event.part}</span>
          )}
        </div>
        <h1>{event.title}</h1>
        <p className="tagline">
          {event.speaker} · {event.speakerRole}
        </p>
        <div className="event-card-meta" style={{ marginTop: "0.5rem" }}>
          <span className="event-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {new Date(event.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="event-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {event.location}
          </span>
        </div>

        {/* CTA buttons */}
        <div className="event-card-actions" style={{ marginTop: "1.25rem" }}>
          {event.slidesUrl && (
            <a
              href={event.slidesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="event-action-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Export PDF
            </a>
          )}
        </div>
      </header>

      {/* Description */}
      <section>
        <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--text-secondary)" }}>
          {event.description}
        </p>
      </section>

      {/* ── Concept Sections ── */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Concepts &amp; Strategies</h2>
        <p className="tagline" style={{ marginBottom: "1.5rem" }}>
          12 core ideas from the talk — each with a definition and a concrete example.
        </p>

        <div className="event-concepts-grid">
          {SECTIONS.map((s) => (
            <div key={s.id} className="event-concept-card" id={s.id}>
              <div className="event-concept-icon">{s.icon}</div>
              <h3 className="event-concept-title">{s.title}</h3>
              <p className="event-concept-body">{s.body}</p>
              <div className="event-concept-example">
                <span className="event-concept-example-label">Example</span>
                <p>{s.example}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Resources & Tools ── */}
      <section>
        <div className="section-divider" />
        <h2 className="section-header">Resources &amp; Tools</h2>
        <p className="tagline" style={{ marginBottom: "1.5rem" }}>
          Collections, release notes, and context management tools referenced in the talk.
        </p>

        <div className="event-resources-grid">
          {RESOURCES.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="event-resource-card"
            >
              <span
                className="source-badge"
                style={{ background: r.badgeColor }}
              >
                {r.badge}
              </span>
              <h3 className="event-resource-title">{r.title}</h3>
              <p className="event-resource-desc">{r.description}</p>
              <span className="event-resource-link">
                Visit →
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Tags */}
      {event.tags.length > 0 && (
        <div className="wiki-card-tags" style={{ marginTop: "2rem" }}>
          {event.tags.map((tag) => (
            <span key={tag} className="wiki-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA Footer */}
      <section>
        <div className="section-divider" />
        <div className="event-cta-footer">
          <h2>Want to dive deeper?</h2>
          <p>
            Explore the full slide deck, try the Tokalator extension, or browse the context engineering wiki.
          </p>
          <div className="event-card-actions">
            {event.slidesUrl && (
              <a
                href={event.slidesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="event-action-btn"
              >
                Open Slide Deck →
              </a>
            )}
            <Link href="/extension" className="event-action-btn event-action-btn--secondary">
              Install Tokalator Extension
            </Link>
            <Link href="/wiki" className="event-action-btn event-action-btn--secondary">
              Browse Wiki
            </Link>
          </div>
        </div>
      </section>

      <div className="footer">
        <Link href="/events">← Back to Events &amp; Talks</Link>
      </div>
    </article>
  );
}
