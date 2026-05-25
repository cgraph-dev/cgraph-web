import { expect, test, type Page, type Route } from '@playwright/test';

const CURRENT_USER_ID = 'e2e-user';
const FRIEND_ID = 'group-scroll-friend';
const GROUP_ID = 'group-scroll-proof';
const TEXT_CHANNEL_ID = 'group-scroll-general';

const currentUser = {
  id: CURRENT_USER_ID,
  username: 'e2e-user',
  display_name: 'E2E User',
  displayName: 'E2E User',
  avatar_url: null,
  avatarUrl: null,
  status: 'online',
};

const friendUser = {
  id: FRIEND_ID,
  username: 'scroll-friend',
  display_name: 'Scroll Friend',
  displayName: 'Scroll Friend',
  avatar_url: null,
  avatarUrl: null,
  status: 'online',
};

const adminRole = {
  id: 'role-group-scroll-admin',
  name: 'Admin',
  color: '#ffffff',
  position: 1,
  permissions: 0x80000000,
  is_default: false,
  is_mentionable: true,
};

const group = {
  id: GROUP_ID,
  name: 'Scroll Proof Group',
  slug: 'scroll-proof-group',
  description: 'Group scroll behavior proof',
  icon_url: null,
  banner_url: null,
  owner_id: CURRENT_USER_ID,
  member_count: 2,
  online_count: 2,
  is_public: true,
  channels: [
    {
      id: TEXT_CHANNEL_ID,
      name: 'general',
      type: 'text',
      topic: 'Scroll behavior proof',
      position: 0,
      category_id: null,
      is_nsfw: false,
      slow_mode_seconds: 0,
      unread_count: 0,
      last_message_at: null,
    },
  ],
  categories: [],
  roles: [adminRole],
  my_member: {
    id: 'member-current',
    user_id: CURRENT_USER_ID,
    user: currentUser,
    roles: [adminRole],
    notifications: 'mentions',
    joined_at: '2026-01-01T00:00:00.000Z',
  },
  created_at: '2026-01-01T00:00:00.000Z',
};

function groupMessageApiFixture(messageNumber: number): Record<string, unknown> {
  return {
    id: `group-scroll-msg-${messageNumber}`,
    channel_id: TEXT_CHANNEL_ID,
    sender_id: FRIEND_ID,
    author: friendUser,
    content: `group scroll proof message ${messageNumber}`,
    message_type: 'text',
    is_pinned: false,
    is_edited: false,
    reply_to_id: null,
    metadata: {},
    reactions: [],
    created_at: `2026-01-01T00:${String(messageNumber).padStart(2, '0')}:00.000Z`,
  };
}

function groupMessageStorePayload(messageNumber: number): Record<string, unknown> {
  return {
    id: `group-scroll-msg-${messageNumber}`,
    channelId: TEXT_CHANNEL_ID,
    authorId: FRIEND_ID,
    author: {
      id: FRIEND_ID,
      username: friendUser.username,
      displayName: friendUser.displayName,
      avatarUrl: null,
      member: null,
    },
    content: `group scroll proof message ${messageNumber}`,
    messageType: 'text',
    replyToId: null,
    replyTo: null,
    isPinned: false,
    isEdited: false,
    deletedAt: null,
    metadata: {},
    reactions: [],
    createdAt: `2026-01-01T00:${String(messageNumber).padStart(2, '0')}:00.000Z`,
  };
}

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installGroupScrollMocks(
  page: Page,
  messages: readonly Record<string, unknown>[]
): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.route('**/api/v1/**', async (route, request) => {
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if ((path === '/api/v1/me' || path === '/api/v1/users/me') && method === 'GET') {
      await fulfillJson(route, { data: currentUser, user: currentUser });
      return;
    }

    if (path === '/api/v1/groups' && method === 'GET') {
      await fulfillJson(route, { data: [group], groups: [group] });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}` && method === 'GET') {
      await fulfillJson(route, { data: group, group });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members` && method === 'GET') {
      const members = [
        { id: 'member-current', user_id: CURRENT_USER_ID, user: currentUser, roles: [adminRole] },
        { id: 'member-friend', user_id: FRIEND_ID, user: friendUser, roles: [] },
      ];
      await fulfillJson(route, { data: members, members });
      return;
    }

    if (
      path === `/api/v1/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}/messages` &&
      method === 'GET'
    ) {
      await fulfillJson(route, {
        data: messages,
        page_info: {
          has_next_page: false,
          has_previous_page: false,
          start_cursor: null,
          end_cursor: null,
          per_page: messages.length,
        },
      });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}/thread-counts`) {
      await fulfillJson(route, { data: {} });
      return;
    }

    if (path === `/api/v1/notification-preferences/channel/${TEXT_CHANNEL_ID}`) {
      await fulfillJson(route, {
        data: { preference: { id: 'pref-group-scroll-channel', mode: 'mentions_only' } },
      });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members/me/notifications`) {
      await fulfillJson(route, { data: { notifications: 'mentions' } });
      return;
    }

    if (path === '/api/v1/onboarding/status' && method === 'GET') {
      await fulfillJson(route, {
        data: {
          completed: true,
          steps: {
            send_first_message: true,
            join_or_create_hub: true,
            customize_profile: true,
            enable_e2ee_backup: true,
          },
        },
      });
      return;
    }

    if (
      path === '/api/v1/conversations' ||
      path === '/api/v1/friends' ||
      path === '/api/v1/friends/requests' ||
      path === '/api/v1/friends/sent' ||
      path === '/api/v1/notifications'
    ) {
      await fulfillJson(route, { data: [] });
      return;
    }

    await fulfillJson(route, { data: {} });
  });
}

test.describe('Group channel scrolling', () => {
  test('keeps routed anchors stable for new messages until the user jumps to latest', async ({
    page,
  }) => {
    const messages = Array.from({ length: 36 }, (_, index) => groupMessageApiFixture(index + 1));
    await installGroupScrollMocks(page, messages);

    await page.goto(`/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}?scrollTo=group-scroll-msg-6`);

    const targetMessage = page.locator('#group-message-group-scroll-msg-6');
    await expect(targetMessage).toBeVisible();
    await expect(targetMessage).toBeInViewport();
    await expect(page.locator('#group-message-group-scroll-msg-36')).not.toBeInViewport();

    const jumpToLatest = page.getByRole('button', { name: /scroll to latest messages/i });
    await expect(jumpToLatest).toBeVisible();

    await page.evaluate((message) => {
      window.dispatchEvent(
        new CustomEvent('cgraph:e2e-add-group-message', {
          detail: message,
        })
      );
    }, groupMessageStorePayload(37));

    const newestMessage = page.locator('#group-message-group-scroll-msg-37');
    await expect(newestMessage).toBeVisible();
    await expect(targetMessage).toBeInViewport();
    await expect(newestMessage).not.toBeInViewport();
    await expect(jumpToLatest).toBeVisible();

    await jumpToLatest.click({ force: true });
    await expect(newestMessage).toBeInViewport();
  });
});
