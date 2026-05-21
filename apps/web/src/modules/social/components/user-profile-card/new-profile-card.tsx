import { memo } from 'react';

import { DEFAULT_PROFILE_THEME_ID } from '@/data/profileThemes';

import { ActionButtons } from './action-buttons';
import { AvatarZone } from './avatar-zone';
import { BannerCanvas } from './banner-canvas';
import { ACCENT_THEMES } from './constants';
import { IdentitySection } from './identity-section';
import { Nameplate } from './nameplate';
import { CardShell } from './profile-card-shell';
import { PulseDots } from './pulse-dots';
import type { NewProfileCardProps } from './types';

import './profile-card.css';

const NOOP = (): void => {};

export const NewProfileCard = memo(function NewProfileCard({
  user,
  mode = 'popout',
  variant = 'full',
  onMessage = NOOP,
  onTip = NOOP,
  onAddFriend = NOOP,
  onViewProfile = NOOP,
  className,
}: NewProfileCardProps) {
  const theme = ACCENT_THEMES[user.accentTheme ?? DEFAULT_PROFILE_THEME_ID];
  const accentColor = theme.accent;
  const isMini = variant === 'mini';
  const isPreview = mode === 'preview';

  const initials = user.displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const tipEnabled = (user.pulseFilled ?? 0) > 0;

  return (
    <CardShell accentColor={accentColor} className={className}>
      {/* Banner */}
      <BannerCanvas
        bannerType={user.bannerType ?? 'static'}
        accentColor={accentColor}
        bannerBackground={theme.banner}
      />

      {/* Card body with theme surface tint */}
      <div
        style={{
          background: `linear-gradient(180deg, ${theme.surface} 0%, transparent 55%), #08090f`,
        }}
      >
        {/* Accent line */}
        <div
          className="h-px"
          style={{
            background: `linear-gradient(90deg, transparent 0%, color-mix(in srgb, ${accentColor} 28%, transparent) 22%, color-mix(in srgb, ${accentColor} 16%, transparent) 78%, transparent 100%)`,
          }}
        />

        {/* Avatar */}
        <AvatarZone
          avatarUrl={user.avatarUrl}
          displayName={user.displayName}
          initials={initials}
          isOnline={user.isOnline}
          energyRingTier={user.energyRingTier ?? 'dim'}
          accentColor={accentColor}
          avatarBorderId={user.avatarBorderId}
        />

        {/* Nameplate */}
        <Nameplate
          displayName={user.displayName}
          nameplateId={user.nameplateId}
          displayNameFont={user.displayNameFont}
          displayNameEffect={user.displayNameEffect}
          displayNameColor={user.displayNameColor}
          displayNameSecondaryColor={user.displayNameSecondaryColor}
        />

        {/* Identity (compact in mini) */}
        <IdentitySection
          title={user.equippedTitle?.name ?? null}
          titleColor={user.equippedTitle?.color}
          titleAnimationType={user.equippedTitle?.animation?.type}
          titleGradient={user.equippedTitle?.gradient}
          titleLottieUrl={user.equippedTitle?.lottieUrl}
          bio={user.bio ?? null}
          badges={user.profileBadges ?? []}
          accentColor={accentColor}
          compact={isMini}
        />

        {/* Divider + Pulse + Actions (full only shows pulse) */}
        {!isMini && (
          <>
            <div
              className="mx-[1.2rem] my-[0.85rem] h-px"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${theme.border} 20%, ${theme.border} 80%, transparent 100%)`,
              }}
            />

            <PulseDots
              filled={user.pulseFilled ?? 0}
              tier={user.pulseTier ?? 'Newcomer'}
              score={user.pulse ?? 0}
              prefersReducedMotion={true}
            />
          </>
        )}

        {/* Action buttons (hidden in preview mode) */}
        {!isPreview && (
          <ActionButtons
            onMessage={onMessage}
            onTip={onTip}
            onAddFriend={onAddFriend}
            onViewProfile={onViewProfile}
            accentColor={accentColor}
            tipEnabled={tipEnabled}
            compact={isMini}
          />
        )}
      </div>
    </CardShell>
  );
});
