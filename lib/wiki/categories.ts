const LABELS: Record<string, string> = {
  "context-management": "Context Management",
  "prompt-engineering": "Prompt Engineering",
  "token-optimization": "Token Optimization",
  "token-economics": "Token Economics",
  caching: "Caching",
  rag: "RAG",
  "tool-use": "Tool Use",
  agents: "Agents",
  architecture: "Architecture",
  general: "General",
};

export function categoryLabel(id: string): string {
  return LABELS[id] ?? id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
