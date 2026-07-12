/**
 * Theme customization settings page.
 *
 * Profile theme cosmetics only. App-wide appearance lives in Settings.
 */

import { useThemeCustomization } from './hooks';
import { SearchBar } from './search-bar';
import { ProfileThemePicker } from './profile-theme-picker';
import { SaveButton } from '@/modules/settings/components/customize/ui/save-button';
import { ThemePanel } from '@/modules/settings/components/customize';

/**
 * Theme customization page component.
 */
export default function ThemeCustomization() {
  const {
    searchQuery,
    setSearchQuery,
    profileThemeCategory,
    setProfileThemeCategory,
    selectedThemes,
    isSaving,
    error,
    filteredNewProfileThemes,
    handleSaveThemes,
    handleApplyProfileTheme,
  } = useThemeCustomization();

  return (
    <div className="space-y-8">
      <ThemePanel />

      <section aria-labelledby="profile-theme-heading" className="space-y-3">
        <div>
          <h2
            id="profile-theme-heading"
            className="text-lg font-semibold text-[var(--token-text-primary)]"
          >
            Profile themes
          </h2>
          <p className="text-sm text-[var(--token-text-secondary)]">
            Cosmetic presets for your profile card.
          </p>
        </div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        <ProfileThemePicker
          profileThemeCategory={profileThemeCategory}
          onCategoryChange={setProfileThemeCategory}
          filteredThemes={filteredNewProfileThemes}
          selectedProfileThemeId={selectedThemes.profile}
          onApplyTheme={handleApplyProfileTheme}
        />

        <SaveButton
          onSave={handleSaveThemes}
          isSaving={isSaving}
          error={error}
          label="Save Profile Theme"
        />
      </section>
    </div>
  );
}
