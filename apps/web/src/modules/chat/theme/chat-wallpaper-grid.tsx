import type { ChatThemeWallpaperPreset } from '@cgraph-dev/shared-types/chat-theme';
import {
  CGRAPH_CHAT_WALLPAPERS,
  getCGraphChatWallpaper,
  getCGraphChatWallpaperStyle,
} from './cgraph-chat-wallpapers';

interface ChatWallpaperGridProps {
  readonly wallpaper?: ChatThemeWallpaperPreset;
  readonly onSelect: (wallpaper: ChatThemeWallpaperPreset) => void;
  readonly ariaLabel: string;
}

export function ChatWallpaperGrid({
  wallpaper,
  onSelect,
  ariaLabel,
}: ChatWallpaperGridProps) {
  const selectedWallpaperId = getCGraphChatWallpaper(wallpaper)?.id;

  return (
    <div
      className="aurora-section-card grid grid-cols-2 gap-3 rounded-xl p-4"
      role="group"
      aria-label={ariaLabel}
    >
      {CGRAPH_CHAT_WALLPAPERS.map((candidate) => {
        const selected = selectedWallpaperId === candidate.id;

        return (
          <button
            key={candidate.id}
            type="button"
            aria-label={candidate.label}
            aria-pressed={selected}
            title={candidate.label}
            className={`relative h-24 overflow-hidden rounded-md border p-3 text-left text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-white/80 ${
              selected
                ? 'border-white ring-2 ring-white/35'
                : 'border-white/15 hover:border-white/45'
            } ${candidate.wallpaper.dark ? 'text-white' : 'text-slate-950'}`}
            style={getCGraphChatWallpaperStyle(candidate.wallpaper)}
            onClick={() => onSelect(candidate.wallpaper)}
          >
            <span className="absolute inset-x-3 bottom-3 rounded bg-black/15 px-2 py-1 backdrop-blur-sm">
              {candidate.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
