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
    const themedHeader = container.querySelector<HTMLElement>('[data-profile-card-banner-variant]');
    const cardShell = container.querySelector<HTMLElement>('[data-profile-card-background-image]');
    const avatarZone = container.querySelector<HTMLElement>('[data-avatar-zone-variant]');
    const backgroundImage = themedBody?.dataset.profileBackgroundImage;

    expect(themedHeader?.dataset.profileThemeHeaderImage).toBeUndefined();
    expect(themedHeader?.dataset.profileCardBannerVariant).toBe('mini');
    expect(themedHeader?.dataset.profileCardBannerDecorative).toBe('false');
    expect(avatarZone?.dataset.avatarZoneVariant).toBe('mini');
    expect(avatarZone?.dataset.avatarSize).toBe('82');
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
    expect(avatarZone?.dataset.avatarSize).toBe('98');
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
});
