# Evaluation Data

This directory contains data and scripts for the Tokalator relevance scorer ground-truth evaluation and the controlled deployment experiment.

## Directory Structure

```
evaluation/
├── README.md                   # This file
├── snapshots/                  # Workspace snapshots (JSON)
│   └── .gitkeep
├── labels/                     # Human labels from annotators
│   └── .gitkeep
└── results/                    # Evaluation outputs (auto-generated)
    └── .gitkeep
```

## Snapshot Schema

Each snapshot JSON file captures a point-in-time view of an IDE session:

```json
{
  "snapshotId": "snap-001",
  "project": "react-app",
  "collector": "annotator-1",
  "timestamp": "2026-03-10T14:30:00Z",
  "activeFile": {
    "relativePath": "src/components/Dashboard.tsx",
    "languageId": "typescriptreact",
    "content": "import React from 'react';\nimport { Chart } from './Chart';\n..."
  },
  "tabs": [
    {
      "relativePath": "src/components/Chart.tsx",
      "languageId": "typescriptreact",
      "lastEditMinutesAgo": 1,
      "diagnosticCount": 0,
      "isPinned": false,
      "estimatedTokens": 450
    }
  ]
}
```

## Label Schema

Each labeler produces one file:

```json
{
  "labeler": "annotator-1",
  "labels": {
    "snap-001": {
      "src/components/Chart.tsx": "relevant",
      "tsconfig.json": "irrelevant"
    }
  }
}
```

## Labeling Instructions

For each tab in each snapshot, answer: **"If you were asking an AI coding assistant to help with the active file, would you want this tab included in the AI's context?"**

- **relevant** = Yes, the AI would benefit from seeing this file
- **irrelevant** = No, this file would be a distractor

Consider whether the tab has a direct code relationship (imports, shared types), is part of the same feature, or provides necessary context for understanding the active file.
