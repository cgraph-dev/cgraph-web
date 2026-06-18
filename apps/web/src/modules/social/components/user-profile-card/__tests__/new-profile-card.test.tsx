import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ProfileCardUserV2 } from '../types';

vi.mock('@/modules/social/components/avatar/avatar-border-renderer', () => ({
  AvatarBorderRenderer: ({ alt }: { alt: string }) => (
    <div data-testid="avatar-border-renderer">{alt}</div>
  ),
}));

vi.mock('@/lib/lottie/lottie-asset-renderer', () => ({
  LottieAssetRenderer: ({ label }: { label: string }) => <div data-testid="lottie">{label}</div>,
}));

import { NewProfileCard } from '../new-profile-card';

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
    const themedHeader = container.querySelector<HTMLElement>('[data-profile-theme-header-image]');
    const avatarZone = container.querySelector<HTMLElement>('[data-avatar-zone-variant]');
    const backgroundImage = themedBody?.dataset.profileBackgroundImage;

    expect(themedHeader?.dataset.profileThemeHeaderImage).toContain('/mini-profile-background/');
    expect(themedHeader?.dataset.profileCardBannerVariant).toBe('mini');
    expect(avatarZone?.dataset.avatarZoneVariant).toBe('mini');
    expect(avatarZone?.dataset.avatarSize).toBe('82');
    expect(backgroundImage).toContain('/mini-profile-background/');
    expect(backgroundImage).toContain('mini_signal_noir');
    expect(screen.getByText('Cipher One')).toBeInTheDocument();
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
    const themedHeader = container.querySelector<HTMLElement>('[data-profile-theme-header-image]');

    expect(themedHeader?.dataset.profileThemeHeaderImage).toContain('mini_deep_space');
    expect(themedBody?.dataset.profileBackgroundImage).toContain('mini_deep_space');
    expect(themedBody).toHaveClass('cgraph-game-profile-surface');
  });

  it('uses the full profile background as the full-card animated header media', () => {
    const { container } = render(<NewProfileCard user={user} mode="preview" variant="full" />);

    const themedHeader = container.querySelector<HTMLElement>('[data-profile-theme-header-image]');
    const avatarZone = container.querySelector<HTMLElement>('[data-avatar-zone-variant]');

    expect(themedHeader?.dataset.profileThemeHeaderImage).toContain('/profile-background/');
    expect(themedHeader?.dataset.profileThemeHeaderImage).toContain('profile_signal_noir');
    expect(themedHeader?.dataset.profileCardBannerVariant).toBe('full');
    expect(avatarZone?.dataset.avatarZoneVariant).toBe('full');
    expect(avatarZone?.dataset.avatarSize).toBe('98');
  });
});
