import { type ReactNode } from 'react';
import { motion } from 'motion/react';

interface PinLockedNoticeProps {
  readonly timeRemaining: number;
  readonly onCreateNewPin: () => void;
  readonly onLearnMore: () => void;
}

/**
 * Lockout notice shown when user exhausts PIN attempts.
 *
 * Mirrors Signal's PinRestoreLockedFragment: shows lockout duration,
 * offers "Create New PIN" (resets account data) and "Learn More" buttons.
 */
function PinLockedNotice({
  timeRemaining,
  onCreateNewPin,
  onLearnMore,
}: PinLockedNoticeProps): ReactNode {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto flex max-w-sm flex-col items-center gap-6 p-6 text-center"
    >
      <div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="text-destructive h-8 w-8"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <h2 className="text-xl font-semibold">Account Locked</h2>

      <p className="text-muted-foreground text-sm">
        Too many incorrect PIN attempts. You can try again in{' '}
        <strong>{formatDuration(timeRemaining)}</strong>.
      </p>

      <p className="text-muted-foreground text-xs">
        If you forgot your PIN, you can create a new one. This will reset your account data.
      </p>

      <button
        onClick={onCreateNewPin}
        className="text-primary-foreground w-full rounded-lg bg-primary py-3 font-medium"
      >
        Create New PIN
      </button>

      <button
        onClick={onLearnMore}
        className="text-muted-foreground text-sm underline"
        type="button"
      >
        Learn more about PINs
      </button>
    </motion.div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds >= 86400) return `${Math.ceil(seconds / 86400)} day(s)`;
  if (seconds >= 3600) return `${Math.ceil(seconds / 3600)} hour(s)`;
  if (seconds >= 60) return `${Math.ceil(seconds / 60)} minute(s)`;
  return `${seconds} seconds`;
}

export { PinLockedNotice };
