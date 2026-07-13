/**
 * Privacy settings configuration panel.
 */
import { motion } from 'motion/react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { useSettingsStore } from '@/modules/settings/store';
import { GlassCard, toast } from '@/shared/components/ui';
import { BlockedUsersSettings } from './blocked-users-settings';
import { PrivacyToggle } from './privacy-toggle';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PrivacySettingsPanel');

/**
 * Presents only privacy controls with a demonstrated CGraph behavior owner.
 */
export function PrivacySettingsPanel() {
  const { settings, updatePrivacySettings, isSaving } = useSettingsStore();

  async function toggleReadReceipts() {
    try {
      await updatePrivacySettings({
        showReadReceipts: !settings.privacy.showReadReceipts,
      });
      toast.success('Read receipts updated');
    } catch (error) {
      logger.error('Failed to update read receipts settings', error);
      toast.error('Failed to update settings');
    }
  }

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} transition={tweens.standard}>
      <div className="mb-6 flex items-start gap-3">
        <div className="aurora-page-icon p-3">
          <EyeIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-primary-300/75 mb-1 text-[11px] font-black uppercase tracking-[0.24em]">
            Privacy Controls
          </p>
          <h1 className="bg-gradient-to-r from-[var(--token-text-primary)] via-primary-500 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
            Privacy
          </h1>
          <p className="mt-1 text-sm text-[var(--token-text-secondary)]">
            Manage blocked people and read receipt visibility.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <BlockedUsersSettings />

        <GlassCard variant="default" className="aurora-social-panel p-4">
          <PrivacyToggle
            label="Read Receipts"
            description="Show when you have read a direct message"
            checked={settings.privacy.showReadReceipts}
            disabled={isSaving}
            onToggle={() => void toggleReadReceipts()}
          />
        </GlassCard>
      </div>
    </motion.div>
  );
}
