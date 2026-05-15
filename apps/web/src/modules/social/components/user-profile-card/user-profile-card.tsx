/**
 * User Profile Card Component
 *
 * Profile popup with hover and click triggers:
 * - Mini variant: Compact card shown on hover (320px)
 * - Full variant: Detailed card shown on click (360px)
 *
 * External API is unchanged — all consumers (<UserProfileCard userId={...} trigger="both">)
 * continue to work without modification.
 */

import type { Achievement } from '@cgraph/shared-types';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { NewProfileCard } from './new-profile-card';
import { useProfileCardNavigation } from './hooks';
import { HOVER_DELAY_MS } from './constants';
import type { UserProfileCardProps, CardPosition, ProfileCardUser } from './types';
import { springs } from '@/lib/animation-presets';
import { FADE_IN } from '@/lib/animations/transitions';
import { useFriendStore } from '@/modules/social/store';
import { http } from '@/lib/api-client';
import { asBool, asNumber, asString, isRecord } from '@/lib/api-utils';
import { identityFieldsFromApi } from '@/lib/identity';
import { getBadgeById } from '@/data/badgesCollection';
import { getTitleById } from '@/data/titlesCollection';

function profilePayloadFromResponse(responseData: unknown): Record<string, unknown> | null {
  if (!isRecord(responseData)) return null;

  if (isRecord(responseData.data)) {
    return isRecord(responseData.data.user) ? responseData.data.user : responseData.data;
  }

  return isRecord(responseData.user) ? responseData.user : responseData;
}

function badgeAchievementFromId(id: string): Achievement {
  const badge = getBadgeById(id);

  return {
    id,
    title: badge?.name ?? id,
    description: badge?.description ?? '',
    category: 'social',
    rarity: badge?.rarity ?? 'common',
    icon: badge?.icon ?? '◇',
    maxProgress: 1,
    isHidden: false,
    unlocked: true,
  };
}

function badgeAchievementFromRecord(record: Record<string, unknown>): Achievement {
  const id = asString(record.id);
  const rarity = asString(record.rarity, 'common');

  return {
    id,
    title: asString(record.title) || asString(record.name) || id,
    description: asString(record.description),
    category: 'social',
    rarity:
      rarity === 'rare' || rarity === 'epic' || rarity === 'legendary' || rarity === 'mythic'
        ? rarity
        : 'common',
    icon: asString(record.icon) || asString(record.icon_url) || '◇',
    maxProgress: 1,
    isHidden: false,
    unlocked: true,
  };
}

function profileBadgesFromApi(
  userData: Record<string, unknown>,
  equippedBadgeIds: readonly string[]
): Achievement[] {
  const badges = userData.equipped_badges;

  if (Array.isArray(badges)) {
    const badgeRecords = badges.filter(isRecord).map(badgeAchievementFromRecord);
    if (badgeRecords.length > 0) return badgeRecords;

    const badgeIds = badges.filter((badge): badge is string => typeof badge === 'string');
    if (badgeIds.length > 0) return badgeIds.map(badgeAchievementFromId);
  }

  return equippedBadgeIds.map(badgeAchievementFromId);
}

function titleFromApi(
  userData: Record<string, unknown>,
  titleId: string | null
): ProfileCardUser['equippedTitle'] | undefined {
  const titleRecord = isRecord(userData.equipped_title)
    ? userData.equipped_title
    : isRecord(userData.current_title)
      ? userData.current_title
      : null;

  if (titleRecord) {
    return {
      id: asString(titleRecord.id) || titleId || '',
      name: asString(titleRecord.name) || asString(titleRecord.title) || titleId || '',
      rarity: asString(titleRecord.rarity, 'common'),
      animation: { type: asString(titleRecord.animation_type, 'none'), speed: 1, intensity: 1 },
      color: asString(titleRecord.color, '#ffffff'),
      gradient: asString(titleRecord.gradient),
    };
  }

  if (!titleId) return undefined;

  const title = getTitleById(titleId);
  if (!title) {
    return {
      id: titleId,
      name: titleId,
      rarity: 'common',
      animation: { type: 'none', speed: 1, intensity: 1 },
      color: '#ffffff',
    };
  }

  return {
    id: title.id,
    name: title.displayName,
    rarity: title.rarity,
    animation: { type: title.animationType, speed: 1, intensity: 1 },
    color: title.colors[0] ?? '#ffffff',
    gradient: title.gradient,
  };
}

function profileCardUserFromApi(userData: Record<string, unknown>): ProfileCardUser {
  const identity = identityFieldsFromApi(userData);
  const displayName = identity.displayName ?? identity.username;

  return {
    id: identity.id,
    username: identity.username,
    displayName,
    avatarUrl: identity.avatarUrl ?? '',
    avatarBorderId: identity.avatarBorderId ?? undefined,
    bannerUrl: identity.bannerUrl ?? undefined,
    bio: asString(userData.bio),
    level: asNumber(userData.level, 1),
    xp: asNumber(userData.xp) || asNumber(userData.total_xp),
    xpToNextLevel: asNumber(userData.xp_to_next_level, 100),
    pulse: asNumber(userData.pulse) || asNumber(userData.reputation),
    streak: asNumber(userData.streak) || asNumber(userData.login_streak),
    equippedTitle: titleFromApi(userData, identity.equippedTitleId),
    equippedBadges: profileBadgesFromApi(userData, identity.equippedBadgeIds),
    messageCount: asNumber(userData.message_count) || asNumber(userData.messages_sent),
    postCount: asNumber(userData.post_count) || asNumber(userData.posts_created),
    friendCount: asNumber(userData.friend_count) || asNumber(userData.friends_count),
    isOnline: identity.status === 'online' || asBool(userData.is_online),
    lastSeen: asString(userData.last_seen_at) || asString(userData.last_active_at),
    pronouns: asString(userData.pronouns),
    profile_theme: identity.profileTheme ?? undefined,
    equipped_nameplate: identity.equippedNameplateId ?? undefined,
    display_name_font: identity.displayNameFont ?? undefined,
    display_name_effect: identity.displayNameEffect ?? undefined,
    display_name_color: identity.displayNameColor ?? undefined,
    display_name_secondary_color: identity.displayNameSecondaryColor ?? undefined,
  };
}

function ProfileCardStatus({ variant, message }: { variant: 'mini' | 'full'; message: string }) {
  return (
    <div
      role="status"
      className={`rounded-2xl border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] p-5 text-sm text-[var(--token-text-muted)] shadow-xl ${
        variant === 'full' ? 'w-[360px]' : 'w-[320px]'
      }`}
    >
      {message}
    </div>
  );
}

/** Profile popup card with hover (mini) and click (full) variants. */
export default function UserProfileCard({
  userId,
  user,
  variant = 'mini',
  trigger = 'click',
  onClose,
  children,
  className = '',
}: UserProfileCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [cardVariant, setCardVariant] = useState<'mini' | 'full'>(variant);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CardPosition>({ top: 0, left: 0 });
  const [fetchedUser, setFetchedUser] = useState<ProfileCardUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { handleViewProfile, handleMessage } = useProfileCardNavigation(userId);
  const { sendRequest } = useFriendStore();
  const profileUser = user ?? fetchedUser;

  async function handleAddFriend() {
    if (userId) await sendRequest(userId);
  }

  useEffect(() => {
    if (!isOpen || user || !userId) return;

    const controller = new AbortController();

    async function fetchProfileUser() {
      setIsLoadingUser(true);
      setLoadError(null);

      try {
        const response = await http.get(`/api/v1/users/${userId}`, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        const payload = profilePayloadFromResponse(response.data);
        if (!payload) {
          setFetchedUser(null);
          setLoadError('Profile unavailable');
          return;
        }

        setFetchedUser(profileCardUserFromApi(payload));
      } catch {
        if (!controller.signal.aborted) {
          setFetchedUser(null);
          setLoadError('Profile unavailable');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingUser(false);
        }
      }
    }

    void fetchProfileUser();

    return () => {
      controller.abort();
    };
  }, [isOpen, user, userId]);

  // Calculate card position relative to trigger element
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const cardWidth = cardVariant === 'full' ? 360 : 320;
      const cardHeight = cardVariant === 'full' ? 480 : 280;

      // Anchor below trigger, centered horizontally on trigger
      let top = rect.bottom + 8;
      let left = rect.left + rect.width / 2;

      // If card would overflow bottom, show above trigger instead
      if (top + cardHeight > window.innerHeight - 16) {
        top = rect.top - cardHeight - 8;
      }
      // If card would overflow top (unlikely), clamp to viewport
      if (top < 16) top = 16;

      // Clamp horizontal so card stays on-screen
      const halfCard = cardWidth / 2;
      if (left - halfCard < 16) left = halfCard + 16;
      if (left + halfCard > window.innerWidth - 16) left = window.innerWidth - halfCard - 16;

      setPosition({ top, left });
    }
  }, [isOpen, cardVariant]);

  const handleMouseEnter = () => {
    if ((trigger === 'hover' || trigger === 'both') && variant === 'mini') {
      hoverTimeout.current = setTimeout(() => {
        setCardVariant('mini');
        setIsOpen(true);
      }, HOVER_DELAY_MS);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    if (cardVariant === 'mini' && (trigger === 'hover' || trigger === 'both')) {
      setIsOpen(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click' || trigger === 'both') {
      setCardVariant('full');
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={className}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {isOpen &&
        createPortal(
          <>
            {/* Backdrop for full variant only */}
            {cardVariant === 'full' && (
              <motion.div
                {...FADE_IN}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            )}

            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={springs.stiff}
                className="pointer-events-auto fixed z-50"
                style={{
                  top: position.top,
                  left: position.left,
                  transform: 'translateX(-50%)',
                }}
                onMouseEnter={cardVariant === 'mini' ? handleMouseEnter : undefined}
                onMouseLeave={cardVariant === 'mini' ? handleMouseLeave : undefined}
              >
                {!profileUser && isLoadingUser ? (
                  <ProfileCardStatus variant={cardVariant} message="Loading profile..." />
                ) : !profileUser || loadError ? (
                  <ProfileCardStatus
                    variant={cardVariant}
                    message={loadError ?? 'Profile unavailable'}
                  />
                ) : cardVariant === 'mini' ? (
                  <NewProfileCard
                    user={profileUser}
                    variant="mini"
                    mode="popout"
                    onMessage={handleMessage}
                    onViewProfile={handleViewProfile}
                    onAddFriend={handleAddFriend}
                    className="w-[320px]"
                  />
                ) : (
                  <NewProfileCard
                    user={profileUser}
                    variant="full"
                    mode="popout"
                    onMessage={handleMessage}
                    onViewProfile={handleViewProfile}
                    onAddFriend={handleAddFriend}
                    onClose={handleClose}
                    className="w-[360px]"
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </>,
          document.body
        )}
    </>
  );
}
