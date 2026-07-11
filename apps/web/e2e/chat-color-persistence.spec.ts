import { expect, test, type Page, type Route } from '@playwright/test';

const currentUser = {
  id: 'e2e-chat-color-user',
  uid: '1000000001',
  username: 'e2e-chat-color-user',
  display_name: 'E2E Chat Color User',
  avatar_url: null,
  onboarding_completed: true,
  email_verified_at: '2026-01-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
};

type JsonRecord = Record<string, unknown>;

function defaultCustomizations(): JsonRecord {
  const chatThemeSettings = {
    base: 'classic',
    preset_id: null,
    accent_color: 0x3390ec,
    message_colors: [0x5ca853],
    wallpaper: {
      intensity: 44,
      background_color: 0xe5f1fa,
      second_background_color: 0xc4dfef,
      third_background_color: 0xe8eaf9,
      fourth_background_color: 0xdfeff0,
      dark: false,
    },
  };
  const defaultConversationColor = { color: 'ultramarine' };
  const customChatColors = { colors: {}, version: 1, order: [] };
  const conversationChatThemeOverrides = {};

  return {
    chat_theme_settings: chatThemeSettings,
    default_conversation_color: defaultConversationColor,
    custom_chat_colors: customChatColors,
    conversation_chat_theme_overrides: conversationChatThemeOverrides,
    custom_config: {
      chat_theme_settings: chatThemeSettings,
      default_conversation_color: defaultConversationColor,
      custom_chat_colors: customChatColors,
      conversation_chat_theme_overrides: conversationChatThemeOverrides,
    },
  };
}

function readJsonRequest(route: Route): JsonRecord {
  const body = route.request().postData();
  return body ? (JSON.parse(body) as JsonRecord) : {};
}

async function fulfillJson(route: Route, body: unknown): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installChatColorApi(page: Page) {
  let customizations = defaultCustomizations();
  let reads = 0;
  const updates: JsonRecord[] = [];

  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if ((path === '/api/v1/me' || path === '/api/v1/users/me') && method === 'GET') {
      await fulfillJson(route, { data: currentUser, user: currentUser });
      return;
    }

    if (path === '/api/v1/me/customizations' && method === 'GET') {
      reads += 1;
      await fulfillJson(route, { data: customizations });
      return;
    }

    if (path === '/api/v1/me/customizations' && method === 'PATCH') {
      const update = readJsonRequest(route);
      const customConfig = update.custom_config;
      updates.push(update);

      if (customConfig && typeof customConfig === 'object' && !Array.isArray(customConfig)) {
        const config = customConfig as JsonRecord;
        customizations = {
          ...customizations,
          ...update,
          chat_theme_settings: config.chat_theme_settings ?? customizations.chat_theme_settings,
          default_conversation_color:
            config.default_conversation_color ?? customizations.default_conversation_color,
          custom_chat_colors: config.custom_chat_colors ?? customizations.custom_chat_colors,
          conversation_chat_theme_overrides:
            config.conversation_chat_theme_overrides ??
            customizations.conversation_chat_theme_overrides,
          custom_config: {
            ...(customizations.custom_config as JsonRecord),
            ...config,
          },
        };
      }

      await fulfillJson(route, { data: customizations });
      return;
    }

    if (path === '/api/v1/settings' && method === 'GET') {
      await fulfillJson(route, { data: {} });
      return;
    }

    if (path === '/api/v1/conversations' || path === '/api/v1/friends') {
      await fulfillJson(route, { data: [] });
      return;
    }

    await fulfillJson(route, { data: {} });
  });

  return { get reads() { return reads; }, updates };
}

async function hydrateThenReturnToBubbles(
  page: Page,
  getReads: () => number,
  readsBeforeHydration: number,
): Promise<void> {
  await page.goto('/me/appearance/themes');
  await expect.poll(getReads).toBeGreaterThan(readsBeforeHydration);
  await page.getByRole('button', { name: /Chat Bubbles/ }).click();
  await expect(page.getByRole('listbox', { name: 'Chat colors' })).toBeVisible();
}

test('persists and resets the routed global chat color across reloads', async ({ page }) => {
  const api = await installChatColorApi(page);

  await page.goto('/me/appearance/bubbles');

  const crimson = page.getByRole('option', { name: 'crimson' });
  await expect(page.getByRole('listbox', { name: 'Chat colors' })).toBeVisible();
  await crimson.click();

  await expect.poll(() => api.updates.length).toBe(1);
  expect(api.updates[0]).toMatchObject({
    custom_config: { default_conversation_color: { color: 'crimson' } },
  });

  const readsBeforeSelectedColorReload = api.reads;
  await page.reload();
  await hydrateThenReturnToBubbles(page, () => api.reads, readsBeforeSelectedColorReload);
  await expect(crimson).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('button', { name: 'Reset default color' }).click();
  await expect.poll(() => api.updates.length).toBe(2);
  expect(api.updates[1]).toMatchObject({
    custom_config: { default_conversation_color: { color: 'ultramarine' } },
  });

  const readsBeforeResetColorReload = api.reads;
  await page.reload();
  await hydrateThenReturnToBubbles(page, () => api.reads, readsBeforeResetColorReload);
  await expect(page.getByRole('option', { name: 'ultramarine' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('persists and resets the routed CGraph chat wallpaper across reloads', async ({ page }) => {
  const api = await installChatColorApi(page);

  await page.goto('/me/appearance/bubbles');
  await expect(page.getByRole('group', { name: 'Chat wallpaper' })).toBeVisible();

  await page.getByRole('button', { name: 'Current', exact: true }).click();

  await expect.poll(() => api.updates.length).toBe(1);
  expect(api.updates[0]).toMatchObject({
    custom_config: {
      chat_theme_settings: {
        wallpaper: {
          intensity: 36,
          background_color: 0x192436,
          second_background_color: 0x284b5c,
          third_background_color: 0x263848,
          fourth_background_color: 0x131b2a,
          dark: true,
        },
      },
    },
  });

  const readsBeforeSelectedWallpaperReload = api.reads;
  await page.reload();
  await hydrateThenReturnToBubbles(page, () => api.reads, readsBeforeSelectedWallpaperReload);
  await expect(page.getByRole('button', { name: 'Current', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.getByRole('button', { name: 'Reset chat wallpaper' }).click();

  await expect.poll(() => api.updates.length).toBe(2);
  expect(api.updates[1]).toMatchObject({
    custom_config: {
      chat_theme_settings: {
        wallpaper: {
          intensity: 44,
          background_color: 0xe5f1fa,
          second_background_color: 0xc4dfef,
          third_background_color: 0xe8eaf9,
          fourth_background_color: 0xdfeff0,
          dark: false,
        },
      },
    },
  });

  const readsBeforeResetWallpaperReload = api.reads;
  await page.reload();
  await hydrateThenReturnToBubbles(page, () => api.reads, readsBeforeResetWallpaperReload);
  await expect(page.getByRole('button', { name: 'Lattice' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
