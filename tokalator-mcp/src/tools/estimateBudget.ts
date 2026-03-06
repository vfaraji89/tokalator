import { z } from 'zod';
import { TokenizerService } from '../core/tokenizerService.js';
import { BudgetEstimator } from '../core/budgetEstimator.js';
import { getModel, DEFAULT_MODEL_ID } from '../core/modelProfiles.js';

export const estimateBudgetSchema = {
  files: z.array(z.string()).describe('List of file paths to include in the budget'),
  model: z.string().optional().describe(`Claude model ID (default: ${DEFAULT_MODEL_ID})`),
  chat_turns: z.number().int().min(0).optional().describe('Number of chat turns so far (default: 0)'),
  instruction_files: z.number().int().min(0).optional().describe('Number of instruction files attached (default: 0)'),
};

export async function estimateBudget(
  input: { files: string[]; model?: string; chat_turns?: number; instruction_files?: number },
  tokenizer: TokenizerService,
): Promise<string> {
  const model = getModel(input.model ?? DEFAULT_MODEL_ID);
  const chatTurns = input.chat_turns ?? 0;
  const instructionFiles = input.instruction_files ?? 0;

  const estimator = new BudgetEstimator(tokenizer);
  const fileBudgets = estimator.countAllFiles(input.files);
  const budget = estimator.computeBudget(fileBudgets, chatTurns, instructionFiles, model.contextWindow);

  const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
  const pct = (n: number) => `${((n / model.contextWindow) * 100).toFixed(1)}%`;

  const errors = fileBudgets.filter(f => f.error);

  const lines: string[] = [
    `Model:    ${model.label} (${fmtK(model.contextWindow)} ctx)`,
    `Budget:   ${fmtK(budget.used)} / ${fmtK(budget.capacity)} (${budget.percent.toFixed(1)}%) — ${budget.budgetLevel.toUpperCase()}`,
    '',
    'Breakdown:',
    `  Files:          ~${fmtK(budget.breakdown.files).padStart(8)}  ${pct(budget.breakdown.files)}`,
    `  System prompt:  ~${fmtK(budget.breakdown.systemPrompt).padStart(8)}  ${pct(budget.breakdown.systemPrompt)}`,
    `  Instructions:   ~${fmtK(budget.breakdown.instructions).padStart(8)}  ${pct(budget.breakdown.instructions)}`,
    `  Conversation:   ~${fmtK(budget.breakdown.conversation).padStart(8)}  ${pct(budget.breakdown.conversation)}`,
    `  Output reserve: ~${fmtK(budget.breakdown.outputReservation).padStart(8)}  ${pct(budget.breakdown.outputReservation)}`,
    '',
    'Files:',
    ...fileBudgets.map(f =>
      `  ${f.error ? '[ERR]' : `~${fmtK(f.tokens).padStart(6)}`}  ${f.path}`
    ),
  ];

  if (errors.length > 0) {
    lines.push('', 'Errors:');
    errors.forEach(f => lines.push(`  ${f.path}: ${f.error}`));
  }

  const rotWarning = model.rotThreshold;
  if (chatTurns >= rotWarning) {
    lines.push('', `Warning: ${chatTurns} turns >= rot threshold (${rotWarning}) — context may be stale`);
  }

  return lines.join('\n');
}
