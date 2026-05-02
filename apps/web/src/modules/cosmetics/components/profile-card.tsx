/**
 * CosmeticProfileCard — full user profile with cosmetic elements.
 *
 * Layers: banner → avatar (LiveAvatarDecoration) → display name + nameplate
 * → badges → accent gradient → bio. All assets via `buildCdnUrl`.
 *
 */

import { memo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { buildCdnUrl } from '@/lib/cdn';
import { useAuthStore } from '@/modules/auth/store';
import { useCosmeticsStore } from '../store/cosmetics-store';
// Props & types
interface CosmeticProfileCardProps {
  readonly userId: string;
  readonly groupId: string | null;
  readonly className?: string;
}

interface ProfileData {
  readonly avatarUrl: string;
  readonly bannerUrl: string | null;
  readonly displayName: string;
  readonly bio: string | null;
  readonly accentColor: string | null;
  readonly borderId: string | null;
  readonly nameplateId: string | null;
  readonly profileEffectId: string | null;
  readonly profileFrameId: string | null;
  readonly badges: ReadonlyArray<string>;
  readonly isServerOverride: boolean;
}

const DEFAULT_AVATAR = '/images/default-avatar.webp';
// Profile data hook
function useProfileData(userId: string, _groupId: string | null): ProfileData | null {
  const currentUser = useAuthStore((s) => s.user);
  const memberCosmetics = useCosmeticsStore((s) => s.memberCosmetics);

  const isOwnProfile = currentUser?.id === userId;

  if (!isOwnProfile) {
    const memberData = memberCosmetics.get(userId);
    if (!memberData) return null;

    const avatarUrl = memberData.avatarHash
      ? (buildCdnUrl(memberData.avatarHash, 'avatar') ?? DEFAULT_AVATAR)
      : DEFAULT_AVATAR;
    const bannerUrl = memberData.bannerHash ? buildCdnUrl(memberData.bannerHash, 'banner') : null;

    return {
      avatarUrl,
      bannerUrl,
      displayName: 'User',
      bio: null,
      accentColor: memberData.accentColor ?? null,
      borderId: memberData.avatarBorderId ?? null,
      nameplateId: memberData.nameplateId ?? null,
      profileEffectId: memberData.profileEffectId ?? null,
      profileFrameId: memberData.profileFrameId ?? null,
      badges: [],
      isServerOverride: false,
    };
  }

  if (!currentUser) return null;

  return {
    avatarUrl: currentUser.avatarUrl ?? DEFAULT_AVATAR,
    bannerUrl: currentUser.bannerUrl ?? null,
    displayName: currentUser.displayName ?? currentUser.username ?? 'User',
    bio: currentUser.bio ?? null,
    accentColor: null,
    borderId: null,
    nameplateId: null,
    profileEffectId: null,
    profileFrameId: null,
    badges: currentUser.badges ?? [],
    isServerOverride: false,
  };
}
// Sub-components
// Sub-components
const BannerSection = memo(function BannerSection({
  bannerUrl,
  accentColor,
}: {
  readonly bannerUrl: string | null;
  readonly accentColor: string | null;
}) {
  if (bannerUrl) {
    return (
      <div className="relative h-28 w-full overflow-hidden rounded-t-xl sm:h-32">
        <img
          src={bannerUrl}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
          loading="lazy"
        />
        {accentColor && (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to bottom, transparent 40%, ${accentColor}66)` }}
          />
        )}
      </div>
    );
  }
  const bg = accentColor
    ? `linear-gradient(135deg, ${accentColor}44, ${accentColor}22)`
    : 'linear-gradient(135deg, var(--color-surface-2, #1e1e2e), var(--color-surface-3, #2a2a3e))';
  return <div className="h-28 w-full rounded-t-xl sm:h-32" style={{ background: bg }} />;
});

const NameplateDisplay = memo(function NameplateDisplay({
  nameplateUrl,
  displayName,
}: {
  readonly nameplateUrl: string;
  readonly displayName: string;
}) {
  return (
    <div className="relative inline-flex items-center">
      <img
        src={nameplateUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-fill"
        draggable={false}
        aria-hidden="true"
      />
      <span className="relative z-10 px-3 py-1 text-lg font-bold text-white">{displayName}</span>
    </div>
  );
});

const BadgesRow = memo(function BadgesRow({ badges }: { readonly badges: ReadonlyArray<string> }) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => {
        const badgeUrl = buildCdnUrl(badge, 'badge');
        if (!badgeUrl) {
          return (
            <span
              key={badge}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px]"
              title={badge}
            >
              ★
            </span>
          );
        }
        return (
          <img
            key={badge}
            src={badgeUrl}
            alt={`Badge: ${badge}`}
            className="h-5 w-5 object-contain"
            draggable={false}
          />
        );
      })}
    </div>
  );
});
export const CosmeticProfileCard = memo(function CosmeticProfileCard({
  userId,
  groupId,
  className,
}: CosmeticProfileCardProps) {
  const profile = useProfileData(userId, groupId);

  if (!profile) {
    return (
      <div
        className={cn('animate-pulse rounded-xl bg-white/5', 'h-64 w-full max-w-sm', className)}
      />
    );
  }

  const nameplateUrl = buildCdnUrl(profile.nameplateId, 'nameplate');
  const accentGradient = profile.accentColor
    ? `linear-gradient(to bottom, transparent, ${profile.accentColor}33)`
    : undefined;

  return (
    <motion.div
      className={cn(
        'relative w-full max-w-sm overflow-hidden rounded-xl',
        'border border-[var(--token-border-muted)] bg-black/40 backdrop-blur-xl',
        className
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* Banner */}
      <BannerSection bannerUrl={profile.bannerUrl} accentColor={profile.accentColor} />

      {/* Avatar — overlaps banner */}
      <div className="-mt-10 flex justify-center px-4 sm:-mt-12">
        <div className="rounded-full ring-4 ring-black/40">
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            className="h-20 w-20 rounded-full object-cover"
          />
        </div>
      </div>

      {/* Content section */}
      <div
        className="flex flex-col items-center gap-2 px-4 pb-4 pt-2"
        style={accentGradient ? { background: accentGradient } : undefined}
      >
        {/* Server profile indicator */}
        {profile.isServerOverride && (
          <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
            Server Profile
          </span>
        )}

        {/* Display name with optional nameplate */}
        {nameplateUrl ? (
          <NameplateDisplay nameplateUrl={nameplateUrl} displayName={profile.displayName} />
        ) : (
          <h3 className="text-lg font-bold text-white">{profile.displayName}</h3>
        )}

        {/* Badges row */}
        <BadgesRow badges={profile.badges} />

        {/* Bio */}
        {profile.bio && (
          <p className="mt-1 line-clamp-3 text-center text-sm text-white/60">{profile.bio}</p>
        )}
      </div>
    </motion.div>
  );
});
