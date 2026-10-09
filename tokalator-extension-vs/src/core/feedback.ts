import * as vscode from 'vscode';
import type { Telemetry } from './telemetry';

const STATE_KEY = 'tokalator.feedback';
const USE_CASE_KEY = 'tokalator.feedback.useCase';
const REVIEW_URL = 'https://marketplace.visualstudio.com/items?itemName=vfaraji89.tokalator&ssr=false#review-details';
const ISSUE_URL = 'https://github.com/vfaraji89/tokalator/issues/new';
const MIN_SESSIONS = 5;
const MIN_DAYS = 3;
const REASK_DAYS = 45;
const DAY = 86_400_000;

interface FeedbackState {
  firstSeen: number;
  sessions: number;
  lastAsked: number;
  optedOut: boolean;
}

const TOPICS = [
  { label: 'Cost and token accuracy', detail: 'Numbers that look wrong or are missing' },
  { label: 'Claude Code tracking', detail: 'Turns, cache, or API-equivalent cost from Claude Code logs' },
  { label: 'Dashboard and UX', detail: 'Layout, readability, interactions' },
  { label: 'Models and pricing catalog', detail: 'A model or price that should be added or fixed' },
  { label: 'Something else', detail: 'Any other idea or problem' },
];

const USE_CASES = [
  'Claude Code cost and turns',
  'Copilot context budget',
  'Comparing model prices',
  'Securing the workspace for agents',
  'Generating SKILL.md or AI settings',
  'Something else',
];

/**
 * The topic is stored only when telemetry consent was given; details always go through a
 * GitHub issue the person reviews and submits themselves.
 */
export async function askForImprovement(version: string, telemetry?: Telemetry): Promise<void> {
  const pick = await vscode.window.showQuickPick(TOPICS, {
    title: 'What should the next Tokalator update improve?',
    placeHolder: 'Pick a topic; a prefilled GitHub issue opens for you to edit and submit',
  });
  if (!pick) return;
  await telemetry?.answer('improve-topic', pick.label);
  const body = [
    `**Topic:** ${pick.label}`,
    '',
    '**What happened or what would help:**',
    '',
    '',
    '---',
    `Tokalator ${version} · VS Code ${vscode.version} · ${process.platform}`,
  ].join('\n');
  const url = `${ISSUE_URL}?title=${encodeURIComponent(`[Feedback] ${pick.label}`)}&labels=feedback&body=${encodeURIComponent(body)}`;
  await vscode.env.openExternal(vscode.Uri.parse(url));
}

/** Asks at most once every few weeks, only after the extension has been used for a while. */
export async function maybeAskForFeedback(state: vscode.Memento, version: string, telemetry?: Telemetry): Promise<void> {
  const now = Date.now();
  const s: FeedbackState = state.get<FeedbackState>(STATE_KEY) ?? { firstSeen: now, sessions: 0, lastAsked: 0, optedOut: false };
  s.sessions++;
  await state.update(STATE_KEY, s);
  if (s.optedOut || s.sessions < MIN_SESSIONS || now - s.firstSeen < MIN_DAYS * DAY || now - s.lastAsked < REASK_DAYS * DAY) return;

  s.lastAsked = now;
  await state.update(STATE_KEY, s);
  const choice = await vscode.window.showInformationMessage(
    'Is Tokalator useful? A quick answer helps shape the next update.',
    'Rate it',
    'Suggest an improvement',
    "Don't ask again",
  );
  await telemetry?.answer('useful-prompt', choice ?? 'dismissed');
  if (choice === 'Rate it') {
    await vscode.env.openExternal(vscode.Uri.parse(REVIEW_URL));
  } else if (choice === 'Suggest an improvement') {
    await askForImprovement(version, telemetry);
  } else if (choice === "Don't ask again") {
    await state.update(STATE_KEY, { ...s, optedOut: true });
  }
}

/** One fixed-choice question, asked once and only after telemetry consent. */
export async function maybeAskUseCase(state: vscode.Memento, telemetry: Telemetry): Promise<void> {
  if (!telemetry.enabled || state.get<boolean>(USE_CASE_KEY)) return;
  const pick = await vscode.window.showQuickPick(USE_CASES, {
    title: 'Tokalator: what do you mainly use it for?',
    placeHolder: 'One anonymous answer helps decide what to build next (Esc to skip)',
  });
  await state.update(USE_CASE_KEY, true);
  if (pick) await telemetry.answer('use-case', pick);
}
