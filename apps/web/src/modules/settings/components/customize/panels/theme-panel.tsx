/**
 * Theme Panel
 *
 * Customization panel for theme colors.
 */

import { memo } from 'react';
import { ColorPickerGrid, SectionHeader } from '../customization-ui';
import { useCustomizationStore } from '@/modules/settings/store/customization';
import { THEME_COLORS as themeColors } from '@/stores/theme';

// THEME PANEL COMPONENT

export const ThemePanel = memo(function ThemePanel() {
  const { themePreset, setTheme } = useCustomizationStore();

  const colors = themeColors[themePreset];

  return (
    <div className="space-y-8">
      {/* Color Theme */}
      <section>
        <SectionHeader
          title="Color Theme"
          subtitle="Choose your primary color palette"
          icon={<span className="text-lg">🎨</span>}
        />
        <ColorPickerGrid selected={themePreset} onSelect={setTheme} size="lg" />
        <p className="mt-2 text-xs text-[var(--token-text-muted)]">
          Currently: <span style={{ color: colors.primary }}>{colors.name}</span>
        </p>
      </section>
    </div>
  );
});

export default ThemePanel;
