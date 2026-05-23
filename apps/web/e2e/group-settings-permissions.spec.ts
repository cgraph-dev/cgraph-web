import { expect, test, type Page, type Route } from '@playwright/test';

const CURRENT_USER_ID = 'e2e-user';
const GROUP_ID = 'group-permission-edge';

const currentUser = {
  id: CURRENT_USER_ID,
  username: 'e2e-user',
  displayName: 'E2E User',
  display_name: 'E2E User',
  avatarUrl: null,
  avatar_url: null,
  status: 'online',
};

const friendUser = {
  id: 'permission-edge-friend',
  username: 'permission-friend',
  displayName: 'Permission Friend',
  display_name: 'Permission Friend',
  avatarUrl: null,
  avatar_url: null,
  status: 'online',
};

const permissionDeniedMessage = {
  id: 'permission-pin-denied',
  channel_id: 'permission-edge-general',
  sender_id: friendUser.id,
  author: friendUser,
  content: 'Permission denied pin route proof',
  message_type: 'text',
  is_pinned: false,
  is_edited: false,
  reply_to_id: null,
  metadata: {},
  reactions: [],
  created_at: '2026-01-01T00:00:00.000Z',
};

const ordinaryMemberGroup = {
  id: GROUP_ID,
  name: 'Permission Edge Hub',
  slug: 'permission-edge-hub',
  description: 'Permission edge proof',
  icon_url: null,
  banner_url: null,
  owner_id: 'another-owner',
  member_count: 2,
  online_count: 1,
  is_public: true,
  channels: [
    {
      id: 'permission-edge-general',
      name: 'general',
      type: 'text',
      topic: 'Permission edge proof',
      position: 0,
    },
  ],
  categories: [],
  roles: [
    {
      id: 'role-member',
      name: 'Member',
      color: '#94a3b8',
      position: 0,
      permissions: 0,
      is_default: true,
      is_mentionable: false,
    },
  ],
  myMember: {
    id: 'member-current',
    user_id: CURRENT_USER_ID,
    user: currentUser,
    roles: [
      {
        id: 'role-member',
        name: 'Member',
        color: '#94a3b8',
        position: 0,
        permissions: 0,
        is_default: true,
        is_mentionable: false,
      },
    ],
    notifications: 'mentions',
    joined_at: '2026-01-01T00:00:00.000Z',
  },
  created_at: '2026-01-01T00:00:00.000Z',
};

const ownerGroup = {
  ...ordinaryMemberGroup,
  owner_id: CURRENT_USER_ID,
  myMember: {
    ...ordinaryMemberGroup.myMember,
    roles: [
      {
        id: 'role-admin',
        name: 'Admin',
        color: '#ffffff',
        position: 0,
        permissions: 1,
        is_default: false,
        is_mentionable: true,
      },
    ],
  },
};

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installGroupPermissionMocks(
  page: Page,
  {
    groupFixture = ordinaryMemberGroup,
    allowGroupPatch = false,
    denyPinCreate = false,
    denyPinList = false,
    denyPinDelete = false,
    seedPinnedMessage = false,
  }: {
    readonly groupFixture?: typeof ordinaryMemberGroup;
    readonly allowGroupPatch?: boolean;
    readonly denyPinCreate?: boolean;
    readonly denyPinList?: boolean;
    readonly denyPinDelete?: boolean;
    readonly seedPinnedMessage?: boolean;
  } = {}
) {
  const requests = {
    groupPatches: [] as unknown[],
    pinCreates: [] as unknown[],
    pinDeletes: [] as string[],
  };

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
      await fulfillJson(route, { data: [groupFixture] });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}`) {
      if (method === 'PATCH') {
        const body = request.postDataJSON();
        requests.groupPatches.push(body);
        if (allowGroupPatch) {
          await fulfillJson(route, { data: { ...groupFixture, ...body } });
          return;
        }

        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }

      await fulfillJson(route, { data: groupFixture });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members` && method === 'GET') {
      await fulfillJson(route, {
        data: [
          groupFixture.myMember,
          {
            id: 'member-friend',
            user_id: friendUser.id,
            user: friendUser,
            roles: groupFixture.roles,
            notifications: 'mentions',
            joined_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      });
      return;
    }

    if (
      path === `/api/v1/groups/${GROUP_ID}/channels/permission-edge-general/messages` &&
      method === 'GET'
    ) {
      await fulfillJson(route, {
        data: [permissionDeniedMessage],
        meta: {
          has_next_page: false,
          has_previous_page: false,
          start_cursor: null,
          end_cursor: null,
          per_page: 50,
        },
      });
      return;
    }

    if (
      path === `/api/v1/groups/${GROUP_ID}/channels/permission-edge-general/thread-counts` &&
      method === 'POST'
    ) {
      await fulfillJson(route, { data: { [permissionDeniedMessage.id]: 0 } });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/channels/permission-edge-general/pins`) {
      if (method === 'POST') {
        const body = request.postDataJSON();
        requests.pinCreates.push(body);
        if (denyPinCreate) {
          await fulfillJson(route, { message: 'Forbidden' }, 403);
          return;
        }

        await fulfillJson(route, { data: { message_id: permissionDeniedMessage.id } }, 201);
        return;
      }

      if (denyPinList) {
        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }

      await fulfillJson(route, {
        data: seedPinnedMessage
          ? [
              {
                id: `pin-${permissionDeniedMessage.id}`,
                channel_id: 'permission-edge-general',
                message_id: permissionDeniedMessage.id,
                pinned_by_id: CURRENT_USER_ID,
                position: 0,
                pinned_at: '2026-01-01T00:00:00.000Z',
              },
            ]
          : [],
      });
      return;
    }

    if (
      path ===
      `/api/v1/groups/${GROUP_ID}/channels/permission-edge-general/pins/pin-${permissionDeniedMessage.id}`
    ) {
      requests.pinDeletes.push(`pin-${permissionDeniedMessage.id}`);
      if (denyPinDelete) {
        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }

      await fulfillJson(route, { data: { ok: true } });
      return;
    }

    if (
      path === `/api/v1/notification-preferences/channel/permission-edge-general` &&
      method === 'GET'
    ) {
      await fulfillJson(route, {
        data: { preference: { id: 'pref-channel', mode: 'mentions_only' } },
      });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members/me/notifications`) {
      await fulfillJson(route, { data: { notifications: 'mentions' } });
      return;
    }

    if (path === '/api/v1/settings' || path.startsWith('/api/v1/settings/')) {
      await fulfillJson(route, { data: {} });
      return;
    }

    if (path === '/api/v1/conversations') {
      await fulfillJson(route, { data: [], meta: { page: 1, total: 0 } });
      return;
    }

    if (
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

  return requests;
}

test.describe('Group settings permissions', () => {
  test('keeps owner management tabs available and saves overview changes', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
      allowGroupPatch: true,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);

    await expect(page.getByText('Group Settings').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Overview$/ })).toBeVisible();

    await expect(page.getByRole('button', { name: /^Overview$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Roles$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Members$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Invites$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Channels$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Audit Log$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^AutoMod$/ })).toBeVisible();

    await page.locator('input[type="text"]').first().fill('Permission Edge Hub Verified');
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect
      .poll(() => requests.groupPatches)
      .toContainEqual(expect.objectContaining({ name: 'Permission Edge Hub Verified' }));
  });

  test('limits settings tabs for non-admin members and avoids admin writes', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page);

    await page.goto(`/groups/${GROUP_ID}/settings`);

    await expect(page.getByText('Group Settings').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Notifications$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Notifications$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Danger Zone$/ })).toBeVisible();

    await expect(page.getByRole('button', { name: /^Overview$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Roles$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Members$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Invites$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Channels$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Audit Log$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^AutoMod$/ })).toHaveCount(0);

    await page.getByRole('button', { name: /^Danger Zone$/ }).click();
    await expect(page.getByRole('heading', { name: /^Danger Zone$/ })).toBeVisible();
    await expect(page.getByText('Leave Group')).toBeVisible();
    await expect(page.getByText('Delete Group')).toHaveCount(0);

    expect(requests.groupPatches).toEqual([]);
  });

  test('keeps channel state unchanged and shows endpoint 403 copy when pinning is denied', async ({
    page,
  }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
      denyPinCreate: true,
    });

    await page.goto(`/groups/${GROUP_ID}/channels/permission-edge-general`);

    const message = page.locator(`#group-message-${permissionDeniedMessage.id}`);
    await expect(message).toContainText(permissionDeniedMessage.content);

    await message.hover();
    await message.getByTitle('More Actions').click();
    await page.getByRole('menuitem', { name: /^Pin$/ }).click();

    await expect
      .poll(() => requests.pinCreates, { message: 'pin create endpoint received message_id' })
      .toContainEqual(expect.objectContaining({ message_id: permissionDeniedMessage.id }));
    await expect(
      page.getByText('You do not have permission to pin messages in this channel.')
    ).toBeVisible();
    await expect(message).not.toContainText('Pinned');
    await expect(page.getByRole('complementary', { name: /pinned messages/i })).toHaveCount(0);
  });

  test('shows endpoint 403 copy when the pinned panel cannot list pins', async ({ page }) => {
    await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
      denyPinList: true,
    });

    await page.goto(`/groups/${GROUP_ID}/channels/permission-edge-general`);

    await page.getByTitle('Pinned Messages').click();
    const pinnedPanel = page.getByRole('complementary', { name: /pinned messages/i });
    await expect(pinnedPanel).toContainText(
      'You do not have permission to view pinned messages in this channel.'
    );
  });

  test('keeps pinned panel state unchanged and shows endpoint 403 copy when unpinning is denied', async ({
    page,
  }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
      seedPinnedMessage: true,
      denyPinDelete: true,
    });

    await page.goto(`/groups/${GROUP_ID}/channels/permission-edge-general`);

    await page.getByTitle('Pinned Messages').click();
    const pinnedPanel = page.getByRole('complementary', { name: /pinned messages/i });
    await expect(pinnedPanel).toContainText(permissionDeniedMessage.content);

    await pinnedPanel.getByText(permissionDeniedMessage.content).hover();
    await pinnedPanel
      .getByRole('button', { name: `Unpin ${permissionDeniedMessage.content}` })
      .click();

    await expect
      .poll(() => requests.pinDeletes, { message: 'unpin endpoint received the pin id' })
      .toContain(`pin-${permissionDeniedMessage.id}`);
    await expect(pinnedPanel).toContainText(
      'You do not have permission to unpin messages in this channel.'
    );
    await expect(pinnedPanel).toContainText(permissionDeniedMessage.content);
  });
});
