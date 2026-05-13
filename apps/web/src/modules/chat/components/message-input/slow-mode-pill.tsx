/**
 * SlowModePill — inline countdown surfaced below the composer when a
 * channel has slow mode enabled and the local user is mid-cooldown.
 *
 * Discord parity: small pill, "Slow mode: send again in 27s".
 */

import { motion } from 'motion/react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { getReducedMotion } from '@/lib/animations/transitions/helpers';

interface SlowModePillProps {
  readonly remainingSeconds: number;
  readonly className?: string;
}

const ENTER_TRANSITION_MS = 120;

function formatRemaining(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (remainder === 0) return `${minutes}m`;
  return `${minutes}m ${remainder}s`;
}

/** Small inline pill that announces the remaining slow-mode cooldown. */
export function SlowModePill({ remainingSeconds, className = '' }: SlowModePillProps) {
  if (remainingSeconds <= 0) return null;

  const reducedMotion = getReducedMotion();
  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: ENTER_TRANSITION_MS / 1000, ease: 'easeOut' as const };

  return (
    <motion.div
      data-testid="slow-mode-pill"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={transition}
      className={`bg-[var(--token-card-bg)]/70 mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-[var(--token-text-muted)] backdrop-blur-sm ${className}`}
    >
      <ClockIcon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>Slow mode: send again in {formatRemaining(remainingSeconds)}</span>
    </motion.div>
  );
}
