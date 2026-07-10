import { render, screen } from '@testing-library/react';
import type { Achievement } from '@cgraph-dev/shared-types';
import type React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserProfile } from '../user-profile';

const {
  actionMocks,
  authState,
  customizationState,
  navigateMock,
  profileDataState,
  showcaseState,
} = vi.hoisted(() => ({
  actionMocks: {
    handleAvatarChange: vi.fn(),
    handleAvatarClick: vi.fn(),
    handleCancelEdit: vi.fn(),
    handleEditToggle: vi.fn(),
    handleSaveProfile: vi.fn(),
    setEditedBio: vi.fn(),
  },
  authState: {
    user: {
      id: 'profile-user',
      username: 'alice',
    },
  },
  customizationState: {
    equippedBadges: ['first_message'],
    selectedProfileThemeId: null as string | null,
  },
  navigateMock: vi.fn(),
  profileDataState: {
    profile: {
      id: 'profile-user',
      username: 'alice',
      displayName: 'Alice',
      avatarUrl: null,
      bannerUrl: null,
      bio: null,
      status: 'online',
      statusMessage: null,
      isVerified: false,
      isPremium: false,
      createdAt: '2026-07-10T00:00:00.000Z',
      level: 1,
      totalXP: 0,
      currentXP: 0,
      loginStreak: 0,
      achievementCount: 0,
      totalAchievements: 0,
      messagesSent: 0,
      postsCreated: 0,
      friendsCount: 0,
      profileTheme: null,
    },
    setProfile: vi.fn(),
    isLoading: false,
    error: null,
    friendshipStatus: 'none',
    setFriendshipStatus: vi.fn(),
    unlockedAchievements: [] as Achievement[],
    totalUnlocked: 0,
    showAllAchievements: false,
    setShowAllAchievements: vi.fn(),
  },
  showcaseState: {
    equippedBadgesProps: null as {
      equippedBadges: readonly string[];
      achievements: Achievement[];
      editMode: boolean;
    } | null,
  },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();

  return {
    ...actual,
    useLocation: () => ({ pathname: '/alice' }),
    useNavigate: () => navigateMock,
    useParams: () => ({ username: 'alice' }),
  };
});

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      className,
      style,
    }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
      <div className={className} style={style}>
        {children}
      </div>
    ),
    button: ({
      children,
      className,
      onClick,
    }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => (
      <button className={className} onClick={onClick} type="button">
        {children}
      </button>
    ),
  },
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => authState,
}));

vi.mock('@/modules/settings/store/customization/customizationStore', () => ({
  useCustomizationStore: (selector: (state: typeof customizationState) => unknown) =>
    selector(customizationState),
}));

vi.mock('@/data/profileThemes', () => ({
  getProfileThemeOrDefault: () => ({
    id: 'aurora-glass',
    accentPrimary: '#8b5cf6',
    accentSecondary: '#06b6d4',
    backgroundGradient: ['#0f172a', '#111827'],
  }),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <section className={className}>{children}</section>
  ),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    light: vi.fn(),
    medium: vi.fn(),
  },
}));

vi.mock('@/lib/animation-presets', () => ({
  tweens: { smooth: {} },
}));

vi.mock('@/lib/animations/transitions', () => ({
  FADE_UP: {},
}));

vi.mock('@/lib/profile-route', () => ({
  isCanonicalUsername: () => true,
  isValidProfileHandle: () => true,
  publicProfilePath: () => '/alice',
}));

vi.mock('@/modules/social/components', () => ({
  AchievementsShowcase: () => <div data-testid="achievements-showcase" />,
  EquippedBadgesShowcase: (props: {
    equippedBadges: readonly string[];
    achievements: Achievement[];
    editMode: boolean;
  }) => {
    showcaseState.equippedBadgesProps = props;

    return (
      <div data-testid="equipped-badges-showcase">
        {props.achievements.map((achievement) => (
          <span key={achievement.id}>{achievement.title}</span>
        ))}
      </div>
    );
  },
  ProfileErrorState: ({ error }: { error: string | null }) => <div>{error}</div>,
  ProfileInvalidUser: () => <div>Invalid user</div>,
  ProfileLoadingState: () => <div>Loading profile</div>,
  ProfileSidebar: () => <aside data-testid="profile-sidebar" />,
  ProfileStatsGrid: () => <div data-testid="profile-stats" />,
}));

vi.mock('@/modules/nodes/components/tip-button', () => ({
  TipButton: () => <button type="button">Tip</button>,
}));

vi.mock('../profile-banner', () => ({
  ProfileBanner: () => <div data-testid="profile-banner" />,
}));

vi.mock('../profile-avatar', () => ({
  ProfileAvatar: () => <div data-testid="profile-avatar" />,
}));

vi.mock('../profile-name-section', () => ({
  ProfileNameSection: () => <div data-testid="profile-name" />,
}));

vi.mock('../friendship-actions', () => ({
  FriendshipActions: () => <div data-testid="friendship-actions" />,
}));

vi.mock('../follow-button', () => ({
  FollowButton: () => <button type="button">Follow</button>,
}));

vi.mock('../profile-about', () => ({
  ProfileAbout: () => <section data-testid="profile-about" />,
}));

vi.mock('../hooks/useProfileData', () => ({
  useProfileData: () => profileDataState,
}));

vi.mock('../hooks/useProfileActions', () => ({
  useProfileActions: () => ({
    editMode: false,
    isActioning: false,
    isUploadingAvatar: false,
    avatarInputRef: { current: null },
    editedBio: '',
    ...actionMocks,
  }),
}));

describe('UserProfile equipped badge showcase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    customizationState.equippedBadges = ['first_message'];
    customizationState.selectedProfileThemeId = null;
    showcaseState.equippedBadgesProps = null;
  });

  it('passes catalog-resolved equipped badges into the showcase', () => {
    render(<UserProfile />);

    expect(screen.getByTestId('equipped-badges-showcase')).toHaveTextContent('First Contact');
    expect(showcaseState.equippedBadgesProps).toMatchObject({
      equippedBadges: ['first_message'],
      achievements: [
        {
          id: 'first_message',
          title: 'First Contact',
          icon: '💬',
          rarity: 'common',
          unlocked: true,
        },
      ],
      editMode: false,
    });
  });

  it('keeps unknown local badge ids renderable with a CGraph fallback record', () => {
    customizationState.equippedBadges = ['founder_badge'];

    render(<UserProfile />);

    expect(screen.getByTestId('equipped-badges-showcase')).toHaveTextContent('Founder Badge');
    expect(showcaseState.equippedBadgesProps?.achievements).toMatchObject([
      {
        id: 'founder_badge',
        title: 'Founder Badge',
        category: 'social',
        rarity: 'common',
        unlocked: true,
      },
    ]);
  });
});
