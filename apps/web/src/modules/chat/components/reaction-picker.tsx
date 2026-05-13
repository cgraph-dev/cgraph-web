/**
 * ReactionPicker — emoji grid triggered from the message actions bar.
 */
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { LottieRenderer, AnimatedEmoji } from '@/lib/lottie';
import { getReactionAnimation } from '@/lib/chat/reactionUtils';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'] as const;

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: 'Smileys',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '🤣',
      '😂',
      '🙂',
      '😊',
      '😇',
      '🥰',
      '😍',
      '🤩',
      '😘',
      '😗',
      '😚',
      '😋',
      '😛',
      '😜',
      '🤪',
      '😝',
      '🤑',
      '🤗',
      '🤭',
      '🤫',
      '🤔',
      '🫡',
      '🤐',
      '🤨',
      '😐',
      '😑',
      '😶',
      '🫥',
      '😏',
      '😒',
      '🙄',
      '😬',
      '🫠',
      '😮‍💨',
    ],
  },
  {
    label: 'Gestures',
    emojis: [
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '🫱',
      '🫲',
      '👌',
      '🤌',
      '🤏',
      '✌️',
      '🤞',
      '🫰',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '👇',
      '☝️',
      '🫵',
      '👍',
      '👎',
      '✊',
      '👊',
      '🤛',
      '🤜',
      '👏',
      '🙌',
      '🫶',
      '🤝',
      '🙏',
      '💪',
      '🦾',
      '❤️',
      '🔥',
      '⭐',
      '💯',
      '✅',
    ],
  },
  {
    label: 'Objects',
    emojis: [
      '💡',
      '🎉',
      '🎊',
      '🥳',
      '🏆',
      '🎮',
      '🎯',
      '🎵',
      '🎶',
      '☕',
      '🍕',
      '🍔',
      '🌮',
      '🍿',
      '🧁',
      '🍩',
      '🧋',
      '🍷',
      '🍻',
      '🥂',
      '💻',
      '📱',
      '⌨️',
      '🖥️',
      '🔒',
      '🔑',
      '⚡',
      '💎',
      '🚀',
      '🌈',
    ],
  },
];

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
  className?: string;
}

/**
 * ReactionPicker — Discord-style emoji picker with quick-react row,
 * categories, and search.
 */
export function ReactionPicker({ onSelect, onClose, isOpen, className }: ReactionPickerProps) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (emoji: string) => {
      onSelect(emoji);
      onClose();
    };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[var(--z-popover,500)]" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
              'absolute bottom-full right-0 z-[var(--z-popover,500)] mb-2',
              'w-[320px] rounded-lg',
              'bg-[var(--token-bg-secondary)]/95 backdrop-blur-xl',
              'border border-[var(--token-border-muted)] shadow-2xl',
              'overflow-hidden',
              className
            )}
          >
            {/* Quick reactions row */}
            <div className="flex items-center justify-between border-b border-[var(--token-border-muted)] px-3 py-2">
              {QUICK_REACTIONS.map((emoji) => {
                const anim = getReactionAnimation(emoji);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelect(emoji)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition-transform hover:scale-125 hover:bg-[var(--token-card-bg)/0.6]"
                  >
                    {anim ? (
                      <LottieRenderer
                        codepoint={anim.codepoint}
                        emoji={emoji}
                        size={24}
                        playOnHover
                        fallbackSrc={anim.webp}
                      />
                    ) : (
                      emoji
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="border-b border-[var(--token-border-muted)] px-3 py-2">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search emoji..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="peer w-full rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] px-9 py-1.5 text-xs text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:border-primary-500/40 focus:bg-[var(--token-card-bg)/0.6] focus:outline-none focus:ring-4 focus:ring-primary-500/10"
                />
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
              </div>
            </div>

            {/* Emoji grid */}
            <div className="max-h-[240px] overflow-y-auto p-2">
              {EMOJI_CATEGORIES.map((cat) => {
                const filtered = search
                  ? cat.emojis.filter(() =>
                      // Simple: show all in a matching category, or none
                      cat.label.toLowerCase().includes(search.toLowerCase())
                    )
                  : cat.emojis;

                if (filtered.length === 0) return null;

                return (
                  <div key={cat.label} className="mb-2">
                    <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-white/30">
                      {cat.label}
                    </p>
                    <div className="grid grid-cols-8 gap-0.5">
                      {filtered.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleSelect(emoji)}
                          className="flex h-8 w-8 items-center justify-center rounded text-base transition-transform hover:scale-110 hover:bg-[var(--token-card-bg)/0.6]"
                        >
                          <AnimatedEmoji emoji={emoji} size={22} playOnHover />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* No results */}
              {search &&
                EMOJI_CATEGORIES.every(
                  (cat) => !cat.label.toLowerCase().includes(search.toLowerCase())
                ) && <p className="py-4 text-center text-xs text-white/30">No emojis found</p>}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ReactionPicker;
