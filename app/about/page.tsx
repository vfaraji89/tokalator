"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const GitHubIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

function AboutContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "tr" ? "tr" : "en";

  const content = {
    en: {
      title: "About Tokalator",
      tagline: "Token budget management tools for AI coding assistants",
      author: "Author",
      authorName: "Vahid Faraji",
      authorBio: "Creator and maintainer of Tokalator — building tools that help developers understand and optimize their AI context consumption.",
      project: "Project",
      projectDesc: "Tokalator is an open-source project. The codebase includes:",
      items: [
        { title: "VS Code Extension", desc: "Real-time token budget dashboard, tab relevance scoring, and @tokens chat participant" },
        { title: "Web Tools", desc: "Cost calculators, model comparison, caching ROI analysis, and context optimization guides" },
        { title: "Context Engineering Library", desc: "Curated agents, instructions, and prompts for better AI interactions" },
      ],
      viewOnGithub: "View on GitHub",
      license: "License",
      licenseText: "MIT License — free for personal and commercial use.",
    },
    tr: {
      title: "Tokalator Hakkında",
      tagline: "Yapay zeka kodlama asistanları için token bütçe yönetim araçları",
      author: "Geliştirici",
      authorName: "Vahid Faraji",
      authorBio: "Tokalator'un yaratıcısı ve geliştiricisi — geliştiricilerin yapay zeka bağlam tüketimini anlamalarına ve optimize etmelerine yardımcı olan araçlar geliştiriyor.",
      project: "Proje",
      projectDesc: "Tokalator açık kaynaklı bir projedir. Kod tabanı şunları içerir:",
      items: [
        { title: "VS Code Uzantısı", desc: "Gerçek zamanlı token bütçe panosu, sekme alaka puanlaması ve @tokens sohbet katılımcısı" },
        { title: "Web Araçları", desc: "Maliyet hesaplayıcıları, model karşılaştırma, önbellekleme ROI analizi ve bağlam optimizasyon kılavuzları" },
        { title: "Bağlam Mühendisliği Kütüphanesi", desc: "Daha iyi yapay zeka etkileşimleri için seçilmiş ajanlar, talimatlar ve istemler" },
      ],
      viewOnGithub: "GitHub'da Görüntüle",
      license: "Lisans",
      licenseText: "MIT Lisansı — kişisel ve ticari kullanım için ücretsiz.",
    },
  };

  const c = content[lang];

  return (
    <article className="article">
      <header>
        <h1>{c.title}</h1>
        <p className="tagline">{c.tagline}</p>
      </header>

      <section>
        <h2>{c.author}</h2>
        <div className="author-card">
          <div className="author-info">
            <h3>{c.authorName}</h3>
            <p>{c.authorBio}</p>
            <a
              href="https://github.com/vfaraji89"
              target="_blank"
              rel="noopener noreferrer"
              className="github-link"
            >
              <GitHubIcon />
              github.com/vfaraji89
            </a>
          </div>
        </div>
      </section>

      <section>
        <h2>{c.project}</h2>
        <p>{c.projectDesc}</p>
        <ul>
          {c.items.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong> — {item.desc}
            </li>
          ))}
        </ul>
        <a
          href="https://github.com/vfaraji89/tokalator"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
          style={{ marginTop: "1.5rem", display: "inline-flex" }}
        >
          <GitHubIcon />
          {c.viewOnGithub}
        </a>
      </section>

      <section>
        <h2>{c.license}</h2>
        <p>{c.licenseText}</p>
      </section>
    </article>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={<div className="article"><p>Loading...</p></div>}>
      <AboutContent />
    </Suspense>
  );
}
