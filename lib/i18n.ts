export type Locale = "en";

export const translations = {
  en: {
    // Navigation
    overview: "Overview",
    about: "About",
    extension: "Extension",
    install: "Install",
    tools: "Tools",
    costCalculator: "Cost Calculator",
    contextOptimizer: "Context Optimizer",
    modelComparison: "Model Comparison",
    cachingRoi: "Caching ROI",
    conversationCost: "Conversation Cost",
    economicAnalysis: "Economic Analysis",
    pricingReference: "Pricing Reference",
    wiki: "Wiki",
    jargon: "Context Jargon",
    
    // About page
    aboutTitle: "About Tokalator",
    aboutTagline: "Token budget management tools for AI coding assistants",
    author: "Author",
    authorName: "Vahid Faraji",
    authorBio: "Creator and maintainer of Tokalator — building tools that help developers understand and optimize their AI context consumption.",
    project: "Project",
    projectDesc: "Tokalator is an open-source project. The codebase includes:",
    vsCodeExtension: "VS Code Extension",
    vsCodeExtensionDesc: "Real-time token budget dashboard, tab relevance scoring, and @tokens chat participant",
    webTools: "Web Tools",
    webToolsDesc: "Cost calculators, model comparison, caching ROI analysis, and context optimization guides",
    contextLibrary: "Context Engineering Library",
    contextLibraryDesc: "Curated agents, instructions, and prompts for better AI interactions",
    viewOnGithub: "View on GitHub",
    license: "License",
    licenseText: "MIT License — free for personal and commercial use.",
    
    // Wiki page
    wikiTitle: "Context Engineering Wiki",
    wikiTagline: "Essential jargon and concepts for AI coding assistants",
    
    // Sections
    jitContext: "IDE and Just-in-Time (JIT) Context",
    jitContextDesc: "Coding assistants typically operate via IDE extensions or CLI tools that utilize specific features like slash commands and IDE commands to interact with your environment.",
    progressiveDisclosure: "Progressive Disclosure",
    progressiveDisclosureDesc: "Instead of loading an entire codebase—which would immediately overwhelm the attention budget—modern agents use JIT context.",
    lightweightIdentifiers: "Lightweight Identifiers",
    lightweightIdentifiersDesc: "The assistant maintains references (file paths, stored queries) and dynamically loads only the necessary data at runtime using tools like grep, head, or tail.",
    
    longHorizon: "Managing Long-Horizon Tasks",
    longHorizonDesc: "Coding tasks often span \"tens of minutes to multiple hours,\" requiring specialized persistence strategies to avoid context rot.",
    compaction: "Compaction",
    compactionDesc: "When a session nears its token limit, the assistant summarizes critical details—such as architectural decisions and unresolved bugs—while discarding redundant tool outputs.",
    toolResultClearing: "Tool Result Clearing",
    toolResultClearingDesc: "A light touch form of compaction where the raw results of previous tool calls (like long terminal outputs) are cleared to save space.",
    structuredNoteTaking: "Structured Note-taking",
    structuredNoteTakingDesc: "The agent may maintain an external NOTES.md or a to-do list to track dependencies and progress across thousands of steps, which it can read back into its context after a reset.",
    
    contextPollution: "Avoiding Context Pollution",
    contextPollutionDesc: "In a coding context, precision is critical. Performance can be degraded by several factors.",
    distractors: "Distractors",
    distractorsDesc: "Files or code snippets that are topically related to the query but do not contain the answer can cause the model to lose focus or hallucinate.",
    contextRot: "Context Rot",
    contextRotDesc: "As more tokens (e.g., long histories or large files) are added, the model's ability to accurately retrieve \"needles\" of information from the \"haystack\" of the codebase decreases.",
    structuralPatterns: "Structural Patterns",
    structuralPatternsDesc: "Research suggests that models often perform better on shuffled or unstructured context than on logically structured haystacks, which may impact how they process long, coherent files.",
    
    promptStructure: "Prompt Structure for Coding Agents",
    promptStructureDesc: "For high-quality requests, system prompts should be organized into distinct sections using XML tagging or Markdown headers (e.g., <background_information>, ## Tool guidance). The objective is to provide the smallest possible set of high-signal tokens that maximize the likelihood of the correct code generation.",
  },
} as const;

export function t(locale: Locale, key: keyof typeof translations.en): string {
  return translations[locale][key];
}
