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

  async function toggleTypingIndicators() {
    try {
      await updatePrivacySettings({
        showTypingIndicators: !settings.privacy.showTypingIndicators,
      });
      toast.success('Typing indicators updated');
    } catch (error) {
      logger.error('Failed to update typing indicators settings', error);
      toast.error('Failed to update settings');
    }
  }

  async function toggleFriendRequests() {
    try {
      await updatePrivacySettings({
        allowFriendRequests: !settings.privacy.allowFriendRequests,
      });
      toast.success('Friend requests updated');
    } catch (error) {
      logger.error('Failed to update friend request settings', error);
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
          <h1 className="text-2xl font-semibold text-[var(--token-text-primary)]">Privacy</h1>
          <p className="mt-1 text-sm text-[var(--token-text-secondary)]">
            Manage blocked people, friend requests, read receipt visibility, and typing indicators.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <BlockedUsersSettings />

        <GlassCard variant="default" className="p-4">
          <PrivacyToggle
            label="Friend Requests"
            description="Let people send you friend requests"
            checked={settings.privacy.allowFriendRequests}
            disabled={isSaving}
            onToggle={() => void toggleFriendRequests()}
          />
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <PrivacyToggle
            label="Read Receipts"
            description="Show when you have read a direct message"
            checked={settings.privacy.showReadReceipts}
            disabled={isSaving}
            onToggle={() => void toggleReadReceipts()}
          />
        </GlassCard>

        <GlassCard variant="default" className="p-4">
          <PrivacyToggle
            label="Typing Indicators"
            description="Show when you are typing in a direct message"
            checked={settings.privacy.showTypingIndicators}
            disabled={isSaving}
            onToggle={() => void toggleTypingIndicators()}
          />
        </GlassCard>
      </div>
    </motion.div>
  );
}
