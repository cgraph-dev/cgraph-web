/**
 * Tests for the Web Push subscribe flow.
 *
 * Mocks `navigator.serviceWorker`, `pushManager.subscribe`, and the HTTP
 * client. Verifies that `subscribeToPush` posts the canonical
 * `{ endpoint, keys, user_agent }` shape to `/api/v1/me/push-subscriptions`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api-client', () => ({
  http: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { http } from '@/lib/api-client';
import { subscribeToPush, urlBase64ToUint8Array } from '../subscribe';

interface MockedHttp {
  post: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

const mockedHttp = http as unknown as MockedHttp;

const TEST_VAPID_KEY =
  'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XkBBKkM5EzE7VqMv87kM9KY';

const FAKE_SUBSCRIPTION_JSON = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  expirationTime: null,
  keys: { p256dh: 'fake-p256dh', auth: 'fake-auth' },
} as const;

function makeFakeSubscription(): PushSubscription {
  const json = { ...FAKE_SUBSCRIPTION_JSON };
  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime,
    options: {
      userVisibleOnly: true,
      applicationServerKey: null,
    } as PushSubscriptionOptions,
    getKey: () => null,
    toJSON: () => json,
    unsubscribe: vi.fn().mockResolvedValue(true),
  } as unknown as PushSubscription;
}

interface MutableNavigator {
  serviceWorker?: unknown;
  userAgent: string;
}

interface MutableWindow {
  PushManager?: unknown;
}

describe('subscribeToPush', () => {
  let originalNavigator: PropertyDescriptor | undefined;

  beforeEach(() => {
    vi.clearAllMocks();

    const fakeSubscription = makeFakeSubscription();

    const fakeRegistration = {
      scope: '/',
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue(fakeSubscription),
      },
    };

    originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      writable: true,
      value: {
        serviceWorker: {
          register: vi.fn().mockResolvedValue(fakeRegistration),
          getRegistration: vi.fn().mockResolvedValue(fakeRegistration),
          ready: Promise.resolve(fakeRegistration),
        },
        userAgent: 'Mozilla/5.0 (Test)',
      } satisfies MutableNavigator,
    });

    (globalThis as unknown as MutableWindow).PushManager = function PushManager() {};
    if (typeof window !== 'undefined') {
      (window as unknown as MutableWindow).PushManager = function PushManager() {};
    }

    if (typeof window !== 'undefined' && typeof Notification === 'undefined') {
      Object.defineProperty(window, 'Notification', {
        configurable: true,
        value: class Notification {
          static permission: NotificationPermission = 'granted';
        },
      });
    }
  });

  afterEach(() => {
    if (originalNavigator) {
      Object.defineProperty(globalThis, 'navigator', originalNavigator);
    }
  });

  it('returns null when given an empty VAPID key', async () => {
    const result = await subscribeToPush('');
    expect(result).toBeNull();
    expect(mockedHttp.post).not.toHaveBeenCalled();
  });

  it('subscribes and posts the subscription JSON to the backend', async () => {
    mockedHttp.post.mockResolvedValueOnce({ status: 201, data: { data: { id: 'abc' } } });

    const result = await subscribeToPush(TEST_VAPID_KEY);

    expect(result).not.toBeNull();
    expect(mockedHttp.post).toHaveBeenCalledTimes(1);
    const [url, body] = mockedHttp.post.mock.calls[0] ?? [];
    expect(url).toBe('/api/v1/me/push-subscriptions');
    expect(body).toEqual({
      endpoint: FAKE_SUBSCRIPTION_JSON.endpoint,
      keys: FAKE_SUBSCRIPTION_JSON.keys,
      user_agent: 'Mozilla/5.0 (Test)',
    });
  });

  it('revokes the local subscription when the server rejects', async () => {
    mockedHttp.post.mockResolvedValueOnce({ status: 500 });

    const result = await subscribeToPush(TEST_VAPID_KEY);

    expect(result).toBeNull();
    expect(mockedHttp.post).toHaveBeenCalledTimes(1);
  });
});

describe('urlBase64ToUint8Array', () => {
  it('decodes a base64url-encoded VAPID key into a 65-byte array', () => {
    const result = urlBase64ToUint8Array(TEST_VAPID_KEY);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(65);
    expect(result[0]).toBe(0x04);
  });

  it('handles padding correctly', () => {
    expect(urlBase64ToUint8Array('YQ')).toEqual(new Uint8Array([97]));
  });
});
