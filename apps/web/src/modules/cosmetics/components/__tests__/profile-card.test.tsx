import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock dependencies

const { mockAuthState, mockCosmeticsState, mockBuildCdnUrl } = vi.hoisted(() => ({
  mockAuthState: {
    user: null as {
      id: string;
      avatarUrl: string | null;
      bannerUrl: string | null;
      displayName: string | null;
      username: string | null;
      bio: string | null;
      badges: string[];
    } | null,
  },
  mockCosmeticsState: {
    memberCosmetics: new Map<
      string,
      {
        avatarHash: string | null;
        bannerHash: string | null;
        accentColor: string | null;
        avatarBorderId: string | null;
        nameplateId: string | null;
        profileFrameId: string | null;
      }
    >(),
  },
  mockBuildCdnUrl: vi.fn().mockReturnValue(null),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: (selector: (s: typeof mockAuthState) => unknown) => selector(mockAuthState),
}));

vi.mock('../../store/cosmetics-store', () => ({
  useCosmeticsStore: (selector: (s: typeof mockCosmeticsState) => unknown) =>
    selector(mockCosmeticsState),
}));

vi.mock('@/lib/cdn', () => ({
  buildCdnUrl: (...args: unknown[]) => mockBuildCdnUrl(...args),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

import { CosmeticProfileCard } from '../profile-card';

// Tests

describe('CosmeticProfileCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.user = null;
    mockCosmeticsState.memberCosmetics = new Map();
    mockBuildCdnUrl.mockReturnValue(null);
  });

  it('renders loading skeleton when profile data is null', () => {
    const { container } = render(<CosmeticProfileCard userId="user-1" groupId={null} />);

    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders own profile display name from currentUser', () => {
    mockAuthState.user = {
      id: 'user-1',
      avatarUrl: '/avatar.png',
      bannerUrl: null,
      displayName: 'TestUser',
      username: 'testuser',
      bio: null,
      badges: [],
    };

    render(<CosmeticProfileCard userId="user-1" groupId={null} />);

    expect(screen.getByText('TestUser')).toBeInTheDocument();
  });

  it('falls back to username when displayName is null', () => {
    mockAuthState.user = {
      id: 'user-1',
      avatarUrl: null,
      bannerUrl: null,
      displayName: null,
      username: 'fallbackuser',
      bio: null,
      badges: [],
    };

    render(<CosmeticProfileCard userId="user-1" groupId={null} />);

    expect(screen.getByText('fallbackuser')).toBeInTheDocument();
  });

  it('falls back to "User" when both displayName and username are null', () => {
    mockAuthState.user = {
      id: 'user-1',
      avatarUrl: null,
      bannerUrl: null,
      displayName: null,
      username: null,
      bio: null,
      badges: [],
    };

    render(<CosmeticProfileCard userId="user-1" groupId={null} />);

    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('renders bio text when present', () => {
    mockAuthState.user = {
      id: 'user-1',
      avatarUrl: null,
      bannerUrl: null,
      displayName: 'User',
      username: 'user',
      bio: 'Hello, I am a tester!',
      badges: [],
    };

    render(<CosmeticProfileCard userId="user-1" groupId={null} />);

    expect(screen.getByText('Hello, I am a tester!')).toBeInTheDocument();
  });

  it('renders avatar image with alt text', () => {
    mockAuthState.user = {
      id: 'user-1',
      avatarUrl: '/my-avatar.png',
      bannerUrl: null,
      displayName: 'TestUser',
      username: 'test',
      bio: null,
      badges: [],
    };

    render(<CosmeticProfileCard userId="user-1" groupId={null} />);

    const avatar = screen.getByAltText('TestUser');
    expect(avatar.getAttribute('src')).toBe('/my-avatar.png');
  });

  it('renders default avatar when avatarUrl is null', () => {
    mockAuthState.user = {
      id: 'user-1',
      avatarUrl: null,
      bannerUrl: null,
      displayName: 'User',
      username: 'u',
      bio: null,
      badges: [],
    };

    render(<CosmeticProfileCard userId="user-1" groupId={null} />);

    const avatar = screen.getByAltText('User');
    expect(avatar.getAttribute('src')).toBe('/images/default-avatar.webp');
  });

  it('renders banner image when bannerUrl is set', () => {
    mockAuthState.user = {
      id: 'user-1',
      avatarUrl: null,
      bannerUrl: '/banner.jpg',
      displayName: 'User',
      username: 'u',
      bio: null,
      badges: [],
    };

    const { container } = render(<CosmeticProfileCard userId="user-1" groupId={null} />);

    // Banner image has empty alt and is inside the banner section
    const imgs = container.querySelectorAll('img');
    const bannerImg = Array.from(imgs).find((img) => img.getAttribute('src') === '/banner.jpg');
    expect(bannerImg).toBeTruthy();
  });

  it('renders other users profile from memberCosmetics', () => {
    mockAuthState.user = {
      id: 'current-user',
      avatarUrl: null,
      bannerUrl: null,
      displayName: 'Me',
      username: 'me',
      bio: null,
      badges: [],
    };
    mockCosmeticsState.memberCosmetics.set('other-user', {
      avatarHash: 'abc123',
      bannerHash: null,
      accentColor: '#ff0000',
      avatarBorderId: null,
      nameplateId: null,
      profileFrameId: null,
    });
    mockBuildCdnUrl.mockImplementation((hash: string, type: string) => {
      if (hash === 'abc123' && type === 'avatar') return '/cdn/abc123.webp';
      return null;
    });

    render(<CosmeticProfileCard userId="other-user" groupId={null} />);

    // Other user's profile shows "User" as displayName
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('renders skeleton for unknown other users', () => {
    mockAuthState.user = {
      id: 'current-user',
      avatarUrl: null,
      bannerUrl: null,
      displayName: 'Me',
      username: 'me',
      bio: null,
      badges: [],
    };

    const { container } = render(<CosmeticProfileCard userId="unknown-user" groupId={null} />);

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders badge fallback stars when CDN returns null', () => {
    mockAuthState.user = {
      id: 'user-1',
      avatarUrl: null,
      bannerUrl: null,
      displayName: 'BadgeUser',
      username: 'bu',
      bio: null,
      badges: ['early-adopter', 'contributor'],
    };
    mockBuildCdnUrl.mockReturnValue(null);

    render(<CosmeticProfileCard userId="user-1" groupId={null} />);

    const stars = screen.getAllByText('★');
    expect(stars.length).toBe(2);
  });

  it('applies custom className', () => {
    const { container } = render(
      <CosmeticProfileCard userId="no-user" groupId={null} className="extra-class" />
    );

    const el = container.firstElementChild;
    expect(el?.className).toContain('extra-class');
  });

  it('renders badges as images when CDN URL is available', () => {
    mockAuthState.user = {
      id: 'user-1',
      avatarUrl: null,
      bannerUrl: null,
      displayName: 'User',
      username: 'u',
      bio: null,
      badges: ['vip'],
    };
    mockBuildCdnUrl.mockImplementation((hash: string, type: string) => {
      if (type === 'badge') return `/cdn/badge-${hash}.png`;
      return null;
    });

    render(<CosmeticProfileCard userId="user-1" groupId={null} />);

    const badgeImg = screen.getByAltText('Badge: vip');
    expect(badgeImg.getAttribute('src')).toBe('/cdn/badge-vip.png');
  });
});
