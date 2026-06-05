import { expect, test, type Page, type Route } from '@playwright/test';

const GROUP_ID = 'invite-joined-group';
const CHANNEL_ID = 'invite-joined-general';
const INVITE_CODE = 'VALID403';
const EXPIRED_CODE = 'EXPIRED403';

const group = {
  id: GROUP_ID,
  name: 'Invite Proof Hub',
  slug: 'invite-proof-hub',
  description: 'Invite redemption route proof',
  icon_url: null,
  banner_url: null,
  owner_id: 'e2e-owner',
  member_count: 12,
  online_count: 3,
  is_public: false,
  channels: [
    {
      id: CHANNEL_ID,
      name: 'general',
      type: 'text',
      topic: 'Invite route proof',
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
  my_member: {
    id: 'member-e2e',
    user_id: 'e2e-user',
    roles: [],
    notifications: 'mentions',
    joined_at: '2026-05-26T00:00:00.000Z',
  },
  created_at: '2026-01-01T00:00:00.000Z',
};

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installInviteMocks(page: Page) {
  const requests = {
    invitePreviews: [] as string[],
    inviteJoins: [] as string[],
  };

  await page.route('**/api/v1/**', async (route, request) => {
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === `/api/v1/invites/${INVITE_CODE}` && method === 'GET') {
      requests.invitePreviews.push(INVITE_CODE);
      await fulfillJson(route, {
        data: {
          id: 'invite-valid',
          code: INVITE_CODE,
          group_id: GROUP_ID,
          group_name: group.name,
          group_avatar: null,
          creator_username: 'owner',
          uses: 4,
          max_uses: 5,
          expires_at: '2026-12-01T00:00:00.000Z',
          group,
        },
      });
      return;
    }

    if (path === `/api/v1/invites/${INVITE_CODE}/join` && method === 'POST') {
      requests.inviteJoins.push(INVITE_CODE);
      await fulfillJson(route, { data: { group } });
      return;
    }

    if (path === `/api/v1/invites/${EXPIRED_CODE}` && method === 'GET') {
      requests.invitePreviews.push(EXPIRED_CODE);
      await fulfillJson(
        route,
        { error: { code: 'invite_expired', message: 'This invite has expired.' } },
        410
      );
      return;
    }

    if (path === `/api/v1/invites/${EXPIRED_CODE}/join` && method === 'POST') {
      requests.inviteJoins.push(EXPIRED_CODE);
      await fulfillJson(route, { error: { code: 'invite_expired', message: 'Expired' } }, 410);
      return;
    }

    if (path === '/api/v1/groups' && method === 'GET') {
      await fulfillJson(route, { groups: [] });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}` && method === 'GET') {
      await fulfillJson(route, { group });
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

    if (path === '/api/v1/settings' || path.startsWith('/api/v1/settings/')) {
      await fulfillJson(route, { data: {} });
      return;
    }

    await fulfillJson(route, { data: {} });
  });

  return requests;
}

test.describe('Group invite landing', () => {
  test('opens generated invite links and joins through the invite endpoint', async ({ page }) => {
    const requests = await installInviteMocks(page);

    await page.goto(`/invite/${INVITE_CODE}`);

    await expect(page.getByRole('heading', { name: group.name })).toBeVisible();
    await expect(page.getByText('4 / 5')).toBeVisible();
    await expect(page.getByText('Invited by owner')).toBeVisible();

    await page.getByRole('button', { name: /join group/i }).click();

    await expect
      .poll(() => requests.inviteJoins, { message: 'invite join endpoint received code' })
      .toContain(INVITE_CODE);
    await expect(page).toHaveURL(new RegExp(`/groups/${GROUP_ID}/channels/${CHANNEL_ID}$`));
    await expect(page.getByRole('heading', { name: 'general' })).toBeVisible();
  });

  test('keeps expired invites on the invite route and does not redeem them', async ({ page }) => {
    const requests = await installInviteMocks(page);

    await page.goto(`/invite/${EXPIRED_CODE}`);

    await expect(page.getByText('This invite has expired.')).toBeVisible();
    await expect(page.getByRole('button', { name: /join group/i })).toBeDisabled();
    expect(requests.inviteJoins).toEqual([]);
  });
});
