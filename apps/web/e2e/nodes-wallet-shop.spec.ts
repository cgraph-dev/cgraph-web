import { expect, test, type Page, type Route } from '@playwright/test';

const currentUser = {
  id: 'nodes-user',
  uid: '1000000001',
  username: 'nodes-user',
  display_name: 'Nodes User',
  avatar_url: null,
  onboarding_completed: true,
  email_verified_at: '2026-01-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
};

const wallet = {
  user_id: currentUser.id,
  available_balance: 1250,
  pending_balance: 0,
  lifetime_earned: 5000,
  lifetime_spent: 3750,
};

const transaction = {
  id: 'tx-browser-proof',
  user_id: currentUser.id,
  type: 'tip_received',
  amount: 250,
  description: 'Browser proof transaction',
  inserted_at: '2026-01-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
};

const bundle = {
  id: 'bundle-browser-proof',
  name: 'Starter Pack',
  nodes: 500,
  price: 4.99,
  bonus_percent: 0,
  popular: false,
  is_active: true,
};

interface NodesMockOptions {
  readonly walletMode?: 'ok' | 'error' | 'error-once';
  readonly walletFailuresBeforeSuccess?: number;
  readonly transactionsMode?: 'ok' | 'error' | 'error-once' | 'empty';
  readonly transactionFailuresBeforeSuccess?: number;
  readonly bundlesMode?: 'ok' | 'error' | 'error-once' | 'empty';
  readonly bundleFailuresBeforeSuccess?: number;
  readonly checkoutMode?: 'ok' | 'error';
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

async function installNodesMocks(
  page: Page,
  options: NodesMockOptions = {}
): Promise<Record<string, number>> {
  const calls: Record<string, number> = {
    wallet: 0,
    transactions: 0,
    bundles: 0,
    checkout: 0,
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

    if (path === '/api/v1/nodes/wallet' && method === 'GET') {
      calls.wallet += 1;
      const failuresBeforeSuccess =
        options.walletFailuresBeforeSuccess ?? (options.walletMode === 'error-once' ? 1 : 0);
      if (
        options.walletMode === 'error' ||
        (failuresBeforeSuccess > 0 && calls.wallet <= failuresBeforeSuccess)
      ) {
        await fulfillJson(route, errorBody('wallet_unavailable', 'Wallet API unavailable'), 503);
        return;
      }

      await fulfillJson(route, { data: wallet });
      return;
    }

    if (path === '/api/v1/nodes/transactions' && method === 'GET') {
      calls.transactions += 1;
      const failuresBeforeSuccess =
        options.transactionFailuresBeforeSuccess ??
        (options.transactionsMode === 'error-once' ? 1 : 0);
      if (
        options.transactionsMode === 'error' ||
        (failuresBeforeSuccess > 0 && calls.transactions <= failuresBeforeSuccess)
      ) {
        await fulfillJson(
          route,
          errorBody('transactions_unavailable', 'Transaction API unavailable'),
          503
        );
        return;
      }

      await fulfillJson(route, { data: options.transactionsMode === 'empty' ? [] : [transaction] });
      return;
    }

    if (path === '/api/v1/nodes/bundles' && method === 'GET') {
      calls.bundles += 1;
      const failuresBeforeSuccess =
        options.bundleFailuresBeforeSuccess ?? (options.bundlesMode === 'error-once' ? 1 : 0);
      if (
        options.bundlesMode === 'error' ||
        (failuresBeforeSuccess > 0 && calls.bundles <= failuresBeforeSuccess)
      ) {
        await fulfillJson(route, errorBody('bundles_unavailable', 'Bundles API unavailable'), 503);
        return;
      }

      await fulfillJson(route, { data: options.bundlesMode === 'empty' ? [] : [bundle] });
      return;
    }

    if (path === '/api/v1/nodes/checkout' && method === 'POST') {
      calls.checkout += 1;
      if (options.checkoutMode === 'error') {
        await fulfillJson(route, errorBody('checkout_unavailable', 'Checkout unavailable'), 503);
        return;
      }

      await fulfillJson(route, {
        data: {
          checkout_url: 'https://checkout.stripe.com/c/pay/cs_test_nodes',
          session_id: 'cs_test_nodes',
        },
      });
      return;
    }

    if (path === '/api/v1/settings' && method === 'GET') {
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

  return calls;
}

test.describe('Nodes wallet and shop routed browser behavior', () => {
  test('renders wallet balance and transaction history from server data', async ({ page }) => {
    await installNodesMocks(page);

    await page.goto('/me/wallet');

    await expect(page.getByText('Available Balance')).toBeVisible();
    await expect(page.getByText(/1,250/)).toBeVisible();
    await expect(page.getByText('Transaction History')).toBeVisible();
    await expect(page.getByText('Tip Received')).toBeVisible();
    await expect(page.getByText(/\+.*250/)).toBeVisible();
  });

  test('does not render a false zero-balance wallet when wallet loading fails', async ({ page }) => {
    await installNodesMocks(page, { walletMode: 'error' });

    await page.goto('/me/wallet');

    await expect(page.getByText('Wallet unavailable')).toBeVisible();
    await expect(page.getByText('Wallet API unavailable')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
    await expect(page.getByText('Available Balance')).toHaveCount(0);
  });

  test('recovers the wallet route after retry without rendering a false zero balance', async ({
    page,
  }) => {
    const calls = await installNodesMocks(page, { walletFailuresBeforeSuccess: 100 });

    await page.goto('/me/wallet');

    await expect(page.getByText('Wallet unavailable')).toBeVisible();
    await expect(page.getByText('Available Balance')).toHaveCount(0);

    calls.wallet = 100;
    await page.getByRole('button', { name: 'Retry' }).click();

    await expect.poll(() => calls.wallet).toBeGreaterThanOrEqual(101);
    await expect(page.getByText('Available Balance')).toBeVisible();
    await expect(page.getByText(/1,250/)).toBeVisible();
    await expect(page.getByText('Wallet unavailable')).toHaveCount(0);
  });

  test('keeps wallet visible while transaction history failure is explicit', async ({ page }) => {
    await installNodesMocks(page, { transactionsMode: 'error' });

    await page.goto('/me/wallet');

    await expect(page.getByText('Available Balance')).toBeVisible();
    await expect(page.getByText(/1,250/)).toBeVisible();
    await expect(page.getByText('Transaction history unavailable')).toBeVisible();
    await expect(page.getByText('Transaction API unavailable')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
    await expect(page.getByText('No transactions yet')).toHaveCount(0);
  });

  test('recovers transaction history after retry while keeping wallet balance visible', async ({
    page,
  }) => {
    const calls = await installNodesMocks(page, { transactionFailuresBeforeSuccess: 100 });

    await page.goto('/me/wallet');

    await expect(page.getByText('Available Balance')).toBeVisible();
    await expect(page.getByText('Transaction history unavailable')).toBeVisible();

    calls.transactions = 100;
    await page.getByRole('button', { name: 'Retry' }).click();

    await expect.poll(() => calls.transactions).toBeGreaterThanOrEqual(101);
    await expect(page.getByText('Tip Received')).toBeVisible();
    await expect(page.getByText(/\+.*250/)).toBeVisible();
    await expect(page.getByText('Transaction history unavailable')).toHaveCount(0);
  });

  test('renders shop bundles and handles checkout failure as a user-facing error', async ({
    page,
  }) => {
    const calls = await installNodesMocks(page, { checkoutMode: 'error' });

    await page.goto('/me/wallet/shop');

    await expect(page.getByRole('heading', { name: 'Get Nodes' })).toBeVisible();
    await expect(page.getByText(/1,250/)).toBeVisible();
    await expect(page.getByText('Starter Pack')).toBeVisible();
    await expect(page.getByText(/500/).first()).toBeVisible();
    await expect(page.getByText(/4\.99/)).toBeVisible();

    await page.getByRole('button', { name: 'Purchase' }).click();
    await expect.poll(() => calls.checkout).toBe(1);
    await expect(page.getByText('Checkout failed. Please try again.')).toBeVisible();
  });

  test('hands successful bundle checkout off to Stripe without local fake success', async ({
    page,
  }) => {
    const calls = await installNodesMocks(page);

    await page.route('https://checkout.stripe.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>Stripe Checkout</title><h1>Stripe Checkout</h1>',
      });
    });

    await page.goto('/me/wallet/shop');

    await expect(page.getByRole('heading', { name: 'Get Nodes' })).toBeVisible();
    await expect(page.getByText('Starter Pack')).toBeVisible();

    await page.getByRole('button', { name: 'Purchase' }).click();

    await expect.poll(() => calls.checkout).toBe(1);
    await expect(page).toHaveURL(/https:\/\/checkout\.stripe\.com\/c\/pay\/cs_test_nodes/);
    await expect(page.getByRole('heading', { name: 'Stripe Checkout' })).toBeVisible();
  });

  test('does not render an empty shop as success when bundles fail to load', async ({ page }) => {
    await installNodesMocks(page, { bundlesMode: 'error' });

    await page.goto('/me/wallet/shop');

    await expect(page.getByText('Shop unavailable')).toBeVisible();
    await expect(page.getByText('Bundles API unavailable')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Purchase' })).toHaveCount(0);
  });

  test('recovers shop bundles after retry without showing the empty-shop state', async ({ page }) => {
    const calls = await installNodesMocks(page, { bundleFailuresBeforeSuccess: 100 });

    await page.goto('/me/wallet/shop');

    await expect(page.getByText('Shop unavailable')).toBeVisible();
    await expect(page.getByText('No Node bundles are available right now.')).toHaveCount(0);

    calls.bundles = 100;
    await page.getByRole('button', { name: 'Retry' }).click();

    await expect.poll(() => calls.bundles).toBeGreaterThanOrEqual(101);
    await expect(page.getByText('Starter Pack')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Purchase' })).toBeVisible();
    await expect(page.getByText('Shop unavailable')).toHaveCount(0);
  });

  test('shows a distinct empty state when the shop loads with no bundles', async ({ page }) => {
    await installNodesMocks(page, { bundlesMode: 'empty' });

    await page.goto('/me/wallet/shop');

    await expect(page.getByText('No Node bundles are available right now.')).toBeVisible();
    await expect(page.getByText('Shop unavailable')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Purchase' })).toHaveCount(0);
  });
});
