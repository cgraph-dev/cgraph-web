import { expect, test, type Page, type Route } from '@playwright/test';

const GROUP_ID = 'social-group';
const CHANNEL_ID = 'social-general';
const NOTIFICATION_ID = 'notif-social-group';
const REQUEST_ID = 'request-social-1';
const DECLINE_REQUEST_ID = 'request-social-2';
const SENT_REQUEST_ID = 'sent-social-1';
const FRIENDSHIP_ID = 'friendship-social-1';
const FRIEND_ID = 'social-friend';
const DISCOVERED_USER_ID = 'social-discovered-user';
const PROFILE_INCOMING_REQUEST_ID = 'profile-request-incoming';
const PROFILE_INCOMING_USER_ID = 'profile-incoming-user';
const PROFILE_OUTGOING_REQUEST_ID = 'profile-request-outgoing';
const PROFILE_OUTGOING_USER_ID = 'profile-outgoing-user';
const PROFILE_FRIENDSHIP_ID = 'profile-friendship-1';
const PROFILE_FRIEND_ID = 'profile-friend';

const pendingUser = {
  id: 'pending-user',
  username: 'ada',
  display_name: 'Ada Lovelace',
  avatar_url: null,
};

const declinedUser = {
  id: 'declined-user',
  username: 'grace',
  display_name: 'Grace Hopper',
  avatar_url: null,
};

const outgoingUser = {
  id: 'outgoing-user',
  username: 'katherine',
  display_name: 'Katherine Johnson',
  avatar_url: null,
};

const existingFriend = {
  id: FRIEND_ID,
  username: 'alan',
  display_name: 'Alan Turing',
  avatar_url: null,
};

const discoveredUser = {
  id: DISCOVERED_USER_ID,
  username: 'dorothy',
  display_name: 'Dorothy Vaughan',
  avatar_url: null,
  canonical_url: `/user/${DISCOVERED_USER_ID}`,
};

const profileIncomingUser = {
  id: PROFILE_INCOMING_USER_ID,
  username: 'emmy',
  display_name: 'Emmy Noether',
  avatar_url: null,
};

const profileOutgoingUser = {
  id: PROFILE_OUTGOING_USER_ID,
  username: 'maryam',
  display_name: 'Maryam Mirzakhani',
  avatar_url: null,
};

const profileFriendUser = {
  id: PROFILE_FRIEND_ID,
  username: 'albert',
  display_name: 'Albert Einstein',
  avatar_url: null,
};

const currentUserProfile = {
  id: 'e2e-user',
  uid: 'e2e-user',
  username: 'e2e-user',
  display_name: 'E2E User',
  avatar_url: null,
  onboarding_completed: true,
  email_verified: true,
};

function profileResponse(
  user: typeof pendingUser,
  friendshipStatus: 'none' | 'friends' | 'pending_sent' | 'pending_received'
) {
  return {
    ...user,
    is_friend: friendshipStatus === 'friends',
    friend_request_sent: friendshipStatus === 'pending_sent',
    friend_request_received: friendshipStatus === 'pending_received',
    friendship_status: friendshipStatus,
    friends_count: friendshipStatus === 'friends' ? 1 : 0,
    created_at: '2026-01-01T00:00:00.000Z',
  };
}

const joinedGroup = {
  id: GROUP_ID,
  name: 'Social Systems',
  slug: 'social-systems',
  description: 'Selected entity routing proof',
  icon_url: null,
  banner_url: null,
  owner_id: 'owner-1',
  member_count: 18,
  online_count: 4,
  is_public: true,
  channels: [
    {
      id: CHANNEL_ID,
      name: 'general',
      type: 'text',
      topic: null,
      category_id: null,
      position: 0,
      is_nsfw: false,
      slow_mode_seconds: 0,
      unread_count: 0,
      last_message_at: null,
    },
  ],
  categories: [],
  roles: [],
  my_member: null,
  created_at: '2026-01-01T00:00:00.000Z',
};

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installSocialMocks(page: Page): Promise<{
  acceptedRequests: string[];
  declinedRequests: string[];
  canceledRequests: string[];
  removedFriendships: string[];
  sentFriendRequests: string[];
  joinedGroups: string[];
  readNotifications: string[];
}> {
  const acceptedRequests: string[] = [];
  const declinedRequests: string[] = [];
  const canceledRequests: string[] = [];
  const removedFriendships: string[] = [];
  const sentFriendRequests: string[] = [];
  const joinedGroups: string[] = [];
  const readNotifications: string[] = [];
  let requestPending = true;
  let declineRequestPending = true;
  let outgoingRequestPending = true;
  let friendVisible = true;
  let discoveredRequestSent = false;
  let profileIncomingPending = true;
  let profileOutgoingPending = true;
  let profileFriendVisible = true;
  let groupJoined = false;

  await page.route('**/api/v1/**', async (route, request) => {
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if ((path === '/api/v1/me' || path === '/api/v1/users/me') && method === 'GET') {
      await fulfillJson(route, { data: currentUserProfile, user: currentUserProfile });
      return;
    }

    if (path === `/api/v1/users/${FRIEND_ID}` && method === 'GET') {
      await fulfillJson(route, {
        data: {
          ...existingFriend,
          is_friend: friendVisible,
          friendship_status: friendVisible ? 'friends' : 'none',
          friends_count: 1,
          created_at: '2026-01-01T00:00:00.000Z',
        },
      });
      return;
    }

    if (path === `/api/v1/users/${DISCOVERED_USER_ID}` && method === 'GET') {
      await fulfillJson(route, {
        data: {
          ...discoveredUser,
          friend_request_sent: discoveredRequestSent,
          friendship_status: discoveredRequestSent ? 'pending_sent' : 'none',
          friends_count: 0,
          created_at: '2026-01-01T00:00:00.000Z',
        },
      });
      return;
    }

    if (path === `/api/v1/users/${PROFILE_INCOMING_USER_ID}` && method === 'GET') {
      await fulfillJson(route, {
        data: profileResponse(
          profileIncomingUser,
          profileIncomingPending ? 'pending_received' : 'none'
        ),
      });
      return;
    }

    if (path === `/api/v1/users/${declinedUser.id}` && method === 'GET') {
      await fulfillJson(route, {
        data: profileResponse(declinedUser, declineRequestPending ? 'pending_received' : 'none'),
      });
      return;
    }

    if (path === `/api/v1/users/${PROFILE_OUTGOING_USER_ID}` && method === 'GET') {
      await fulfillJson(route, {
        data: profileResponse(
          profileOutgoingUser,
          profileOutgoingPending ? 'pending_sent' : 'none'
        ),
      });
      return;
    }

    if (path === `/api/v1/users/${PROFILE_FRIEND_ID}` && method === 'GET') {
      await fulfillJson(route, {
        data: profileResponse(profileFriendUser, profileFriendVisible ? 'friends' : 'none'),
      });
      return;
    }

    if (path === '/api/v1/friends' && method === 'GET') {
      await fulfillJson(route, {
        data: [
          ...(friendVisible
            ? [
                {
                  id: FRIENDSHIP_ID,
                  user: existingFriend,
                  since: '2026-01-01T00:00:00.000Z',
                },
              ]
            : []),
          ...(profileFriendVisible
            ? [
                {
                  id: PROFILE_FRIENDSHIP_ID,
                  user: profileFriendUser,
                  since: '2026-01-01T00:00:00.000Z',
                },
              ]
            : []),
        ],
      });
      return;
    }

    if (path === '/api/v1/friends' && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}') as { username?: string; user_id?: string };
      const identifier = body.username || body.user_id || DISCOVERED_USER_ID;
      sentFriendRequests.push(identifier);
      discoveredRequestSent = true;
      await fulfillJson(route, {
        id: 'sent-social-new',
        status: 'pending',
        to: discoveredUser,
        sent_at: '2026-01-01T00:00:00.000Z',
      });
      return;
    }

    if (path === '/api/v1/friends/requests' && method === 'GET') {
      await fulfillJson(route, {
        data: [
          ...(requestPending
            ? [
                {
                  id: REQUEST_ID,
                  status: 'pending',
                  from: pendingUser,
                  sent_at: '2026-01-01T00:00:00.000Z',
                },
              ]
            : []),
          ...(declineRequestPending
            ? [
                {
                  id: DECLINE_REQUEST_ID,
                  status: 'pending',
                  from: declinedUser,
                  sent_at: '2026-01-01T00:00:00.000Z',
                },
              ]
            : []),
          ...(profileIncomingPending
            ? [
                {
                  id: PROFILE_INCOMING_REQUEST_ID,
                  status: 'pending',
                  from: profileIncomingUser,
                  sent_at: '2026-01-01T00:00:00.000Z',
                },
              ]
            : []),
        ],
      });
      return;
    }

    if (path === '/api/v1/friends/sent' && method === 'GET') {
      await fulfillJson(route, {
        data: [
          ...(outgoingRequestPending
            ? [
                {
                  id: SENT_REQUEST_ID,
                  status: 'pending',
                  to: outgoingUser,
                  sent_at: '2026-01-01T00:00:00.000Z',
                },
              ]
            : []),
          ...(discoveredRequestSent
            ? [
                {
                  id: 'sent-social-new',
                  status: 'pending',
                  to: discoveredUser,
                  sent_at: '2026-01-01T00:00:00.000Z',
                },
              ]
            : []),
          ...(profileOutgoingPending
            ? [
                {
                  id: PROFILE_OUTGOING_REQUEST_ID,
                  status: 'pending',
                  to: profileOutgoingUser,
                  sent_at: '2026-01-01T00:00:00.000Z',
                },
              ]
            : []),
        ],
      });
      return;
    }

    if (path === `/api/v1/friends/${REQUEST_ID}/accept` && method === 'POST') {
      acceptedRequests.push(REQUEST_ID);
      requestPending = false;
      await fulfillJson(route, {
        id: REQUEST_ID,
        status: 'accepted',
        from: pendingUser,
        sent_at: '2026-01-01T00:00:00.000Z',
      });
      return;
    }

    if (path === `/api/v1/friends/${DECLINE_REQUEST_ID}/decline` && method === 'POST') {
      declinedRequests.push(DECLINE_REQUEST_ID);
      declineRequestPending = false;
      await fulfillJson(route, {
        id: DECLINE_REQUEST_ID,
        status: 'declined',
        from: declinedUser,
        sent_at: '2026-01-01T00:00:00.000Z',
      });
      return;
    }

    if (path === `/api/v1/friends/${PROFILE_INCOMING_REQUEST_ID}/accept` && method === 'POST') {
      acceptedRequests.push(PROFILE_INCOMING_REQUEST_ID);
      profileIncomingPending = false;
      await fulfillJson(route, {
        id: PROFILE_INCOMING_REQUEST_ID,
        status: 'accepted',
        from: profileIncomingUser,
        sent_at: '2026-01-01T00:00:00.000Z',
      });
      return;
    }

    if (path === `/api/v1/friends/${PROFILE_OUTGOING_REQUEST_ID}` && method === 'DELETE') {
      canceledRequests.push(PROFILE_OUTGOING_REQUEST_ID);
      profileOutgoingPending = false;
      await fulfillJson(route, {});
      return;
    }

    if (path === `/api/v1/friends/${SENT_REQUEST_ID}` && method === 'DELETE') {
      canceledRequests.push(SENT_REQUEST_ID);
      outgoingRequestPending = false;
      await fulfillJson(route, {});
      return;
    }

    if (path === `/api/v1/friends/sent-social-new` && method === 'DELETE') {
      canceledRequests.push('sent-social-new');
      discoveredRequestSent = false;
      await fulfillJson(route, {});
      return;
    }

    if (path === `/api/v1/friends/${PROFILE_FRIENDSHIP_ID}` && method === 'DELETE') {
      removedFriendships.push(PROFILE_FRIENDSHIP_ID);
      profileFriendVisible = false;
      await fulfillJson(route, {});
      return;
    }

    if (path === `/api/v1/friends/${FRIENDSHIP_ID}` && method === 'DELETE') {
      removedFriendships.push(FRIENDSHIP_ID);
      friendVisible = false;
      await fulfillJson(route, {});
      return;
    }

    if (path === '/api/v1/notifications' && method === 'GET') {
      await fulfillJson(route, {
        data: [
          {
            id: NOTIFICATION_ID,
            type: 'mention',
            title: 'Mention in Social Systems',
            body: 'Open the exact group channel route',
            is_read: false,
            created_at: '2026-01-01T00:00:00.000Z',
            data: {
              group_id: GROUP_ID,
              channel_id: CHANNEL_ID,
              message_id: 'message-77',
            },
          },
        ],
      });
      return;
    }

    if (path === `/api/v1/notifications/${NOTIFICATION_ID}/read` && method === 'POST') {
      readNotifications.push(NOTIFICATION_ID);
      await fulfillJson(route, {});
      return;
    }

    if (path === '/api/v1/search/groups' && method === 'GET') {
      await fulfillJson(route, [
        {
          id: GROUP_ID,
          name: 'Social Systems',
          slug: 'social-systems',
          description: 'Selected entity routing proof',
          default_channel_id: CHANNEL_ID,
          canonical_url: `/groups/${GROUP_ID}/channels/${CHANNEL_ID}?source=backend-search`,
          member_count: 18,
          is_member: groupJoined,
        },
      ]);
      return;
    }

    if (path === '/api/v1/search/users' && method === 'GET') {
      await fulfillJson(route, [discoveredUser]);
      return;
    }

    if (path.startsWith('/api/v1/search/') && method === 'GET') {
      await fulfillJson(route, []);
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/join` && method === 'POST') {
      joinedGroups.push(GROUP_ID);
      groupJoined = true;
      await fulfillJson(route, { group: joinedGroup });
      return;
    }

    if (path === '/api/v1/groups' && method === 'GET') {
      await fulfillJson(route, { groups: groupJoined ? [joinedGroup] : [] });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}` && method === 'GET') {
      await fulfillJson(route, { group: joinedGroup });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members` && method === 'GET') {
      await fulfillJson(route, { members: [] });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/channels/${CHANNEL_ID}/messages`) {
      await fulfillJson(route, { data: [] });
      return;
    }

    await fulfillJson(route, {});
  });

  return {
    acceptedRequests,
    declinedRequests,
    canceledRequests,
    removedFriendships,
    sentFriendRequests,
    joinedGroups,
    readNotifications,
  };
}

test.describe('Social hub main pane', () => {
  test('routes selected notifications, discover results, and friend requests through store actions', async ({
    page,
  }) => {
    const {
      acceptedRequests,
      declinedRequests,
      canceledRequests,
      removedFriendships,
      sentFriendRequests,
      joinedGroups,
      readNotifications,
    } = await installSocialMocks(page);

    await page.goto('/social/notifications');
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
    await page.locator('main').getByRole('button', { name: /mention in social systems/i }).click();
    await expect
      .poll(() => readNotifications, { message: 'notification read endpoint was called' })
      .toContain(NOTIFICATION_ID);
    await expect(page).toHaveURL(
      new RegExp(`/groups/${GROUP_ID}/channels/${CHANNEL_ID}\\?scrollTo=message-77$`)
    );

    await page.goto('/social/discover');
    await page.getByPlaceholder(/search cgraph/i).fill('social');
    const mainPane = page.locator('main');
    await expect(mainPane.getByRole('heading', { name: 'Social Systems' })).toBeVisible();
    await mainPane.getByRole('button', { name: /^join$/i }).click();
    await expect
      .poll(() => joinedGroups, { message: 'group join endpoint was called' })
      .toContain(GROUP_ID);
    await expect(page).toHaveURL(new RegExp(`/groups/${GROUP_ID}/channels/${CHANNEL_ID}$`));

    await page.goto('/social/discover');
    await page.getByPlaceholder(/search cgraph/i).fill('social');
    await mainPane
      .getByRole('button', { name: /social systems selected entity routing proof/i })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`/groups/${GROUP_ID}/channels/${CHANNEL_ID}\\?source=backend-search$`)
    );

    await page.goto('/social/discover');
    await page.getByPlaceholder(/search cgraph/i).fill('dorothy');
    await page.locator('aside').getByRole('button', { name: /^add$/i }).click();
    await expect
      .poll(() => sentFriendRequests, { message: 'friend request send endpoint was called' })
      .toContain(DISCOVERED_USER_ID);

    await page.goto('/social/friends');
    await expect(
      page.locator('main span').filter({ hasText: /^Ada Lovelace$/ })
    ).toBeVisible();
    await page.locator('main button').filter({ hasText: /^Accept$/ }).first().click();
    await expect
      .poll(() => acceptedRequests, { message: 'friend request accept endpoint was called' })
      .toContain(REQUEST_ID);

    await page.goto('/social/friends');
    await page
      .locator('aside')
      .getByRole('button', { name: /decline friend request from grace hopper/i })
      .click();
    await expect
      .poll(() => declinedRequests, { message: 'friend request decline endpoint was called' })
      .toContain(DECLINE_REQUEST_ID);

    await page.goto('/social/friends');
    await page
      .locator('aside')
      .getByRole('button', { name: /cancel friend request to katherine johnson/i })
      .click();
    await expect
      .poll(() => canceledRequests, { message: 'friend request cancel endpoint was called' })
      .toContain(SENT_REQUEST_ID);

    await page.goto('/social/friends');
    await page.locator('aside').getByRole('button', { name: /remove alan turing from friends/i }).click();
    await expect
      .poll(() => removedFriendships, { message: 'friend remove endpoint was called' })
      .toContain(FRIENDSHIP_ID);

    await page.goto(`/user/${FRIEND_ID}`);
    await expect(page.getByRole('heading', { name: /alan turing/i })).toBeVisible();
    await page.getByRole('button', { name: /^add friend$/i }).click();
    await expect
      .poll(() => sentFriendRequests, { message: 'profile send endpoint was called' })
      .toContain('alan');
  });

  test('runs profile friendship accept, decline, cancel, and remove through store-owned ids', async ({
    page,
  }) => {
    const { acceptedRequests, declinedRequests, canceledRequests, removedFriendships } =
      await installSocialMocks(page);

    await page.goto(`/user/${PROFILE_INCOMING_USER_ID}`);
    await expect(page.getByRole('heading', { name: /emmy noether/i })).toBeVisible();
    await page.getByRole('button', { name: /^accept$/i }).click();
    await expect
      .poll(() => acceptedRequests, { message: 'profile accept endpoint was called' })
      .toContain(PROFILE_INCOMING_REQUEST_ID);

    await page.goto(`/user/${declinedUser.id}`);
    await expect(page.getByRole('heading', { name: /grace hopper/i })).toBeVisible();
    await page.getByRole('button', { name: /^decline$/i }).click();
    await expect
      .poll(() => declinedRequests, { message: 'profile decline endpoint was called' })
      .toContain(DECLINE_REQUEST_ID);

    await page.goto(`/user/${PROFILE_OUTGOING_USER_ID}`);
    await expect(page.getByRole('heading', { name: /maryam mirzakhani/i })).toBeVisible();
    await page.getByRole('button', { name: /^cancel request$/i }).click();
    await expect
      .poll(() => canceledRequests, { message: 'profile cancel endpoint was called' })
      .toContain(PROFILE_OUTGOING_REQUEST_ID);

    await page.goto(`/user/${PROFILE_FRIEND_ID}`);
    await expect(page.getByRole('heading', { name: /albert einstein/i })).toBeVisible();
    await page.getByRole('button', { name: /friend actions/i }).click();
    await page.getByRole('button', { name: /remove friend/i }).click();
    await expect
      .poll(() => removedFriendships, { message: 'profile remove endpoint was called' })
      .toContain(PROFILE_FRIENDSHIP_ID);
  });
});
