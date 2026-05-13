/**
 * Enhanced Appearance Settings Component
 *
 * Comprehensive theme customization panel with:
 * - Visual theme picker with 7 built-in themes
 * - Font scaling with live preview
 * - Message density options
 * - Accessibility settings
 *
 */

import { useThemeEnhanced } from '@/providers/theme-context-enhanced';

import { ThemeSelection } from './theme-selection';
import { DisplayOptions } from './display-options';
import { BackgroundEffects } from './background-effects';
import { Accessibility } from './accessibility';
import { LivePreview } from './live-preview';

// MAIN COMPONENT

/**
 */
/**
 * Appearance Settings Enhanced component.
 */
export function AppearanceSettingsEnhanced() {
  const {
    theme,
    preferences,
    availableThemes,
    isSystemPreference,
    setTheme,
    updateSettings,
    setFontScale,
    setMessageDisplay,
    setMessageSpacing,
    toggleReduceMotion,
    toggleHighContrast,
    toggleSystemPreference,
    deleteCustomTheme,
  } = useThemeEnhanced();

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-2xl font-bold text-[var(--token-text-primary)]">Appearance</h1>
        <p className="text-[var(--token-text-secondary)]">
          Customize how CGraph looks and feels. Changes are saved automatically.
        </p>
      </div>

      {/* Theme Selection */}
      <ThemeSelection
        theme={theme}
        availableThemes={availableThemes}
        isSystemPreference={isSystemPreference}
        setTheme={setTheme}
        toggleSystemPreference={toggleSystemPreference}
        deleteCustomTheme={deleteCustomTheme}
      />

      {/* Display Options */}
      <DisplayOptions
        fontScale={preferences.settings.fontScale}
        messageSpacing={preferences.settings.messageSpacing}
        messageDisplay={preferences.settings.messageDisplay}
        setFontScale={setFontScale}
        setMessageSpacing={setMessageSpacing}
        setMessageDisplay={setMessageDisplay}
      />

      {/* Background Effects */}
      <BackgroundEffects
        backgroundEffect={preferences.settings.backgroundEffect}
        shaderVariant={preferences.settings.shaderVariant}
        backgroundIntensity={preferences.settings.backgroundIntensity || 0.6}
        updateSettings={updateSettings}
      />

      {/* Accessibility */}
      <Accessibility
        reduceMotion={preferences.settings.reduceMotion}
        highContrast={preferences.settings.highContrast}
        toggleReduceMotion={toggleReduceMotion}
        toggleHighContrast={toggleHighContrast}
      />

      {/* Live Preview */}
      <LivePreview
        theme={theme}
        fontScale={preferences.settings.fontScale}
        messageSpacing={preferences.settings.messageSpacing}
      />
    </div>
  );
}

export default AppearanceSettingsEnhanced;
