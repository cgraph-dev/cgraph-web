import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { http } from '@/lib/api-client';
import { useProfileData } from '../useProfileData';

const { httpGet, loggerError } = vi.hoisted(() => ({
  httpGet: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    get: httpGet,
  },
}));

vi.mock('@/lib/logger', () => ({
  authLogger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
  createLogger: () => ({ debug: vi.fn(), error: loggerError, warn: vi.fn() }),
}));

const mockedGet = vi.mocked(http.get);

function profilePayload(overrides: Record<string, unknown> = {}) {
  return {
    id: 'profile-user',
    username: 'profileuser',
    display_name: 'Profile User',
    avatar_url: null,
    banner_url: null,
    bio: null,
    status: 'offline',
    inserted_at: '2026-07-09T00:00:00.000Z',
    ...overrides,
  };
}

function renderProfileData() {
  return renderHook(() =>
    useProfileData({
      profileHandle: 'profileuser',
      lookupMode: 'username',
      isOwnProfile: false,
    })
  );
}

describe('user-profile useProfileData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates blocked state above stale friendship fields', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: profilePayload({
          friendship_status: 'friends',
          is_friend: true,
          is_blocked: true,
        }),
      },
    });

    const { result } = renderProfileData();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.friendshipStatus).toBe('blocked');
    expect(mockedGet).toHaveBeenCalledWith(
      '/api/v1/users/profileuser/profile',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('hydrates incoming request booleans when explicit status is absent or invalid', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: profilePayload({
          friendship_status: 'unknown',
          friend_request_received: true,
        }),
      },
    });

    const { result } = renderProfileData();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.friendshipStatus).toBe('pending_received');
  });

  it('hydrates outgoing request booleans for full profile actions', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: profilePayload({
          friend_request_sent: true,
        }),
      },
    });

    const { result } = renderProfileData();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.friendshipStatus).toBe('pending_sent');
  });

  it('normalizes nested cosmetic records into profile renderer ids', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: profilePayload({
          equipped_title: { id: 'title-founder', name: 'Founder' },
          equipped_nameplate: { id: 'plate_gilded_sapphire_loop_01', name: 'Gilded' },
          profile_theme: { id: 'aurora-glass', name: 'Aurora Glass' },
          avatar_border: { id: 'border_cyberpunk_common_01', name: 'Cyberpunk' },
        }),
      },
    });

    const { result } = renderProfileData();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toMatchObject({
      equippedTitle: 'title-founder',
      equippedNameplateId: 'plate_gilded_sapphire_loop_01',
      profileTheme: 'aurora-glass',
      avatarBorderId: 'border_cyberpunk_common_01',
    });
  });

  it('uses current title object id when no equipped title id is present', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: profilePayload({
          current_title: { id: 'title-current', name: 'Current Title' },
        }),
      },
    });

    const { result } = renderProfileData();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile?.equippedTitle).toBe('title-current');
  });

  it('normalizes raw stats, community rows, links, and profile dates before rendering', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: profilePayload({
          inserted_at: { invalid: true },
          created_at: '2026-07-08T12:30:00.000Z',
          top_communities: [
            {
              forum_id: 'nodes',
              forum_name: 'Nodes',
              score: '1250',
              tier: 'trusted',
            },
            {
              forum_id: 'missing-name',
              score: 50,
              tier: 'active',
            },
            'not-a-community',
          ],
          mutual_friends_count: '3',
          location: 42,
          website: 'cgraph.org/profile',
          level: '7',
          total_xp: '12345',
          current_xp: '345',
          login_streak: '6',
          achievement_count: '2',
          total_achievements: '9',
          messages_sent: '101',
          posts_created: '12',
          friends_count: '8',
        }),
      },
    });

    const { result } = renderProfileData();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toMatchObject({
      createdAt: '2026-07-08T12:30:00.000Z',
      topCommunities: [{ forumId: 'nodes', forumName: 'Nodes', score: 1250, tier: 'trusted' }],
      mutualFriends: 3,
      website: 'https://cgraph.org/profile',
      level: 7,
      totalXP: 12345,
      currentXP: 345,
      loginStreak: 6,
      achievementCount: 2,
      totalAchievements: 9,
      messagesSent: 101,
      postsCreated: 12,
      friendsCount: 8,
    });
    expect(result.current.profile?.location).toBeUndefined();
  });

  it('drops unsafe profile website protocols', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: profilePayload({
          website: 'javascript:alert(1)',
        }),
      },
    });

    const { result } = renderProfileData();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile?.website).toBeUndefined();
  });

  it('normalizes identity text and boolean fallbacks before rendering', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: profilePayload({
          id: 42,
          username: { invalid: true },
          display_name: { invalid: true },
          banner_url: { invalid: true },
          bio: ['not bio'],
          custom_status: 123,
          status_message: { text: 'busy' },
          is_verified: 'false',
          is_premium: 'true',
          display_name_font: 12,
          display_name_effect: { name: 'spark' },
          display_name_color: '',
          display_name_secondary_color: ['#fff'],
        }),
      },
    });

    const { result } = renderProfileData();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toMatchObject({
      id: 'profileuser',
      username: 'profileuser',
      displayName: null,
      avatarUrl: null,
      bannerUrl: null,
      bio: null,
      statusMessage: null,
      isVerified: false,
      isPremium: false,
      displayNameFont: null,
      displayNameEffect: null,
      displayNameColor: null,
      displayNameSecondaryColor: null,
    });
  });
});
