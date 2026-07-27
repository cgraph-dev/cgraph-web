/**
 * Category tabs component for emoji picker
 */

import { HapticFeedback } from '@/lib/animations/animation-engine';
import { Button } from '@/components/ui/button';

import { EMOJI_CATEGORIES } from './emojiData';
import type { EmojiCategory } from './types';

interface CategoryTabsProps {
  activeCategory: EmojiCategory;
  onCategoryChange: (category: EmojiCategory) => void;
}

function getEmojiCategoryKeys(obj: Record<EmojiCategory, string[]>): EmojiCategory[] {
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
        <Button
          key={category}
          role="tab"
          aria-selected={activeCategory === category}
          variant={activeCategory === category ? 'secondary' : 'ghost'}
          size="sm"
          animated={false}
          onClick={() => {
            onCategoryChange(category);
            HapticFeedback.light();
          }}
          className="min-h-8 whitespace-nowrap rounded-md border-transparent px-3 py-1.5 text-xs shadow-none"
        >
          {category}
        </Button>
      ))}
    </div>
  );
}
