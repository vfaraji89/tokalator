/**
 * Token budget estimator for MCP — operates on plain file paths.
 * No VS Code dependencies.
 */

import { readFileSync } from 'fs';
import { TokenizerService } from './tokenizerService.js';
import { BudgetBreakdown } from './types.js';

export interface FileBudget {
  path: string;
  tokens: number;
  error?: string;
}

export class BudgetEstimator {

  constructor(private readonly tokenizer: TokenizerService) {}

  /**
   * Count tokens in a file by reading it from disk.
   */
  countFileTokens(filePath: string): FileBudget {
    try {
      const content = readFileSync(filePath, 'utf-8');
      return { path: filePath, tokens: this.tokenizer.countTokens(content) };
    } catch (e) {
      return { path: filePath, tokens: 0, error: String(e) };
    }
  }

  /**
   * Count tokens in a list of files.
   */
  countAllFiles(filePaths: string[]): FileBudget[] {
    return filePaths.map(p => this.countFileTokens(p));
  }

  /**
   * Estimate non-file overhead: system prompt + instructions + conversation + output reservation.
   */
  estimateOverhead(chatTurns: number, instructionFiles: number): number {
    const systemPrompt = 2_000;
    const instructionsCost = instructionFiles * 500;
    const conversationCost = chatTurns * 800;
    const outputReservation = 4_000;
    return systemPrompt + instructionsCost + conversationCost + outputReservation;
  }

  /**
   * Compute total budget usage and breakdown.
   */
  computeBudget(
    files: FileBudget[],
    chatTurns: number,
    instructionFiles: number,
    windowCapacity: number,
  ): { used: number; capacity: number; percent: number; budgetLevel: 'low' | 'medium' | 'high'; breakdown: BudgetBreakdown } {
    const fileTokens = files.reduce((sum, f) => sum + f.tokens, 0);
    const overhead = this.estimateOverhead(chatTurns, instructionFiles);
    const used = fileTokens + overhead;
    const percent = Math.min((used / windowCapacity) * 100, 100);

    const budgetLevel: 'low' | 'medium' | 'high' =
      percent > 85 ? 'high' : percent > 60 ? 'medium' : 'low';

    return {
      used,
      capacity: windowCapacity,
      percent,
      budgetLevel,
      breakdown: {
        files: fileTokens,
        systemPrompt: 2_000,
        instructions: instructionFiles * 500,
        conversation: chatTurns * 800,
        outputReservation: 4_000,
      },
    };
  }
}
