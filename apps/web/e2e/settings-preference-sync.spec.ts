import { expect, test, type Page, type Route } from '@playwright/test';

const CURRENT_USER_ID = 'e2e-user';

const currentUser = {
  id: CURRENT_USER_ID,
  uid: '1000000000',
  username: 'e2e-user',
  display_name: 'E2E User',
  avatar_url: null,
  onboarding_completed: true,
  email_verified_at: '2026-01-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
};

const initialSettings = {
  show_online_status: false,
  show_read_receipts: false,
  profile_visibility: 'friends',
  allow_group_invites: 'friends',
  selective_privacy: {
    message_requests: {
      mode: 'contacts',
      always_allow_user_ids: ['friend-1'],
      never_allow_user_ids: [],
    },
    phone_number: {
      mode: 'nobody',
      always_allow_user_ids: [],
      never_allow_user_ids: [],
    },
    calls: {
      mode: 'contacts',
      always_allow_user_ids: [],
      never_allow_user_ids: ['blocked-1'],
    },
  },
};

const initialCustomizations = {
  custom_config: {
    app_theme: 'purple',
    profile_theme: 'signal-noir',
    equipped_nameplate: 'plate_cosmic',
    display_name_effect: 'none',
    display_name_color: '#ffffff',
  },
};

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installPreferenceMocks(page: Page): Promise<void> {
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

    if (path === '/api/v1/settings' && method === 'GET') {
      await fulfillJson(route, { data: initialSettings });
      return;
    }

    if (path.startsWith('/api/v1/settings/') && method === 'GET') {
      await fulfillJson(route, { data: initialSettings });
      return;
    }

    if (path.startsWith('/api/v1/settings/') && method !== 'GET') {
      await fulfillJson(route, { data: initialSettings });
      return;
    }

    if (path === '/api/v1/me/customizations' && method === 'GET') {
      await fulfillJson(route, { data: initialCustomizations });
      return;
    }

    if (path === '/api/v1/me/customizations' && method === 'PATCH') {
      await fulfillJson(route, { data: initialCustomizations });
      return;
    }

    if (path === '/api/v1/me/theme') {
      await fulfillJson(route, {
        data: {
          theme: {
            mode: 'aurora',
            modeExplicit: true,
            profileThemeId: 'signal-noir',
            chatBubbleColor: 'purple',
          },
        },
      });
      return;
    }

    if (path === '/api/v1/conversations') {
      await fulfillJson(route, { data: [], meta: { page: 1, total: 0 } });
      return;
    }

    if (path === '/api/v1/friends' || path === '/api/v1/friends/requests') {
      await fulfillJson(route, { data: [] });
      return;
    }

    if (path === '/api/v1/friends/sent' || path === '/api/v1/notifications') {
      await fulfillJson(route, { data: [] });
      return;
    }

    if (path.startsWith('/api/v1/search/')) {
      await fulfillJson(route, []);
      return;
    }

    await fulfillJson(route, { data: {} });
  });
}

test.describe('Settings preference sync', () => {
  test('hydrates privacy settings, preserves them across reload, and applies live sync', async ({
    page,
  }) => {
    await installPreferenceMocks(page);

    await page.goto('/me/settings/privacy');

    const messageRequests = page.getByLabel('Who can send you direct messages');
    const onlineStatus = page.getByLabel('Who can see your online status');
    const groupInvites = page.getByLabel('Who can add you to groups');

    await expect(page.getByRole('heading', { name: /^Privacy$/ })).toBeVisible();
    await expect(messageRequests).toHaveValue('contacts');
    await expect(onlineStatus).toHaveValue('nobody');
    await expect(groupInvites).toHaveValue('friends');

    await page.reload();

    await expect(page.getByRole('heading', { name: /^Privacy$/ })).toBeVisible();
    await expect(messageRequests).toHaveValue('contacts');
    await expect(onlineStatus).toHaveValue('nobody');
    await expect(groupInvites).toHaveValue('friends');

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('cgraph:e2e-preference-sync', {
          detail: {
            surface: 'settings',
            section: 'privacy',
            last_updated_at: new Date(Date.now() + 10_000).toISOString(),
            changes: {
              show_online_status: true,
              allow_group_invites: 'nobody',
              selective_privacy: {
                message_requests: {
                  mode: 'everyone',
                  always_allow_user_ids: [],
                  never_allow_user_ids: [],
                },
                phone_number: {
                  mode: 'nobody',
                  always_allow_user_ids: [],
                  never_allow_user_ids: [],
                },
                calls: {
                  mode: 'contacts',
                  always_allow_user_ids: [],
                  never_allow_user_ids: [],
                },
              },
            },
          },
        })
      );
    });

    await expect(messageRequests).toHaveValue('everyone');
    await expect(onlineStatus).toHaveValue('everyone');
    await expect(groupInvites).toHaveValue('nobody');
  });

  test('applies customization and app-shell theme sync on the live appearance route', async ({
    page,
  }) => {
    await installPreferenceMocks(page);

    await page.goto('/me/appearance/themes');

    await expect(page.getByRole('heading', { name: /^Themes$/ })).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/theme-aurora/);
    await expect(page.locator('[data-profile-theme-id="signal-noir"]').first()).toBeVisible();

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('cgraph:e2e-preference-sync', {
          detail: {
            surface: 'customization',
            changes: {
              profile_theme: 'aurora-glass',
              equipped_nameplate: 'plate_aurora',
              display_name_effect: 'neon',
              display_name_color: '#7dd3fc',
              display_name_secondary_color: '#a78bfa',
            },
          },
        })
      );
    });

    await expect(page.locator('[data-profile-theme-id="aurora-glass"]').first()).toBeVisible();
    await expect(page.locator('[data-nameplate-id="plate_aurora"]').first()).toBeVisible();
    await expect(page.locator('[data-display-name-effect="neon"]').first()).toBeVisible();

    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('cgraph:e2e-preference-sync', {
          detail: {
            surface: 'theme',
            theme: {
              mode: 'light',
              modeExplicit: true,
            },
          },
        })
      );
    });

    await expect(page.locator('html')).toHaveClass(/theme-light/);
  });
});
