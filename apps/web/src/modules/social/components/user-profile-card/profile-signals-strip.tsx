import { memo } from 'react';
import { Activity, Flame, Newspaper, Users } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ProfileSignalsStripProps {
  readonly pulse: number;
  readonly streak: number;
  readonly postCount?: number;
  readonly friendCount?: number;
  readonly accentColor: string;
  readonly compact?: boolean;
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(Math.max(0, value));
}

export const ProfileSignalsStrip = memo(function ProfileSignalsStrip({
  pulse,
  streak,
  postCount = 0,
  friendCount = 0,
  accentColor,
  compact,
}: ProfileSignalsStripProps) {
  const metrics = [
    { id: 'pulse', label: 'Pulse', value: pulse, icon: Activity },
    { id: 'streak', label: 'Streak', value: streak, icon: Flame },
    { id: 'posts', label: 'Posts', value: postCount, icon: Newspaper },
    { id: 'network', label: 'Network', value: friendCount, icon: Users },
  ];

  return (
    <div className={cn('px-[1.1rem]', compact ? 'pt-2' : 'pt-[0.55rem]')}>
      <div
        className={cn(
          'grid gap-1.5 rounded-[16px] border p-1.5',
          compact ? 'grid-cols-4' : 'grid-cols-4'
        )}
        style={{
          borderColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
          background: `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 7%, transparent), rgba(255,255,255,0.018))`,
        }}
      >
        {metrics.map(({ id, label, value, icon: Icon }) => (
          <div
            key={id}
            className="flex min-w-0 flex-col items-center justify-center rounded-[12px] px-1.5 py-2"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.035), transparent)',
            }}
          >
            <Icon
              aria-hidden="true"
              className={cn('mb-1 shrink-0', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')}
              style={{ color: `color-mix(in srgb, ${accentColor} 68%, #edf0f8 32%)` }}
            />
            <span
              className={cn('font-bold leading-none text-[#edf0f8]', compact ? 'text-[11px]' : 'text-xs')}
              style={{ fontFamily: "'Inter', system-ui" }}
            >
              {formatCompactNumber(value)}
            </span>
            <span
              className={cn('mt-1 truncate leading-none text-[#65738d]', compact ? 'text-[8px]' : 'text-[9px]')}
              style={{ fontFamily: "'Inter', system-ui" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
