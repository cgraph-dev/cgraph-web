/**
 * TierBadge — small icon rendered next to a conversation name to indicate
 * its encryption tier (see ADR-022 and the Cloud Chat Tier plan).
 *
 * - `secret` conversations are post-quantum E2EE (mobile + desktop only).
 * - `cloud` conversations are server-readable (AES-256-GCM + KMS) and work
 *   on every device, including the web.
 *
 * The component renders an accessible icon only — no tooltip wiring. The
 * `aria-label` is the single source of truth for screen readers and e2e
 * assertions.
 */
import type { ReactNode } from 'react';
import { LockClosedIcon, CloudIcon } from '@heroicons/react/24/outline';

const SECRET_LABEL = 'Secret Chat — end-to-end encrypted on mobile and desktop';
const CLOUD_LABEL = 'Cloud Chat — works on every device';

interface TierBadgeProps {
  readonly type: 'secret' | 'cloud';
  readonly className?: string;
}

/**
 * Renders the icon that identifies the encryption tier of a conversation.
 *
 * @param props.type Which tier the conversation belongs to (`secret` or `cloud`).
 * @param props.className Optional extra Tailwind classes merged onto the icon.
 */
export function TierBadge({ type, className }: TierBadgeProps): ReactNode {
  const baseClass = 'w-4 h-4 text-foreground-muted';
  const mergedClass = className ? `${baseClass} ${className}` : baseClass;

  if (type === 'secret') {
    return <LockClosedIcon aria-label={SECRET_LABEL} className={mergedClass} />;
  }

  return <CloudIcon aria-label={CLOUD_LABEL} className={mergedClass} />;
}
