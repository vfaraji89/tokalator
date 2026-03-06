/**
 * Tokalator MCP Server
 *
 * Exposes real Claude BPE token counting and budget analysis to Claude Code.
 * Uses stdio transport — all logging goes to stderr (stdout is reserved for JSON-RPC).
 *
 * Tools:
 *  count_tokens    — Count tokens in text or a file
 *  estimate_budget — Full budget breakdown for a list of files
 *  preview_turn    — Preview estimated cost of next chat turn
 *  list_models     — List available Claude model profiles
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { TokenizerService } from './core/tokenizerService.js';
import { countTokens, countTokensSchema } from './tools/countTokens.js';
import { estimateBudget, estimateBudgetSchema } from './tools/estimateBudget.js';
import { previewTurn, previewTurnSchema } from './tools/previewTurn.js';
import { listModels } from './tools/listModels.js';

const tokenizer = new TokenizerService();

const server = new McpServer({
  name: 'tokalator',
  version: '3.1.1',
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

// ── Start ─────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[tokalator-mcp] Server ready — Claude BPE tokenizer loaded on first use');
