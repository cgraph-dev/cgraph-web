/**
 * ProfileThemePicker component for profile theme selection
 */

import { motion } from 'motion/react';
import {
  ALL_PROFILE_THEMES,
  PROFILE_THEME_CATEGORIES,
  type ProfileThemeConfig,
  type ProfileThemeCategory,
  type ProfileThemeId,
} from '@/data/profileThemes';
import ProfileThemeCard, {
  ProfileThemeGrid,
} from '@/modules/settings/components/customize/profile-theme-card';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';

interface ProfileThemePickerProps {
  profileThemeCategory: ProfileThemeCategory | 'all';
  onCategoryChange: (category: ProfileThemeCategory | 'all') => void;
  filteredThemes: readonly ProfileThemeConfig[];
  selectedProfileThemeId: ProfileThemeId;
  onApplyTheme: (theme: ProfileThemeConfig) => void;
}

/**
 * Profile Theme Picker — single unified theme selector.
 */
export function ProfileThemePicker({
  profileThemeCategory,
  onCategoryChange,
  filteredThemes,
  selectedProfileThemeId,
  onApplyTheme,
}: ProfileThemePickerProps) {
  return (
    <>
      {/* Subcategory Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/65">Profile Themes</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange('all')}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-300 ${
              profileThemeCategory === 'all'
                ? 'aurora-social-button border-primary-400/30 bg-gradient-to-r from-primary-500/70 via-violet-500/60 to-primary-400/45 text-white shadow-[0_12px_30px_rgba(76,29,149,0.35)]'
                : 'aurora-social-button-muted text-white/65 hover:text-white'
            }`}
          >
            All ({ALL_PROFILE_THEMES.length})
          </button>
          {PROFILE_THEME_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-300 ${
                profileThemeCategory === cat.id
                  ? 'aurora-social-button border-primary-400/30 bg-gradient-to-r from-primary-500/70 via-violet-500/60 to-primary-400/45 text-white shadow-[0_12px_30px_rgba(76,29,149,0.35)]'
                  : 'aurora-social-button-muted text-white/65 hover:text-white'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Theme Grid */}
      <motion.div
        key="profile-themes"
        {...FADE_UP}
        exit={{ opacity: 0, y: -20 }}
        transition={tweens.fast}
      >
        <ProfileThemeGrid>
          {filteredThemes.map((theme) => (
            <ProfileThemeCard
              key={theme.id}
              theme={theme}
              isSelected={selectedProfileThemeId === theme.id}
              onSelect={() => onApplyTheme(theme)}
            />
          ))}
        </ProfileThemeGrid>

        {filteredThemes.length === 0 && (
          <div className="py-12 text-center text-[var(--token-text-muted)]">
            No themes found matching your search.
          </div>
        )}
      </motion.div>
    </>
  );
}
