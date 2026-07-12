import { execFileSync } from 'node:child_process';
import {
  expect,
  test,
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';

const AUTH_STORAGE_KEY = 'cgraph-auth-v2';
const PASSWORD = 'LiveProof123!';

type RawUser = Record<string, unknown>;

interface LiveAccount {
  readonly user: RawUser;
  readonly username: string;
  readonly email: string;
  readonly accessToken: string;
  readonly refreshToken: string | null;
}

test.skip(process.env.CGRAPH_LIVE_E2E !== 'true', 'requires local backend-backed live e2e');
test.setTimeout(90_000);

function uniqueHandle(prefix: string): string {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 7);
  return `p36${prefix}${stamp}${random}`.slice(0, 30);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function historyFrameIncludes(frame: string, text: string): boolean {
  try {
    const decoded: unknown = JSON.parse(frame);
    if (!Array.isArray(decoded) || decoded[3] !== 'message_history') return false;

    const payload = decoded[4];
    if (!payload || typeof payload !== 'object' || !('messages' in payload)) return false;

    const messages = payload.messages;
    return Array.isArray(messages) && messages.some((message) => JSON.stringify(message).includes(text));
  } catch {
    return false;
  }
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function markLocalAccountReady(email: string): void {
  const sql = [
    'update users',
    'set email_verified_at = coalesce(email_verified_at, now()),',
    '    onboarding_completed_at = coalesce(onboarding_completed_at, now())',
    `where email = ${sqlLiteral(email)};`,
  ].join(' ');

  execFileSync('psql', ['-v', 'ON_ERROR_STOP=1', '-c', sql], {
    env: {
      ...process.env,
      PGHOST: process.env.PGHOST || 'localhost',
      PGPORT: process.env.PGPORT || '5432',
      PGUSER: process.env.PGUSER || 'cgraph',
      PGPASSWORD: process.env.PGPASSWORD || 'cgraph_dev_password',
      PGDATABASE: process.env.PGDATABASE || 'cgraph_dev',
    },
    stdio: 'pipe',
  });
}

function mapSessionUser(user: RawUser): Record<string, unknown> {
  const username = asString(user.username);
  const displayName = asString(user.display_name, username);

  return {
    id: asString(user.id),
    uid: asString(user.uid),
    userId: typeof user.user_id === 'number' ? user.user_id : 0,
    userIdDisplay: asString(user.user_id_display, '#0000000000'),
    email: asString(user.email),
    username,
    displayName,
    avatarUrl: user.avatar_url ?? null,
    walletAddress: user.wallet_address ?? null,
    emailVerifiedAt: asString(user.email_verified_at, new Date().toISOString()),
    onboardingCompleted: true,
    twoFactorEnabled: user.totp_enabled === true,
    status: asString(user.status, 'offline'),
    statusMessage: user.custom_status ?? null,
    pulse: typeof user.karma === 'number' ? user.karma : 0,
    isVerified: user.is_verified === true,
    isPremium: user.is_premium === true,
    isAdmin: user.is_admin === true,
    canChangeUsername: user.can_change_username !== false,
    usernameNextChangeAt: user.username_next_change_at ?? null,
    phoneNumber: user.phone_number ?? null,
    createdAt: asString(user.inserted_at),
  };
}

async function registerLiveAccount(request: APIRequestContext, prefix: string): Promise<LiveAccount> {
  const username = uniqueHandle(prefix);
  const email = `${username}@e2e.cgraph.local`;
  const response = await request.post('/api/v1/auth/register', {
    data: {
      user: {
        username,
        email,
        password: PASSWORD,
        password_confirmation: PASSWORD,
      },
    },
  });

  expect(response.status(), await response.text()).toBe(201);
  const body = (await response.json()) as Record<string, unknown>;
  const tokens = body.tokens as Record<string, unknown> | undefined;
  const rawUser = body.user;

  expect(rawUser).toBeTruthy();
  expect(typeof rawUser).toBe('object');
  expect(tokens?.access_token).toBeTruthy();

  markLocalAccountReady(email);

  const user = rawUser as RawUser;

  return {
    user,
    username,
    email,
    accessToken: asString(tokens?.access_token),
    refreshToken: typeof tokens?.refresh_token === 'string' ? tokens.refresh_token : null,
  };
}

async function installSession(context: BrowserContext, account: LiveAccount): Promise<void> {
  await context.addInitScript(
    ({ storageKey, token, refreshToken, user }) => {
      const state = {
        state: {
          token,
          refreshToken,
          user,
          isAuthenticated: true,
        },
        version: 0,
      };

      window.localStorage.clear();
      window.sessionStorage.setItem(storageKey, btoa(encodeURIComponent(JSON.stringify(state))));
    },
    {
      storageKey: AUTH_STORAGE_KEY,
      token: account.accessToken,
      refreshToken: account.refreshToken,
      user: mapSessionUser(account.user),
    }
  );
}

async function newSignedInPage(browser: Browser, account: LiveAccount): Promise<Page> {
  const context = await browser.newContext();
  await installSession(context, account);
  return context.newPage();
}

async function openFriends(page: Page): Promise<void> {
  await page.goto('/social/friends');
  await expect(page.getByRole('heading', { name: 'Friends', exact: true })).toBeVisible();
}

function friendsRegion(page: Page) {
  return page.getByRole('region', { name: 'Friends and requests' });
}

async function sendFriendRequest(page: Page, targetUsername: string): Promise<void> {
  await page.getByRole('button', { name: 'Add friend' }).click();
  await page.getByLabel('Friend identifier').fill(targetUsername);
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(friendsRegion(page).getByText(`@${targetUsername}`)).toBeVisible();

  const closeButton = page.getByRole('button', { name: 'Close add friend' });
  if (await closeButton.isVisible()) {
    await closeButton.click();
  }
}

async function acceptFriendRequest(page: Page, requesterUsername: string): Promise<void> {
  const region = friendsRegion(page);

  await expect(region.getByText(`@${requesterUsername}`)).toBeVisible();
  await region
    .getByRole('button', { name: new RegExp(`Accept friend request from ${requesterUsername}`) })
    .click();
  await expect(
    region.getByRole('button', { name: new RegExp(`Message ${requesterUsername}`) })
  ).toBeVisible();
}

async function openFriendDm(page: Page, friendUsername: string): Promise<void> {
  await friendsRegion(page).getByRole('button', { name: new RegExp(`Message ${friendUsername}`) }).click();
  await expect(page).toHaveURL(/\/messages\/[^/?#]+$/);
  await expect(page.getByPlaceholder(/type a message/i)).toBeVisible();
}

async function sendMessage(page: Page, text: string): Promise<void> {
  await page.getByPlaceholder(/type a message/i).fill(text);
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByLabel('Conversation messages')).toContainText(text);
}

async function expectOrderedMessages(page: Page, first: string, second: string): Promise<void> {
  const messages = page.getByLabel('Conversation messages');
  await expect(messages).toContainText(first);
  await expect(messages).toContainText(second);
  await expect.poll(async () => {
    const text = (await messages.textContent()) ?? '';
    return text.indexOf(first) >= 0 && text.indexOf(first) < text.indexOf(second);
  }).toBe(true);
  await expect(messages.getByText(first, { exact: true })).toHaveCount(1);
  await expect(messages.getByText(second, { exact: true })).toHaveCount(1);
}

function responseData(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};

  const record = body as Record<string, unknown>;
  const data = record.data;
  return data && typeof data === 'object' && !Array.isArray(data)
    ? (data as Record<string, unknown>)
    : record;
}

test.describe('Post-registration Cloud DM live web acceptance', () => {
  test('new account saves a profile color without replacing the app theme', async ({
    browser,
    request,
  }) => {
    const account = await registerLiveAccount(request, 'profilecolor');
    const page = await newSignedInPage(browser, account);

    try {
      const initialCustomizationResponse = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === '/api/v1/me/customizations' &&
          response.request().method() === 'GET'
        );
      });

      await page.goto('/me/appearance/themes');
      const initialCustomization = responseData(await (await initialCustomizationResponse).json());
      const initialAppTheme = initialCustomization.app_theme;

      expect(typeof initialAppTheme).toBe('string');
      await expect(page.getByRole('heading', { name: 'Profile Color' })).toBeVisible();

      const saveResponse = page.waitForResponse((response) => {
        const url = new URL(response.url());
        return (
          url.pathname === '/api/v1/me/customizations' &&
          response.request().method() === 'PATCH'
        );
      });

      await page.getByRole('button', { name: 'Select Gold profile color' }).click();

      const response = await saveResponse;
      expect(response.status()).toBe(200);

      const payload = response.request().postDataJSON() as Record<string, unknown>;
      const customConfig = payload.custom_config as Record<string, unknown>;
      expect(payload.profile_color).toBe('gold');
      expect(payload.app_theme).toBe(initialAppTheme);
      expect(customConfig.profile_color).toBe('gold');
      expect(customConfig.app_theme).toBe(initialAppTheme);
      expect(responseData(await response.json())).toMatchObject({
        profile_color: 'gold',
        app_theme: initialAppTheme,
      });

      const reloadedCustomizationResponse = page.waitForResponse((reloadResponse) => {
        const url = new URL(reloadResponse.url());
        return (
          url.pathname === '/api/v1/me/customizations' &&
          reloadResponse.request().method() === 'GET'
        );
      });

      await page.reload();

      expect(responseData(await (await reloadedCustomizationResponse).json())).toMatchObject({
        profile_color: 'gold',
        app_theme: initialAppTheme,
      });
      await expect(page.getByText('Currently: Gold')).toBeVisible();
      await expect(page.locator('[data-profile-color="gold"]').first()).toBeVisible();
    } finally {
      await page.context().close();
    }
  });

  test('new accounts can friend, message, refresh, and retain order', async ({ browser, request }) => {
    const alice = await registerLiveAccount(request, 'alice');
    const bob = await registerLiveAccount(request, 'bob');
    const alicePage = await newSignedInPage(browser, alice);
    const bobPage = await newSignedInPage(browser, bob);
    const bobSocketFrames: string[] = [];
    bobPage.on('websocket', (socket) => {
      socket.on('framereceived', (event) => {
        bobSocketFrames.push(event.payload);
      });
    });
    const aliceText = `alice live cloud proof ${Date.now()}`;
    const bobText = `bob live cloud proof ${Date.now()}`;

    try {
      await openFriends(alicePage);
      await sendFriendRequest(alicePage, bob.username);

      await openFriends(bobPage);
      await acceptFriendRequest(bobPage, alice.username);

      await alicePage.reload();
      await expect(friendsRegion(alicePage).getByText(`@${bob.username}`)).toBeVisible();
      await openFriendDm(alicePage, bob.username);
      await sendMessage(alicePage, aliceText);

      await openFriends(bobPage);
      await openFriendDm(bobPage, alice.username);
      await expect.poll(() => bobSocketFrames.some((frame) => historyFrameIncludes(frame, aliceText))).toBe(
        true
      );
      await expect(bobPage.getByLabel('Conversation messages')).toContainText(aliceText);
      await sendMessage(bobPage, bobText);

      await bobPage.reload();
      await expect(bobPage.getByPlaceholder(/type a message/i)).toBeVisible();
      await expectOrderedMessages(bobPage, aliceText, bobText);

      await alicePage.reload();
      await expect(alicePage.getByPlaceholder(/type a message/i)).toBeVisible();
      await expectOrderedMessages(alicePage, aliceText, bobText);
    } finally {
      await alicePage.context().close();
      await bobPage.context().close();
    }
  });
});
