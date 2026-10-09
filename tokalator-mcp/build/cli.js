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
import { DEFAULT_MODEL_ID } from './core/modelProfiles.js';
import { claudeCodeUsage, formatUsage } from './tools/claudeCodeUsage.js';
import { pretty, ui } from './core/ui.js';
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
  usage     Claude Code turns, tokens, cache hits, and API-equivalent cost from local logs

Options:
  --model <id>          Claude model ID (default: ${DEFAULT_MODEL_ID})
  --turns <n>           Chat turns so far, for budget overhead (default: 0)
  --instructions <n>    Instruction files attached (default: 0)
  --text "<text>"       Count tokens in a raw string instead of a file
  --days <n>            usage: days to include (default: 7)
  --all                 usage: every project, not just the current directory
  --project <dir>       usage: a specific project directory
  --watch               usage: refresh every 5 seconds
  --json                usage: machine-readable output
  --help, -h            Show this help

Examples:
  tokalator count src/main.ts
  tokalator count --model claude-sonnet-5-5 src/**/*.ts
  tokalator count --text "Hello, world!"
  tokalator budget --turns 5 src/index.ts src/utils.ts
  tokalator preview 42000
  tokalator preview --model claude-haiku-5-5 18000
  tokalator models
  tokalator usage --days 30
  tokalator usage --all --watch
`.trim();
// ── Argument parsing ──────────────────────────────────────────────────────────
function parseArgs(argv) {
    const args = argv.slice(2);
    let command = '';
    let model;
    let turns = 0;
    let instructions = 0;
    let text;
    let days;
    let all = false;
    let project;
    let watch = false;
    let json = false;
    const positional = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--help' || arg === '-h') {
            console.log(HELP);
            process.exit(0);
        }
        else if (arg === '--model' && args[i + 1]) {
            model = args[++i];
        }
        else if (arg === '--turns' && args[i + 1]) {
            turns = parseInt(args[++i], 10);
        }
        else if (arg === '--instructions' && args[i + 1]) {
            instructions = parseInt(args[++i], 10);
        }
        else if (arg === '--text' && args[i + 1]) {
            text = args[++i];
        }
        else if (arg === '--days' && args[i + 1]) {
            days = parseInt(args[++i], 10);
        }
        else if (arg === '--project' && args[i + 1]) {
            project = args[++i];
        }
        else if (arg === '--all') {
            all = true;
        }
        else if (arg === '--watch') {
            watch = true;
        }
        else if (arg === '--json') {
            json = true;
        }
        else if (!arg.startsWith('-') && !command) {
            command = arg;
        }
        else if (!arg.startsWith('-')) {
            positional.push(arg);
        }
    }
    return { command, model, turns, instructions, text, positional, days, all, project, watch, json };
}
// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    const { command, model, turns, instructions, text, positional, days, all, project, watch, json } = parseArgs(process.argv);
    if (!command) {
        console.log(HELP);
        process.exit(0);
    }
    const tokenizer = new TokenizerService();
    switch (command) {
        case 'count': {
            if (text) {
                const result = await countTokens({ text, model }, tokenizer);
                console.log(pretty(result));
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
                console.log(pretty(result));
            }
            break;
        }
        case 'budget': {
            if (positional.length === 0) {
                console.error('Error: provide at least one file path');
                process.exit(1);
            }
            const result = await estimateBudget({ files: positional, model, chat_turns: turns, instruction_files: instructions }, tokenizer);
            console.log(pretty(result));
            break;
        }
        case 'preview': {
            const raw = positional[0];
            if (!raw || isNaN(Number(raw))) {
                console.error('Error: provide current token count as a number\n  tokalator preview 42000');
                process.exit(1);
            }
            const result = previewTurn({ current_tokens: parseInt(raw, 10), model });
            console.log(pretty(result));
            break;
        }
        case 'models': {
            console.log(pretty(listModels()));
            break;
        }
        case 'usage': {
            const opts = { days, all, project };
            if (json) {
                console.log(JSON.stringify(await claudeCodeUsage(opts), null, 2));
                break;
            }
            if (!watch) {
                console.log(formatUsage(await claudeCodeUsage(opts)));
                break;
            }
            process.on('SIGINT', () => { process.stdout.write('\x1b[?25h\n'); process.exit(0); });
            process.stdout.write('\x1b[?25l');
            for (;;) {
                const report = formatUsage(await claudeCodeUsage(opts));
                process.stdout.write('\x1b[2J\x1b[H' + report + '\n\n' + ui.dim(`  Updated ${new Date().toLocaleTimeString()}  ·  Ctrl+C to stop`) + '\n');
                await new Promise(r => setTimeout(r, 5000));
            }
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
