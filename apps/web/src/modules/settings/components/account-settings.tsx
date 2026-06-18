/**
 * Account settings form component.
 */
import { useState, useActionState } from 'react';
import { motion } from 'motion/react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { http } from '@/lib/api-client';
import { tweens } from '@/lib/animation-presets';
import { createLogger } from '@/lib/logger';
import { useAuthStore } from '@/modules/auth/store';
import { GlassCard, toast } from '@/shared/components/ui';
import type { SaveProfileState } from './account-settings.types';
import { AvatarSection } from './avatar-section';
import { ProfileFormFields } from './profile-form-fields';

const logger = createLogger('AccountSettings');

/** Safely extract a string from FormData */
function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function nullableFormString(formData: FormData, key: string): string | null {
  const value = getFormString(formData, key).trim();
  return value.length > 0 ? value : null;
}

/**
 * AccountSettings - User account management component
 *
 * Handles:
 * - Profile picture upload
 * - Username changes (14-day cooldown)
 * - Display name updates
 * - Email management
 * - Wallet connection
 *
 * Uses React 19 useActionState for profile save and username change actions.
 */
export function AccountSettings() {
  const { user, updateUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isChangingUsername, setIsChangingUsername] = useState(false);

  const canChangeUsername = user?.canChangeUsername ?? true;
  const nextChangeDate = user?.usernameNextChangeAt
    ? new Date(user.usernameNextChangeAt).toLocaleDateString()
    : null;

  const [saveState, saveAction, isSaving] = useActionState(
    async (_prev: SaveProfileState, formData: FormData): Promise<SaveProfileState> => {
      const displayName = nullableFormString(formData, 'displayName');
      const bio = nullableFormString(formData, 'bio');
      const pronouns = nullableFormString(formData, 'pronouns');

      try {
        const response = await http.put('/api/v1/me', {
          user: {
            display_name: displayName,
            bio,
            pronouns,
          },
        });
        const updated = response.data.data ?? response.data.user ?? response.data;
        updateUser({
          displayName: updated.display_name ?? updated.displayName ?? displayName,
          bio: updated.bio ?? bio ?? '',
          pronouns: updated.pronouns ?? pronouns ?? '',
        });
        toast.success('Settings saved');
        HapticFeedback.success();
        return { error: null };
      } catch (error) {
        logger.error('Failed to save settings:', error);
        toast.error('Failed to save settings');
        return { error: 'Failed to save settings' };
      }
    },
    { error: null }
  );

  const handleChangeUsername = async () => {
    if (!username.trim() || username === user?.username) return;

    setIsChangingUsername(true);
    try {
      const response = await http.put('/api/v1/me/username', { username });
      updateUser({
        username: response.data.data.username,
        canChangeUsername: false,
        usernameNextChangeAt: response.data.data.username_next_change_at,
      });
      toast.success('Username changed successfully');
    } catch (error: unknown) {
      const resp = error instanceof Object && 'response' in error ? error.response : undefined;
      const data = resp instanceof Object && 'data' in resp ? resp.data : undefined;
      const errField = data instanceof Object && 'error' in data ? data.error : undefined;
      const errorMessage =
        errField instanceof Object && 'message' in errField && typeof errField.message === 'string'
          ? errField.message
          : 'Failed to change username';
      toast.error(errorMessage);
    } finally {
      setIsChangingUsername(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={tweens.standard}
      className="space-y-6"
    >
      <AvatarSection user={user} />

      {/* Username with 14-day cooldown */}
      <GlassCard variant="default" className="relative mb-6 overflow-hidden p-6">
        {/* Section accent */}
        <div className="via-primary-500/30 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
        <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/70">
          Username
          {!canChangeUsername && nextChangeDate && (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-400 ring-1 ring-amber-500/20">
              Locked until {nextChangeDate}
            </span>
          )}
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            disabled={!canChangeUsername}
            placeholder={user?.username || 'Choose a username'}
            className={`focus:ring-primary-500/20 flex-1 rounded-xl border bg-[var(--token-bg-secondary)] px-4 py-3 text-white placeholder-white/30 shadow-inner shadow-black/20 transition-all focus:outline-none focus:ring-2 ${
              canChangeUsername
                ? 'focus:border-primary-500/40 border-[var(--token-card-border)]'
                : 'cursor-not-allowed border-[var(--token-border-muted)] text-gray-500'
            }`}
          />
          {canChangeUsername && username !== user?.username && username.length >= 3 && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                handleChangeUsername();
                HapticFeedback.medium();
              }}
              disabled={isChangingUsername}
              className="rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-5 py-3 text-sm font-semibold text-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.3),rgba(255,255,255,0.02)_0px_1px_1px_inset] backdrop-blur-md transition-all hover:border-[var(--token-card-border)] hover:bg-[var(--token-card-bg)] disabled:opacity-40"
            >
              {isChangingUsername ? 'Saving...' : 'Change'}
            </motion.button>
          )}
        </div>
        <p className="mt-2 text-xs text-white/30">
          {canChangeUsername
            ? 'Username can be changed every 14 days. Letters, numbers, and underscores only.'
            : `You changed your username recently. Next change available on ${nextChangeDate}.`}
        </p>
      </GlassCard>

      {/* Profile Form — uses React 19 useActionState */}
      <form action={saveAction}>
        <ProfileFormFields
          user={user}
          email={email}
          setEmail={setEmail}
          isSaving={isSaving}
          saveError={saveState.error}
        />
      </form>
    </motion.div>
  );
}

export default AccountSettings;
