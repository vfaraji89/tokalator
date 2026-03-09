# Controlled Deployment Experiment Protocol

## Study Design: Within-Subjects Crossover

Each participant completes two 1-hour coding sessions on real tasks:
- **Session A (Control)**: Tokalator extension **disabled**. Work normally.
- **Session B (Treatment)**: Tokalator extension **enabled** with session logging on.

### Counterbalancing
- Group 1 (half of participants): Session A first, then Session B
- Group 2 (other half): Session B first, then Session A
- Minimum 1-day gap between sessions to reduce carryover effects.

---

## Participants

- **Target**: 20–30 software engineers from iLab/Kariyer.net
- **Eligibility**: Uses VS Code daily, uses GitHub Copilot or similar AI coding assistant
- **Informed consent**: Each participant signs a brief consent form acknowledging anonymized data collection

---

## Pre-Session Setup

### Control Session (Tokalator Off)
1. Ensure Tokalator extension is **disabled** in VS Code
2. Participant works on a real task for 1 hour
3. At session end: **briefly enable Tokalator** to capture a single snapshot (run `/count` and `/breakdown`)
4. Record: total tabs, total estimated tokens, budget breakdown

### Treatment Session (Tokalator On)
1. Enable Tokalator extension
2. Set `tokalator.enableSessionLogging` to `true` in VS Code settings
3. Participant works on a real task for 1 hour, using Tokalator naturally
4. Session logger automatically records all events
5. At session end: final snapshot is captured automatically

---

## Measured Variables

### Primary Outcome
- **Context tokens at session end**: total estimated tokens across all open tabs + overhead

### Secondary Outcomes
- Number of open tabs at session end
- Distractor tab ratio (tabs with R < 0.3 / total tabs)
- Number of `/optimize` invocations (treatment only)
- Commands used (treatment only)

### Subjective Measures (Post-Session Likert, 1–5 scale)
1. "I had a good sense of how much of my context budget was being used."
2. "I felt my AI assistant's responses were relevant to my current task."
3. "I would use a context budget monitoring tool in my daily workflow."

---

## Data Collection

### Control Session
Manual capture at session end:
```json
{
  "participantId": "P01",
  "group": 1,
  "session": "control",
  "date": "2026-03-12",
  "taskDescription": "Implement user profile page",
  "durationMinutes": 60,
  "tabsAtEnd": 18,
  "estimatedTokensAtEnd": 72000,
  "budgetBreakdown": {
    "files": 45000,
    "systemPrompt": 2000,
    "instructions": 1500,
    "conversation": 19500,
    "outputReservation": 4000
  },
  "likert": [2, 3, 4]
}
```

### Treatment Session
Automatic via session logger + manual Likert:
```json
{
  "participantId": "P01",
  "group": 1,
  "session": "treatment",
  "date": "2026-03-13",
  "taskDescription": "Implement notification system",
  "durationMinutes": 60,
  "sessionLogFile": "session-1741820400000.json",
  "likert": [4, 4, 5]
}
```

---

## Analysis Plan

### Primary Analysis
- **Paired Wilcoxon signed-rank test** on context tokens (treatment vs control)
- Effect size: **Cohen's d** (or rank-biserial correlation for non-parametric)
- Report: median ± IQR, p-value, effect size, 95% CI

### Secondary Analyses
- Paired comparison of tab count, distractor ratio
- Descriptive statistics of command usage during treatment sessions
- Likert score comparison (Wilcoxon signed-rank)

### Reporting
- Summary statistics table (mean, median, SD, IQR for each metric)
- Box plots: control vs treatment for primary + secondary outcomes
- Effect size interpretation (Cohen's d: 0.2 small, 0.5 medium, 0.8 large)

---

## Ethical Considerations

- **No PII collected**: Session logs contain only counts, scores, and timestamps
- **No file contents or names**: Only aggregate metrics
- **Voluntary participation**: Participants can withdraw at any time
- **Data stored locally**: No cloud upload; analysis runs on researcher's machine
- **Informed consent**: Participants are briefed on what data is collected before starting

---

## Timeline

| Day | Activity |
|-----|----------|
| 1 | Recruit participants, assign groups, distribute instructions |
| 2–3 | Group 1: Control sessions; Group 2: Treatment sessions |
| 4–5 | Group 1: Treatment sessions; Group 2: Control sessions |
| 6 | Collect all session logs and manual data |
| 7 | Run analysis script, generate results |
