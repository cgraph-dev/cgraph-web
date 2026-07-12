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
  const { profileColor, setProfileColor } = useCustomizationStore();

  const colors = themeColors[profileColor];

  return (
    <div className="space-y-8">
      {/* Color Theme */}
      <section>
        <SectionHeader
          title="Profile Color"
          subtitle="Choose the accent shown on your profile"
          icon={<span className="text-lg">🎨</span>}
        />
        <ColorPickerGrid selected={profileColor} onSelect={setProfileColor} size="lg" />
        <p className="mt-2 text-xs text-[var(--token-text-muted)]">
          Currently: <span style={{ color: colors.primary }}>{colors.name}</span>
        </p>
      </section>
    </div>
  );
});

export default ThemePanel;
