export const CLAUDE_CODE_LIVE_MS = 30 * 60_000;

/**
 * The catalog model Claude Code is using, when it should become the active model:
 * the session is live and newer than the last model switch from any other source.
 */
export function claudeCodeModelToSync(
  session: { modelId: string | null; lastAt: string } | null,
  activeId: string,
  lastSwitchAt: number | undefined,
  now: number,
): string | null {
  if (!session?.modelId || session.modelId === activeId) { return null; }
  const at = Date.parse(session.lastAt);
  if (!(now - at < CLAUDE_CODE_LIVE_MS)) { return null; }
  if (lastSwitchAt !== undefined && lastSwitchAt > at) { return null; }
  return session.modelId;
}
