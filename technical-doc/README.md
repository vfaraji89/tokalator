# Technical Documentation

This folder contains the arXiv-ready technical paper for the Tokalator project.

## Contents

- **tokalator-paper.tex** — Full LaTeX paper: *"Tokalator: A Context Engineering Toolkit for AI Coding Assistants"*

## Building

```bash
# Compile with pdflatex (two passes for references + table of contents)
pdflatex tokalator-paper.tex
pdflatex tokalator-paper.tex
```

Or with `latexmk`:

```bash
latexmk -pdf tokalator-paper.tex
```

## arXiv Submission

1. Upload `tokalator-paper.tex` directly — all packages are standard arXiv-supported packages.
2. No external figures required — the architecture diagram uses `verbatim`.
3. Suggested arXiv categories: **cs.SE** (Software Engineering), **cs.AI** (Artificial Intelligence).

## Paper Structure

| Section | Topic |
|---------|-------|
| 1 | Introduction |
| 2 | Related Work |
| 3 | System Architecture |
| 4 | Economic Model (Cobb–Douglas) |
| 5 | Prompt Caching Analysis |
| 6 | Multi-Turn Conversation Estimation |
| 7 | VS Code Extension |
| 8 | Web Platform |
| 9 | Context Engineering Catalog |
| 10 | Data Model |
| 11 | Implementation Details |
| 12 | Availability & Licensing |
| 13 | Future Work |
| 14 | Conclusion |
| A–C | Appendices (code listings) |
