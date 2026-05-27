import { expect, test, type Page, type Route } from '@playwright/test';

const THREAD_ID = 'gated-thread';
const FORUM_SLUG = 'nodes';

const currentUser = {
  id: 'nodes-unlock-user',
  uid: '1000000101',
  username: 'unlocker',
  display_name: 'Unlock User',
  avatar_url: null,
  onboarding_completed: true,
  email_verified_at: '2026-01-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
};

const author = {
  id: 'nodes-unlock-author',
  username: 'author',
  display_name: 'Thread Author',
  avatar_url: null,
};

const forum = {
  id: 'forum-nodes',
  name: 'Nodes Forum',
  slug: FORUM_SLUG,
  description: 'Nodes unlock proof',
  icon: null,
  banner: null,
  is_nsfw: false,
  is_private: false,
  member_count: 3,
  score: 0,
  upvotes: 0,
  downvotes: 0,
  hot_score: 0,
  weekly_score: 0,
  featured: false,
  user_vote: 0,
  categories: [],
  is_subscribed: false,
  is_member: true,
  owner: { id: author.id },
  created_at: '2026-01-01T00:00:00.000Z',
};

type UnlockMode = 'insufficient' | 'not-gated' | 'not-found' | 'fail-then-success';

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

function postPayload(isContentGated: boolean) {
  return {
    id: THREAD_ID,
    forum_id: forum.id,
    author_id: author.id,
    title: 'Gated Nodes Thread',
    content: 'Preview text for a gated thread.',
    post_type: 'text',
    link_url: null,
    media_urls: [],
    is_pinned: false,
    is_locked: false,
    is_nsfw: false,
    upvotes: 0,
    downvotes: 0,
    score: 0,
    hot_score: 0,
    comment_count: 0,
    my_vote: null,
    category: null,
    views: 1,
    author,
    forum: {
      id: forum.id,
      name: forum.name,
      slug: forum.slug,
      icon_url: null,
    },
    is_content_gated: isContentGated,
    gate_price_nodes: isContentGated ? 75 : null,
    gate_preview_chars: 40,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
}

async function installContentUnlockMocks(
  page: Page,
  mode: UnlockMode
): Promise<{ unlockAttempts: string[] }> {
  const unlockAttempts: string[] = [];
  let unlocked = false;

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

    if (path === `/api/v1/forums/${FORUM_SLUG}` && method === 'GET') {
      await fulfillJson(route, { data: forum });
      return;
    }

    if (path === `/api/v1/posts/${THREAD_ID}` && method === 'GET') {
      await fulfillJson(route, { data: postPayload(!unlocked) });
      return;
    }

    if (path === `/api/v1/posts/${THREAD_ID}/comments` && method === 'GET') {
      await fulfillJson(route, { data: [] });
      return;
    }

    if (path === '/api/v1/nodes/unlock' && method === 'POST') {
      unlockAttempts.push(request.postData() || '');

      if (mode === 'insufficient') {
        await fulfillJson(route, errorBody('insufficient_balance', 'Insufficient node balance'), 422);
        return;
      }

      if (mode === 'not-gated') {
        await fulfillJson(route, errorBody('content_not_gated', 'Content is not gated'), 422);
        return;
      }

      if (mode === 'not-found') {
        await fulfillJson(route, errorBody('thread_not_found', 'Thread not found'), 404);
        return;
      }

      if (unlockAttempts.length === 1) {
        await fulfillJson(route, errorBody('unlock_failed', 'Unlock failed'), 503);
        return;
      }

      unlocked = true;
      await fulfillJson(route, {
        data: {
          id: 'unlock-profile-retry',
          amount: -75,
          type: 'content_unlock',
          reference_id: THREAD_ID,
          reference_type: 'thread',
          platform_cut: 0,
          net_amount: -75,
          metadata: { thread_id: THREAD_ID, author_id: author.id },
          inserted_at: '2026-01-01T00:00:00.000Z',
        },
      });
      return;
    }

    if (path === '/api/v1/settings' && method === 'GET') {
      await fulfillJson(route, { data: {} });
      return;
    }

    if (path === '/api/v1/onboarding/status' && method === 'GET') {
      await fulfillJson(route, { data: { completed: true, steps: {} } });
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

  return { unlockAttempts };
}

test.describe('Nodes content unlock routed browser behavior', () => {
  test('routes insufficient balance to the canonical wallet shop', async ({ page }) => {
    const calls = await installContentUnlockMocks(page, 'insufficient');

    await page.goto(`/forums/${FORUM_SLUG}/post/${THREAD_ID}`);

    await expect(page.getByRole('heading', { name: /gated nodes thread/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unlock for 75 Nodes' })).toBeVisible();

    await page.getByRole('button', { name: 'Unlock for 75 Nodes' }).click();

    await expect.poll(() => calls.unlockAttempts.length).toBe(1);
    await expect(page).toHaveURL(/\/me\/wallet\/shop/);
  });

  test('keeps the gated route retryable after server not-gated and not-found errors', async ({
    page,
  }) => {
    const notGatedCalls = await installContentUnlockMocks(page, 'not-gated');

    await page.goto(`/forums/${FORUM_SLUG}/post/${THREAD_ID}`);
    await page.getByRole('button', { name: 'Unlock for 75 Nodes' }).click();

    await expect.poll(() => notGatedCalls.unlockAttempts.length).toBe(1);
    await expect(page.getByText('Unlock failed. Please try again.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unlock for 75 Nodes' })).toBeVisible();

    await page.unroute('**/api/v1/**');
    const notFoundCalls = await installContentUnlockMocks(page, 'not-found');

    await page.goto(`/forums/${FORUM_SLUG}/post/${THREAD_ID}`);
    await page.getByRole('button', { name: 'Unlock for 75 Nodes' }).click();

    await expect.poll(() => notFoundCalls.unlockAttempts.length).toBe(1);
    await expect(page.getByText('Unlock failed. Please try again.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unlock for 75 Nodes' })).toBeVisible();
  });

  test('recovers from an unlock failure and hides the gate only after server success', async ({
    page,
  }) => {
    const calls = await installContentUnlockMocks(page, 'fail-then-success');

    await page.goto(`/forums/${FORUM_SLUG}/post/${THREAD_ID}`);

    await page.getByRole('button', { name: 'Unlock for 75 Nodes' }).click();
    await expect.poll(() => calls.unlockAttempts.length).toBe(1);
    await expect(page.getByText('Unlock failed. Please try again.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unlock for 75 Nodes' })).toBeVisible();

    await page.getByRole('button', { name: 'Unlock for 75 Nodes' }).click();

    await expect.poll(() => calls.unlockAttempts.length).toBe(2);
    await expect(page.getByText('Content unlocked!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unlock for 75 Nodes' })).toHaveCount(0);
  });
});
