import { expect, test, type Page, type Route } from '@playwright/test';
import { createHash } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { Socket } from 'node:net';

const CURRENT_USER_ID = 'e2e-user';
const PREFERENCE_SYNC_CHANNEL = 'cgraph:preference-sync:v1';
const SOCKET_SYNC_PORT = Number(process.env.PLAYWRIGHT_SOCKET_SYNC_PORT ?? '18181');
const SOCKET_SYNC_URL = `ws://127.0.0.1:${SOCKET_SYNC_PORT}/socket`;
const SOCKET_SYNC_PROOF_ENABLED = process.env.PLAYWRIGHT_SOCKET_SYNC_PROOF === 'true';

type PhoenixMessage = [
  joinRef: string | null,
  ref: string | null,
  topic: string,
  event: string,
  payload: Record<string, unknown>,
];

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

function readJsonRequest(route: Route): unknown {
  const body = route.request().postData();

  if (!body) return null;

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function encodeWsTextFrame(data: string): Buffer {
  const payload = Buffer.from(data);
  const length = payload.byteLength;

  if (length < 126) {
    return Buffer.concat([Buffer.from([0x81, length]), payload]);
  }

  if (length <= 0xffff) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
    return Buffer.concat([header, payload]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(length), 2);
  return Buffer.concat([header, payload]);
}

function decodeWsTextFrames(buffer: Buffer): { frames: string[]; rest: Buffer } {
  const frames: string[] = [];
  let offset = 0;

  while (buffer.byteLength - offset >= 2) {
    const firstByte = buffer[offset]!;
    const secondByte = buffer[offset + 1]!;
    const opcode = firstByte & 0x0f;
    const masked = (secondByte & 0x80) !== 0;
    let length = secondByte & 0x7f;
    let cursor = offset + 2;

    if (length === 126) {
      if (buffer.byteLength - cursor < 2) break;
      length = buffer.readUInt16BE(cursor);
      cursor += 2;
    } else if (length === 127) {
      if (buffer.byteLength - cursor < 8) break;
      const bigLength = buffer.readBigUInt64BE(cursor);
      if (bigLength > BigInt(Number.MAX_SAFE_INTEGER)) break;
      length = Number(bigLength);
      cursor += 8;
    }

    const maskLength = masked ? 4 : 0;
    if (buffer.byteLength - cursor < maskLength + length) break;

    const mask = masked ? buffer.subarray(cursor, cursor + 4) : null;
    cursor += maskLength;
    const payload = Buffer.from(buffer.subarray(cursor, cursor + length));
    cursor += length;

    offset = cursor;

    if (opcode === 0x8) continue;
    if (opcode !== 0x1) continue;

    if (mask) {
      for (let index = 0; index < payload.byteLength; index += 1) {
        payload[index] = payload[index]! ^ mask[index % 4]!;
      }
    }

    frames.push(payload.toString('utf8'));
  }

  return { frames, rest: buffer.subarray(offset) };
}

class PhoenixSocketHarness {
  private server: Server | null = null;
  private readonly sockets = new Set<Socket>();
  private readonly joinedTopics = new Map<string, number>();
  private upgradeCount = 0;
  private frameCount = 0;
  private readonly lastFrames: string[] = [];

  async start(): Promise<void> {
    if (this.server) return;

    this.server = createServer();
    this.server.on('upgrade', (request, rawSocket) => {
      this.upgradeCount += 1;
      const socket = rawSocket as Socket;
      const key = request.headers['sec-websocket-key'];
      if (typeof key !== 'string') {
        socket.destroy();
        return;
      }

      const accept = createHash('sha1')
        .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
        .digest('base64');

      socket.write(
        [
          'HTTP/1.1 101 Switching Protocols',
          'Upgrade: websocket',
          'Connection: Upgrade',
          `Sec-WebSocket-Accept: ${accept}`,
          '',
          '',
        ].join('\r\n')
      );

      this.sockets.add(socket);
      let pending = Buffer.alloc(0);

      socket.on('data', (chunk) => {
        pending = Buffer.concat([pending, chunk]);
        const decoded = decodeWsTextFrames(pending);
        pending = decoded.rest;

        for (const frame of decoded.frames) {
          this.handleFrame(socket, frame);
        }
      });

      socket.on('close', () => {
        this.sockets.delete(socket);
      });

      socket.on('error', () => {
        this.sockets.delete(socket);
      });
    });

    await new Promise<void>((resolve) => {
      this.server!.listen(SOCKET_SYNC_PORT, '127.0.0.1', resolve);
    });
  }

  async stop(): Promise<void> {
    for (const socket of this.sockets) {
      socket.destroy();
    }
    this.sockets.clear();
    this.joinedTopics.clear();

    await new Promise<void>((resolve) => {
      this.server?.close(() => resolve());
      if (!this.server) resolve();
    });

    this.server = null;
  }

  async waitForJoins(topic: string, count: number): Promise<void> {
    await expect
      .poll(() => this.joinedTopics.get(topic) ?? 0, {
        message: `${topic} should have ${count} joined browser clients: ${JSON.stringify(
          this.diagnostics()
        )}`,
      })
      .toBeGreaterThanOrEqual(count);
  }

  diagnostics(): Record<string, unknown> {
    return {
      upgradeCount: this.upgradeCount,
      socketCount: this.sockets.size,
      frameCount: this.frameCount,
      joinedTopics: Object.fromEntries(this.joinedTopics),
      lastFrames: this.lastFrames,
    };
  }

  broadcast(topic: string, event: string, payload: Record<string, unknown>): void {
    const message: PhoenixMessage = [null, null, topic, event, payload];
    const frame = encodeWsTextFrame(JSON.stringify(message));

    for (const socket of this.sockets) {
      socket.write(frame);
    }
  }

  private handleFrame(socket: Socket, frame: string): void {
    let message: PhoenixMessage;

    try {
      message = JSON.parse(frame) as PhoenixMessage;
    } catch {
      return;
    }

    const [joinRef, ref, topic, event] = message;
    this.frameCount += 1;
    this.lastFrames.push(`${topic}:${event}`);
    this.lastFrames.splice(0, Math.max(0, this.lastFrames.length - 10));

    if (event === 'heartbeat') {
      this.reply(socket, [joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]);
      return;
    }

    if (event === 'phx_join') {
      this.joinedTopics.set(topic, (this.joinedTopics.get(topic) ?? 0) + 1);
      this.reply(socket, [joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]);
      return;
    }

    if (event === 'phx_leave') {
      this.reply(socket, [joinRef, ref, topic, 'phx_reply', { status: 'ok', response: {} }]);
    }
  }

  private reply(socket: Socket, message: PhoenixMessage): void {
    socket.write(encodeWsTextFrame(JSON.stringify(message)));
  }
}

let socketHarness: PhoenixSocketHarness | null = null;

async function installPreferenceMocks(page: Page) {
  const requests = {
    cancelDeletion: [] as unknown[],
    logout: [] as unknown[],
    oauthStart: [] as unknown[],
    scheduleDeletion: [] as unknown[],
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
      await fulfillJson(route, {
        data: {
          ...currentUser,
          connected_accounts: [
            {
              id: 'acct-google',
              provider: 'google',
              provider_name: 'Google',
              email: 'e2e@example.com',
              linked_at: '2026-05-23T00:00:00.000Z',
            },
          ],
        },
        user: currentUser,
      });
      return;
    }

    if (path === '/api/v1/auth/oauth/providers' && method === 'GET') {
      await fulfillJson(route, { data: { providers: ['google', { provider: 'tiktok' }] } });
      return;
    }

    if (path === '/api/v1/auth/oauth/google' && method === 'GET') {
      requests.oauthStart.push(readJsonRequest(route));
      await fulfillJson(route, {
        authorization_url: '/auth/oauth/google/callback?code=e2e-code&state=e2e-state',
        state: 'e2e-state',
        provider: 'google',
      });
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

    if (path === '/api/v1/me/delete-account' && method === 'DELETE') {
      requests.cancelDeletion.push(readJsonRequest(route));
      await fulfillJson(route, { data: { message: 'Account deletion cancelled.' } });
      return;
    }

    if (path === '/api/v1/me/delete-account' && method === 'POST') {
      requests.scheduleDeletion.push(readJsonRequest(route));
      await fulfillJson(route, {
        data: {
          scheduled_for: '2026-06-22T00:00:00.000Z',
          grace_period_days: 30,
        },
      });
      return;
    }

    if (path === '/api/v1/auth/logout' && method === 'POST') {
      requests.logout.push(readJsonRequest(route));
      await fulfillJson(route, { data: { ok: true } });
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

  return requests;
}

async function readAuthStorageDebug(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => {
    const raw = sessionStorage.getItem('cgraph-auth-v2');
    if (!raw) return { hasStorage: false };

    try {
      const decoded = decodeURIComponent(atob(raw));
      const parsed = JSON.parse(decoded) as {
        state?: {
          token?: string | null;
          user?: { id?: string | null } | null;
          isAuthenticated?: boolean;
        };
      };

      return {
        hasStorage: true,
        hasToken: Boolean(parsed.state?.token),
        userId: parsed.state?.user?.id ?? null,
        isAuthenticated: Boolean(parsed.state?.isAuthenticated),
      };
    } catch {
      return { hasStorage: true, decoded: false };
    }
  });
}

async function readRuntimeDebug(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => {
    const debugWindow = window as Window & {
      __CGRAPH_E2E_AUTH_SNAPSHOT__?: Record<string, unknown>;
      __CGRAPH_E2E_SOCKET_BOOTSTRAP__?: Record<string, unknown>;
    };

    return {
      authSnapshot: debugWindow.__CGRAPH_E2E_AUTH_SNAPSHOT__ ?? null,
      socketBootstrap: debugWindow.__CGRAPH_E2E_SOCKET_BOOTSTRAP__ ?? null,
    };
  });
}

async function waitForPreferenceSyncReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    return (
      window as Window & {
        __CGRAPH_E2E_PREFERENCE_SYNC_READY__?: boolean;
      }
    ).__CGRAPH_E2E_PREFERENCE_SYNC_READY__;
  });
}

test.describe('Settings preference sync', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    if (!SOCKET_SYNC_PROOF_ENABLED) return;

    socketHarness = new PhoenixSocketHarness();
    await socketHarness.start();
  });

  test.afterAll(async () => {
    await socketHarness?.stop();
    socketHarness = null;
  });

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

    await waitForPreferenceSyncReady(page);

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

    await waitForPreferenceSyncReady(page);

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

    await waitForPreferenceSyncReady(page);

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

  test('applies preference sync across already-open tabs through the browser sync bus', async ({
    context,
    page,
  }) => {
    await installPreferenceMocks(page);
    const secondPage = await context.newPage();
    await installPreferenceMocks(secondPage);

    await page.goto('/me/settings/privacy');
    await secondPage.goto('/me/settings/privacy');

    const firstTabMessageRequests = page.getByLabel('Who can send you direct messages');
    const secondTabMessageRequests = secondPage.getByLabel('Who can send you direct messages');
    const secondTabOnlineStatus = secondPage.getByLabel('Who can see your online status');
    const secondTabGroupInvites = secondPage.getByLabel('Who can add you to groups');

    await expect(page.getByRole('heading', { name: /^Privacy$/ })).toBeVisible();
    await expect(secondPage.getByRole('heading', { name: /^Privacy$/ })).toBeVisible();
    await expect(firstTabMessageRequests).toHaveValue('contacts');
    await expect(secondTabMessageRequests).toHaveValue('contacts');

    await page.evaluate(
      ({ channelName, userId }) => {
        const channel = new BroadcastChannel(channelName);
        channel.postMessage({
          kind: 'settings',
          userId,
          sourceId: 'playwright-driver',
          payload: {
            section: 'privacy',
            lastUpdatedAt: new Date(Date.now() + 10_000).toISOString(),
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
        });
        channel.close();
      },
      { channelName: PREFERENCE_SYNC_CHANNEL, userId: CURRENT_USER_ID }
    );

    await expect(firstTabMessageRequests).toHaveValue('everyone');
    await expect(secondTabMessageRequests).toHaveValue('everyone');
    await expect(secondTabOnlineStatus).toHaveValue('everyone');
    await expect(secondTabGroupInvites).toHaveValue('nobody');

    await secondPage.close();
  });

  test('applies settings sync delivered through the user Phoenix channel to two browser profiles', async ({
    browser,
    page,
  }) => {
    test.skip(
      !SOCKET_SYNC_PROOF_ENABLED,
      'Set PLAYWRIGHT_SOCKET_SYNC_PROOF=true and VITE_SOCKET_URL to the local harness URL.'
    );
    test.skip(
      (process.env.VITE_SOCKET_URL ?? process.env.VITE_WS_URL) !== SOCKET_SYNC_URL,
      `Set VITE_SOCKET_URL=${SOCKET_SYNC_URL} for this production-like socket proof.`
    );

    await installPreferenceMocks(page);
    const secondContext = await browser.newContext();
    const secondProfile = await secondContext.newPage();
    const socketEvents: string[] = [];
    const pageEvents: string[] = [];

    for (const targetPage of [page, secondProfile]) {
      targetPage.on('websocket', (socket) => {
        socketEvents.push(`open:${socket.url()}`);
        socket.on('close', () => socketEvents.push(`close:${socket.url()}`));
        socket.on('socketerror', (error) => {
          socketEvents.push(`error:${socket.url()}:${error.message}`);
        });
      });
      targetPage.on('pageerror', (error) => {
        pageEvents.push(`pageerror:${error.message}`);
      });
      targetPage.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') {
          pageEvents.push(`${message.type()}:${message.text()}`);
        }
      });
    }

    try {
      await installPreferenceMocks(secondProfile);

      await page.goto('/me/settings/privacy');
      await secondProfile.goto('/me/settings/privacy');

      const firstProfileMessageRequests = page.getByLabel('Who can send you direct messages');
      const secondProfileMessageRequests = secondProfile.getByLabel(
        'Who can send you direct messages'
      );
      const firstProfileGroupInvites = page.getByLabel('Who can add you to groups');
      const secondProfileOnlineStatus = secondProfile.getByLabel('Who can see your online status');
      const secondProfileGroupInvites = secondProfile.getByLabel('Who can add you to groups');

      await expect(page.getByRole('heading', { name: /^Privacy$/ })).toBeVisible();
      await expect(secondProfile.getByRole('heading', { name: /^Privacy$/ })).toBeVisible();
      await expect(firstProfileMessageRequests).toHaveValue('contacts');
      await expect(secondProfileMessageRequests).toHaveValue('contacts');

      try {
        await socketHarness!.waitForJoins(`user:${CURRENT_USER_ID}`, 2);
      } catch (error) {
        const diagnostics = {
          harness: socketHarness!.diagnostics(),
          socketEvents,
          pageEvents,
          firstProfileAuth: await readAuthStorageDebug(page),
          secondProfileAuth: await readAuthStorageDebug(secondProfile),
          firstProfileRuntime: await readRuntimeDebug(page),
          secondProfileRuntime: await readRuntimeDebug(secondProfile),
        };
        throw new Error(`${error instanceof Error ? error.message : String(error)}
Diagnostics: ${JSON.stringify(diagnostics)}`);
      }

      socketHarness!.broadcast(`user:${CURRENT_USER_ID}`, 'settings_synced', {
        _seq: 77,
        _session_id: 'socket-proof-session',
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
      });

      await expect(firstProfileMessageRequests).toHaveValue('everyone');
      await expect(secondProfileMessageRequests).toHaveValue('everyone');
      await expect(firstProfileGroupInvites).toHaveValue('nobody');
      await expect(secondProfileOnlineStatus).toHaveValue('everyone');
      await expect(secondProfileGroupInvites).toHaveValue('nobody');
    } finally {
      await secondContext.close();
    }
  });

  test('applies the same server-shaped settings sync in separate browser profiles', async ({
    browser,
    page,
  }) => {
    await installPreferenceMocks(page);
    const secondContext = await browser.newContext();
    const secondProfile = await secondContext.newPage();

    try {
      await installPreferenceMocks(secondProfile);

      await page.goto('/me/settings/privacy');
      await secondProfile.goto('/me/settings/privacy');

      const firstProfileMessageRequests = page.getByLabel('Who can send you direct messages');
      const secondProfileMessageRequests = secondProfile.getByLabel(
        'Who can send you direct messages'
      );
      const secondProfileOnlineStatus = secondProfile.getByLabel('Who can see your online status');
      const secondProfileGroupInvites = secondProfile.getByLabel('Who can add you to groups');

      await expect(page.getByRole('heading', { name: /^Privacy$/ })).toBeVisible();
      await expect(secondProfile.getByRole('heading', { name: /^Privacy$/ })).toBeVisible();
      await expect(firstProfileMessageRequests).toHaveValue('contacts');
      await expect(secondProfileMessageRequests).toHaveValue('contacts');

      const syncPayload = {
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
      };

      for (const targetPage of [page, secondProfile]) {
        await waitForPreferenceSyncReady(targetPage);
        await targetPage.evaluate((detail) => {
          window.dispatchEvent(new CustomEvent('cgraph:e2e-preference-sync', { detail }));
        }, syncPayload);
      }

      await expect(firstProfileMessageRequests).toHaveValue('everyone');
      await expect(secondProfileMessageRequests).toHaveValue('everyone');
      await expect(secondProfileOnlineStatus).toHaveValue('everyone');
      await expect(secondProfileGroupInvites).toHaveValue('nobody');
    } finally {
      await secondContext.close();
    }
  });

  test('proves routed account deletion scheduling and grace-period cancellation', async ({
    page,
  }) => {
    const requests = await installPreferenceMocks(page);

    await page.goto('/me/settings/delete-account');

    await expect(page.getByRole('heading', { name: /delete my account/i })).toBeVisible();
    await page.getByRole('button', { name: /cancel pending deletion/i }).click();

    await expect(page.getByText('Account deletion cancelled.')).toBeVisible();
    await expect.poll(() => requests.cancelDeletion.length).toBe(1);

    await page.getByRole('button', { name: /start deletion process/i }).click();
    await page.getByPlaceholder('Enter your current password').fill('CGraph!2026Password');
    await page.getByPlaceholder('Type DELETE to confirm').fill('DELETE');
    await page.getByRole('button', { name: /final confirmation/i }).click();

    await expect.poll(() => requests.scheduleDeletion.length).toBe(1);
    expect(requests.scheduleDeletion[0]).toMatchObject({ password: 'CGraph!2026Password' });
    await expect.poll(() => requests.logout.length).toBe(1);
  });

  test('discovers connected-account providers from backend configuration on the routed settings page', async ({
    page,
  }) => {
    await installPreferenceMocks(page);

    await page.goto('/me/settings/connected-accounts');

    await expect(page.getByRole('heading', { name: /^Connected Accounts$/ })).toBeVisible();
    await expect(page.getByText('Google')).toBeVisible();
    await expect(page.getByText('Connected · e2e@example.com')).toBeVisible();
    await expect(page.getByText('TikTok')).toBeVisible();
    await expect(page.getByText('Apple')).toHaveCount(0);
    await expect(page.getByText('Facebook')).toHaveCount(0);
  });
});
