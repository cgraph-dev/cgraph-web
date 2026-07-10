/** @module profile-name-section tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileNameSection } from '../profile-name-section';
import type { UserProfileData } from '@/types/profile.types';

vi.mock('@heroicons/react/24/outline', () => ({
  ShieldCheckIcon: () => <span data-testid="premium-icon" />,
  CheckBadgeIcon: () => <span data-testid="verified-icon" />,
}));

// NOTE: vi.mock('@/modules/gamification/components/title-badge') removed — module was deleted.
// Tests referencing TitleBadge / data-testid="title-badge" may need updating.

vi.mock('@/lib/animation-presets', () => ({
  springs: { bouncy: {} },
}));

vi.mock('@/shared/components/ui', () => ({
  InlineTitle: ({ titleId }: { titleId: string }) => <span>{titleId}</span>,
}));

function makeProfile(overrides: Partial<UserProfileData> = {}): UserProfileData {
  return {
    id: 'u1',
    username: 'alice',
    displayName: 'Alice Smith',
    avatarUrl: null,
    bannerUrl: null,
    bio: null,
    status: 'online',
    statusMessage: null,
    isVerified: false,
    isPremium: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ProfileNameSection', () => {
  it('renders display name when available', () => {
    render(<ProfileNameSection profile={makeProfile()} />);
    expect(screen.getByText('Alice Smith')).toBeTruthy();
  });

  it('falls back to username when displayName is null', () => {
    render(<ProfileNameSection profile={makeProfile({ displayName: null })} />);
    expect(screen.getByText('alice')).toBeTruthy();
  });

  it('shows @username', () => {
    render(<ProfileNameSection profile={makeProfile()} />);
    expect(screen.getByText('@alice')).toBeTruthy();
  });

  it('shows verified badge when isVerified', () => {
    render(<ProfileNameSection profile={makeProfile({ isVerified: true })} />);
    expect(screen.getByTestId('verified-icon')).toBeTruthy();
  });

  it('shows premium badge when isPremium', () => {
    render(<ProfileNameSection profile={makeProfile({ isPremium: true })} />);
    expect(screen.getByTestId('premium-icon')).toBeTruthy();
  });

  it('does not show badges when not verified or premium', () => {
    render(<ProfileNameSection profile={makeProfile()} />);
    expect(screen.queryByTestId('verified-icon')).toBeNull();
    expect(screen.queryByTestId('premium-icon')).toBeNull();
  });

  it('shows title badge when equippedTitle is set', () => {
    render(<ProfileNameSection profile={makeProfile({ equippedTitle: 'Legend' })} />);
    expect(screen.getByText('Legend')).toBeTruthy();
  });

  it('shows status message when present', () => {
    render(<ProfileNameSection profile={makeProfile({ statusMessage: 'AFK' })} />);
    expect(screen.getByText('AFK')).toBeTruthy();
  });

  it('uses the canonical backend tier when displaying top-community Pulse', () => {
    render(
      <ProfileNameSection
        profile={makeProfile({
          topCommunities: [
            { forumId: 'forum-1', forumName: 'Community', score: 49, tier: 'active' },
            { forumId: 'forum-2', forumName: 'CGraph', score: 50, tier: 'trusted' },
          ],
        })}
      />
    );

    expect(screen.getByLabelText('Pulse score: 99 (Trusted)')).toBeInTheDocument();
  });

  it('hides status message when absent', () => {
    render(<ProfileNameSection profile={makeProfile()} />);
    // No extra text beyond name/username
    expect(screen.queryByText('AFK')).toBeNull();
  });
});
