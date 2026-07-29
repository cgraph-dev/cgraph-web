import type { LucideIcon } from 'lucide-react';
import { Gem, HeartPulse, Sparkles, TrendingUp, Waves } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeedMode } from '../store/discoveryStore';

const MODES: ReadonlyArray<{
  readonly key: FeedMode;
  readonly label: string;
  readonly icon: LucideIcon;
}> = [
  { key: 'pulse', label: 'Pulse', icon: HeartPulse },
  { key: 'fresh', label: 'Fresh', icon: Sparkles },
  { key: 'rising', label: 'Rising', icon: TrendingUp },
  { key: 'deep_cut', label: 'Deep Cut', icon: Gem },
  { key: 'frequency_surf', label: 'Frequency Surf', icon: Waves },
];

interface FeedModeTabsProps {
  readonly activeMode: FeedMode;
  readonly onModeChange: (mode: FeedMode) => void;
  readonly className?: string;
}

export function FeedModeTabs({ activeMode, onModeChange, className }: FeedModeTabsProps) {
  return (
    <div
      className={cn('cgraph-segmented scrollbar-hide max-w-full overflow-x-auto', className)}
      role="group"
      aria-label="Feed mode"
    >
      {MODES.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onModeChange(key)}
          className="cgraph-segmented-item flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 text-sm font-medium"
          aria-pressed={activeMode === key}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

export default FeedModeTabs;
