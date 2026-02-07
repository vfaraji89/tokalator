import Link from "next/link";
import wikiData from "../../../content/wiki/articles.json";
import type { Metadata } from "next";

type WikiArticle = (typeof wikiData.articles)[number];

export function generateStaticParams() {
  return wikiData.articles.map((a) => ({ slug: a.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = wikiData.articles.find((a) => a.slug === slug);
  return {
    title: article ? article.title : "Wiki Article",
    description: article ? `${article.title} — ${article.source} wiki article on Tokalator` : "Wiki article",
  };
}

function renderMarkdownToHtml(md: string): string {
  return md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
    // Headings
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Horizontal rules
    .replace(/^---$/gm, "<hr />")
    // Lists
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Blockquotes
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Paragraphs (lines not already wrapped)
    .replace(/^(?!<[a-z])([ \t]*\S.+)$/gm, "<p>$1</p>")
    // Clean up
    .replace(/\n{2,}/g, "\n");
}

export default async function WikiArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = wikiData.articles.find(
    (a) => a.slug === slug
  ) as WikiArticle | undefined;

  if (!article) {
    return (
      <article className="article">
        <h1>Article not found</h1>
        <p>
          <Link href="/wiki">Back to Wiki</Link>
        </p>
      </article>
    );
  }

  const html = renderMarkdownToHtml(article.content);

  // Find related articles (same category, different slug)
  const related = wikiData.articles
    .filter((a) => a.category === article.category && a.slug !== article.slug)
    .slice(0, 4);

  return (
    <article className="article">
      {/* Breadcrumb */}
      <nav className="wiki-breadcrumb">
        <Link href="/wiki">Wiki</Link>
        <span className="wiki-breadcrumb-sep">/</span>
        <span>{article.title}</span>
      </nav>

      {/* Header */}
      <header>
        <div className="wiki-card-header">
          <span
            className="source-badge"
            style={{ background: article.sourceColor }}
          >
            {article.sourceLabel}
          </span>
          <span className="category-badge">
            {article.category.replace(/-/g, " ")}
          </span>
          {article.date && (
            <span className="wiki-tag">{article.date}</span>
          )}
        </div>
        <h1>{article.title}</h1>
        {article.authors && article.authors.length > 0 && (
          <p className="tagline">{article.authors.join(", ")}</p>
        )}
        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-secondary"
            style={{ marginTop: "0.75rem", display: "inline-flex" }}
          >
            View Original →
          </a>
        )}
      </header>

      {/* Content */}
      <div
        className="wiki-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="wiki-card-tags" style={{ marginTop: "2rem" }}>
          {article.tags.map((tag) => (
            <span key={tag} className="wiki-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section>
          <div className="section-divider" />
          <h2 className="section-header">Related Articles</h2>
          <div className="wiki-grid">
            {related.map((r) => (
              <Link key={r.slug} href={`/wiki/${r.slug}`} className="wiki-card">
                <div className="wiki-card-header">
                  <span
                    className="source-badge"
                    style={{ background: r.sourceColor }}
                  >
                    {r.sourceLabel}
                  </span>
                </div>
                <h3 className="wiki-card-title">{r.title}</h3>
                <p className="wiki-card-desc">{r.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="footer">
        <Link href="/wiki">← Back to Wiki</Link>
      </div>
    </article>
  );
}
