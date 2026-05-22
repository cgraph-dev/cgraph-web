import { expect, test, type Page, type Route } from '@playwright/test';

const CURRENT_USER_ID = 'e2e-user';
const AVATAR_BORDER_ID = 'border_cyberpunk_common_01';
const NAMEPLATE_ID = 'plate_aurora';
const PROFILE_THEME_ID = 'aurora-glass';

const currentUserProfile = {
  id: CURRENT_USER_ID,
  uid: '1000000000',
  username: 'e2e-user',
  display_name: 'E2E User',
  avatar_url: null,
  avatar_border_id: AVATAR_BORDER_ID,
  equipped_nameplate_id: NAMEPLATE_ID,
  profile_theme: PROFILE_THEME_ID,
  display_name_effect: 'neon',
  display_name_color: '#7dd3fc',
  display_name_secondary_color: '#a78bfa',
  bio: 'Browser-safe identity proof',
  level: 7,
  pulse: 42,
  is_verified: true,
  is_premium: false,
  status: 'online',
  created_at: '2026-01-01T00:00:00.000Z',
};

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installIdentityMocks(page: Page): Promise<void> {
  await page.route('**/api/v1/**', async (route, request) => {
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if ((path === '/api/v1/me' || path === '/api/v1/users/me') && method === 'GET') {
      await fulfillJson(route, { data: currentUserProfile, user: currentUserProfile });
      return;
    }

    if (path === `/api/v1/users/${CURRENT_USER_ID}` && method === 'GET') {
      await fulfillJson(route, { data: currentUserProfile, user: currentUserProfile });
      return;
    }

    if (path === '/api/v1/conversations' && method === 'GET') {
      await fulfillJson(route, { data: [], meta: { page: 1, total: 0 } });
      return;
    }

    if (path === '/api/v1/friends' && method === 'GET') {
      await fulfillJson(route, { data: [] });
      return;
    }

    if (path === '/api/v1/friends/requests' && method === 'GET') {
      await fulfillJson(route, { data: [] });
      return;
    }

    if (path === '/api/v1/friends/sent' && method === 'GET') {
      await fulfillJson(route, { data: [] });
      return;
    }

    if (path === '/api/v1/notifications' && method === 'GET') {
      await fulfillJson(route, { data: [] });
      return;
    }

    if (path.startsWith('/api/v1/search/') && method === 'GET') {
      await fulfillJson(route, []);
      return;
    }

    await fulfillJson(route, {});
  });
}

test.describe('Sidebar profile identity', () => {
  test('renders canonical current-user cosmetics in the hover card and opens the public profile', async ({
    page,
  }) => {
    await installIdentityMocks(page);

    await page.goto('/messages');

    const profileButton = page.getByRole('button', { name: /open your public profile/i });
    await expect(profileButton).toBeVisible();
    await profileButton.hover();

    await expect(page.locator(`[data-profile-theme-id="${PROFILE_THEME_ID}"]`).first()).toBeVisible();
    await expect(page.locator(`[data-avatar-border-id="${AVATAR_BORDER_ID}"]`).first()).toBeVisible();
    await expect(page.locator(`[data-nameplate-id="${NAMEPLATE_ID}"]`).first()).toBeVisible();
    await expect(page.locator('[data-display-name-effect="neon"]').first()).toBeVisible();

    await profileButton.click();
    await expect(page).toHaveURL(new RegExp(`/user/${CURRENT_USER_ID}$`));
    await expect(page.getByRole('heading', { name: /e2e user/i })).toBeVisible();

    const publicProfile = page.getByRole('main');
    await expect(publicProfile.locator(`[data-profile-theme-id="${PROFILE_THEME_ID}"]`)).toBeVisible();
    await expect(publicProfile.locator(`[data-nameplate-id="${NAMEPLATE_ID}"]`)).toBeVisible();
    await expect(publicProfile.locator('[data-display-name-effect="neon"]')).toBeVisible();
  });
});
