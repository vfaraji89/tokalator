"""
Controlled Experiment Analysis Script

Performs paired analysis of control vs treatment sessions:
  - Wilcoxon signed-rank test
  - Cohen's d effect size
  - Summary statistics table

Usage:
    python scripts/analyze-experiment.py

Reads: evaluation/results/experiment-data.json
Outputs: evaluation/results/experiment-analysis.json, experiment-table.tex
"""

import json
import math
import os
import sys
from typing import List, Tuple

RESULTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'evaluation', 'results')
DATA_FILE = os.path.join(RESULTS_DIR, 'experiment-data.json')


def wilcoxon_signed_rank(x: List[float], y: List[float]) -> Tuple[float, float]:
    """
    Wilcoxon signed-rank test (two-sided).
    Returns (W statistic, approximate p-value using normal approximation).
    """
    n = len(x)
    assert n == len(y), "Arrays must be same length"

    diffs = [xi - yi for xi, yi in zip(x, y)]
    # Remove zeros
    diffs = [(abs(d), 1 if d > 0 else -1) for d in diffs if d != 0]
    n_nonzero = len(diffs)

    if n_nonzero == 0:
        return 0.0, 1.0

    # Rank by absolute difference
    diffs.sort(key=lambda t: t[0])

    # Assign ranks (handle ties with average rank)
    ranks = [0.0] * n_nonzero
    i = 0
    while i < n_nonzero:
        j = i
        while j < n_nonzero and diffs[j][0] == diffs[i][0]:
            j += 1
        avg_rank = (i + 1 + j) / 2.0
        for k in range(i, j):
            ranks[k] = avg_rank
        i = j

    # W+ = sum of ranks of positive differences
    w_plus = sum(ranks[i] for i in range(n_nonzero) if diffs[i][1] > 0)
    w_minus = sum(ranks[i] for i in range(n_nonzero) if diffs[i][1] < 0)
    W = min(w_plus, w_minus)

    # Normal approximation for p-value
    mean_W = n_nonzero * (n_nonzero + 1) / 4
    var_W = n_nonzero * (n_nonzero + 1) * (2 * n_nonzero + 1) / 24
    z = (W - mean_W) / math.sqrt(var_W) if var_W > 0 else 0

    # Two-tailed p-value (using normal CDF approximation)
    p_value = 2 * normal_cdf(-abs(z))

    return W, p_value


def normal_cdf(x: float) -> float:
    """Approximate normal CDF using Abramowitz and Stegun."""
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


def cohens_d(x: List[float], y: List[float]) -> float:
    """Cohen's d for paired samples (using pooled SD)."""
    diffs = [xi - yi for xi, yi in zip(x, y)]
    mean_diff = sum(diffs) / len(diffs)
    var_diff = sum((d - mean_diff) ** 2 for d in diffs) / (len(diffs) - 1) if len(diffs) > 1 else 0
    sd_diff = math.sqrt(var_diff) if var_diff > 0 else 1e-10
    return mean_diff / sd_diff


def interpret_cohens_d(d: float) -> str:
    d_abs = abs(d)
    if d_abs < 0.2:
        return 'negligible'
    elif d_abs < 0.5:
        return 'small'
    elif d_abs < 0.8:
        return 'medium'
    else:
        return 'large'


def median(values: List[float]) -> float:
    s = sorted(values)
    n = len(s)
    if n % 2 == 0:
        return (s[n // 2 - 1] + s[n // 2]) / 2
    return s[n // 2]


def iqr(values: List[float]) -> Tuple[float, float]:
    s = sorted(values)
    n = len(s)
    q1 = median(s[:n // 2])
    q3 = median(s[(n + 1) // 2:])
    return q1, q3


def mean(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0


def std(values: List[float]) -> float:
    if len(values) < 2:
        return 0
    m = mean(values)
    return math.sqrt(sum((v - m) ** 2 for v in values) / (len(values) - 1))


def generate_latex_table(analysis: dict) -> str:
    """Generate LaTeX summary table for the paper."""
    metrics = analysis['metrics']
    rows = []
    for metric_name, data in metrics.items():
        ctrl = data['control']
        treat = data['treatment']
        p_str = f'{data["p_value"]:.3f}' if data['p_value'] >= 0.001 else '<0.001'
        d_str = f'{data["cohens_d"]:.2f}'
        rows.append(
            f'    {metric_name} & '
            f'{ctrl["median"]:.0f} ({ctrl["q1"]:.0f}--{ctrl["q3"]:.0f}) & '
            f'{treat["median"]:.0f} ({treat["q1"]:.0f}--{treat["q3"]:.0f}) & '
            f'{p_str} & {d_str} \\\\'
        )

    return f"""\\begin{{table}}[htp!]
\\centering
\\small
\\caption{{Controlled experiment results ($N={analysis['n_participants']}$, within-subjects crossover). Median (IQR) reported. $p$-values from Wilcoxon signed-rank test.}}
\\label{{tab:experiment}}
\\begin{{tabular}}{{@{{}} l r r c r @{{}}}}
\\toprule
\\textbf{{Metric}} & \\textbf{{Control}} & \\textbf{{Treatment}} & \\textbf{{$p$}} & \\textbf{{Cohen's $d$}} \\\\
\\midrule
{chr(10).join(rows)}
\\bottomrule
\\end{{tabular}}
\\end{{table}}"""


def main():
    print('=== Controlled Experiment Analysis ===\n')

    if not os.path.exists(DATA_FILE):
        print(f'Data file not found: {DATA_FILE}')
        print('Create experiment-data.json with the following structure:')
        print(json.dumps({
            "participants": [
                {
                    "id": "P01",
                    "group": 1,
                    "control": {"tokens": 72000, "tabs": 18, "likert": [2, 3, 4]},
                    "treatment": {"tokens": 48000, "tabs": 12, "likert": [4, 4, 5]}
                }
            ]
        }, indent=2))
        sys.exit(1)

    with open(DATA_FILE, 'r') as f:
        data = json.load(f)

    participants = data['participants']
    n = len(participants)
    print(f'Participants: {n}')

    if n < 5:
        print('Warning: very small sample size, results may not be meaningful\n')

    # Extract paired values
    control_tokens = [p['control']['tokens'] for p in participants]
    treatment_tokens = [p['treatment']['tokens'] for p in participants]
    control_tabs = [p['control']['tabs'] for p in participants]
    treatment_tabs = [p['treatment']['tabs'] for p in participants]

    # Likert scores (per question)
    control_likert = list(zip(*(p['control']['likert'] for p in participants)))
    treatment_likert = list(zip(*(p['treatment']['likert'] for p in participants)))

    analysis = {'n_participants': n, 'metrics': {}}

    # Analyze each metric
    for name, ctrl, treat in [
        ('Context Tokens', control_tokens, treatment_tokens),
        ('Open Tabs', control_tabs, treatment_tabs),
    ]:
        W, p = wilcoxon_signed_rank(ctrl, treat)
        d = cohens_d(ctrl, treat)
        ctrl_q1, ctrl_q3 = iqr(ctrl)
        treat_q1, treat_q3 = iqr(treat)

        analysis['metrics'][name] = {
            'control': {
                'mean': round(mean(ctrl), 1),
                'median': round(median(ctrl), 1),
                'std': round(std(ctrl), 1),
                'q1': round(ctrl_q1, 1),
                'q3': round(ctrl_q3, 1),
            },
            'treatment': {
                'mean': round(mean(treat), 1),
                'median': round(median(treat), 1),
                'std': round(std(treat), 1),
                'q1': round(treat_q1, 1),
                'q3': round(treat_q3, 1),
            },
            'W': round(W, 2),
            'p_value': round(p, 4),
            'cohens_d': round(d, 3),
            'effect_size_interpretation': interpret_cohens_d(d),
        }

        sig = '***' if p < 0.001 else '**' if p < 0.01 else '*' if p < 0.05 else 'ns'
        print(f'{name}:')
        print(f'  Control:   median={median(ctrl):.0f} (IQR: {ctrl_q1:.0f}–{ctrl_q3:.0f})')
        print(f'  Treatment: median={median(treat):.0f} (IQR: {treat_q1:.0f}–{treat_q3:.0f})')
        print(f'  W={W:.1f}, p={p:.4f} {sig}, d={d:.3f} ({interpret_cohens_d(d)})')
        print()

    # Likert analysis
    analysis['likert'] = {}
    q_names = ['Budget Awareness', 'Response Relevance', 'Tool Adoption Intent']
    for i, q_name in enumerate(q_names):
        ctrl_vals = list(control_likert[i])
        treat_vals = list(treatment_likert[i])
        W, p = wilcoxon_signed_rank(ctrl_vals, treat_vals)

        analysis['likert'][q_name] = {
            'control_median': round(median(ctrl_vals), 1),
            'treatment_median': round(median(treat_vals), 1),
            'p_value': round(p, 4),
        }
        sig = '*' if p < 0.05 else 'ns'
        print(f'Likert Q{i+1} ({q_name}): control={median(ctrl_vals):.0f}, treatment={median(treat_vals):.0f}, p={p:.4f} {sig}')

    # Token reduction percentage
    reductions = [(c - t) / c * 100 for c, t in zip(control_tokens, treatment_tokens) if c > 0]
    if reductions:
        analysis['token_reduction_pct'] = {
            'mean': round(mean(reductions), 1),
            'median': round(median(reductions), 1),
        }
        print(f'\nToken reduction: mean={mean(reductions):.1f}%, median={median(reductions):.1f}%')

    # Save
    os.makedirs(RESULTS_DIR, exist_ok=True)
    with open(os.path.join(RESULTS_DIR, 'experiment-analysis.json'), 'w') as f:
        json.dump(analysis, f, indent=2)

    latex = generate_latex_table(analysis)
    with open(os.path.join(RESULTS_DIR, 'experiment-table.tex'), 'w') as f:
        f.write(latex)

    print(f'\nSaved to {RESULTS_DIR}/:')
    print('  experiment-analysis.json — full analysis')
    print('  experiment-table.tex     — LaTeX table for paper')


if __name__ == '__main__':
    main()
