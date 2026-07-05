import { render, screen } from '@testing-library/react';
import { getProfileRenderingAnchorOrDefault } from '@cgraph-dev/shared-types';
import { describe, expect, it, vi } from 'vitest';

import type { ProfileCardUserV2 } from '../types';

vi.mock('@/modules/social/components/avatar/avatar-border-renderer', () => ({
  AvatarBorderRenderer: ({
    alt,
    size,
    avatarScale,
    className,
  }: {
    alt: string;
    size?: number;
    avatarScale?: number;
    className?: string;
  }) => (
    <div
      className={className}
      data-testid="avatar-border-renderer"
      data-size={size}
      data-avatar-scale={avatarScale}
    >
      {alt}
    </div>
  ),
}));

vi.mock('@/lib/lottie/lottie-asset-renderer', () => ({
  LottieAssetRenderer: ({ label }: { label: string }) => <div data-testid="lottie">{label}</div>,
}));

import { NewProfileCard } from '../new-profile-card';

const MINI_PROFILE_ANCHOR = getProfileRenderingAnchorOrDefault('mini-card').avatar;
const FULL_PROFILE_ANCHOR = getProfileRenderingAnchorOrDefault('full-profile').avatar;

describe('NewProfileCard', () => {
  const user: ProfileCardUserV2 = {
    id: 'u1',
    username: 'cipher',
    displayName: 'Cipher One',
    avatarUrl: '',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    pulse: 2450,
    streak: 12,
    postCount: 128,
    friendCount: 42,
    isOnline: true,
    accentTheme: 'signal-noir',
    profileBadges: [],
  };

  it('renders mini profile background without the redundant signal metrics panel', () => {
    const { container } = render(<NewProfileCard user={user} mode="preview" variant="mini" />);

    const themedBody = container.querySelector<HTMLElement>('[data-profile-background-image]');
    const themedHeader = container.querySelector<HTMLElement>('[data-profile-card-banner-variant]');
    const cardShell = container.querySelector<HTMLElement>('[data-profile-card-background-image]');
    const avatarZone = container.querySelector<HTMLElement>('[data-avatar-zone-variant]');
    const backgroundImage = themedBody?.dataset.profileBackgroundImage;

    expect(themedHeader?.dataset.profileThemeHeaderImage).toBeUndefined();
    expect(themedHeader?.dataset.profileCardBannerVariant).toBe('mini');
    expect(themedHeader?.dataset.profileCardBannerDecorative).toBe('false');
    expect(themedBody?.dataset.profileCardLayout).toBe('fixed-identity-skeleton');
    expect(themedBody?.dataset.profileThemeSurface).toBe('normalized');
    expect(avatarZone?.dataset.avatarZoneVariant).toBe('mini');
    expect(avatarZone?.dataset.avatarSize).toBe(String(MINI_PROFILE_ANCHOR.avatarSize));
    expect(avatarZone?.dataset.avatarFrameSize).toBe(String(MINI_PROFILE_ANCHOR.frameSize));
    expect(avatarZone?.dataset.avatarLayoutAnchor).toBe('fixed');
    expect(avatarZone?.dataset.avatarAnchorY).toBe(String(MINI_PROFILE_ANCHOR.anchorY));
    expect(cardShell?.dataset.profileCardBackgroundImage).toContain('/mini-profile-background/');
    expect(backgroundImage).toContain('/mini-profile-background/');
    expect(backgroundImage).toContain('mini_signal_noir');
    expect(themedBody).toHaveClass('overflow-visible');
    expect(screen.getByText('Cipher One')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('2450')).toBeInTheDocument();
    expect(screen.queryByText('Pulse')).not.toBeInTheDocument();
    expect(screen.queryByText('Streak')).not.toBeInTheDocument();
    expect(screen.queryByText('Posts')).not.toBeInTheDocument();
    expect(screen.queryByText('Network')).not.toBeInTheDocument();
  });

  it('renders enriched game theme backgrounds for non-default profile themes', () => {
    const { container } = render(
      <NewProfileCard
        user={{ ...user, accentTheme: 'deep-space', profile_theme: 'deep-space' }}
        mode="preview"
        variant="mini"
      />
    );

    const themedBody = container.querySelector<HTMLElement>('[data-profile-background-image]');
    const themedHeader = container.querySelector<HTMLElement>('[data-profile-card-banner-variant]');
    const cardShell = container.querySelector<HTMLElement>('[data-profile-card-background-image]');

    expect(themedHeader?.dataset.profileThemeHeaderImage).toBeUndefined();
    expect(themedHeader?.dataset.profileCardBannerDecorative).toBe('false');
    expect(cardShell?.dataset.profileCardBackgroundImage).toContain('mini_deep_space');
    expect(themedBody?.dataset.profileBackgroundImage).toContain('mini_deep_space');
    expect(themedBody).toHaveClass('cgraph-game-profile-surface');
    expect(themedBody).toHaveClass('overflow-visible');
  });

  it('uses the full profile background once as the full-card theme surface', () => {
    const { container } = render(<NewProfileCard user={user} mode="preview" variant="full" />);

    const themedHeader = container.querySelector<HTMLElement>('[data-profile-card-banner-variant]');
    const themedBody = container.querySelector<HTMLElement>('[data-profile-background-image]');
    const cardShell = container.querySelector<HTMLElement>('[data-profile-card-background-image]');
    const avatarZone = container.querySelector<HTMLElement>('[data-avatar-zone-variant]');

    expect(themedHeader?.dataset.profileThemeHeaderImage).toBeUndefined();
    expect(themedHeader?.dataset.profileCardBannerDecorative).toBe('false');
    expect(cardShell?.dataset.profileCardBackgroundImage).toContain('/profile-background/');
    expect(cardShell?.dataset.profileCardBackgroundImage).toContain('profile_signal_noir');
    expect(themedBody?.dataset.profileBackgroundImage).toContain('profile_signal_noir');
    expect(themedBody).toHaveClass('overflow-visible');
    expect(themedHeader?.dataset.profileCardBannerVariant).toBe('full');
    expect(avatarZone?.dataset.avatarZoneVariant).toBe('full');
    expect(avatarZone?.dataset.avatarSize).toBe(String(FULL_PROFILE_ANCHOR.avatarSize));
  });

  it('renders the supplied avatar image above the profile theme surface', () => {
    render(
      <NewProfileCard
        user={{ ...user, avatarUrl: 'https://cdn.example.com/avatar.jpg' }}
        mode="preview"
        variant="mini"
      />
    );

    expect(screen.getByRole('img', { name: 'Cipher One' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/avatar.jpg'
    );
  });

  it('renders backend-relative avatar paths in the profile card avatar zone', () => {
    render(
      <NewProfileCard
        user={{ ...user, avatarUrl: '/uploads/avatars/u1/avatar.jpg' }}
        mode="preview"
        variant="mini"
      />
    );

    expect(screen.getByRole('img', { name: 'Cipher One' })).toHaveAttribute(
      'src',
      expect.stringContaining('/uploads/avatars/u1/avatar.jpg')
    );
  });

  it('keeps the mini avatar skeleton fixed across theme changes and avatar borders', () => {
    const { container, rerender } = render(
      <NewProfileCard
        user={{ ...user, accentTheme: 'deep-space', avatarBorderId: 'border_8bit_common_01' }}
        mode="preview"
        variant="mini"
      />
    );

    const firstAvatarZone = container.querySelector<HTMLElement>('[data-avatar-zone-variant]');
    const firstStatusDot = container.querySelector<HTMLElement>('[data-avatar-status-dot]');
    const firstRenderer = screen.getByTestId('avatar-border-renderer');

    expect(firstAvatarZone?.dataset.avatarLayoutAnchor).toBe('fixed');
    expect(firstAvatarZone?.dataset.avatarSize).toBe(String(MINI_PROFILE_ANCHOR.avatarSize));
    expect(firstAvatarZone?.dataset.avatarFrameSize).toBe(String(MINI_PROFILE_ANCHOR.frameSize));
    expect(firstAvatarZone?.dataset.avatarAnchorY).toBe(String(MINI_PROFILE_ANCHOR.anchorY));
    expect(firstStatusDot?.dataset.statusAttachedTo).toBe(MINI_PROFILE_ANCHOR.statusAttachedTo);
    expect(firstRenderer).toHaveAttribute('data-size', String(MINI_PROFILE_ANCHOR.frameSize));
    expect(Number(firstRenderer.getAttribute('data-avatar-scale'))).toBeCloseTo(
      MINI_PROFILE_ANCHOR.avatarSize / MINI_PROFILE_ANCHOR.frameSize,
      4
    );

    rerender(
      <NewProfileCard
        user={{ ...user, accentTheme: 'sakura-dream', avatarBorderId: 'border_8bit_common_01' }}
        mode="preview"
        variant="mini"
      />
    );

    const nextAvatarZone = container.querySelector<HTMLElement>('[data-avatar-zone-variant]');
    const nextStatusDot = container.querySelector<HTMLElement>('[data-avatar-status-dot]');
    const nextRenderer = screen.getByTestId('avatar-border-renderer');

    expect(nextAvatarZone?.dataset.avatarLayoutAnchor).toBe(firstAvatarZone?.dataset.avatarLayoutAnchor);
    expect(nextAvatarZone?.dataset.avatarSize).toBe(firstAvatarZone?.dataset.avatarSize);
    expect(nextAvatarZone?.dataset.avatarFrameSize).toBe(firstAvatarZone?.dataset.avatarFrameSize);
    expect(nextAvatarZone?.dataset.avatarAnchorY).toBe(firstAvatarZone?.dataset.avatarAnchorY);
    expect(nextStatusDot?.dataset.statusAttachedTo).toBe(firstStatusDot?.dataset.statusAttachedTo);
    expect(nextRenderer).toHaveAttribute('data-size', firstRenderer.getAttribute('data-size'));
  });
});
