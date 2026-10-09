import ext from "@/content/extension.json";
import dictionary from "@/content/dictionary.json";
import pkg from "@/tokalator-extension-vs/package.json";
import { CATALOG_MODELS, CATALOG_UPDATED_AT } from "@/lib/models";

function money(n: number): string {
  return `$${n < 1 ? n.toFixed(3) : n.toFixed(2)}`;
}

export function GET() {
  const models = CATALOG_MODELS.map(m => {
    const lc = m.longContext ? `; above ${m.longContext.threshold.toLocaleString("en-US")} input tokens: ${m.longContext.inputMultiplier}x input, ${m.longContext.outputMultiplier}x output` : "";
    return `- ${m.label} (${m.id}, ${m.provider}): ${m.contextWindow.toLocaleString("en-US")} token window, ${m.maxOutput.toLocaleString("en-US")} max output, ${money(m.inputCostPerMTok)} input / ${money(m.outputCostPerMTok)} output / ${money(m.cachedInputCostPerMTok)} cached input per million tokens${lc}${m.notes ? `. ${m.notes}` : ""}`;
  });
  const body = [
    "# Tokalator (full text for LLMs)",
    "",
    `Open-source context engineering toolkit for AI coding assistants. Website: https://tokalator.ai. Source: ${ext.githubUrl}. License: AGPL-3.0-or-later. Generated from the site's data; model catalog verified ${CATALOG_UPDATED_AT}.`,
    "",
    `## VS Code extension ${pkg.version}`,
    "",
    ext.tagline,
    "",
    ...ext.features.map(f => `- ${f.name} (${f.surface}): ${f.description} [${f.command}]`),
    "",
    "What it tracks: Claude Code usage is observed from Claude Code's own local logs (CLI and VS Code extension). For GitHub Copilot, the extension detects the active chat model and counts @tokalator turns; VS Code does not expose Copilot token usage to other extensions, so Copilot cost is an input-only estimate. API-equivalent cost is the price at API list rates; subscription plans are not billed per token.",
    "",
    "### Chat commands",
    ...pkg.contributes.chatParticipants[0].commands.map(c => `- /${c.name}: ${c.description}`),
    "",
    "### Settings",
    ...Object.entries(pkg.contributes.configuration.properties as Record<string, { default?: unknown; description?: string; markdownDescription?: string }>)
      .map(([k, v]) => `- ${k} (default ${JSON.stringify(v.default)}): ${(v.description ?? v.markdownDescription ?? "").replace(/\*\*|\[([^\]]+)\]\([^)]+\)/g, "$1")}`),
    "",
    `## Model catalog (${CATALOG_MODELS.length} models, prices in USD)`,
    "",
    ...models,
    "",
    "## Dictionary",
    "",
    ...dictionary.terms.map(t => `- ${t.term}: ${t.definition}`),
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
