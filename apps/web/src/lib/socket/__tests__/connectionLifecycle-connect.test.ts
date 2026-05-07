/**
 * Tests for connectionLifecycle.ts - connectSocket function
 *
 * Covers:
 * - Reuses existing connectionPromise (dedup)
 * - Returns immediately if no auth token
 * - Returns immediately if already connected
 * - Socket onOpen: resolves promise, resets circuit breaker
 * - Socket onClose: increments reconnect attempts, circuit breaker
 * - Socket onError: increments reconnect attempts, circuit breaker
 * - Session persistence on close
 * - Connection timeout
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { STORAGE_KEYS } from '@/lib/storage/namespaces';
const mockToken = vi.hoisted(() => ({ value: 'test-token' }));

vi.mock('phoenix', () => {
  const MockSocket = vi.fn();
  return { Socket: MockSocket, Channel: vi.fn(), Presence: vi.fn() };
});

vi.mock('@cgraph/utils', () => ({
  exponentialBackoffWithJitter: vi.fn(() => () => 1000),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ token: mockToken.value })),
  },
}));

vi.mock('../../logger', () => ({
  socketLogger: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  },
}));

import { connectSocket } from '../connectionLifecycle';
import type { SocketManagerState } from '../connectionLifecycle';
import { Socket } from 'phoenix';

// Helpers

function makeState(overrides?: Partial<SocketManagerState>): SocketManagerState {
  return {
    socket: null,
    channels: new Map(),
    presences: new Map(),
    onlineUsers: new Map(),
    reconnectTimer: null,
    connectionPromise: null,
    channelHandlersSetUp: new Set(),
    lastJoinAttempts: new Map(),
    forumCallbacks: new Map(),
    threadCallbacks: new Map(),
    sessionId: null,
    lastSequence: 0,
    reconnectAttempts: 0,
    ...overrides,
  };
}

type SocketCallback = (...args: unknown[]) => void;
interface MockSocketInstance {
  onOpenCb: SocketCallback | null;
  onCloseCb: SocketCallback | null;
  onErrorCb: SocketCallback | null;
  isConnected: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  onOpen: (cb: SocketCallback) => void;
  onClose: (cb: SocketCallback) => void;
  onError: (cb: SocketCallback) => void;
}

function setupMockSocket(): MockSocketInstance {
  const instance: MockSocketInstance = {
    onOpenCb: null,
    onCloseCb: null,
    onErrorCb: null,
    isConnected: vi.fn().mockReturnValue(false),
    connect: vi.fn(),
    disconnect: vi.fn(),
    onOpen(cb: SocketCallback) {
      instance.onOpenCb = cb;
    },
    onClose(cb: SocketCallback) {
      instance.onCloseCb = cb;
    },
    onError(cb: SocketCallback) {
      instance.onErrorCb = cb;
    },
  };

  vi.mocked(Socket).mockImplementation(() => instance as unknown as Socket);
  return instance;
}

// Tests

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockToken.value = 'test-token';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('connectSocket', () => {
  it('returns existing connectionPromise if already connecting', () => {
    const existingPromise = Promise.resolve();
    const state = makeState({ connectionPromise: existingPromise });

    const result = connectSocket(state);
    expect(result).toBe(existingPromise);
  });

  it('resolves immediately if no auth token', async () => {
    mockToken.value = '';
    const state = makeState();

    await connectSocket(state);

    // Socket constructor should not have been called
    expect(Socket).not.toHaveBeenCalled();
  });

  it('resolves immediately if already connected', async () => {
    const mockSocket = { isConnected: vi.fn().mockReturnValue(true) };
    const state = makeState({ socket: mockSocket as unknown as Socket });

    await connectSocket(state);

    // No new Socket should be created
    expect(Socket).not.toHaveBeenCalled();
  });

  it('creates Socket and connects on success', async () => {
    const mockSocketInstance = setupMockSocket();
    const state = makeState();

    const promise = connectSocket(state);

    // Simulate successful connection
    mockSocketInstance.onOpenCb!();

    await promise;

    expect(state.socket).not.toBeNull();
    expect(mockSocketInstance.connect).toHaveBeenCalled();
    expect(state.reconnectAttempts).toBe(0);
    expect(state.connectionPromise).toBeNull();
  });

  it('resets circuit breaker on successful connection', async () => {
    const mockSocketInstance = setupMockSocket();
    const state = makeState({ reconnectAttempts: 5 });

    const promise = connectSocket(state);
    mockSocketInstance.onOpenCb!();

    await promise;

    expect(state.reconnectAttempts).toBe(0);
  });

  it('clears reconnect timer on successful connection', async () => {
    const mockSocketInstance = setupMockSocket();
    const timer = setTimeout(() => {}, 1000);
    const state = makeState({ reconnectTimer: timer as unknown as number });

    const promise = connectSocket(state);
    mockSocketInstance.onOpenCb!();

    await promise;

    expect(state.reconnectTimer).toBeNull();
  });

  it('increments reconnect attempts on close', async () => {
    const mockSocketInstance = setupMockSocket();
    const state = makeState();

    const promise = connectSocket(state);

    // Simulate open then close
    mockSocketInstance.onOpenCb!();
    await promise;

    mockSocketInstance.onCloseCb!();
    expect(state.reconnectAttempts).toBe(1);
  });

  it('trips circuit breaker after max reconnect attempts on close', async () => {
    const mockSocketInstance = setupMockSocket();
    const state = makeState();

    const promise = connectSocket(state);
    mockSocketInstance.onOpenCb!();
    await promise;

    // Simulate reaching the production circuit-breaker ceiling.
    state.reconnectAttempts = 63;

    mockSocketInstance.onCloseCb!();

    expect(state.reconnectAttempts).toBe(64);
    expect(mockSocketInstance.disconnect).toHaveBeenCalled();
    expect(state.socket).toBeNull();
  });

  it('persists session info to sessionStorage on close', async () => {
    const mockSocketInstance = setupMockSocket();
    const mockSessionStorage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal('sessionStorage', mockSessionStorage);

    const state = makeState({ sessionId: 'sess-123', lastSequence: 42 });

    const promise = connectSocket(state);
    mockSocketInstance.onOpenCb!();
    await promise;

    mockSocketInstance.onCloseCb!();

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.socketSessionId,
      'sess-123'
    );
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.socketLastSequence,
      '42'
    );

    vi.unstubAllGlobals();
  });

  it('does not persist session if no sessionId', async () => {
    const mockSocketInstance = setupMockSocket();
    const mockSessionStorage = { setItem: vi.fn(), getItem: vi.fn(), removeItem: vi.fn() };
    vi.stubGlobal('sessionStorage', mockSessionStorage);

    const state = makeState({ sessionId: null });

    const promise = connectSocket(state);
    mockSocketInstance.onOpenCb!();
    await promise;

    mockSocketInstance.onCloseCb!();

    expect(mockSessionStorage.setItem).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('increments reconnect attempts on error', async () => {
    const mockSocketInstance = setupMockSocket();
    const state = makeState();

    const promise = connectSocket(state);
    mockSocketInstance.onErrorCb!(new Error('test'));

    // The promise should resolve (caught internally)
    await promise;

    expect(state.reconnectAttempts).toBe(1);
    expect(state.connectionPromise).toBeNull();
  });

  it('trips circuit breaker on error after max attempts', async () => {
    const mockSocketInstance = setupMockSocket();
    const state = makeState({ reconnectAttempts: 63 });

    const promise = connectSocket(state);
    mockSocketInstance.onErrorCb!(new Error('test'));

    await promise;

    expect(state.reconnectAttempts).toBe(64);
    expect(mockSocketInstance.disconnect).toHaveBeenCalled();
    expect(state.socket).toBeNull();
  });

  it('handles connection timeout after 15s', async () => {
    setupMockSocket();
    const state = makeState();

    const promise = connectSocket(state);

    // Advance past 15s timeout
    await vi.advanceTimersByTimeAsync(15001);

    // Should resolve without error (caught internally)
    await promise;

    expect(state.connectionPromise).toBeNull();
  });
});
