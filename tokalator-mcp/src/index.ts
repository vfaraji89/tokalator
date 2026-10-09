/**
 * Tokalator MCP Server
 *
 * Exposes token counting, budget analysis, and Claude Code usage to Claude Code.
 * Uses stdio transport — all logging goes to stderr (stdout is reserved for JSON-RPC).
 *
 * Tools:
 *  count_tokens    — Count tokens in text or a file
 *  estimate_budget — Full budget breakdown for a list of files
 *  preview_turn    — Preview estimated cost of next chat turn
 *  list_models     — List available Claude model profiles
 *  claude_code_usage — Turns, tokens, cache hits, and API-equivalent cost from local Claude Code logs
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// z is re-exported by tool schemas; keep dependency but remove unused direct import

import { TokenizerService } from './core/tokenizerService.js';
import { countTokens, countTokensSchema } from './tools/countTokens.js';
import { estimateBudget, estimateBudgetSchema } from './tools/estimateBudget.js';
import { previewTurn, previewTurnSchema } from './tools/previewTurn.js';
import { listModels } from './tools/listModels.js';
import { claudeCodeUsage, claudeCodeUsageSchema, formatUsage } from './tools/claudeCodeUsage.js';

const tokenizer = new TokenizerService();

const server = new McpServer({
  name: 'tokalator',
  version: '3.1.8',
});

// ── count_tokens ──────────────────────────────────────────────────────────────

server.registerTool(
  'count_tokens',
  {
    description: 'Count tokens in a text string or file using the real Claude BPE tokenizer. Provide either `text` or `file` (path).',
    inputSchema: countTokensSchema,
  },
  async (input) => {
    const result = await countTokens(input, tokenizer);
    return { content: [{ type: 'text', text: result }] };
  },
);

// ── estimate_budget ───────────────────────────────────────────────────────────

server.registerTool(
  'estimate_budget',
  {
    description: 'Estimate the token budget for a set of files plus conversation overhead. Returns a full breakdown: files, system prompt, instructions, conversation, and output reservation.',
    inputSchema: estimateBudgetSchema,
  },
  async (input) => {
    const result = await estimateBudget(input, tokenizer);
    return { content: [{ type: 'text', text: result }] };
  },
);

// ── preview_turn ──────────────────────────────────────────────────────────────

server.registerTool(
  'preview_turn',
  {
    description: 'Preview the estimated token cost of the next chat turn. Shows current usage, projected usage after the turn, and how many turns remain before hitting the context limit.',
    inputSchema: previewTurnSchema,
  },
  async (input) => {
    const result = previewTurn(input);
    return { content: [{ type: 'text', text: result }] };
  },
);

// ── list_models ───────────────────────────────────────────────────────────────

server.registerTool(
  'list_models',
  {
    description: 'List all available Claude model profiles with context window sizes, max output tokens, and context rot thresholds.',
    inputSchema: {},
  },
  async () => {
    const result = listModels();
    return { content: [{ type: 'text', text: result }] };
  },
);

// ── claude_code_usage ─────────────────────────────────────────────────────────

server.registerTool(
  'claude_code_usage',
  {
    description: 'Summarize Claude Code usage from local session logs (CLI and VS Code extension): turns, requests, input, output, and cache tokens, cache hit rate, and API-equivalent cost by model, project, and client. Defaults to the current project and the last 7 days. API-equivalent means API list prices; subscription plans are not billed per token.',
    inputSchema: claudeCodeUsageSchema,
  },
  async (args) => {
    const result = formatUsage(await claudeCodeUsage(args));
    return { content: [{ type: 'text', text: result }] };
  },
);

// ── Start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[tokalator-mcp] Server ready — Claude BPE tokenizer loaded on first use');
