import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { getArticle, wiki } from "@/lib/wiki/data";
import { categoryLabel } from "@/lib/wiki/categories";
import { renderMarkdown } from "@/lib/wiki/markdown";

export function generateStaticParams() {
  return wiki.articles.map((a) => ({ slug: a.slug }));
}

const SITE_URL = "https://tokalator.ai";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = getArticle((await params).slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.source === "arxiv" ? `arXiv paper, ${article.date}: ${article.description}` : article.description,
    alternates: { canonical: `/wiki/${article.slug}` },
  };
}

export default async function WikiArticlePage({ params }: PageProps) {
  const article = getArticle((await params).slug);
  if (!article) notFound();

  const lead = `# ${article.title}\n`;
  const content = article.content.startsWith(lead) ? article.content.slice(lead.length) : article.content;
  const html = renderMarkdown(content, article.url);
  const pageUrl = `${SITE_URL}/wiki/${article.slug}`;
  const isPartOf = { "@type": "CollectionPage", name: "Context Engineering Wiki", url: `${SITE_URL}/wiki` };
  const jsonLd =
    article.source === "arxiv"
      ? {
          "@context": "https://schema.org",
          "@type": "ScholarlyArticle",
          headline: article.title,
          author: (article.authors ?? []).map((name) => ({ "@type": "Person", name })),
          datePublished: article.date,
          abstract: content.replace(/^## Abstract\s*/, ""),
          url: article.url,
          mainEntityOfPage: pageUrl,
          isPartOf,
        }
      : {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: article.title,
          description: article.description,
          url: pageUrl,
          ...(article.url && { isBasedOn: article.url }),
          isPartOf,
        };
  const related = wiki.articles
    .filter((a) => a.category === article.category && a.slug !== article.slug)
    .slice(0, 4);

  return (
    <article className="article">
      <JsonLd data={jsonLd} />
      <nav className="wiki-breadcrumb" aria-label="Breadcrumb">
        <Link href="/wiki">Wiki</Link>
        <span className="wiki-breadcrumb-sep">/</span>
        <span>{article.title}</span>
      </nav>

      <header>
        <div className="wiki-card-header">
          <span className="source-badge" style={{ background: article.sourceColor }}>
            {article.sourceLabel}
          </span>
          <span className="category-badge">{categoryLabel(article.category)}</span>
          {article.date && (
            <time className="wiki-tag" dateTime={article.date}>
              {article.date}
            </time>
          )}
        </div>
        <h1>{article.title}</h1>
        {article.authors && article.authors.length > 0 && <p className="tagline">{article.authors.join(", ")}</p>}
        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-secondary"
            style={{ marginTop: "0.75rem", display: "inline-flex" }}
          >
            {article.source === "arxiv" ? "View on arXiv" : "View original"} →
          </a>
        )}
      </header>

      <div className="wiki-content" dangerouslySetInnerHTML={{ __html: html }} />

      {article.tags.length > 0 && (
        <div className="wiki-card-tags" style={{ marginTop: "2rem" }}>
          {article.tags.map((tag) => (
            <span key={tag} className="wiki-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      {related.length > 0 && (
        <section>
          <div className="section-divider" />
          <h2 className="section-header">Related Articles</h2>
          <div className="wiki-grid">
            {related.map((r) => (
              <Link key={r.slug} href={`/wiki/${r.slug}`} className="wiki-card">
                <div className="wiki-card-header">
                  <span className="source-badge" style={{ background: r.sourceColor }}>
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
