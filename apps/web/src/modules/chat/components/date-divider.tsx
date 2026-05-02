/**
 * DateDivider — horizontal rule separating message days.
 */
import { cn } from '@/lib/utils';

interface DateDividerProps {
  /** ISO date string or display label */
  date: string | Date;
  /** Whether to use sticky positioning */
  sticky?: boolean;
  className?: string;
}

/**
 * DateDivider — centered label between horizontal lines,
 * styled as a subtle separator between day groups.
 */
export function DateDivider({ date, sticky = true, className }: DateDividerProps) {
  const label =
    typeof date === 'string' && !date.includes('T')
      ? date
      : formatDayLabel(typeof date === 'string' ? new Date(date) : date);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2',
        sticky && 'sticky top-0 z-[var(--z-sticky,10)]',
        className
      )}
      role="separator"
      aria-label={label}
    >
      <div className="h-px flex-1 bg-[var(--token-card-bg)/0.6]" />
      <span className="flex-shrink-0 select-none rounded-full bg-[var(--token-bg-secondary)] px-2 py-0.5 text-[11px] font-semibold text-white/40">
        {label}
      </span>
      <div className="h-px flex-1 bg-[var(--token-card-bg)/0.6]" />
    </div>
  );
}

function formatDayLabel(d: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - target.getTime();
  const dayMs = 86_400_000;

  if (diff < dayMs) return 'Today';
  if (diff < dayMs * 2) return 'Yesterday';

  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export default DateDivider;
