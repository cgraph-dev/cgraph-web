/**
 * Language and locale settings panel.
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { useSettingsStore } from '@/modules/settings/store';
import { toast } from '@/shared/components/ui';
import { GlassCard } from '@/shared/components/ui';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';
import { createLogger } from '@/lib/logger';

const logger = createLogger('LanguageSettingsPanel');

/**
 */
/**
 * Language Settings Panel component.
 */
export function LanguageSettingsPanel() {
  const { settings, updateLocaleSettings, isSaving } = useSettingsStore();
  const [language, setLanguage] = useState(settings.locale.language);

  const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    try {
      await updateLocaleSettings({ language: newLanguage });
      toast.success('Language updated');
    } catch (error) {
      logger.error('Failed to update language', error);
      setLanguage(settings.locale.language);
      toast.error('Failed to update language');
    }
  };

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} transition={tweens.standard}>
      <h1 className="mb-6 bg-gradient-to-r from-[var(--token-text-primary)] via-primary-500 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
        Language & Region
      </h1>

      <GlassCard variant="default" className="aurora-social-panel mb-6 p-6">
        <label className="mb-2 block text-sm font-medium text-[var(--token-text-secondary)]">
          Interface Language
        </label>
        <select
          value={language}
          onChange={handleLanguageChange}
          disabled={isSaving}
          className="aurora-social-select w-full rounded-xl px-4 py-3 text-[var(--token-text-primary)] disabled:opacity-50"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
          <option value="ja">日本語</option>
          <option value="zh">中文</option>
          <option value="ko">한국어</option>
          <option value="pt">Português</option>
          <option value="ru">Русский</option>
          <option value="ar">العربية</option>
        </select>
      </GlassCard>

      <GlassCard variant="default" className="aurora-social-panel mb-6 p-6">
        <label className="mb-2 block text-sm font-medium text-[var(--token-text-secondary)]">
          Date Format
        </label>
        <select
          value={settings.locale.dateFormat}
          onChange={async (e) => {
            try {
              const value = e.target.value;
              if (value === 'mdy' || value === 'dmy' || value === 'ymd') {
                await updateLocaleSettings({ dateFormat: value });
              }
              toast.success('Date format updated');
            } catch (error) {
              logger.error('Failed to update date format', error);
              toast.error('Failed to update date format');
            }
          }}
          disabled={isSaving}
          className="aurora-social-select w-full rounded-xl px-4 py-3 text-[var(--token-text-primary)] disabled:opacity-50"
        >
          <option value="mdy">MM/DD/YYYY</option>
          <option value="dmy">DD/MM/YYYY</option>
          <option value="ymd">YYYY-MM-DD</option>
        </select>
      </GlassCard>

      <GlassCard variant="default" className="aurora-social-panel p-6">
        <label className="mb-2 block text-sm font-medium text-[var(--token-text-secondary)]">
          Time Format
        </label>
        <select
          value={settings.locale.timeFormat}
          onChange={async (e) => {
            try {
              const value = e.target.value;
              if (value === 'twelve_hour' || value === 'twenty_four_hour') {
                await updateLocaleSettings({ timeFormat: value });
              }
              toast.success('Time format updated');
            } catch (error) {
              logger.error('Failed to update time format', error);
              toast.error('Failed to update time format');
            }
          }}
          disabled={isSaving}
          className="aurora-social-select w-full rounded-xl px-4 py-3 text-[var(--token-text-primary)] disabled:opacity-50"
        >
          <option value="twelve_hour">12-hour (1:30 PM)</option>
          <option value="twenty_four_hour">24-hour (13:30)</option>
        </select>
      </GlassCard>
    </motion.div>
  );
}
