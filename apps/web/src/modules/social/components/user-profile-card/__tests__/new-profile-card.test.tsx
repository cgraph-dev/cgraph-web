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

  it('renders mini profile background and live profile signal metrics', () => {
    const { container } = render(<NewProfileCard user={user} mode="preview" variant="mini" />);

    const themedBody = container.querySelector<HTMLElement>('[data-profile-background-image]');
    const backgroundImage = themedBody?.dataset.profileBackgroundImage;

    expect(backgroundImage).toContain('/mini-profile-background/');
    expect(backgroundImage).toContain('mini_signal_noir_founder');
    expect(screen.getByText('Cipher One')).toBeInTheDocument();
    expect(screen.getByText('Pulse')).toBeInTheDocument();
    expect(screen.getByText('Streak')).toBeInTheDocument();
    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByText('Network')).toBeInTheDocument();
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

    expect(themedBody?.dataset.profileBackgroundImage).toContain('mini_void_relay');
    expect(themedBody).toHaveClass('cgraph-game-profile-surface');
  });
});
