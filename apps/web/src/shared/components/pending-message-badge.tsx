/**
 * Pending Message Badge
 *
 * Shows a clock icon on messages that are queued for sending (offline).
 * Used inline next to messages in the conversation view.
 *
 */

import { ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface PendingMessageBadgeProps {
  readonly status: 'pending' | 'sending' | 'failed';
}

/** Pending Message Badge. */
export function PendingMessageBadge({ status }: PendingMessageBadgeProps) {
  if (status === 'failed') {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-red-400"
        title="Failed to send. Will retry on reconnect."
      >
        <ExclamationCircleIcon className="h-3.5 w-3.5" />
        <span>Failed</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-zinc-500"
      title={status === 'sending' ? 'Sending...' : 'Queued — will send when online'}
    >
      <ClockIcon className={`h-3.5 w-3.5 ${status === 'sending' ? 'animate-spin' : ''}`} />
      <span>{status === 'sending' ? 'Sending...' : 'Queued'}</span>
    </span>
  );
}
