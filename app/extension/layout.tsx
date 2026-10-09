import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VS Code Extension",
  description:
    "Tokalator for VS Code: real-time context budget, BPE token counting, Context Engineering stats, per-model cost estimates, and a 12-command @tokalator chat participant. Free, MIT licensed.",
  alternates: { canonical: "/extension" },
  openGraph: {
    title: "Tokalator VS Code Extension",
    description:
      "Real-time context budget, token counting, and per-model cost estimates for AI coding. Free, MIT licensed.",
    url: "/extension",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tokalator",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Visual Studio Code 1.99+",
  url: "https://tokalator.wiki/extension",
  downloadUrl:
    "https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator",
  softwareVersion: "4.1.0",
  license: "https://opensource.org/license/mit",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function ExtensionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
