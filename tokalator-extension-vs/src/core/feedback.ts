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

const SURVEY_KEY = 'tokalator.feedback.survey';

/** Fixed-choice questions only, so no free text (and no personal data) can be sent. */
export const SURVEY: { id: string; title: string; options: string[]; many?: boolean }[] = [
  { id: 'role', title: 'What best describes you?', options: ['Developer', 'Team lead or manager', 'Researcher', 'Student', 'Other'] },
  { id: 'team-size', title: 'How many developers are on your team?', options: ['Just me', '2 to 10', '11 to 50', 'More than 50'] },
  { id: 'agents', title: 'Which coding agents do you use? (pick all that apply)', options: ['Claude Code', 'GitHub Copilot', 'Codex', 'Cursor', 'OpenCode', 'Other'], many: true },
  { id: 'billing', title: 'How do you pay for AI coding?', options: ['API, pay per token', 'Personal subscription', 'My company pays', 'Free tier', 'Not sure'] },
  { id: 'pain', title: 'What is the hardest part today?', options: ['Unexpected cost', 'Running out of context', 'Choosing the right model', 'Keeping secrets away from agents', 'Something else'] },
  { id: 'team-insights', title: 'Would your team use opt-in, anonymous team usage insights?', options: ['Yes', 'Maybe', 'No'] },
];

/** Runs the survey; every question can be skipped with Esc. Answers are sent only with telemetry consent. */
export async function runSurvey(state: vscode.Memento, telemetry: Telemetry): Promise<number> {
  if (!telemetry.enabled) {
    const turnOn = await vscode.window.showInformationMessage(
      'The Tokalator survey sends anonymous, fixed-choice answers. It needs telemetry consent, which is off.',
      'Turn on telemetry',
      'Cancel',
    );
    if (turnOn !== 'Turn on telemetry') return 0;
    await vscode.workspace.getConfiguration('tokalator').update('telemetry.enabled', true, vscode.ConfigurationTarget.Global);
    if (!telemetry.enabled) {
      void vscode.window.showWarningMessage('VS Code telemetry is off, so Tokalator cannot send answers. Nothing was sent.');
      return 0;
    }
  }
  let answered = 0;
  for (const [i, q] of SURVEY.entries()) {
    const title = `Tokalator survey ${i + 1}/${SURVEY.length}: ${q.title}`;
    const picked = q.many
      ? await vscode.window.showQuickPick(q.options, { title, canPickMany: true, placeHolder: 'Space to select, Enter to continue, Esc to stop' })
      : await vscode.window.showQuickPick(q.options, { title, placeHolder: 'Enter to continue, Esc to stop' });
    if (!picked || (Array.isArray(picked) && !picked.length)) break;
    await telemetry.answer(`survey-${q.id}`, Array.isArray(picked) ? picked.join(', ') : picked);
    answered++;
  }
  await state.update(SURVEY_KEY, true);
  if (answered) void vscode.window.showInformationMessage(`Thank you. ${answered} anonymous answer${answered === 1 ? '' : 's'} sent.`);
  return answered;
}

/** Offers the survey once, only to people who already consented to telemetry and have used the extension for a while. */
export async function maybeOfferSurvey(state: vscode.Memento, telemetry: Telemetry): Promise<void> {
  const s = state.get<FeedbackState>(STATE_KEY);
  if (!telemetry.enabled || state.get<boolean>(SURVEY_KEY) || !s || s.sessions < MIN_SESSIONS + 2) return;
  const choice = await vscode.window.showInformationMessage('Help shape Tokalator: 6 quick, anonymous questions (about a minute).', 'Start', 'Not now', "Don't ask again");
  if (choice === 'Start') await runSurvey(state, telemetry);
  else if (choice === "Don't ask again") await state.update(SURVEY_KEY, true);
}
