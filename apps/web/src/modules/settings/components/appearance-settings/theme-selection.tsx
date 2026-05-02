/**
 * Theme Selection Section
 *
 * Theme picker with categorized theme cards.
 */

import { useMemo} from 'react';
import {
  PaintBrushIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon} from '@heroicons/react/24/outline';

import type { Theme } from '@/lib/theme/theme-engine';
import type { ThemeGroups } from './types';
import { SectionHeader } from './section-header';
import { Toggle } from './toggle';
import { ThemeCard } from './theme-card';

// TYPES

interface ThemeSelectionProps {
  /** Currently active theme */
  theme: Theme;
  /** All available themes */
  availableThemes: Theme[];
  /** Whether using system preference */
  isSystemPreference: boolean;
  /** Callback to set theme */
  setTheme: (themeId: string) => void;
  /** Callback to toggle system preference */
  toggleSystemPreference: () => void;
  /** Callback to delete custom theme */
  deleteCustomTheme: (themeId: string) => void;
}

// COMPONENT

export function ThemeSelection({
  theme,
  availableThemes,
  isSystemPreference,
  setTheme,
  toggleSystemPreference,
  deleteCustomTheme,
}: ThemeSelectionProps) {
  // Group themes by category
  const themeGroups = useMemo<ThemeGroups>(() => {
    const groups: ThemeGroups = {
      dark: [],
      light: [],
      custom: [],
    };

    availableThemes.forEach((t) => {
      if (!t.isBuiltIn) {
        groups.custom.push(t);
      } else if (t.category === 'dark') {
        groups.dark.push(t);
      } else if (t.category === 'light') {
        groups.light.push(t);
      }
    });

    return groups;
  }, [availableThemes]);

  // Handle delete custom theme
  function handleDeleteTheme(themeId: string) {
      if (confirm('Are you sure you want to delete this theme?')) {
        deleteCustomTheme(themeId);
      }
    }

  return (
    <section>
      <SectionHeader
        icon={<PaintBrushIcon className="h-5 w-5" />}
        title="Theme"
        description="Choose a color scheme that suits your style"
      />

      {/* System Preference Toggle */}
      <div className="mb-4">
        <Toggle
          enabled={isSystemPreference}
          onChange={toggleSystemPreference}
          label="Match System Theme"
          description="Automatically switch between light and dark themes based on your system settings"
          icon={<ComputerDesktopIcon className="h-5 w-5" />}
        />
      </div>

      {/* Dark Themes */}
      <div className="mb-6">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--token-text-secondary)]">
          <MoonIcon className="h-4 w-4" />
          Dark Themes
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {themeGroups.dark.map((t) => (
            <ThemeCard
              key={t.id}
              theme={t}
              isActive={theme.id === t.id}
              onSelect={() => setTheme(t.id)}
            />
          ))}
        </div>
      </div>

      {/* Light Themes */}
      <div className="mb-6">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--token-text-secondary)]">
          <SunIcon className="h-4 w-4" />
          Light Themes
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {themeGroups.light.map((t) => (
            <ThemeCard
              key={t.id}
              theme={t}
              isActive={theme.id === t.id}
              onSelect={() => setTheme(t.id)}
            />
          ))}
        </div>
      </div>

      {/* Custom Themes */}
      {themeGroups.custom.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-medium text-[var(--token-text-secondary)]">
            Custom Themes
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {themeGroups.custom.map((t) => (
              <ThemeCard
                key={t.id}
                theme={t}
                isActive={theme.id === t.id}
                onSelect={() => setTheme(t.id)}
                onDelete={() => handleDeleteTheme(t.id)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default ThemeSelection;
