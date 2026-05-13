/**
 * Theme customization settings page.
 *
 * Two sections:
 *   - App theme — the 4 core shells (aurora / dark / light / bubble).
 *   - Profile theme — cosmetic presets for profile cards.
 */

import { useThemeCustomization } from './hooks';
import { SearchBar } from './search-bar';
import { ProfileThemePicker } from './profile-theme-picker';
import { SaveButton } from '@/modules/settings/components/customize/ui/save-button';
import { ThemePicker } from '@/components/theme-picker/theme-picker';

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
      <section aria-labelledby="app-theme-heading" className="space-y-3">
        <div>
          <h2
            id="app-theme-heading"
            className="text-lg font-semibold text-[var(--token-text-primary)]"
          >
            App theme
          </h2>
          <p className="text-sm text-[var(--token-text-secondary)]">
            The overall look of CGraph. Changes apply instantly across every page.
          </p>
        </div>
        <ThemePicker placement="settings" />
      </section>

      <section aria-labelledby="profile-theme-heading" className="space-y-3">
        <div>
          <h2
            id="profile-theme-heading"
            className="text-lg font-semibold text-[var(--token-text-primary)]"
          >
            Profile theme
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
          label="Save Theme Settings"
        />
      </section>
    </div>
  );
}
