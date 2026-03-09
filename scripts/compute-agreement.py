"""
Inter-Annotator Agreement (Fleiss' Kappa)

Computes agreement across multiple labelers for the relevance scorer benchmark.

Usage:
    python scripts/compute-agreement.py

Reads: evaluation/labels/*.json
Outputs: evaluation/results/agreement.json
"""

import json
import os
import sys
from collections import defaultdict

LABEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'evaluation', 'labels')
RESULTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'evaluation', 'results')


def load_labels():
    """Load all labeler JSON files."""
    labelers = []
    for fname in sorted(os.listdir(LABEL_DIR)):
        if not fname.endswith('.json'):
            continue
        with open(os.path.join(LABEL_DIR, fname), 'r') as f:
            labelers.append(json.load(f))
    return labelers


def fleiss_kappa(matrix):
    """
    Compute Fleiss' kappa for a matrix of shape (N_subjects, N_categories).
    Each cell contains the count of raters who assigned that category to that subject.
    """
    N = len(matrix)  # number of subjects
    if N == 0:
        return 0.0

    n = sum(matrix[0])  # number of raters per subject
    k = len(matrix[0])  # number of categories

    if n <= 1:
        return 1.0

    # P_i for each subject
    P = []
    for row in matrix:
        p_i = (sum(r * r for r in row) - n) / (n * (n - 1))
        P.append(p_i)

    P_bar = sum(P) / N

    # p_j for each category
    p_j = []
    for j in range(k):
        total = sum(matrix[i][j] for i in range(N))
        p_j.append(total / (N * n))

    P_e = sum(p * p for p in p_j)

    if P_e == 1.0:
        return 1.0

    kappa = (P_bar - P_e) / (1 - P_e)
    return kappa


def interpret_kappa(k):
    """Standard interpretation of Fleiss' kappa."""
    if k < 0:
        return 'Poor'
    elif k < 0.20:
        return 'Slight'
    elif k < 0.40:
        return 'Fair'
    elif k < 0.60:
        return 'Moderate'
    elif k < 0.80:
        return 'Substantial'
    else:
        return 'Almost Perfect'


def main():
    print('=== Inter-Annotator Agreement (Fleiss\' Kappa) ===\n')

    labelers = load_labels()
    n_raters = len(labelers)
    print(f'Loaded {n_raters} labeler files')

    if n_raters < 2:
        print('Need at least 2 labelers to compute agreement.')
        sys.exit(1)

    # Collect all (snapshot, tab) pairs
    categories = ['relevant', 'irrelevant']
    cat_index = {c: i for i, c in enumerate(categories)}

    # Build rating matrix: each row = one (snapshot, tab) item
    items = defaultdict(lambda: [0, 0])  # (snapshot, tab) -> [relevant_count, irrelevant_count]

    for labeler in labelers:
        labeler_name = labeler.get('labeler', 'unknown')
        for snap_id, tab_labels in labeler['labels'].items():
            for tab_path, label in tab_labels.items():
                key = (snap_id, tab_path)
                if label in cat_index:
                    items[key][cat_index[label]] += 1

    # Filter to items rated by all labelers
    matrix = []
    for key, counts in sorted(items.items()):
        total_votes = sum(counts)
        if total_votes == n_raters:
            matrix.append(counts)

    print(f'Items rated by all {n_raters} labelers: {len(matrix)}')

    if len(matrix) == 0:
        print('No items rated by all labelers. Check label files.')
        sys.exit(1)

    kappa = fleiss_kappa(matrix)
    interpretation = interpret_kappa(kappa)

    print(f'\nFleiss\' kappa: {kappa:.3f} ({interpretation})')
    print(f'  N subjects:   {len(matrix)}')
    print(f'  N raters:     {n_raters}')
    print(f'  Categories:   {categories}')

    # Per-snapshot breakdown
    snap_items = defaultdict(list)
    for (snap_id, _), counts in items.items():
        if sum(counts) == n_raters:
            snap_items[snap_id].append(counts)

    print(f'\nPer-snapshot breakdown:')
    for snap_id in sorted(snap_items.keys()):
        snap_matrix = snap_items[snap_id]
        snap_kappa = fleiss_kappa(snap_matrix)
        print(f'  {snap_id}: kappa={snap_kappa:.3f} ({len(snap_matrix)} items)')

    # Agreement percentage (how often all labelers agreed)
    unanimous = sum(1 for row in matrix if max(row) == n_raters)
    pct_unanimous = unanimous / len(matrix) * 100 if matrix else 0
    print(f'\nUnanimous agreement: {unanimous}/{len(matrix)} ({pct_unanimous:.1f}%)')

    # Save results
    os.makedirs(RESULTS_DIR, exist_ok=True)
    result = {
        'fleiss_kappa': round(kappa, 4),
        'interpretation': interpretation,
        'n_subjects': len(matrix),
        'n_raters': n_raters,
        'unanimous_count': unanimous,
        'unanimous_pct': round(pct_unanimous, 1),
        'labelers': [l.get('labeler', 'unknown') for l in labelers],
    }
    with open(os.path.join(RESULTS_DIR, 'agreement.json'), 'w') as f:
        json.dump(result, f, indent=2)

    print(f'\nSaved to {RESULTS_DIR}/agreement.json')


if __name__ == '__main__':
    main()
