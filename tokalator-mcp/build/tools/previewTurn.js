import { z } from 'zod';
import { getModel, DEFAULT_MODEL_ID } from '../core/modelProfiles.js';
export const previewTurnSchema = {
    current_tokens: z.number().int().min(0).describe('Current estimated token usage'),
    model: z.string().optional().describe(`Claude model ID (default: ${DEFAULT_MODEL_ID})`),
};
export function previewTurn(input) {
    const model = getModel(input.model ?? DEFAULT_MODEL_ID);
    const perTurnCost = 800; // estimated tokens per turn (user message + assistant response)
    const currentInput = input.current_tokens;
    const nextTurnEstimate = currentInput + perTurnCost;
    const percentAfterTurn = Math.min((nextTurnEstimate / model.contextWindow) * 100, 100);
    const remaining = Math.max(model.contextWindow - nextTurnEstimate - model.maxOutput, 0);
    const turnsLeft = Math.floor(remaining / perTurnCost);
    const fmtK = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
    const barLen = 24;
    const nowFilled = Math.round((currentInput / model.contextWindow) * barLen);
    const nextFilled = Math.round((percentAfterTurn / 100) * barLen);
    const nowBar = '█'.repeat(nowFilled) + '░'.repeat(barLen - nowFilled);
    const nextBar = '█'.repeat(nextFilled) + '░'.repeat(barLen - nextFilled);
    let warning = null;
    if (percentAfterTurn >= 90) {
        warning = 'High risk of context overflow on next turn';
    }
    else if (percentAfterTurn >= 75) {
        warning = 'Approaching context limit — consider compacting';
    }
    const lines = [
        `Model:            ${model.label}`,
        `Window:           ${fmtK(model.contextWindow)}`,
        '',
        `Now:              ~${fmtK(currentInput)}  [${nowBar}]`,
        `After next turn:  ~${fmtK(nextTurnEstimate)}  [${nextBar}] (${percentAfterTurn.toFixed(1)}%)`,
        `Turn cost:        +~${fmtK(perTurnCost)}`,
        `Output reserve:   ~${fmtK(model.maxOutput)}`,
        `Remaining:        ~${fmtK(remaining)}  (~${turnsLeft} turns left)`,
    ];
    if (warning) {
        lines.push('', `Warning: ${warning}`);
    }
    return lines.join('\n');
}
