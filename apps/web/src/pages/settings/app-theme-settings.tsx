/**
 * Appearance settings page — Telegram/WhatsApp-style theme picker.
 */
import { Palette } from 'lucide-react';
import { ThemePicker } from '@/components/theme-picker';

/**
 * Appearance settings — clean theme selection like Telegram & WhatsApp.
 * Shows preview cards for each theme so users see what they're picking.
 */
export default function AppThemeSettings() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Palette className="h-6 w-6 text-[var(--token-interactive-primary)]" />
        <h1 className="text-xl font-semibold text-[var(--token-text-primary)]">Appearance</h1>
      </div>

      <ThemePicker placement="settings" />
    </div>
  );
}
