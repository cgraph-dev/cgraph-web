import { memo } from 'react';
import { X } from 'lucide-react';

import { DEFAULT_PROFILE_THEME_ID } from '@/data/profileThemes';

import { ActionButtons } from './action-buttons';
import { AvatarZone } from './avatar-zone';
import { BannerCanvas } from './banner-canvas';
import { ACCENT_THEMES, normalizeAccentThemeId } from './constants';
import { IdentitySection } from './identity-section';
import { Nameplate } from './nameplate';
import { CardShell } from './profile-card-shell';
import { PulseDots } from './pulse-dots';
import { ProfileSignalsStrip } from './profile-signals-strip';
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
  onClose,
  className,
}: NewProfileCardProps) {
  const themeId = user.accentTheme ?? normalizeAccentThemeId(user.profile_theme) ?? DEFAULT_PROFILE_THEME_ID;
  const theme = ACCENT_THEMES[themeId] ?? ACCENT_THEMES[DEFAULT_PROFILE_THEME_ID];
  const accentColor = theme.accent;
  const isMini = variant === 'mini';
  const isPreview = mode === 'preview';
  const nameplateId = user.nameplateId ?? user.equipped_nameplate;
  const displayNameFont = user.displayNameFont ?? user.display_name_font;
  const displayNameEffect = user.displayNameEffect ?? user.display_name_effect;
  const displayNameColor = user.displayNameColor ?? user.display_name_color;
  const displayNameSecondaryColor =
    user.displayNameSecondaryColor ?? user.display_name_secondary_color;
  const bannerBackgroundImage = isMini
    ? (theme.miniProfileBackgroundImage ?? theme.previewImage)
    : (theme.profileBackgroundImage ?? theme.previewImage);
  const cardBackgroundImage = isMini
    ? theme.miniProfileBackgroundImage
    : theme.profileBackgroundImage;

  const initials = user.displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const tipEnabled = (user.pulseFilled ?? 0) > 0;
  const showCloseButton = variant === 'full' && mode === 'popout' && Boolean(onClose);

  return (
    <CardShell accentColor={accentColor} className={className} profileThemeId={themeId}>
      {showCloseButton && (
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/45 text-white/70 shadow-lg backdrop-blur transition hover:border-white/20 hover:bg-black/65 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      {/* Banner */}
      <BannerCanvas
        bannerType={user.bannerType ?? 'static'}
        accentColor={accentColor}
        bannerBackground={theme.banner}
        backgroundImage={bannerBackgroundImage}
      />

      {/* Card body with theme surface tint */}
      <div
        data-profile-background-image={cardBackgroundImage ?? undefined}
        style={{
          background: cardBackgroundImage
            ? `linear-gradient(180deg, rgba(8,9,15,0.58) 0%, rgba(8,9,15,0.9) 52%, #08090f 100%), linear-gradient(180deg, ${theme.surface} 0%, transparent 55%), url("${cardBackgroundImage}") center top / cover no-repeat, #08090f`
            : `linear-gradient(180deg, ${theme.surface} 0%, transparent 55%), #08090f`,
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
          nameplateId={nameplateId}
          displayNameFont={displayNameFont}
          displayNameEffect={displayNameEffect}
          displayNameColor={displayNameColor}
          displayNameSecondaryColor={displayNameSecondaryColor}
        />

        {/* Identity (compact in mini) */}
        <IdentitySection
          title={user.equippedTitle?.name ?? null}
          titleColor={user.equippedTitle?.color}
          titleAnimationType={user.equippedTitle?.animation?.type}
          titleGradient={user.equippedTitle?.gradient}
          titleLottieUrl={user.equippedTitle?.lottieUrl}
          titleImageUrl={user.equippedTitle?.imageUrl}
          bio={user.bio ?? null}
          badges={user.profileBadges ?? []}
          accentColor={accentColor}
          compact={isMini}
        />

        <ProfileSignalsStrip
          pulse={user.pulse ?? 0}
          streak={user.streak ?? 0}
          postCount={user.postCount ?? 0}
          friendCount={user.friendCount ?? 0}
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
