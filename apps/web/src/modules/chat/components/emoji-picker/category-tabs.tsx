/**
 * Category tabs component for emoji picker
 */

import { HapticFeedback } from '@/lib/animations/animation-engine';

import { EMOJI_CATEGORIES } from './emojiData';
import type { EmojiCategory } from './types';

interface CategoryTabsProps {
  activeCategory: EmojiCategory;
  onCategoryChange: (category: EmojiCategory) => void;
}

/**
 */
/**
 * Category Tabs component.
 */
function getEmojiCategoryKeys(obj: Record<EmojiCategory, string[]>): EmojiCategory[] {
  // Object.keys returns string[], but since EMOJI_CATEGORIES is typed as
  // Record<EmojiCategory, string[]>, the keys are always EmojiCategory values.
  // We validate each key at runtime to narrow the type safely.
  const ALL_CATEGORIES: ReadonlySet<string> = new Set<string>([
    'Frequently Used',
    'Smileys & People',
    'Gestures',
    'Hearts & Love',
    'Animals & Nature',
    'Food & Drink',
    'Activities',
    'Travel & Places',
    'Objects',
    'Symbols',
    'Flags',
  ]);
  return Object.keys(obj).filter((key): key is EmojiCategory => ALL_CATEGORIES.has(key));
}

/** Horizontal tab bar for selecting emoji categories. */
export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  const categories = getEmojiCategoryKeys(EMOJI_CATEGORIES);

  return (
    <div
      role="tablist"
      aria-label="Emoji categories"
      className="scrollbar-thin scrollbar-thumb-gray-700 flex gap-1 overflow-x-auto border-b border-[var(--token-card-border)] p-2"
    >
      {categories.map((category) => (
        <button
          key={category}
          role="tab"
          aria-selected={activeCategory === category}
          onClick={() => {
            onCategoryChange(category);
            HapticFeedback.light();
          }}
          className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            activeCategory === category
              ? 'bg-primary-500/20 text-primary-400'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
