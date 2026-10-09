export const TRACKING = [
  { assistant: "Claude Code (VS Code extension and CLI)", sees: "Turns, requests, input, output, and cache tokens, cache hit rate, and context size per turn, read from Claude Code's local logs and refreshed automatically.", cost: "API-equivalent cost from the logged token counts." },
  { assistant: "GitHub Copilot Chat", sees: "The active chat model (context window and prices switch to match) and @tokalator turns.", cost: "Input-only estimate. VS Code does not expose Copilot's token usage to other extensions." },
  { assistant: "Any assistant", sees: "Open tabs, pinned files, instruction files, and the context budget in the editor.", cost: "Input-only estimate at catalog rates." },
];

export const FAQ = [
  { q: "Does Tokalator track Claude Code usage?", a: "Yes. It reads Claude Code's local session logs, written by both the VS Code extension and the CLI, and shows turns, requests, cache hit rate, context size per turn, and API-equivalent cost. It refreshes every 15 seconds while the sidebar is open, with no chat mention needed." },
  { q: "Does it track GitHub Copilot usage?", a: "Partly. It detects the active Copilot chat model and switches the context window and prices to match, and it counts @tokalator turns. VS Code does not expose Copilot's token usage to other extensions, so Copilot cost is an input-only estimate." },
  { q: "What does API-equivalent cost mean?", a: "It is what the tokens would cost at API list prices. If you use Claude Code with a Pro, Max, or Team subscription, you are not billed per token, so read it as the value of your usage." },
  { q: "Is my code sent anywhere?", a: "No. Everything runs locally. The only default network request downloads the public pricing catalog from GitHub. Telemetry is opt-in, off by default, and never includes code, file names, paths, or prompts." },
  { q: "Is Tokalator free?", a: "Yes. The extension, the website tools, and the MCP server are free and open source under the AGPL-3.0-or-later license." },
];
