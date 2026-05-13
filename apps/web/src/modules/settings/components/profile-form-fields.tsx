/**
 * Profile form input fields component.
 */
import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { User } from '@/modules/auth/store/authStore.types';

interface ProfileFormFieldsProps {
  user: User | null;
  email: string;
  setEmail: (value: string) => void;
  isSaving: boolean;
  saveError: string | null;
}

/**
 */
/**
 * Profile Form Fields component.
 */
export function ProfileFormFields({
  user,
  email,
  setEmail,
  isSaving,
  saveError,
}: ProfileFormFieldsProps) {
  return (
    <>
      {saveError && (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm text-red-400 shadow-lg shadow-red-500/5">
          {saveError}
        </div>
      )}

      {/* Display Name */}
      <GlassCard
        variant="default"
        className="aurora-social-panel relative mb-5 overflow-hidden p-6"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <label
          htmlFor="profile-display-name"
          className="mb-3 block text-sm font-semibold text-[var(--token-text-secondary)]"
        >
          Display Name
        </label>
        <input
          id="profile-display-name"
          type="text"
          name="displayName"
          defaultValue={user?.displayName || ''}
          placeholder="How should we call you?"
          className="aurora-social-select w-full rounded-xl px-4 py-3 text-[var(--token-text-primary)] placeholder-[var(--token-text-muted)]"
        />
      </GlassCard>

      {/* Bio */}
      <GlassCard
        variant="default"
        className="aurora-social-panel relative mb-5 overflow-hidden p-6"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <label
          htmlFor="profile-bio"
          className="mb-3 block text-sm font-semibold text-[var(--token-text-secondary)]"
        >
          About Me
        </label>
        <textarea
          id="profile-bio"
          name="bio"
          defaultValue={user?.bio || ''}
          placeholder="Tell others about yourself..."
          maxLength={300}
          rows={3}
          className="aurora-social-select w-full resize-none rounded-xl px-4 py-3 text-[var(--token-text-primary)] placeholder-[var(--token-text-muted)]"
        />
      </GlassCard>

      {/* Pronouns */}
      <GlassCard
        variant="default"
        className="aurora-social-panel relative mb-5 overflow-hidden p-6"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <label
          htmlFor="profile-pronouns"
          className="mb-3 block text-sm font-semibold text-[var(--token-text-secondary)]"
        >
          Pronouns
        </label>
        <select
          id="profile-pronouns"
          name="pronouns"
          defaultValue={user?.pronouns || ''}
          className="aurora-social-select w-full rounded-xl px-4 py-3 text-[var(--token-text-primary)]"
        >
          <option value="">Prefer not to say</option>
          <option value="he/him">he/him</option>
          <option value="she/her">she/her</option>
          <option value="they/them">they/them</option>
          <option value="he/they">he/they</option>
          <option value="she/they">she/they</option>
          <option value="any">Any pronouns</option>
          <option value="ask">Ask me</option>
        </select>
      </GlassCard>

      {/* Banner */}
      <GlassCard
        variant="crystal"
        className="aurora-social-panel relative mb-5 overflow-hidden p-6"
      >
        <div className="via-primary-500/30 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
        <label className="mb-3 block text-sm font-semibold text-[var(--token-text-secondary)]">
          Profile Banner
        </label>
        <div className="relative h-36 overflow-hidden rounded-xl bg-[var(--token-bg-secondary)] ring-1 ring-white/[0.06]">
          {user?.bannerUrl ? (
            <img
              src={user.bannerUrl}
              alt="Banner"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--token-bg-secondary)] via-[var(--token-bg-secondary)] to-[var(--token-bg-tertiary)]">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--token-bg-secondary)] ring-1 ring-white/[0.06]">
                  <svg
                    className="h-5 w-5 text-[var(--token-text-muted)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                    />
                  </svg>
                </div>
                <span className="text-xs text-[var(--token-text-muted)]">No banner set</span>
              </div>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 backdrop-blur-sm transition-opacity hover:opacity-100">
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              onClick={() => HapticFeedback.medium()}
              className="aurora-social-button-muted rounded-xl px-5 py-2.5 text-sm font-semibold text-[var(--token-text-primary)]"
            >
              Upload Banner
            </motion.button>
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--token-text-muted)]">
          Recommended: 1920x480px. Max 5MB.
        </p>
      </GlassCard>

      {/* Email */}
      <GlassCard
        variant="default"
        className="aurora-social-panel relative mb-5 overflow-hidden p-6"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <label
          htmlFor="profile-email"
          className="mb-3 block text-sm font-semibold text-[var(--token-text-secondary)]"
        >
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="aurora-social-select w-full rounded-xl px-4 py-3 text-[var(--token-text-primary)] placeholder-[var(--token-text-muted)]"
        />
      </GlassCard>

      {/* Wallet */}
      <GlassCard
        variant="crystal"
        className="aurora-social-panel relative mb-8 overflow-hidden p-6"
      >
        <div className="via-primary-500/30 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
        {user?.walletAddress ? (
          <>
            <label
              htmlFor="profile-wallet-address"
              className="mb-3 block text-sm font-semibold text-[var(--token-text-secondary)]"
            >
              Connected Wallet
            </label>
            <div className="flex items-center gap-3">
              <input
                id="profile-wallet-address"
                type="text"
                value={user.walletAddress}
                disabled
                className="aurora-social-select flex-1 rounded-xl px-4 py-3 font-mono text-sm text-[var(--token-text-muted)]"
              />
              <button
                type="button"
                className="aurora-social-button-danger rounded-xl px-4 py-3 text-sm font-medium"
              >
                Disconnect
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-3 block text-sm font-semibold text-[var(--token-text-secondary)]">
              Connected Wallet
            </p>
            <button
              type="button"
              className="aurora-social-button-muted rounded-xl px-5 py-3 text-sm font-medium text-[var(--token-text-primary)]"
            >
              Connect Wallet
            </button>
          </>
        )}
      </GlassCard>

      {/* Save Button */}
      <motion.button
        type="submit"
        whileTap={{ scale: 0.88 }}
        disabled={isSaving}
        className="aurora-social-button w-full rounded-xl px-6 py-3 font-semibold text-white disabled:opacity-40 sm:w-auto"
      >
        {isSaving ? 'Saving...' : 'Save Changes'}
      </motion.button>
    </>
  );
}
