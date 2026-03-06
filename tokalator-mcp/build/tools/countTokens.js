import { readFileSync } from 'fs';
import { z } from 'zod';
import { getModel, DEFAULT_MODEL_ID } from '../core/modelProfiles.js';
export const countTokensSchema = {
    text: z.string().optional().describe('Text to count tokens in'),
    file: z.string().optional().describe('Absolute or relative file path to read and count'),
    model: z.string().optional().describe(`Claude model ID (default: ${DEFAULT_MODEL_ID})`),
};
export async function countTokens(input, tokenizer) {
    const { text, file, model: modelId } = input;
    if (!text && !file) {
        return 'Error: provide either `text` or `file`.';
    }
    const model = getModel(modelId ?? DEFAULT_MODEL_ID);
    let content;
    let source;
    if (file) {
        try {
            content = readFileSync(file, 'utf-8');
            source = file;
        }
        catch (e) {
            return `Error reading file "${file}": ${String(e)}`;
        }
    }
    else {
        content = text;
        source = '(text input)';
    }
    const tokens = tokenizer.countTokens(content);
    const chars = content.length;
    const ratio = chars > 0 ? (chars / tokens).toFixed(1) : '—';
    return [
        `Source:     ${source}`,
        `Model:      ${model.label}`,
        `Tokenizer:  ${tokenizer.getTokenizerLabel()}`,
        `Tokens:     ${tokens.toLocaleString()}`,
        `Characters: ${chars.toLocaleString()}`,
        `Ratio:      ~${ratio} chars/token`,
    ].join('\n');
}
