import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { getBadgeById } from '@/data/badgesCollection';
import { getTitleById } from '@/data/titlesCollection';
import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';

import { getPulseFilled, getPulseTier, mapRarityToDisplayTier } from './constants';
import type {
  AccentThemeId,
  BadgeDisplayTier,
  NameplateVariant,
  ProfileBadge,
  ProfileCardUserV2,
} from './types';
import type { ProfileCardUser } from '../profile-card';
const NAMEPLATE_MAP: Record<string, NameplateVariant> = {
  cosmic: 'cosmic',
  aurora: 'aurora',
  ember: 'ember',
};

const RARITY_RANK: Record<BadgeDisplayTier, number> = {
  dim: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

const ACCENT_THEME_IDS: readonly AccentThemeId[] = ['default', 'ember', 'void', 'rose', 'ice'];
function toAccentThemeId(value: string): AccentThemeId {
  const found = ACCENT_THEME_IDS.find((id) => id === value);
  return found ?? 'default';
}

/** Map badge IDs from store → ProfileBadge[] for the card display */
function resolveBadgesFromIds(badgeIds: readonly string[]): ProfileBadge[] {
  const badges: ProfileBadge[] = badgeIds.slice(0, 3).map((id) => {
    const def = getBadgeById(id);
    return def
      ? {
          id: def.id,
          name: def.name,
          icon: def.icon,
          rarity: mapRarityToDisplayTier(def.rarity),
        }
      : { id, name: id, icon: '◇', rarity: 'dim' satisfies BadgeDisplayTier }; // fallback badge tier
  });

  while (badges.length < 3) {
    badges.push({
      id: `placeholder-${badges.length}`,
      name: 'Empty',
      icon: '◇',
      rarity: 'dim',
    });
  }

  return badges;
}

/** Map Achievement[] from user data → ProfileBadge[] */
function resolveBadgesFromUser(user: ProfileCardUser): ProfileBadge[] {
  const badges: ProfileBadge[] = (user.equippedBadges ?? []).slice(0, 3).map((a) => ({
    id: a.id,
    name: a.title,
    icon: a.icon,
    rarity: mapRarityToDisplayTier(a.rarity),
  }));

  while (badges.length < 3) {
    badges.push({
      id: `placeholder-${badges.length}`,
      name: 'Empty',
      icon: '◇',
      rarity: 'dim',
    });
  }

  return badges;
}

function getHighestRarity(badges: ProfileBadge[]): BadgeDisplayTier {
  let highest: BadgeDisplayTier = 'dim';
  for (const b of badges) {
    if (RARITY_RANK[b.rarity] > RARITY_RANK[highest]) {
      highest = b.rarity;
    }
  }
  return highest;
}

/** Map title ID from store → equippedTitle shape for ProfileCardUser */
function resolveTitle(titleId: string | null): ProfileCardUser['equippedTitle'] | undefined {
  if (!titleId) return undefined;
  const def = getTitleById(titleId);
  if (!def) return undefined;
  return {
    id: def.id,
    name: def.displayName,
    rarity: def.rarity,
    animation: { type: def.animationType, speed: 1, intensity: 1 },
    color: def.colors[0] ?? '#ffffff',
    gradient: def.gradient,
  };
}
/**
 * Compute display-ready profile card data for a given user.
 */
export function useProfileCardData(
  user: ProfileCardUser,
  mode: 'popout' | 'preview' = 'popout'
): ProfileCardUserV2 {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isOwnProfile = mode === 'preview' || user.id === currentUserId;

  const ownCustomization = useCustomizationStore(
    useShallow((s) =>
      isOwnProfile
        ? {
            accentTheme: toAccentThemeId(s.profileThemePresetId ?? 'default'), // store value narrowed to branded ID
            nameplate: s.equippedNameplate,
            borderId: s.selectedBorderId,
            titleId: s.equippedTitle,
            badgeIds: s.equippedBadges,
            displayNameFont: s.displayNameFont,
            displayNameEffect: s.displayNameEffect,
            displayNameColor: s.displayNameColor,
            displayNameSecondaryColor: s.displayNameSecondaryColor,
          }
        : null
    )
  );

  return useMemo(() => {
    const accentTheme: AccentThemeId = isOwnProfile
      ? (ownCustomization?.accentTheme ?? 'default')
      : toAccentThemeId(user.profile_theme ?? 'default');

    const nameplateVariant: NameplateVariant = isOwnProfile
      ? (NAMEPLATE_MAP[ownCustomization?.nameplate ?? ''] ?? 'none')
      : (NAMEPLATE_MAP[user.equipped_nameplate ?? ''] ?? 'none');

    // Badges: use store badge IDs for own profile, otherwise use user's Achievement[] data
    const profileBadges =
      isOwnProfile && ownCustomization?.badgeIds?.length
        ? resolveBadgesFromIds(ownCustomization.badgeIds)
        : resolveBadgesFromUser(user);

    // Title: use store title ID for own profile, otherwise use user's equipped title
    const equippedTitle =
      isOwnProfile && ownCustomization?.titleId
        ? resolveTitle(ownCustomization.titleId)
        : user.equippedTitle;

    const energyRingTier = getHighestRarity(profileBadges);
    const pulseScore = user.pulse ?? 0;

    const bannerType =
      energyRingTier === 'legendary' || energyRingTier === 'epic'
        ? ('animated' as const)
        : ('static' as const);

    return {
      ...user,
      equippedTitle,
      accentTheme,
      nameplateVariant,
      nameplateId: isOwnProfile
        ? (ownCustomization?.nameplate ?? null)
        : (user.equipped_nameplate ?? null),
      profileBadges,
      bannerType,
      energyRingTier,
      pulseTier: getPulseTier(pulseScore),
      pulseFilled: getPulseFilled(pulseScore),
      avatarBorderId: isOwnProfile
        ? (ownCustomization?.borderId ?? undefined)
        : (user.avatarBorderId ?? undefined),
      displayNameFont: isOwnProfile ? ownCustomization?.displayNameFont : user.display_name_font,
      displayNameEffect: isOwnProfile
        ? ownCustomization?.displayNameEffect
        : user.display_name_effect,
      displayNameColor: isOwnProfile ? ownCustomization?.displayNameColor : user.display_name_color,
      displayNameSecondaryColor: isOwnProfile
        ? ownCustomization?.displayNameSecondaryColor
        : user.display_name_secondary_color,
    };
  }, [user, isOwnProfile, ownCustomization]);
}
