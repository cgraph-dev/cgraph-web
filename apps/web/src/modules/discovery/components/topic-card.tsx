/**
 * Topic Card — Selectable topic card for the frequency picker
 *
 */

import { cn } from '@/lib/utils';
import type { Topic } from '../hooks/useFrequencies';

interface TopicCardProps {
  topic: Topic;
  selected: boolean;
  onToggle: (topicId: string) => void;
  className?: string;
}

/** Topic Card component. */
export function TopicCard({ topic, selected, onToggle, className }: TopicCardProps) {
  return (
    <button
      onClick={() => onToggle(topic.id)}
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
        selected
          ? 'border-indigo-500/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
          : 'hover:bg-white/8 border-[var(--token-border-muted)] bg-white/5 hover:border-white/20',
        className
      )}
    >
      <span className="text-2xl">{topic.icon}</span>
      <span className={cn('text-sm font-medium', selected ? 'text-white' : 'text-white/60')}>
        {topic.name}
      </span>
    </button>
  );
}

export default TopicCard;
