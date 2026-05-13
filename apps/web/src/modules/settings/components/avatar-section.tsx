/**
 * Profile avatar upload and display section.
 */
import { motion } from 'motion/react';
import { GlassCard } from '@/shared/components/ui';
import { ThemedAvatar } from '@/components/theme/themed-avatar';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getAvatarBorderId } from '@/lib/utils';
import type { User } from '@/modules/auth/store/authStore.types';

interface AvatarSectionProps {
  user: User | null;
}

/**
 */
/**
 * Avatar Section component.
 */
export function AvatarSection({ user }: AvatarSectionProps) {
  return (
    <GlassCard variant="crystal" className="aurora-social-panel relative mb-6 overflow-hidden p-6">
      <div className="via-primary-500/30 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
      <label className="mb-4 block text-sm font-semibold text-[var(--token-text-secondary)]">
        Profile Picture
      </label>
      <div className="flex items-center gap-5">
        <div className="hover:ring-primary-500/40 relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-[var(--token-bg-secondary)] shadow-lg shadow-black/20 ring-2 ring-white/[0.08] transition-all duration-200">
          {user?.avatarUrl ? (
            <ThemedAvatar
              src={user.avatarUrl}
              alt={user?.displayName || user?.username || 'User'}
              size="large"
              className="h-20 w-20 rounded-full"
              avatarBorderId={getAvatarBorderId(user)}
            />
          ) : (
            <div className="from-primary-500/10 to-purple-500/10 flex h-full w-full items-center justify-center bg-gradient-to-br text-3xl font-bold text-[var(--token-text-muted)]">
              {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => HapticFeedback.medium()}
            className="aurora-social-button-muted rounded-xl px-5 py-2.5 text-sm font-semibold text-[var(--token-text-primary)]"
          >
            Upload Image
          </motion.button>
          <p className="mt-2 text-xs text-[var(--token-text-muted)]">JPG, PNG, or GIF. Max 2MB.</p>
        </div>
      </div>
    </GlassCard>
  );
}
