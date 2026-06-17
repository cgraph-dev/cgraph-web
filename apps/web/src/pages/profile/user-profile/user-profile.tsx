/**
 * UserProfile - Main profile page component
 *
 * Displays user profile information including:
 * - Profile theme header and avatar with edit capabilities
 * - User info with verification badges and title
 * - Bio section
 * - XP progress and achievements
 * - Stats grid and sidebar
 * - Activity summary
 */

import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import type React from 'react';

const PROFILE_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,79}$/;
const INVALID_PROFILE_IDS = new Set(['undefined', 'null', 'nan', 'object-object']);

function isValidProfileId(userId: string | undefined): userId is string {
  if (!userId) return false;

  const normalized = userId.trim().toLowerCase().replaceAll(/[\s[\]]/g, '-');
  return PROFILE_ID_RE.test(userId) && !INVALID_PROFILE_IDS.has(normalized);
}

import {
  PaintBrushIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';
import { getProfileThemeOrDefault, type ProfileThemeConfig } from '@/data/profileThemes';
import { GlassCard } from '@/shared/components/ui';
import { HapticFeedback } from '@/lib/animations/animation-engine';

import {
  ProfileLoadingState,
  ProfileErrorState,
  ProfileInvalidUser,
  ProfileStatsGrid,
  ProfileSidebar,
  EquippedBadgesShowcase,
  AchievementsShowcase,
} from '@/modules/social/components';

import { ProfileBanner } from './profile-banner';
import { ProfileAvatar } from './profile-avatar';
import { ProfileNameSection } from './profile-name-section';
import { FriendshipActions } from './friendship-actions';
import { FollowButton } from './follow-button';
import { ProfileAbout } from './profile-about';
import { useProfileData } from './hooks/useProfileData';
import { useProfileActions } from './hooks/useProfileActions';
import { TipButton } from '@/modules/nodes/components/tip-button';
import { tweens } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';

/** Stable empty array for stub achievements */
const EMPTY_ACHIEVEMENTS: never[] = [];

interface ProfileThemePageStyle extends React.CSSProperties {
  '--profile-theme-accent': string;
  '--profile-theme-accent-secondary': string;
}

function getProfileThemePageStyle(theme: ProfileThemeConfig): ProfileThemePageStyle {
  const baseGradient = `linear-gradient(135deg, ${theme.backgroundGradient.join(', ')})`;

  return {
    background: `radial-gradient(circle at 15% 8%, ${theme.accentPrimary}24, transparent 30%), radial-gradient(circle at 84% 18%, ${theme.accentSecondary}22, transparent 34%), ${baseGradient}`,
    '--profile-theme-accent': theme.accentPrimary,
    '--profile-theme-accent-secondary': theme.accentSecondary,
  };
}

/** XP progress bar toward next level */
function XPProgressBar({
  currentXP,
  level,
}: {
  readonly currentXP: number;
  readonly level: number;
}) {
  const xpForNextLevel = level * 500;
  const xpInCurrentLevel = currentXP % xpForNextLevel || 0;
  const progress =
    xpForNextLevel > 0 ? Math.min((xpInCurrentLevel / xpForNextLevel) * 100, 100) : 0;

  return (
    <GlassCard variant="frosted" className="aurora-social-panel p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-white/40">
          Level {level} &rarr; {level + 1}
        </span>
        <span className="text-white/30">
          {xpInCurrentLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </GlassCard>
  );
}

/** Activity summary cards showing messages sent, posts created, etc. */
function ActivitySummary({
  messagesSent,
  postsCreated,
}: {
  messagesSent?: number;
  postsCreated?: number;
}) {
  if (!messagesSent && !postsCreated) return null;

  return (
    <GlassCard variant="frosted" className="aurora-social-panel p-6">
      <h2 className="mb-4 flex items-center gap-2 bg-gradient-to-r from-white to-primary-200 bg-clip-text text-lg font-semibold text-transparent">
        <TrophyIcon className="h-5 w-5 text-primary-400" />
        Activity
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="aurora-social-option flex items-center gap-3 rounded-xl p-3">
          <ChatBubbleLeftIcon className="h-8 w-8 text-primary-400" />
          <div>
            <div className="text-xl font-bold text-white">
              {(messagesSent ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-white/40">Messages Sent</div>
          </div>
        </div>
        <div className="aurora-social-option flex items-center gap-3 rounded-xl p-3">
          <DocumentTextIcon className="h-8 w-8 text-primary-300" />
          <div>
            <div className="text-xl font-bold text-white">
              {(postsCreated ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-white/40">Forum Posts</div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * User Profile component.
 */
export function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const equippedBadges = useCustomizationStore((s) => s.equippedBadges) ?? [];
  const selectedProfileThemeId = useCustomizationStore((s) => s.selectedProfileThemeId);

  const isOwnProfile = currentUser?.id === userId;

  const {
    profile,
    setProfile,
    isLoading,
    error,
    friendshipStatus,
    setFriendshipStatus,
    unlockedAchievements,
    totalUnlocked,
    showAllAchievements,
    setShowAllAchievements,
  } = useProfileData({ userId, isOwnProfile });

  const actions = useProfileActions({
    profile,
    setProfile,
    isOwnProfile,
    setFriendshipStatus,
  });

  // Guard against broken route params while still allowing UUIDs and profile handles.
  if (!isValidProfileId(userId)) {
    return <ProfileInvalidUser onGoBack={() => navigate(-1)} />;
  }

  if (isLoading) return <ProfileLoadingState />;
  if (error || !profile) return <ProfileErrorState error={error} />;

  const activeProfileTheme = getProfileThemeOrDefault(
    isOwnProfile ? (selectedProfileThemeId ?? profile.profileTheme) : profile.profileTheme
  );

  return (
    <div
      className="relative flex-1 overflow-y-auto bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950"
      data-profile-theme-id={activeProfileTheme.id}
      style={getProfileThemePageStyle(activeProfileTheme)}
    >
      <div className="pointer-events-none absolute inset-0 bg-dark-950/40" />
      <ProfileBanner
        theme={activeProfileTheme}
        isOwnProfile={isOwnProfile}
        editMode={actions.editMode}
        isActioning={actions.isActioning}
        onEditToggle={actions.handleEditToggle}
        onSave={actions.handleSaveProfile}
        onCancel={actions.handleCancelEdit}
      />

      <div className="relative z-10 mx-auto -mt-20 max-w-4xl px-6">
        <motion.div
          {...FADE_UP}
          transition={{ ...tweens.smooth, delay: 0.2 }}
          className="flex items-end gap-6"
        >
          <ProfileAvatar
            profile={profile}
            isOwnProfile={isOwnProfile}
            editMode={actions.editMode}
            isUploading={actions.isUploadingAvatar}
            avatarInputRef={actions.avatarInputRef}
            onAvatarChange={actions.handleAvatarChange}
            onAvatarClick={() => {
              actions.avatarInputRef.current?.click();
              HapticFeedback.medium();
            }}
          />

          <div className="flex flex-1 items-center justify-between pb-2">
            <div>
              <ProfileNameSection profile={profile} />
              {profile.statusMessage && (
                <p className="mt-1 text-sm italic text-white/40">
                  &ldquo;{profile.statusMessage}&rdquo;
                </p>
              )}
            </div>

            {!isOwnProfile && (
              <div className="flex items-center gap-3">
                <TipButton
                  recipientId={profile.id}
                  recipientName={profile.displayName ?? profile.username ?? ''}
                  className="bg-purple-600/20 hover:bg-purple-600/30 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-purple-300 transition-colors"
                />
                <FriendshipActions
                  friendshipStatus={friendshipStatus}
                  isActioning={actions.isActioning}
                  onSendRequest={actions.handleSendRequest}
                  onAcceptRequest={actions.handleAcceptRequest}
                  onDeclineRequest={actions.handleDeclineRequest}
                  onCancelRequest={actions.handleCancelRequest}
                  onRemoveFriend={actions.handleRemoveFriend}
                  onBlockUser={actions.handleBlockUser}
                  onMessage={actions.handleMessage}
                />
                <FollowButton userId={profile.id} />
              </div>
            )}

            {isOwnProfile && actions.editMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2"
              >
                <motion.button
                  onClick={() => navigate('/customize/identity')}
                  className="aurora-social-button flex items-center gap-2 rounded-xl px-4 py-2 font-medium text-white"
                  whileTap={{ scale: 0.88 }}
                >
                  <PaintBrushIcon className="h-4 w-4" />
                  Customize
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div
          {...FADE_UP}
          transition={{ ...tweens.smooth, delay: 0.4 }}
          className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          <div className="space-y-6 md:col-span-2">
            <ProfileAbout
              bio={profile.bio ?? undefined}
              isOwnProfile={isOwnProfile}
              editMode={actions.editMode}
              editedBio={actions.editedBio}
              onBioChange={actions.setEditedBio}
            />

            <XPProgressBar
              currentXP={profile.currentXP ?? profile.totalXP ?? 0}
              level={profile.level ?? 1}
            />

            <EquippedBadgesShowcase
              equippedBadges={equippedBadges}
              achievements={EMPTY_ACHIEVEMENTS}
              editMode={isOwnProfile && actions.editMode}
            />

            <AchievementsShowcase
              achievements={unlockedAchievements}
              totalUnlocked={totalUnlocked}
              totalAchievements={profile?.totalAchievements || 0}
              showAll={showAllAchievements}
              onToggleShowAll={() => setShowAllAchievements(!showAllAchievements)}
            />

            <ProfileStatsGrid profile={profile} />

            <ActivitySummary
              messagesSent={profile.messagesSent}
              postsCreated={profile.postsCreated}
            />

            {profile.mutualFriends !== undefined && profile.mutualFriends > 0 && (
              <GlassCard variant="default" className="aurora-social-panel p-6">
                <h2 className="mb-3 bg-gradient-to-r from-white to-primary-200 bg-clip-text text-lg font-semibold text-transparent">
                  Mutual Friends
                </h2>
                <p className="text-white/40">
                  You have {profile.mutualFriends} mutual friend
                  {profile.mutualFriends !== 1 ? 's' : ''}
                </p>
              </GlassCard>
            )}
          </div>

          <ProfileSidebar profile={profile} isOwnProfile={isOwnProfile} />
        </motion.div>
      </div>
    </div>
  );
}
