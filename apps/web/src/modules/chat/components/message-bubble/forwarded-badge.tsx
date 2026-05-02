/**
 * Forwarded Badge — italic header rendered above a forwarded message.
 * Mirrors Telegram's "Forwarded from X" attribution and Signal's
 * `forwarded` banner styling.
 */

import type { ReactNode } from 'react';

const UNKNOWN_SENDER_LABEL = 'a user';

export interface ForwardedBadgeProps {
  readonly forwardedFromUserName: string | null;
  readonly isOwn: boolean;
}

/**
 * Italic "Forwarded from {name}" header rendered above a forwarded
 * message body. Falls back to "a user" when the original sender name
 * is unknown.
 */
export function ForwardedBadge({ forwardedFromUserName, isOwn }: ForwardedBadgeProps): ReactNode {
  const displayName = forwardedFromUserName?.trim() || UNKNOWN_SENDER_LABEL;

  return (
    <div
      className={`mb-1 flex items-center gap-1 px-1 text-xs text-[var(--token-text-muted)] dark:text-gray-400 ${isOwn ? 'justify-end' : ''}`}
      data-testid="forwarded-badge"
    >
      <span aria-hidden="true">↪</span>
      <span className="italic">Forwarded from {displayName}</span>
    </div>
  );
}

export default ForwardedBadge;
