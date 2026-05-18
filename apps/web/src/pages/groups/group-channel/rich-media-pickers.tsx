import { lazy, Suspense } from 'react';
import type { GifResult } from '@/modules/chat/components/gif-picker';
import type { StickerSelection } from './types';

const EmojiPicker = lazy(() =>
  import('@/modules/chat/components/emoji-picker').then((m) => ({
    default: m.EmojiPicker,
  }))
);
const GifPicker = lazy(() =>
  import('@/modules/chat/components/gif-picker').then((m) => ({ default: m.GifPicker }))
);

const STICKERS: readonly StickerSelection[] = [
  { id: 'wave', packId: 'cgraph-default', label: 'Wave', emoji: '\u{1F44B}' },
  { id: 'thumbs-up', packId: 'cgraph-default', label: 'Thumbs up', emoji: '\u{1F44D}' },
  { id: 'fire', packId: 'cgraph-default', label: 'Fire', emoji: '\u{1F525}' },
  { id: 'party', packId: 'cgraph-default', label: 'Party', emoji: '\u{1F389}' },
  { id: 'heart', packId: 'cgraph-default', label: 'Heart', emoji: '\u{1F49C}' },
  { id: 'sparkles', packId: 'cgraph-default', label: 'Sparkles', emoji: '\u2728' },
];

interface RichMediaPickersProps {
  showEmojiPicker: boolean;
  showGifPicker: boolean;
  showStickerPicker: boolean;
  onEmojiClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  onGifClose: () => void;
  onGifSelect: (gif: GifResult) => void;
  onStickerSelect: (sticker: StickerSelection) => void;
}

/** Renders the popover pickers for emoji, GIF, and sticker sends in group channels. */
export function RichMediaPickers({
  showEmojiPicker,
  showGifPicker,
  showStickerPicker,
  onEmojiClose,
  onEmojiSelect,
  onGifClose,
  onGifSelect,
  onStickerSelect,
}: RichMediaPickersProps) {
  return (
    <>
      <Suspense fallback={null}>
        {showEmojiPicker && (
          <div className="fixed bottom-24 left-36 z-50">
            <EmojiPicker isOpen={showEmojiPicker} onClose={onEmojiClose} onSelect={onEmojiSelect} />
          </div>
        )}

        {showGifPicker && (
          <div className="fixed bottom-24 left-36 z-50">
            <GifPicker
              isOpen={showGifPicker}
              onClose={onGifClose}
              onSelect={onGifSelect}
              className="relative"
            />
          </div>
        )}
      </Suspense>

      {showStickerPicker && (
        <div
          role="menu"
          aria-label="Sticker picker"
          className="bg-[var(--token-card-bg)]/95 fixed bottom-24 left-36 z-50 grid w-64 grid-cols-3 gap-2 rounded-xl border border-[var(--token-card-border)] p-3 shadow-2xl backdrop-blur-xl"
        >
          {STICKERS.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              role="menuitem"
              onClick={() => onStickerSelect(sticker)}
              className="rounded-lg border border-white/10 bg-white/[0.06] p-3 text-2xl transition-colors hover:bg-white/[0.12] focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label={`Send sticker ${sticker.label}`}
              title={sticker.label}
            >
              {sticker.emoji}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
