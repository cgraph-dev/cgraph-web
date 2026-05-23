import { expect, test, type Page, type Route } from '@playwright/test';

const GROUP_ID = 'social-group';
const CHANNEL_ID = 'social-general';
const NOTIFICATION_ID = 'notif-social-group';
const REQUEST_ID = 'request-social-1';

const pendingUser = {
  id: 'pending-user',
  username: 'ada',
  display_name: 'Ada Lovelace',
  avatar_url: null,
};

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
  joinedGroups: string[];
  readNotifications: string[];
}> {
  const acceptedRequests: string[] = [];
  const joinedGroups: string[] = [];
  const readNotifications: string[] = [];
  let requestPending = true;
  let groupJoined = false;

  await page.route('**/api/v1/**', async (route, request) => {
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === '/api/v1/friends' && method === 'GET') {
      await fulfillJson(route, { data: [] });
      return;
    }

    if (path === '/api/v1/friends/requests' && method === 'GET') {
      await fulfillJson(route, {
        data: requestPending
          ? [
              {
                id: REQUEST_ID,
                status: 'pending',
                from: pendingUser,
                sent_at: '2026-01-01T00:00:00.000Z',
              },
            ]
          : [],
      });
      return;
    }

    if (path === '/api/v1/friends/sent' && method === 'GET') {
      await fulfillJson(route, { data: [] });
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

  return { acceptedRequests, joinedGroups, readNotifications };
}

test.describe('Social hub main pane', () => {
  test('routes selected notifications, discover results, and friend requests through store actions', async ({
    page,
  }) => {
    const { acceptedRequests, joinedGroups, readNotifications } = await installSocialMocks(page);

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
    await mainPane.getByRole('button', { name: /^open$/i }).click();
    await expect(page).toHaveURL(
      new RegExp(`/groups/${GROUP_ID}/channels/${CHANNEL_ID}\\?source=backend-search$`)
    );

    await page.goto('/social/friends');
    await expect(
      page.locator('main span').filter({ hasText: /^Ada Lovelace$/ })
    ).toBeVisible();
    await page.locator('main button').filter({ hasText: /^Accept$/ }).click();
    await expect
      .poll(() => acceptedRequests, { message: 'friend request accept endpoint was called' })
      .toContain(REQUEST_ID);
  });
});
