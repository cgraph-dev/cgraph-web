import { expect, test, type Page } from '@playwright/test';

const GROUP_ID = 'entry-group';
const TEXT_CHANNEL_ID = 'entry-general';

const group = {
  id: GROUP_ID,
  name: 'Entry Group',
  slug: 'entry-group',
  description: 'Group entry routing proof',
  icon_url: null,
  banner_url: null,
  owner_id: 'e2e-user',
  member_count: 3,
  online_count: 1,
  is_public: true,
  channels: [
    {
      id: 'entry-voice',
      name: 'Voice',
      type: 'voice',
      topic: null,
      category_id: null,
      position: 0,
      is_nsfw: false,
      slow_mode_seconds: 0,
      unread_count: 0,
      last_message_at: null,
    },
    {
      id: TEXT_CHANNEL_ID,
      name: 'General',
      type: 'text',
      topic: null,
      category_id: null,
      position: 1,
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

async function installGroupMocks(page: Page): Promise<void> {
  await page.route('**/api/v1/groups**', async (route, request) => {
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === '/api/v1/groups' && method === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ groups: [group] }),
      });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}` && method === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ group }),
      });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members` && method === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ members: [] }),
      });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}/messages`) {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
      return;
    }

    await route.fallback();
  });
}

test.describe('Group entry routes', () => {
  test('redirects a bare group link to the default mounted channel route', async ({ page }) => {
    await installGroupMocks(page);

    await page.goto(`/groups/${GROUP_ID}`);

    await expect(page).toHaveURL(new RegExp(`/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}$`));
    await expect(page.getByRole('heading', { name: 'General' })).toBeVisible();
  });
});
