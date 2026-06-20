/**
 * ProfileNameSection - Display name, verification badges, title, and status
 */

import { motion } from 'motion/react';
import { ShieldCheckIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import type { UserProfileData } from '@/types/profile.types';
import { InlineTitle } from '@/shared/components/ui';
import { springs } from '@/lib/animation-presets';
import { PulseBadge } from '@/modules/pulse/components';
import { Nameplate } from '@/modules/social/components/user-profile-card/nameplate';
import type { PulseTier } from '@/modules/pulse/types';

interface ProfileNameSectionProps {
  profile: UserProfileData;
}

const PULSE_TIERS: readonly PulseTier[] = ['bronze', 'silver', 'gold', 'platinum'];

function isPulseTier(value: string | undefined): value is PulseTier {
  if (value === undefined) return false;
  return PULSE_TIERS.some((t) => t === value);
}

interface AggregatedPulse {
  readonly score: number;
  readonly tier: PulseTier | undefined;
}

function aggregatePulse(profile: UserProfileData): AggregatedPulse | null {
  const communities = profile.topCommunities;
  if (communities === undefined || communities.length === 0) return null;
  let total = 0;
  let bestTier: PulseTier | undefined;
  let bestScore = -Infinity;
  for (const community of communities) {
    total += community.score;
    if (community.score > bestScore && isPulseTier(community.tier)) {
      bestScore = community.score;
      bestTier = community.tier;
    }
  }
  return { score: total, tier: bestTier };
}

function hasDisplayNameCosmetics(profile: UserProfileData): boolean {
  return Boolean(
    profile.equippedNameplateId ||
      profile.displayNameFont ||
      profile.displayNameEffect ||
      profile.displayNameColor
  );
}

/**
 */
/**
 * Profile Name Section section component.
 */
export function ProfileNameSection({ profile }: ProfileNameSectionProps) {
  const pulse = aggregatePulse(profile);
  const displayName = profile.displayName || profile.username;
  const renderCosmeticNameplate = hasDisplayNameCosmetics(profile);

  return (
    <div>
      <div className="flex items-center gap-2">
        {renderCosmeticNameplate ? (
          <Nameplate
            displayName={displayName}
            nameplateId={profile.equippedNameplateId}
            displayNameFont={profile.displayNameFont ?? undefined}
            displayNameEffect={profile.displayNameEffect ?? undefined}
            displayNameColor={profile.displayNameColor ?? undefined}
            displayNameSecondaryColor={profile.displayNameSecondaryColor ?? undefined}
            className="items-start px-0 pt-0"
            displayNameClassName="text-2xl"
            headingLevel={1}
          />
        ) : (
          <h1 className="bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
            {displayName}
          </h1>
        )}
        {profile.isVerified && (
          <motion.div whileHover={{ rotate: 360 }} transition={springs.bouncy}>
            <CheckBadgeIcon className="h-6 w-6 text-primary-500" />
          </motion.div>
        )}
        {profile.isPremium && (
          <motion.div whileHover={{ rotate: 360 }} transition={springs.bouncy}>
            <ShieldCheckIcon className="h-5 w-5 text-yellow-500" />
          </motion.div>
        )}
      </div>

      {/* User Title + Pulse */}
      <div className="mt-0.5 flex items-center gap-2">
        <p className="text-white/40">@{profile.username}</p>
        {profile.equippedTitle && <InlineTitle titleId={profile.equippedTitle} size="lg" />}
        {pulse !== null && <PulseBadge score={pulse.score} tier={pulse.tier} />}
      </div>

      {profile.statusMessage && (
        <p className="mt-1 text-sm text-white/40">{profile.statusMessage}</p>
      )}
    </div>
  );
}
