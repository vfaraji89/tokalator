#!/usr/bin/env node
/**
 * Tokalator CLI
 *
 * Usage:
 *   tokalator count [--model <id>] <file> [<file>...]
 *   tokalator count [--model <id>] --text "<text>"
 *   tokalator budget [--model <id>] [--turns <n>] [--instructions <n>] <file> [<file>...]
 *   tokalator preview [--model <id>] <current_tokens>
 *   tokalator models
 *   tokalator --help
 */

import { TokenizerService } from './core/tokenizerService.js';
import { countTokens } from './tools/countTokens.js';
import { estimateBudget } from './tools/estimateBudget.js';
import { previewTurn } from './tools/previewTurn.js';
import { listModels } from './tools/listModels.js';

const HELP = `
Tokalator — real Claude BPE token counting

Usage:
  tokalator count [--model <id>] <file> [<file>...]
  tokalator count [--model <id>] --text "<text>"
  tokalator budget [--model <id>] [--turns <n>] [--instructions <n>] <file> [<file>...]
  tokalator preview [--model <id>] <current_tokens>
  tokalator models

Commands:
  count     Count tokens in one or more files (or raw text via --text)
  budget    Full budget breakdown: files + system overhead + conversation
  preview   Preview estimated token cost of the next chat turn
  models    List available Claude model profiles

Options:
  --model <id>          Claude model ID (default: claude-opus-4.6)
  --turns <n>           Chat turns so far, for budget overhead (default: 0)
  --instructions <n>    Instruction files attached (default: 0)
  --text "<text>"       Count tokens in a raw string instead of a file
  --help, -h            Show this help

Examples:
  tokalator count src/main.ts
  tokalator count --model claude-sonnet-4.5 src/**/*.ts
  tokalator count --text "Hello, world!"
  tokalator budget --turns 5 src/index.ts src/utils.ts
  tokalator preview 42000
  tokalator preview --model claude-haiku-4.5 18000
  tokalator models
`.trim();

// ── Argument parsing ──────────────────────────────────────────────────────────

function parseArgs(argv: string[]): {
  command: string;
  model?: string;
  turns: number;
  instructions: number;
  text?: string;
  positional: string[];
} {
  const args = argv.slice(2);
  let command = '';
  let model: string | undefined;
  let turns = 0;
  let instructions = 0;
  let text: string | undefined;
  const positional: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      console.log(HELP);
      process.exit(0);
    } else if (arg === '--model' && args[i + 1]) {
      model = args[++i];
    } else if (arg === '--turns' && args[i + 1]) {
      turns = parseInt(args[++i], 10);
    } else if (arg === '--instructions' && args[i + 1]) {
      instructions = parseInt(args[++i], 10);
    } else if (arg === '--text' && args[i + 1]) {
      text = args[++i];
    } else if (!arg.startsWith('-') && !command) {
      command = arg;
    } else if (!arg.startsWith('-')) {
      positional.push(arg);
    }
  }

  return { command, model, turns, instructions, text, positional };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { command, model, turns, instructions, text, positional } = parseArgs(process.argv);

  if (!command) {
    console.log(HELP);
    process.exit(0);
  }

  const tokenizer = new TokenizerService();

  switch (command) {
    case 'count': {
      if (text) {
        const result = await countTokens({ text, model }, tokenizer);
        console.log(result);
        break;
      }
      if (positional.length === 0) {
        console.error('Error: provide at least one file path, or use --text "<text>"');
        process.exit(1);
      }
      // Count each file, print results
      for (const file of positional) {
        const result = await countTokens({ file, model }, tokenizer);
        if (positional.length > 1) {
          console.log(`\n── ${file} ──`);
        }
        console.log(result);
      }
      break;
    }

    case 'budget': {
      if (positional.length === 0) {
        console.error('Error: provide at least one file path');
        process.exit(1);
      }
      const result = await estimateBudget(
        { files: positional, model, chat_turns: turns, instruction_files: instructions },
        tokenizer,
      );
      console.log(result);
      break;
    }

    case 'preview': {
      const raw = positional[0];
      if (!raw || isNaN(Number(raw))) {
        console.error('Error: provide current token count as a number\n  tokalator preview 42000');
        process.exit(1);
      }
      const result = previewTurn({ current_tokens: parseInt(raw, 10), model });
      console.log(result);
      break;
    }

    case 'models': {
      console.log(listModels());
      break;
    }

    default:
      console.error(`Unknown command: "${command}"\n`);
      console.log(HELP);
      process.exit(1);
  }

  tokenizer.dispose();
}

main().catch(err => {
  console.error('Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
