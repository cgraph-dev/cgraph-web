import { useState, useEffect } from 'react';

interface DripCountdownProps {
  readonly unlockAt: string;
  readonly sectionIndex: number;
}

/** Countdown card for locked drip content sections. */
export default function DripCountdown({ unlockAt, sectionIndex }: DripCountdownProps) {
  const [remaining, setRemaining] = useState(() => computeRemaining(unlockAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(computeRemaining(unlockAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [unlockAt]);

  if (remaining.total <= 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-dashed border-yellow-400 bg-yellow-50 p-4 dark:bg-yellow-900/10">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-200 text-sm font-bold text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
          {sectionIndex + 1}
        </div>
        <div>
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Section {sectionIndex + 1} — Locked
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            Unlocks in {formatCountdown(remaining)}
          </p>
        </div>
      </div>
    </div>
  );
}
interface TimeRemaining {
  readonly total: number;
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
}

function computeRemaining(isoDate: string): TimeRemaining {
  const total = Math.max(0, new Date(isoDate).getTime() - Date.now());
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { total, days, hours, minutes, seconds };
}

function formatCountdown(r: TimeRemaining): string {
  const parts: string[] = [];
  if (r.days > 0) parts.push(`${r.days}d`);
  if (r.hours > 0) parts.push(`${r.hours}h`);
  if (r.minutes > 0) parts.push(`${r.minutes}m`);
  parts.push(`${r.seconds}s`);
  return parts.join(' ');
}
