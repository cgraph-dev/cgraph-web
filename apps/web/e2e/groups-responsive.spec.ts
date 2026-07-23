import { expect, test, type Page, type Route } from '@playwright/test';

const GROUP_ID = 'responsive-group';
const GENERAL_CHANNEL_ID = 'responsive-general';
const NEWS_CHANNEL_ID = 'responsive-news';

const group = {
  id: GROUP_ID,
  name: 'CGraph Builders',
  slug: 'cgraph-builders',
  description: 'Build, test, and share together',
  icon_url: null,
  banner_url: null,
  owner_id: 'e2e-user',
  member_count: 42,
  online_count: 7,
  is_public: true,
  channels: [
    {
      id: GENERAL_CHANNEL_ID,
      name: 'General',
      type: 'text',
      topic: 'Community conversation',
      category_id: null,
      position: 0,
      is_nsfw: false,
      slow_mode_seconds: 0,
      unread_count: 2,
      last_message_at: null,
    },
    {
      id: NEWS_CHANNEL_ID,
      name: 'News',
      type: 'announcement',
      topic: 'Project updates',
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

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installGroupMocks(page: Page): Promise<void> {
  await page.route('**/api/v1/groups**', async (route, request) => {
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === '/api/v1/groups' && method === 'GET') {
      await fulfillJson(route, { groups: [group] });
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

    if (
      path === `/api/v1/groups/${GROUP_ID}/channels/${GENERAL_CHANNEL_ID}/messages` ||
      path === `/api/v1/groups/${GROUP_ID}/channels/${NEWS_CHANNEL_ID}/messages`
    ) {
      await fulfillJson(route, { data: [] });
      return;
    }

    if (path.endsWith('/thread-counts') || path.endsWith('/pins')) {
      await fulfillJson(route, { data: [] });
      return;
    }

    await route.fallback();
  });
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
    )
  ).toBe(true);
}

test.describe('Responsive Groups navigation', () => {
  for (const viewport of [
    { width: 400, height: 874 },
    { width: 768, height: 1024 },
  ]) {
    test(`uses one Groups surface at ${viewport.width}x${viewport.height}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport);
      await installGroupMocks(page);
      await page.goto('/groups');

      const directory = page.getByTestId('mobile-group-directory');
      await expect(directory).toBeVisible();
      await expect(page.getByTestId('groups-server-rail')).toBeHidden();
      await expect(page.getByTestId('groups-channel-list')).toBeHidden();
      await expect(page.getByTestId('group-content-pane')).toBeHidden();
      expect((await directory.boundingBox())?.width).toBe(viewport.width);
      await expectNoHorizontalOverflow(page);

      for (const name of ['Create', 'Join']) {
        const box = await page.getByRole('button', { name }).boundingBox();
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }

      await testInfo.attach(`groups-directory-${viewport.width}x${viewport.height}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });

      await page.getByRole('link', { name: /CGraph Builders/ }).click();
      await expect(page).toHaveURL(
        new RegExp(`/groups/${GROUP_ID}/channels/${GENERAL_CHANNEL_ID}$`)
      );
      await expect(page.getByTestId('mobile-group-directory')).toBeHidden();
      await expect(page.getByTestId('mobile-group-toolbar')).toBeVisible();
      await expect(page.getByTestId('group-content-pane')).toBeVisible();
      await expect(page.getByTestId('groups-channel-list')).toBeHidden();
      expect((await page.getByTestId('group-content-pane').boundingBox())?.width).toBe(
        viewport.width
      );
      await expectNoHorizontalOverflow(page);

      await page.getByRole('button', { name: 'Open CGraph Builders channels' }).click();
      await expect(page.getByTestId('groups-channel-list')).toBeVisible();
      await expect(page.getByTestId('group-content-pane')).toBeHidden();
      expect((await page.getByTestId('groups-channel-list').boundingBox())?.width).toBe(
        viewport.width
      );
      expect((await page.getByRole('link', { name: 'News' }).boundingBox())?.height).toBeGreaterThanOrEqual(
        44
      );

      await page.getByRole('link', { name: 'News' }).click();
      await expect(page).toHaveURL(
        new RegExp(`/groups/${GROUP_ID}/announcements/${NEWS_CHANNEL_ID}$`)
      );
      await expect(page.getByTestId('groups-channel-list')).toBeHidden();
      await expect(page.getByTestId('group-content-pane')).toBeVisible();

      await testInfo.attach(`groups-channel-${viewport.width}x${viewport.height}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });

      await page.getByRole('button', { name: 'Back to groups' }).click();
      await expect(page).toHaveURL(/\/groups$/);
      await expect(directory).toBeVisible();
    });
  }

  test('retains the established desktop Groups columns', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await installGroupMocks(page);
    await page.goto(`/groups/${GROUP_ID}/channels/${GENERAL_CHANNEL_ID}`);

    await expect(page.getByTestId('mobile-group-directory')).toBeHidden();
    await expect(page.getByTestId('mobile-group-toolbar')).toBeHidden();
    await expect(page.getByTestId('groups-server-rail')).toBeVisible();
    await expect(page.getByTestId('groups-channel-list')).toBeVisible();
    await expect(page.getByTestId('group-content-pane')).toBeVisible();

    expect((await page.getByTestId('groups-server-rail').boundingBox())?.width).toBe(72);
    expect((await page.getByTestId('groups-channel-list').boundingBox())?.width).toBe(240);
    await expectNoHorizontalOverflow(page);

    await testInfo.attach('groups-desktop-1440x900', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });
});
