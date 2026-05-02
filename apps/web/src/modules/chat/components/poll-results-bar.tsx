/**
 * Animated progress bar for poll results.
 *
 * Renders a single option's vote count as an animated bar,
 * following Telegram's PollVotesAlert pattern for smooth
 * spring-based width transitions.
 */
import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface PollResultsBarProps {
  readonly text: string;
  readonly count: number;
  readonly totalVoters: number;
  readonly isSelected: boolean;
  readonly isCorrect?: boolean;
  readonly isQuiz: boolean;
}

/** Renders a single poll option result as an animated progress bar. */
function PollResultsBar(props: PollResultsBarProps): ReactNode {
  const percentage =
    props.totalVoters > 0 ? Math.round((props.count / props.totalVoters) * 100) : 0;

  const barColor = resolveBarColor(props.isQuiz, props.isCorrect, props.isSelected);

  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between">
        <span className={cn('text-sm', props.isSelected && 'font-medium')}>{props.text}</span>
        <span className="text-text-secondary text-xs">{percentage}%</span>
      </div>
      <div className="bg-surface-tertiary h-2 overflow-hidden rounded-full">
        <motion.div
          className={cn('h-full rounded-full', barColor)}
          initial={{ width: '0%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        />
      </div>
    </div>
  );
}

/** Determines the Tailwind background color class for a poll result bar. */
function resolveBarColor(
  isQuiz: boolean,
  isCorrect: boolean | undefined,
  isSelected: boolean
): string {
  if (isQuiz) {
    if (isCorrect) return 'bg-green-500';
    if (isSelected) return 'bg-red-500';
    return 'bg-surface-secondary';
  }
  return isSelected ? 'bg-primary' : 'bg-surface-secondary';
}

export { PollResultsBar };
