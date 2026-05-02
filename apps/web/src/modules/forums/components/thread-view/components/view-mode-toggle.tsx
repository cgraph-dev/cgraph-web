
import { ListBulletIcon, Bars3BottomLeftIcon } from '@heroicons/react/24/outline';
import type { CommentViewMode } from '../types';

interface ViewModeToggleProps {
  viewMode: CommentViewMode;
  onViewModeChange: (mode: CommentViewMode) => void;
}

export function ViewModeToggle({ viewMode, onViewModeChange }: ViewModeToggleProps) {
  return (
    <div className="flex rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-0.5">
      <button
        onClick={() => onViewModeChange('linear')}
        className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
          viewMode === 'linear' ? 'bg-[var(--token-card-bg)] text-white' : 'text-gray-400 hover:text-white'
        }`}
        title="Linear view - comments in order"
      >
        <ListBulletIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Linear</span>
      </button>
      <button
        onClick={() => onViewModeChange('threaded')}
        className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
          viewMode === 'threaded' ? 'bg-[var(--token-card-bg)] text-white' : 'text-gray-400 hover:text-white'
        }`}
        title="Threaded view - nested replies"
      >
        <Bars3BottomLeftIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Threaded</span>
      </button>
    </div>
  );
}
