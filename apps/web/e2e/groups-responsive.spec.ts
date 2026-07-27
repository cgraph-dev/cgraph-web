import { expect, test, type Page, type Route } from '@playwright/test';
import visualTokenDocument from '@cgraph-dev/design-tokens/visual-tokens.json' with { type: 'json' };

const GROUP_ID = 'responsive-group';
const GENERAL_CHANNEL_ID = 'responsive-general';
const NEWS_CHANNEL_ID = 'responsive-news';
const APP_THEMES = ['aurora', 'dark', 'light', 'bubble'] as const;
const TOKEN_REGISTRY = visualTokenDocument.semanticThemes;
const THEME_RUNTIME = {
  aurora: { category: 'dark', variant: 'aurora', colorScheme: 'dark' },
  dark: { category: 'dark', variant: 'dark', colorScheme: 'dark' },
  light: { category: 'light', variant: 'light', colorScheme: 'light' },
  bubble: { category: 'dark', variant: 'bubble', colorScheme: 'dark' },
} as const;
const UI_MATRIX_VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

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
  roles: [
    {
      id: 'responsive-admin',
      name: 'Admin',
      color: '#ffffff',
      position: 0,
      permissions: 0x80000000,
      is_default: false,
      is_hoisted: true,
      is_mentionable: true,
    },
  ],
  my_member: {
    id: 'responsive-member',
    user_id: 'e2e-user',
    roles: [
      {
        id: 'responsive-admin',
        name: 'Admin',
        color: '#ffffff',
        position: 0,
        permissions: 0x80000000,
        is_default: false,
        is_hoisted: true,
        is_mentionable: true,
      },
    ],
    joined_at: '2026-01-01T00:00:00.000Z',
  },
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
      await fulfillJson(route, { data: [group] });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}` && method === 'GET') {
      await fulfillJson(route, { data: group });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members` && method === 'GET') {
      await fulfillJson(route, { members: [] });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/channels` && method === 'GET') {
      await fulfillJson(route, [
        {
          id: 'core-category',
          name: 'Core',
          position: 0,
          is_collapsed: false,
          channels: group.channels,
        },
      ]);
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/categories` && method === 'GET') {
      await fulfillJson(route, [
        {
          id: 'core-category',
          name: 'Core',
          position: 0,
          is_collapsed: false,
        },
      ]);
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/roles` && method === 'GET') {
      await fulfillJson(route, []);
      return;
    }

    if (
      path ===
        `/api/v1/groups/${GROUP_ID}/channels/${GENERAL_CHANNEL_ID}/permissions` &&
      method === 'GET'
    ) {
      await fulfillJson(route, []);
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

async function applyAppTheme(page: Page, theme: (typeof APP_THEMES)[number]): Promise<void> {
  const runtime = THEME_RUNTIME[theme];
  const tokens = TOKEN_REGISTRY[theme];
  if (!tokens) throw new Error(`Missing visual contract for ${theme}`);

  await page.evaluate(
    ({ runtime, theme, tokens }) => {
      const root = document.documentElement;
      root.classList.remove(
        'light',
        'dark',
        'theme-aurora',
        'theme-dark',
        'theme-light',
        'theme-bubble'
      );
      root.classList.add(runtime.category);
      root.classList.add(`theme-${runtime.variant}`);
      root.style.setProperty('color-scheme', runtime.colorScheme);

      for (const [key, value] of Object.entries(tokens)) {
        root.style.setProperty(`--token-${key}`, value);
      }

      root.dataset.cgraphTestTheme = theme;
    },
    { runtime, theme, tokens }
  );
  await expect(page.locator('html')).toHaveClass(new RegExp(`theme-${theme}`));
  await expect(page.locator('html')).toHaveAttribute('data-cgraph-test-theme', theme);
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
      await expect(page.getByRole('button', { name: 'Back to groups' })).toHaveAttribute(
        'data-cgraph-surface',
        'control'
      );
      await expect(
        page.getByRole('button', { name: 'Open CGraph Builders channels' })
      ).toHaveAttribute('data-cgraph-surface', 'control');
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
      await expect(page.getByRole('button', { name: 'Close channel list' })).toHaveAttribute(
        'data-cgraph-surface',
        'control'
      );
      await expect(
        page.getByRole('link', { name: 'Open CGraph Builders settings' })
      ).toHaveAttribute('data-cgraph-surface', 'control');
      await expect(page.getByRole('button', { name: 'Create Category' })).toHaveCount(0);
      expect((await page.getByRole('link', { name: 'News' }).boundingBox())?.height).toBeGreaterThanOrEqual(
        44
      );
      await expect(page.getByRole('link', { name: 'News' })).toHaveAttribute(
        'data-cgraph-surface',
        'control'
      );

      await testInfo.attach(`groups-channel-${viewport.width}x${viewport.height}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });

      await page.getByRole('link', { name: 'News' }).click();
      await expect(page).toHaveURL(
        new RegExp(`/groups/${GROUP_ID}/announcements/${NEWS_CHANNEL_ID}$`)
      );
      await expect(page.getByTestId('groups-channel-list')).toBeHidden();
      await expect(page.getByTestId('group-content-pane')).toBeVisible();

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
    await expect(
      page.getByRole('link', { name: 'Open CGraph Builders settings' })
    ).toHaveAttribute('data-cgraph-surface', 'control');
    await expect(page.getByRole('link', { name: 'general' })).toHaveAttribute(
      'data-cgraph-surface',
      'control'
    );
    await expectNoHorizontalOverflow(page);

    await testInfo.attach('groups-desktop-1440x900', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  });

  for (const viewport of [
    { width: 400, height: 874 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    test(`keeps group settings usable at ${viewport.width}x${viewport.height}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize(viewport);
      await installGroupMocks(page);
      await page.goto(`/groups/${GROUP_ID}/settings`);

      const settingsNav = page.getByRole('navigation', { name: 'Group settings' });
      await expect(settingsNav).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Change banner' })).toHaveAttribute(
        'data-cgraph-surface',
        'control'
      );
      await expect(page.getByRole('button', { name: 'Upload icon' })).toHaveAttribute(
        'data-cgraph-surface',
        'control'
      );
      await expect(page.getByRole('switch', { name: 'Public group' })).toBeVisible();

      const groupName = page.getByRole('textbox', { name: /^Group name/ });
      await groupName.fill('CGraph Builders Lab');
      const saveBar = page.getByRole('region', { name: 'Unsaved group settings' });
      await expect(saveBar).toBeVisible();
      await expect(saveBar.getByRole('button', { name: 'Reset' })).toHaveAttribute(
        'data-cgraph-surface',
        'control'
      );
      await expect(saveBar.getByRole('button', { name: 'Save changes' })).toHaveAttribute(
        'data-cgraph-surface',
        'control'
      );

      if (viewport.width < 1024) {
        await expect
          .poll(async () => {
            const saveBarBox = await saveBar.boundingBox();
            const mobileNavBox = await page
              .getByRole('navigation', { name: 'Mobile navigation' })
              .boundingBox();
            return Boolean(
              saveBarBox &&
                mobileNavBox &&
                saveBarBox.y + saveBarBox.height <= mobileNavBox.y
            );
          })
          .toBe(true);
      } else {
        await expect
          .poll(async () => {
            const saveBarBox = await saveBar.boundingBox();
            return saveBarBox ? Math.round(saveBarBox.y + saveBarBox.height) : null;
          })
          .toBe(viewport.height - 12);
      }

      await saveBar.getByRole('button', { name: 'Reset' }).click();
      await expect(saveBar).toBeHidden();

      const channelsTab = settingsNav.getByRole('button', { name: 'Channels', exact: true });
      await channelsTab.click();

      await expect(page.getByRole('heading', { name: 'Channels', exact: true })).toBeVisible();
      await expect(page.getByLabel('Loading channels')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Create Channel' })).toHaveAttribute(
        'data-cgraph-surface',
        'control'
      );
      await expect(page.getByRole('button', { name: 'Add Category' })).toHaveAttribute(
        'data-cgraph-surface',
        'control'
      );
      await expect(page.getByRole('button', { name: 'Edit Core' })).toHaveAttribute(
        'data-cgraph-surface',
        'control'
      );

      if (viewport.width < 1024) {
        expect((await channelsTab.boundingBox())?.height).toBeGreaterThanOrEqual(44);
        expect(
          (await page.getByRole('button', { name: 'Create Channel' }).boundingBox())?.height
        ).toBeGreaterThanOrEqual(44);
      }

      await page.getByRole('button', { name: 'Create Channel' }).click();
      await expect(page.getByRole('textbox', { name: 'Channel name' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Close channel form' })).toHaveAttribute(
        'data-cgraph-surface',
        'control'
      );
      const formBox = await page.getByTestId('new-channel-form').boundingBox();
      const categoriesBox = await page
        .getByRole('heading', { name: 'Categories', exact: true })
        .boundingBox();
      expect(formBox).not.toBeNull();
      expect(categoriesBox).not.toBeNull();
      expect(categoriesBox!.y).toBeGreaterThanOrEqual(formBox!.y + formBox!.height);

      if (viewport.width < 1024) {
        const lastChannelAction = page.getByRole('button', { name: 'Delete News' });
        await lastChannelAction.scrollIntoViewIfNeeded();
        const actionBox = await lastChannelAction.boundingBox();
        const mobileNavBox = await page
          .getByRole('navigation', { name: 'Mobile navigation' })
          .boundingBox();
        expect(actionBox).not.toBeNull();
        expect(mobileNavBox).not.toBeNull();
        expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(mobileNavBox!.y);
      }

      await expectNoHorizontalOverflow(page);

      await testInfo.attach(`groups-settings-${viewport.width}x${viewport.height}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });

      const rolesTab = settingsNav.getByRole('button', { name: 'Roles', exact: true });
      await rolesTab.click();
      await expect(page.getByRole('heading', { name: 'Roles', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Create role' })).toHaveAttribute(
        'data-cgraph-surface',
        'control'
      );
      await expectNoHorizontalOverflow(page);

      const membersTab = settingsNav.getByRole('button', { name: 'Members', exact: true });
      await membersTab.click();
      await expect(page.getByRole('heading', { name: 'Members', exact: true })).toBeVisible();
      await expect(page.getByRole('searchbox', { name: 'Search members' })).toBeVisible();
      await expect(page.getByRole('combobox', { name: 'Filter members by role' })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }

  for (const viewport of UI_MATRIX_VIEWPORTS) {
    test(`renders every app theme at ${viewport.width}x${viewport.height}`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(60_000);
      await page.setViewportSize(viewport);
      await installGroupMocks(page);
      await page.goto(`/groups/${GROUP_ID}/settings`);

      for (const theme of APP_THEMES) {
        await applyAppTheme(page, theme);
        await expect(
          page.getByRole('navigation', { name: 'Group settings' })
        ).toBeVisible();
        await expect(
          page.getByRole('heading', { name: 'Overview', exact: true })
        ).toBeVisible();
        await expect(page.getByRole('button', { name: 'Change banner' })).toHaveAttribute(
          'data-cgraph-surface',
          'control'
        );
        await expectNoHorizontalOverflow(page);

        await testInfo.attach(
          `groups-settings-${theme}-${viewport.width}x${viewport.height}`,
          {
            body: await page.screenshot({ fullPage: true }),
            contentType: 'image/png',
          }
        );
      }
    });
  }
});
