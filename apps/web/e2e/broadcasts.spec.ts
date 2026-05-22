import { test, expect, type Page } from '@playwright/test';

const BROADCAST_ID = 'broadcast-1';
const CREATED_BROADCAST_ID = 'broadcast-created';

const broadcast = {
  id: BROADCAST_ID,
  name: 'CGraph Launches',
  slug: 'cgraph-launches',
  description: 'Release notes and product updates from CGraph.',
  avatar_url: null,
  banner_url: null,
  owner_id: 'e2e-user',
  subscriber_count: 41,
  is_verified: true,
  is_subscribed: false,
  inserted_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const existingPost = {
  id: 'post-1',
  broadcast_id: BROADCAST_ID,
  author_id: 'e2e-user',
  content: 'First broadcast proof',
  media_url: null,
  scheduled_for: null,
  published_at: '2026-01-01T00:00:00.000Z',
  view_count: 12,
  inserted_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

async function installBroadcastMocks(page: Page): Promise<{
  createdBroadcasts: Record<string, unknown>[];
  publishedPosts: Record<string, unknown>[];
  subscriptionCalls: string[];
}> {
  const createdBroadcasts: Record<string, unknown>[] = [];
  const publishedPosts: Record<string, unknown>[] = [];
  const subscriptionCalls: string[] = [];
  let subscribed = false;

  await page.route('**/api/v1/broadcasts**', async (route, request) => {
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === '/api/v1/broadcasts' && method === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ ...broadcast, is_subscribed: subscribed }],
          page_info: { end_cursor: null, has_next_page: false },
        }),
      });
      return;
    }

    if (path === '/api/v1/broadcasts' && method === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      createdBroadcasts.push(body);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            ...broadcast,
            id: CREATED_BROADCAST_ID,
            name: String(body.name ?? ''),
            slug: String(body.slug ?? ''),
            description: body.description,
            subscriber_count: 1,
            is_subscribed: true,
          },
        }),
      });
      return;
    }

    if (path === `/api/v1/broadcasts/${BROADCAST_ID}` && method === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: { ...broadcast, is_subscribed: subscribed } }),
      });
      return;
    }

    if (path === `/api/v1/broadcasts/${CREATED_BROADCAST_ID}` && method === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            ...broadcast,
            id: CREATED_BROADCAST_ID,
            name: 'Weekly Signal',
            slug: 'weekly-signal',
            description: 'New channel',
            subscriber_count: 1,
            is_subscribed: true,
          },
        }),
      });
      return;
    }

    if (path === `/api/v1/broadcasts/${BROADCAST_ID}/subscribe` && method === 'POST') {
      subscribed = true;
      subscriptionCalls.push('subscribe');
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: {} }) });
      return;
    }

    if (path === `/api/v1/broadcasts/${BROADCAST_ID}/subscribe` && method === 'DELETE') {
      subscribed = false;
      subscriptionCalls.push('unsubscribe');
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: {} }) });
      return;
    }

    if (path === `/api/v1/broadcasts/${BROADCAST_ID}/posts` && method === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: [existingPost],
          page_info: { end_cursor: null, has_next_page: false },
        }),
      });
      return;
    }

    if (path === `/api/v1/broadcasts/${CREATED_BROADCAST_ID}/posts` && method === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: [], page_info: { end_cursor: null, has_next_page: false } }),
      });
      return;
    }

    if (path === `/api/v1/broadcasts/${BROADCAST_ID}/posts` && method === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      publishedPosts.push(body);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            ...existingPost,
            id: 'post-new',
            content: String(body.content ?? ''),
            view_count: 0,
          },
        }),
      });
      return;
    }

    await route.fallback();
  });

  return { createdBroadcasts, publishedPosts, subscriptionCalls };
}

test.describe('Broadcast routes', () => {
  test('browses, subscribes, and publishes a first-class broadcast surface', async ({ page }) => {
    const { publishedPosts, subscriptionCalls } = await installBroadcastMocks(page);

    await page.goto('/broadcasts');
    await expect(page.getByRole('heading', { name: 'Broadcasts' })).toBeVisible();
    await page.getByRole('button', { name: /cgraph launches/i }).click();

    await expect(page).toHaveURL(new RegExp(`/broadcasts/${BROADCAST_ID}$`));
    await expect(page.getByRole('heading', { name: 'CGraph Launches' })).toBeVisible();
    await expect(page.getByText('First broadcast proof')).toBeVisible();

    await page.getByRole('button', { name: /^subscribe$/i }).click();
    await expect
      .poll(() => subscriptionCalls, { message: 'subscribe endpoint was called' })
      .toContain('subscribe');
    await expect(page.getByRole('button', { name: /^subscribed$/i })).toBeVisible();

    await page.getByPlaceholder('Write a broadcast post').fill('Published from routed web');
    await page.getByRole('button', { name: /^publish$/i }).click();
    await expect
      .poll(() => publishedPosts, { message: 'publish endpoint received post content' })
      .toContainEqual(expect.objectContaining({ content: 'Published from routed web' }));
    await expect(
      page.locator('article').filter({ hasText: 'Published from routed web' })
    ).toBeVisible();
  });

  test('creates a broadcast from the routed directory', async ({ page }) => {
    const { createdBroadcasts } = await installBroadcastMocks(page);

    await page.goto('/broadcasts');
    const createForm = page.locator('form[aria-label="Create broadcast"]');
    await createForm.getByLabel('Name').fill('Weekly Signal');
    await createForm.getByLabel('Description').fill('New channel');
    await createForm.getByRole('button', { name: /create broadcast/i }).click();

    await expect
      .poll(() => createdBroadcasts, { message: 'create endpoint received broadcast payload' })
      .toContainEqual(
        expect.objectContaining({
          name: 'Weekly Signal',
          slug: 'weekly-signal',
          description: 'New channel',
        })
      );
    await expect(page).toHaveURL(new RegExp(`/broadcasts/${CREATED_BROADCAST_ID}$`));
  });
});
