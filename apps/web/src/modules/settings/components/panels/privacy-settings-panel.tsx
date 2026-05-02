/**
 * Privacy settings configuration panel.
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { useSettingsStore } from '@/modules/settings/store';
import { toast } from '@/shared/components/ui';
import { GlassCard } from '@/shared/components/ui';
import { PROFILE_FIELD_VISIBILITY_OPTIONS } from './privacy-field-config';
import { PrivacyToggle } from './privacy-toggle';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PrivacySettingsPanel');

export function PrivacySettingsPanel() {
  const { settings, updatePrivacySettings, isSaving } = useSettingsStore();
  const [fieldVisExpanded, setFieldVisExpanded] = useState(false);

  /** Safely read a boolean privacy field by dynamic key. */
  function privacyBool(key: string): boolean {
    const entry = Object.entries(settings.privacy).find(([k]) => k === key);
    return entry ? entry[1] !== false : true;
  }

  const handleSelectChange = async (key: keyof typeof settings.privacy, value: string) => {
    try {
      await updatePrivacySettings({ [key]: value });
      toast.success('Privacy settings updated');
    } catch (error) {
      logger.error('Failed to update privacy settings', error);
      toast.error('Failed to update privacy settings');
    }
  };

  return (
    <motion.div {...FADE_UP} exit={{ opacity: 0, y: -20 }} transition={tweens.standard}>
      <div className="mb-6 flex items-start gap-3">
        <div className="aurora-page-icon p-3">
          <EyeIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-primary-300/75 mb-1 text-[11px] font-black uppercase tracking-[0.24em]">
            Visibility Controls
          </p>
          <h1 className="bg-gradient-to-r from-[var(--token-text-primary)] via-primary-500 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
            Privacy
          </h1>
          <p className="mt-1 text-sm text-[var(--token-text-secondary)]">
            Direct-message, profile, and discovery visibility settings with the same Aurora gradient
            language.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <GlassCard variant="default" className="aurora-social-panel p-4">
          <h3 className="mb-2 font-medium text-[var(--token-text-primary)]">
            Who can send you direct messages
          </h3>
          <select
            value={settings.privacy.allowMessageRequests ? 'everyone' : 'nobody'}
            onChange={(e) =>
              handleSelectChange(
                'allowMessageRequests',
                e.target.value === 'everyone' ? 'true' : 'false'
              )
            }
            disabled={isSaving}
            className="aurora-social-select w-full rounded-xl px-4 py-2 text-[var(--token-text-primary)] outline-none disabled:opacity-50"
          >
            <option value="everyone">Everyone</option>
            <option value="friends">Friends Only</option>
            <option value="nobody">No One</option>
          </select>
        </GlassCard>

        <GlassCard variant="default" className="aurora-social-panel p-4">
          <h3 className="mb-2 font-medium text-[var(--token-text-primary)]">
            Who can see your online status
          </h3>
          <select
            value={settings.privacy.showOnlineStatus ? 'everyone' : 'nobody'}
            onChange={async (e) => {
              try {
                await updatePrivacySettings({ showOnlineStatus: e.target.value === 'everyone' });
                toast.success('Online status visibility updated');
              } catch (error) {
                logger.error('Failed to update online status visibility', error);
                toast.error('Failed to update settings');
              }
            }}
            disabled={isSaving}
            className="aurora-social-select w-full rounded-xl px-4 py-2 text-[var(--token-text-primary)] outline-none disabled:opacity-50"
          >
            <option value="everyone">Everyone</option>
            <option value="nobody">No One</option>
          </select>
        </GlassCard>

        <GlassCard variant="default" className="aurora-social-panel p-4">
          <h3 className="mb-2 font-medium text-[var(--token-text-primary)]">
            Who can add you to groups
          </h3>
          <select
            value={settings.privacy.allowGroupInvites}
            onChange={async (e) => {
              try {
                const value = e.target.value;
                if (value === 'anyone' || value === 'friends' || value === 'nobody') {
                  await updatePrivacySettings({ allowGroupInvites: value });
                }
                toast.success('Group invite settings updated');
              } catch (error) {
                logger.error('Failed to update group invite settings', error);
                toast.error('Failed to update settings');
              }
            }}
            disabled={isSaving}
            className="aurora-social-select w-full rounded-xl px-4 py-2 text-[var(--token-text-primary)] outline-none disabled:opacity-50"
          >
            <option value="anyone">Everyone</option>
            <option value="friends">Friends Only</option>
            <option value="nobody">No One</option>
          </select>
        </GlassCard>

        <GlassCard variant="default" className="aurora-social-panel p-4">
          <h3 className="mb-2 font-medium text-[var(--token-text-primary)]">Profile Visibility</h3>
          <select
            value={settings.privacy.profileVisibility}
            onChange={async (e) => {
              try {
                const value = e.target.value;
                if (value === 'public' || value === 'friends' || value === 'private') {
                  await updatePrivacySettings({ profileVisibility: value });
                }
                toast.success('Profile visibility updated');
              } catch (error) {
                logger.error('Failed to update profile visibility', error);
                toast.error('Failed to update settings');
              }
            }}
            disabled={isSaving}
            className="aurora-social-select w-full rounded-xl px-4 py-2 text-[var(--token-text-primary)] outline-none disabled:opacity-50"
          >
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </GlassCard>

        {/* Per-field profile visibility controls */}
        <GlassCard variant="default" className="aurora-social-panel p-4">
          <button
            onClick={() => setFieldVisExpanded((v) => !v)}
            className="flex w-full items-center justify-between"
          >
            <div>
              <h3 className="text-left font-medium text-[var(--token-text-primary)]">
                Profile Field Visibility
              </h3>
              <p className="text-left text-sm text-[var(--token-text-secondary)]">
                Control which profile fields are visible to others
              </p>
            </div>
            <span
              className={`text-[var(--token-text-muted)] transition-transform ${fieldVisExpanded ? 'rotate-180' : ''}`}
            >
              ▾
            </span>
          </button>

          {fieldVisExpanded && (
            <div className="mt-4 space-y-3 border-t border-[var(--token-border-muted)] pt-4">
              {PROFILE_FIELD_VISIBILITY_OPTIONS.map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--token-text-primary)]">{label}</p>
                    <p className="text-xs text-[var(--token-text-muted)]">{desc}</p>
                  </div>
                  <button
                    onClick={async () => {
                      HapticFeedback.light();
                      try {
                        await updatePrivacySettings({
                          [key]: !privacyBool(key),
                        });
                        toast.success(`${label} visibility updated`);
                      } catch (error) {
                        logger.error(`Failed to update ${label} visibility`, error);
                        toast.error('Failed to update settings');
                      }
                    }}
                    type="button"
                    role="switch"
                    aria-checked={privacyBool(key)}
                    disabled={isSaving}
                    data-checked={privacyBool(key)}
                    className={`aurora-social-toggle relative h-6 w-11 rounded-full ${isSaving ? 'opacity-50' : ''}`}
                  >
                    <span className="aurora-social-toggle-thumb absolute left-1 top-1 h-4 w-4 rounded-full" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard variant="default" className="aurora-social-panel p-4">
          <PrivacyToggle
            label="Allow Friend Requests"
            description="Let others send you friend requests"
            checked={settings.privacy.allowFriendRequests}
            disabled={isSaving}
            onToggle={async () => {
              HapticFeedback.light();
              try {
                await updatePrivacySettings({
                  allowFriendRequests: !settings.privacy.allowFriendRequests,
                });
                toast.success('Friend request settings updated');
              } catch (error) {
                logger.error('Failed to update friend request settings', error);
                toast.error('Failed to update settings');
              }
            }}
          />
        </GlassCard>

        <GlassCard variant="default" className="aurora-social-panel p-4">
          <PrivacyToggle
            label="Show in Search Results"
            description="Allow others to find you in search"
            checked={settings.privacy.showInSearch}
            disabled={isSaving}
            onToggle={async () => {
              HapticFeedback.light();
              try {
                await updatePrivacySettings({ showInSearch: !settings.privacy.showInSearch });
                toast.success('Search visibility updated');
              } catch (error) {
                logger.error('Failed to update search visibility', error);
                toast.error('Failed to update settings');
              }
            }}
          />
        </GlassCard>

        <GlassCard variant="default" className="aurora-social-panel p-4">
          <PrivacyToggle
            label="Read Receipts"
            description="Show when you've read messages"
            checked={settings.privacy.showReadReceipts}
            disabled={isSaving}
            onToggle={async () => {
              HapticFeedback.light();
              try {
                await updatePrivacySettings({
                  showReadReceipts: !settings.privacy.showReadReceipts,
                });
                toast.success('Read receipts updated');
              } catch (error) {
                logger.error('Failed to update read receipts settings', error);
                toast.error('Failed to update settings');
              }
            }}
          />
        </GlassCard>

        {/* Phone number visibility (Signal parity) */}
        <GlassCard variant="default" className="aurora-social-panel p-4">
          <h3 className="mb-2 font-medium text-[var(--token-text-primary)]">
            Phone Number Visibility
          </h3>
          <p className="mb-3 text-sm text-[var(--token-text-secondary)]">
            Who can see your phone number
          </p>
          <select
            value={privacyBool('showPhone') ? 'everyone' : 'nobody'}
            onChange={async (e) => {
              try {
                await updatePrivacySettings({ showPhone: e.target.value === 'everyone' });
                toast.success('Phone visibility updated');
              } catch (error) {
                logger.error('Failed to update phone visibility', error);
                toast.error('Failed to update settings');
              }
            }}
            disabled={isSaving}
            className="aurora-social-select w-full rounded-xl px-4 py-2 text-[var(--token-text-primary)] outline-none disabled:opacity-50"
          >
            <option value="everyone">Everyone</option>
            <option value="contacts">Contacts Only</option>
            <option value="nobody">Nobody</option>
          </select>
        </GlassCard>

        {/* Forwarded messages visibility (Telegram parity) */}
        <GlassCard variant="default" className="aurora-social-panel p-4">
          <PrivacyToggle
            label="Show Forwarded From"
            description="Include your name when messages are forwarded"
            checked={privacyBool('showForwardedFrom')}
            disabled={isSaving}
            onToggle={async () => {
              HapticFeedback.light();
              try {
                await updatePrivacySettings({
                  showForwardedFrom: !privacyBool('showForwardedFrom'),
                });
                toast.success('Forwarding visibility updated');
              } catch (error) {
                logger.error('Failed to update forwarding settings', error);
                toast.error('Failed to update settings');
              }
            }}
          />
        </GlassCard>

        {/* Calls privacy (Telegram parity) */}
        <GlassCard variant="default" className="aurora-social-panel p-4">
          <h3 className="mb-2 font-medium text-[var(--token-text-primary)]">Who Can Call You</h3>
          <p className="mb-3 text-sm text-[var(--token-text-secondary)]">
            Control who can start voice and video calls with you
          </p>
          <select
            value={privacyBool('allowCalls') ? 'everyone' : 'nobody'}
            onChange={async (e) => {
              try {
                const value = e.target.value;
                if (value === 'everyone' || value === 'contacts' || value === 'nobody') {
                  await updatePrivacySettings({ allowCalls: value === 'everyone' });
                }
                toast.success('Call privacy updated');
              } catch (error) {
                logger.error('Failed to update call privacy', error);
                toast.error('Failed to update settings');
              }
            }}
            disabled={isSaving}
            className="aurora-social-select w-full rounded-xl px-4 py-2 text-[var(--token-text-primary)] outline-none disabled:opacity-50"
          >
            <option value="everyone">Everyone</option>
            <option value="contacts">Contacts Only</option>
            <option value="nobody">Nobody</option>
          </select>
        </GlassCard>

        {/* Auto-delete / Vanish messages default (Telegram parity) */}
        <GlassCard variant="default" className="aurora-social-panel p-4">
          <h3 className="mb-2 font-medium text-[var(--token-text-primary)]">
            Vanish Messages Default
          </h3>
          <p className="mb-3 text-sm text-[var(--token-text-secondary)]">
            Set default auto-delete timer for new conversations
          </p>
          <select
            value={String(settings.privacy.autoDeleteDefault ?? 'off')}
            onChange={async (e) => {
              try {
                await updatePrivacySettings({
                  autoDeleteDefault: e.target.value === 'off' ? null : Number(e.target.value),
                });
                toast.success('Vanish timer updated');
              } catch (error) {
                logger.error('Failed to update vanish timer', error);
                toast.error('Failed to update settings');
              }
            }}
            disabled={isSaving}
            className="aurora-social-select w-full rounded-xl px-4 py-2 text-[var(--token-text-primary)] outline-none disabled:opacity-50"
          >
            <option value="off">Off</option>
            <option value="1day">1 Day</option>
            <option value="1week">1 Week</option>
            <option value="1month">1 Month</option>
          </select>
        </GlassCard>
      </div>
    </motion.div>
  );
}
