import { expect, test, type Page, type Route } from '@playwright/test';

const RECIPIENT_ID = 'nodes-profile-recipient';

const currentUser = {
  id: 'nodes-profile-user',
  uid: '1000000091',
  username: 'nodes-owner',
  display_name: 'Nodes Owner',
  avatar_url: null,
  onboarding_completed: true,
  email_verified_at: '2026-01-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
};

const recipientUser = {
  id: RECIPIENT_ID,
  uid: '1000000092',
  username: 'recipient',
  display_name: 'Recipient Creator',
  avatar_url: null,
  bio: 'Routed profile Nodes proof',
  is_friend: false,
  friend_request_sent: false,
  friend_request_received: false,
  friendship_status: 'none',
  friends_count: 0,
  level: 2,
  total_xp: 800,
  current_xp: 300,
  top_communities: [],
  created_at: '2026-01-01T00:00:00.000Z',
};

const wallet = {
  user_id: currentUser.id,
  available_balance: 1000,
  pending_balance: 0,
  lifetime_earned: 1000,
  lifetime_spent: 0,
};

interface NodesProfileMockOptions {
  readonly tipMode?: 'fail-then-success' | 'success';
  readonly giftMode?: 'fail-then-success' | 'success';
}

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function errorBody(code: string, message: string) {
  return { error: { code, message } };
}

async function installNodesProfileMocks(
  page: Page,
  options: NodesProfileMockOptions = {}
): Promise<{ tipAttempts: string[]; giftAttempts: string[] }> {
  const tipAttempts: string[] = [];
  const giftAttempts: string[] = [];

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

    if (path === `/api/v1/users/${RECIPIENT_ID}` && method === 'GET') {
      await fulfillJson(route, { data: recipientUser });
      return;
    }

    if (path === '/api/v1/nodes/wallet' && method === 'GET') {
      await fulfillJson(route, { data: wallet });
      return;
    }

    if (path === '/api/v1/nodes/tip' && method === 'POST') {
      tipAttempts.push(request.postData() || '');

      if (
        (options.tipMode ?? 'fail-then-success') === 'fail-then-success' &&
        tipAttempts.length === 1
      ) {
        await fulfillJson(
          route,
          errorBody('insufficient_balance', 'Insufficient node balance'),
          422
        );
        return;
      }

      await fulfillJson(route, {
        data: {
          id: 'tip-profile-retry',
          amount: -10,
          type: 'tip_sent',
          reference_id: RECIPIENT_ID,
          reference_type: 'user',
          platform_cut: 0,
          net_amount: -10,
          metadata: { recipient_id: RECIPIENT_ID },
          inserted_at: '2026-01-01T00:00:00.000Z',
        },
      });
      return;
    }

    if (path === '/api/v1/nodes/gift' && method === 'POST') {
      giftAttempts.push(request.postData() || '');

      if (
        (options.giftMode ?? 'fail-then-success') === 'fail-then-success' &&
        giftAttempts.length === 1
      ) {
        await fulfillJson(
          route,
          errorBody('insufficient_balance', 'Insufficient node balance'),
          422
        );
        return;
      }

      await fulfillJson(route, {
        data: {
          id: 'gift-profile-retry',
          amount: 10,
          recipient_id: RECIPIENT_ID,
          message: null,
          created_at: '2026-01-01T00:00:00.000Z',
          net_amount: 8,
          platform_cut: 2,
        },
      });
      return;
    }

    if (path === '/api/v1/settings' && method === 'GET') {
      await fulfillJson(route, { data: {} });
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

  return { tipAttempts, giftAttempts };
}

test.describe('Nodes profile action routed browser behavior', () => {
  test('keeps the profile tip modal honest on insufficient balance and retries to success', async ({
    page,
  }) => {
    const calls = await installNodesProfileMocks(page);

    await page.goto(`/user/${RECIPIENT_ID}`);

    await expect(page.getByRole('heading', { name: /recipient creator/i })).toBeVisible();
    await page.getByTitle('Tip @Recipient Creator').first().click();
    await expect(page.getByRole('heading', { name: /tip @recipient creator/i })).toBeVisible();

    await page.getByRole('button', { name: /send .*10/i }).click();
    await expect(page.getByText('Not enough Nodes. Add Nodes to continue.')).toBeVisible();
    await expect(page.getByRole('heading', { name: /tip @recipient creator/i })).toBeVisible();

    await page.getByRole('button', { name: /send .*10/i }).click();

    await expect.poll(() => calls.tipAttempts.length).toBe(2);
    await expect(page.getByText('Tipped')).toBeVisible();
    await expect(page.getByRole('heading', { name: /tip @recipient creator/i })).toHaveCount(0);
  });

  test('keeps the profile gift modal honest on insufficient balance and retries to success', async ({
    page,
  }) => {
    const calls = await installNodesProfileMocks(page);

    await page.goto(`/user/${RECIPIENT_ID}`);

    await expect(page.getByRole('heading', { name: /recipient creator/i })).toBeVisible();
    await page.getByTitle('Gift Nodes to @Recipient Creator').click();
    await expect(
      page.getByRole('dialog', { name: /gift nodes to recipient creator/i })
    ).toBeVisible();

    await page.getByRole('button', { name: /^send gift$/i }).click();
    await expect(page.getByText('Not enough Nodes. Add Nodes to continue.')).toBeVisible();
    await expect(
      page.getByRole('dialog', { name: /gift nodes to recipient creator/i })
    ).toBeVisible();

    await page.getByRole('button', { name: /^send gift$/i }).click();

    await expect.poll(() => calls.giftAttempts.length).toBe(2);
    await expect(page.getByRole('heading', { name: /gift sent/i })).toBeVisible();
  });
});
