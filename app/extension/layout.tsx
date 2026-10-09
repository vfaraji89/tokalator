import type { Metadata } from "next";
import pkg from "../../tokalator-extension-vs/package.json";
import { CATALOG_MODELS } from "../../lib/models";
import { JsonLd } from "../../components/json-ld";
import { FAQ } from "../../lib/extension-faq";

const description = `Tokalator ${pkg.version} for VS Code: context budget meter, tab relevance, Claude Code turn and API-equivalent cost tracking, ${CATALOG_MODELS.length} current models with long-context pricing, Secure Workspace, and a ${pkg.contributes.chatParticipants[0].commands.length}-command @tokalator chat participant. Free and open source (AGPL-3.0).`;

export const metadata: Metadata = {
  title: "VS Code Extension",
  description,
  alternates: { canonical: "/extension" },
  openGraph: {
    title: `Tokalator ${pkg.version} for VS Code`,
    description,
    url: "/extension",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tokalator",
  alternateName: "vfaraji89.tokalator",
  description,
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: "VS Code extension",
  operatingSystem: `Windows, macOS, Linux (Visual Studio Code ${pkg.engines.vscode.replace(/[^\d.]/g, "")}+)`,
  url: "https://tokalator.ai/extension",
  downloadUrl: "https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator",
  installUrl: "https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator",
  softwareVersion: pkg.version,
  dateModified: "2026-10-10",
  license: "https://www.gnu.org/licenses/agpl-3.0.html",
  isAccessibleForFree: true,
  codeRepository: "https://github.com/vfaraji89/tokalator",
  author: { "@type": "Person", name: "Vahid Farajijobehdar", url: "https://vfaraji89.github.io/" },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Context window budget meter",
    "Open tab relevance scoring and cleanup",
    "Claude Code turns, cache hit rate, and API-equivalent cost",
    "Long-context pricing for Claude, GPT, and Gemini models",
    "Secure Workspace for AI agents",
    "Opt-in telemetry with export and delete",
  ],
};

export default function ExtensionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      {children}
    </>
  );
}
