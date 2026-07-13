/**
 * Appearance settings page — Telegram/WhatsApp-style theme picker.
 */
import { Palette } from 'lucide-react';
import { ThemePicker } from '@/components/theme-picker';
import { Accessibility } from '@/modules/settings/components/appearance-settings/accessibility';
import { useSettingsStore } from '@/modules/settings/store';
import { toast } from '@/shared/components/ui';

/**
 * Appearance settings — clean theme selection like Telegram & WhatsApp.
 * Shows preview cards for each theme so users see what they're picking.
 */
export default function AppThemeSettings() {
  const appearance = useSettingsStore((state) => state.settings.appearance);
  const updateAppearanceSettings = useSettingsStore((state) => state.updateAppearanceSettings);

  function toggleReduceMotion() {
    void updateAppearanceSettings({ reduceMotion: !appearance.reduceMotion }).catch(() => {
      toast.error('Failed to save reduced-motion preference');
    });
  }

  function toggleHighContrast() {
    void updateAppearanceSettings({ highContrast: !appearance.highContrast }).catch(() => {
      toast.error('Failed to save high-contrast preference');
    });
  }

  return (
    <div className="space-y-8">
      <div className="mb-6 flex items-center gap-3">
        <Palette className="h-6 w-6 text-[var(--token-interactive-primary)]" />
        <h1 className="text-xl font-semibold text-[var(--token-text-primary)]">Appearance</h1>
      </div>

      <ThemePicker placement="settings" />

      <Accessibility
        reduceMotion={appearance.reduceMotion}
        highContrast={appearance.highContrast}
        toggleReduceMotion={toggleReduceMotion}
        toggleHighContrast={toggleHighContrast}
      />
    </div>
  );
}
