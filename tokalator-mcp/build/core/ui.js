const enabled = process.stdout.isTTY === true && !process.env.NO_COLOR && process.env.TERM !== 'dumb';
const wrap = (code) => (s) => (enabled ? `\x1b[${code}m${s}\x1b[0m` : s);
export const ui = {
    color: enabled,
    bold: wrap('1'),
    dim: wrap('2'),
    red: wrap('31'),
    green: wrap('32'),
    yellow: wrap('33'),
    cyan: wrap('36'),
};
export function bar(fraction, width = 20) {
    const filled = Math.round(Math.min(Math.max(fraction, 0), 1) * width);
    const tone = fraction >= 0.9 ? ui.red : fraction >= 0.75 ? ui.yellow : ui.green;
    return tone('█'.repeat(filled)) + ui.dim('░'.repeat(width - filled));
}
const SPARKS = '▁▂▃▄▅▆▇█';
export function sparkline(values) {
    const max = Math.max(...values, 0);
    return values.map(v => SPARKS[max > 0 ? Math.min(SPARKS.length - 1, Math.round((v / max) * (SPARKS.length - 1))) : 0]).join('');
}
/** Dims "Label:" prefixes and colors bars in plain tool output for the terminal. */
export function pretty(text) {
    if (!enabled)
        return text;
    return text
        .split('\n')
        .map(line => line
        .replace(/^(\s*[A-Za-z][A-Za-z ()/]*:)(\s+)/, (_m, label, gap) => ui.dim(label) + gap)
        .replace(/\[([█░]+)\]/g, (_m, b) => '[' + ui.cyan(b.replace(/░+/, s => ui.dim(s))) + ']'))
        .join('\n');
}
