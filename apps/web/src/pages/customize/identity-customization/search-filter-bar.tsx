/**
 * SearchFilterBar – search input + rarity dropdown for IdentityCustomization.
 */

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Select from '@/components/ui/select';
import type { Rarity } from './types';
import { RARITIES } from './constants';
import type { SectionId } from './useIdentityCustomization';
import { BORDER_THEMES, type BorderTheme } from '@/data/avatar-borders';

function getOptionValue<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  value: string
): T | null {
  const match = options.find((option) => option.value === value);
  return match?.value ?? null;
}

interface SearchFilterBarProps {
  activeSection: SectionId;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedRarity: Rarity | 'all';
  onRarityChange: (value: Rarity | 'all') => void;
  selectedTheme?: BorderTheme | 'all';
  onThemeChange?: (value: BorderTheme | 'all') => void;
}

/**
 * Search Filter Bar component with premium styling.
 */
export function SearchFilterBar({
  activeSection,
  searchQuery,
  onSearchChange,
  selectedRarity,
  onRarityChange,
  selectedTheme,
  onThemeChange,
}: SearchFilterBarProps) {
  // If no controls would be rendered, return null
  const showSearch = activeSection === 'borders';
  const showTheme = activeSection === 'borders' && onThemeChange;
  const showRarity = activeSection === 'borders' || activeSection === 'badges';

  if (!showSearch && !showTheme && !showRarity) {
    return null;
  }

  const themeOptions: Array<{ value: BorderTheme | 'all'; label: string; icon?: string }> = [
    { value: 'all', label: 'All Themes', icon: '✨' },
    ...BORDER_THEMES.map((theme) => ({ value: theme.id, label: theme.name, icon: theme.icon })),
  ];

  const rarityOptions: Array<{ value: Rarity | 'all'; label: string }> = [
    { value: 'all', label: 'All Rarities' },
    ...RARITIES.map((rarity) => ({ value: rarity.value, label: rarity.label })),
  ];

  return (
    <div className="flex gap-4">
      {showSearch && (
        <div className="relative flex-1 group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search ${activeSection}...`}
            className="aurora-social-search peer w-full rounded-xl py-3 pl-11 pr-4 text-sm text-white backdrop-blur-2xl transition-all duration-300 focus:outline-none"
          />
          <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-primary-500/8 via-violet-500/6 to-primary-400/8 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />
          <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-all duration-300 peer-focus:text-primary-300" />
        </div>
      )}

      {showTheme && (
        <div className="w-52">
          <Select
            options={themeOptions}
            value={selectedTheme || 'all'}
            onChange={(value) => {
              const nextValue = getOptionValue(themeOptions, value);
              if (nextValue) {
                onThemeChange(nextValue);
              }
            }}
            className="transition-all duration-300"
          />
        </div>
      )}

      {showRarity && (
        <div className="w-52">
          <Select
            options={rarityOptions}
            value={selectedRarity}
            onChange={(value) => {
              const nextValue = getOptionValue(rarityOptions, value);
              if (nextValue) {
                onRarityChange(nextValue);
              }
            }}
            className="transition-all duration-300"
          />
        </div>
      )}
    </div>
  );
}
