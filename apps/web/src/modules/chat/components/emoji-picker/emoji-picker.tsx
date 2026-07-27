import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

import { Button, IconButton } from '@/components/ui/button';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { cn } from '@/lib/utils';

import type { EmojiPickerProps, EmojiCategory } from './types';
import { useRecentEmojis, useFilteredEmojis, useAnimatedEmojiCatalog } from './useEmojiPicker';
import { EmojiSearch } from './emoji-search';
import { CategoryTabs } from './category-tabs';
import { EmojiGrid } from './emoji-grid';
import { springs } from '@/lib/animation-presets';

const PICKER_WIDTH = 320;
const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 8;

export function EmojiPicker({
  isOpen,
  onClose,
  onSelect,
  anchorRef,
  className,
}: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState<EmojiCategory>('Frequently Used');
  const [searchQuery, setSearchQuery] = useState('');
  const [animatedOnly, setAnimatedOnly] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [pickerPos, setPickerPos] = useState<{ bottom: number; left: number } | null>(null);

  const { addRecentEmoji } = useRecentEmojis();
  const filteredEmojis = useFilteredEmojis(searchQuery, activeCategory);
  const { catalog, loading } = useAnimatedEmojiCatalog(isOpen);

  const updatePickerPosition = useCallback(() => {
    const anchor = anchorRef?.current;
    if (!anchor) {
      setPickerPos(null);
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const availableWidth = Math.max(0, window.innerWidth - VIEWPORT_MARGIN * 2);
    const pickerWidth = Math.min(PICKER_WIDTH, availableWidth);
    const maximumLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - pickerWidth - VIEWPORT_MARGIN);

    setPickerPos({
      bottom: window.innerHeight - rect.top + TRIGGER_GAP,
      left: Math.min(Math.max(VIEWPORT_MARGIN, rect.right - pickerWidth), maximumLeft),
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;

    updatePickerPosition();
    window.addEventListener('resize', updatePickerPosition);
    window.addEventListener('scroll', updatePickerPosition, true);

    return () => {
      window.removeEventListener('resize', updatePickerPosition);
      window.removeEventListener('scroll', updatePickerPosition, true);
    };
  }, [isOpen, updatePickerPosition]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    HapticFeedback.light();
    addRecentEmoji(emoji);
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            aria-hidden="true"
          />
          <motion.div
            key="emoji-picker-panel"
            ref={pickerRef}
            role="dialog"
            aria-label="Emoji picker"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={springs.stiff}
            className={cn('fixed z-[9999]', className)}
            style={
              pickerPos
                ? { bottom: pickerPos.bottom, left: pickerPos.left }
                : { bottom: 96, left: VIEWPORT_MARGIN }
            }
          >
            <GlassCard className="w-[min(20rem,calc(100vw-1rem))] overflow-hidden p-0">
              <div className="flex min-h-12 items-center justify-between border-b border-[var(--token-border-muted)] px-3">
                <h2 className="text-sm font-semibold text-[var(--token-text-primary)]">Emoji</h2>
                <IconButton
                  icon={<X />}
                  label="Close emoji picker"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 flex-none"
                />
              </div>

              <EmojiSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />

              <div className="flex items-center justify-between border-b border-[var(--token-border-muted)] px-3 py-1">
                <Button
                  onClick={() => setAnimatedOnly(!animatedOnly)}
                  variant={animatedOnly ? 'secondary' : 'ghost'}
                  size="sm"
                  animated={false}
                  leftIcon={<Sparkles />}
                  aria-pressed={animatedOnly}
                  className="min-h-8 rounded-md border-transparent px-2 py-1 text-xs shadow-none"
                >
                  Animated
                </Button>
                {loading && (
                  <span
                    role="status"
                    aria-label="Loading animated emoji"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--token-interactive-primary)] border-t-transparent"
                  />
                )}
              </div>

              {!searchQuery && (
                <CategoryTabs
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                />
              )}

              <EmojiGrid
                emojis={filteredEmojis}
                onEmojiClick={handleEmojiClick}
                searchQuery={searchQuery}
                animatedCatalog={catalog}
                animatedOnly={animatedOnly}
              />
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
