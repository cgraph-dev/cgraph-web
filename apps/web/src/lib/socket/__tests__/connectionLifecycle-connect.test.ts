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
const mockToken = vi.hoisted(() => ({ value: 'test-token' }));

vi.mock('phoenix', () => {
  const MockSocket = vi.fn();
  return { Socket: MockSocket, Channel: vi.fn(), Presence: vi.fn() };
});

vi.mock('@cgraph-dev/utils', () => ({
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

import { connectSocket, reconnectSocketWithFreshToken } from '../connectionLifecycle';
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
    connectedToken: null,
    credentialReconnectInProgress: false,
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
  off: ReturnType<typeof vi.fn>;
  onOpen: (cb: SocketCallback) => number;
  onClose: (cb: SocketCallback) => number;
  onError: (cb: SocketCallback) => number;
}

function setupMockSocket(): MockSocketInstance {
  const instance: MockSocketInstance = {
    onOpenCb: null,
    onCloseCb: null,
    onErrorCb: null,
    isConnected: vi.fn().mockReturnValue(false),
    connect: vi.fn(),
    disconnect: vi.fn(),
    off: vi.fn(),
    onOpen(cb: SocketCallback) {
      instance.onOpenCb = cb;
      return 1;
    },
    onClose(cb: SocketCallback) {
      instance.onCloseCb = cb;
      return 2;
    },
    onError(cb: SocketCallback) {
      instance.onErrorCb = cb;
      return 3;
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

  it('reuses an existing disconnected socket instead of creating a second owner', async () => {
    const mockSocketInstance = setupMockSocket();
    mockSocketInstance.disconnect.mockImplementation((callback?: () => void) => callback?.());
    const state = makeState({
      socket: mockSocketInstance as unknown as Socket,
      connectedToken: 'test-token',
    });

    const promise = connectSocket(state);

    expect(mockSocketInstance.disconnect).toHaveBeenCalledTimes(1);
    expect(mockSocketInstance.connect).toHaveBeenCalledTimes(1);
    expect(Socket).not.toHaveBeenCalled();

    mockSocketInstance.onOpenCb!();
    await promise;
  });

  it('creates Socket and connects on success', async () => {
    const mockSocketInstance = setupMockSocket();
    const onConnected = vi.fn();
    const state = makeState({ onConnected });

    const promise = connectSocket(state);

    // Simulate successful connection
    mockSocketInstance.onOpenCb!();

    await promise;

    expect(state.socket).not.toBeNull();
    expect(mockSocketInstance.connect).toHaveBeenCalled();
    expect(state.reconnectAttempts).toBe(0);
    expect(state.connectedToken).toBe('test-token');
    expect(state.connectionPromise).toBeNull();
    expect(onConnected).toHaveBeenCalledTimes(1);
  });

  it('reads the latest token whenever the transport connects', async () => {
    const mockSocketInstance = setupMockSocket();
    const state = makeState();

    const promise = connectSocket(state);
    const options = vi.mocked(Socket).mock.calls[0]?.[1];
    expect(typeof options?.params).toBe('function');

    mockToken.value = 'rotated-token';
    expect((options?.params as () => Record<string, unknown>)()).toEqual({
      token: 'rotated-token',
    });

    mockSocketInstance.onOpenCb!();
    await promise;
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

    // Simulate reaching max attempts (connection resets to 0 on open, so set it high)
    state.reconnectAttempts = 63;

    // This close should trip the circuit breaker (63 + 1 = 64)
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

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('ws_session_id', 'sess-123');
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('ws_last_sequence', '42');

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

  it('counts one reconnect attempt when an error is followed by close', async () => {
    const mockSocketInstance = setupMockSocket();
    const state = makeState();

    const promise = connectSocket(state);
    mockSocketInstance.onErrorCb!(new Error('test'));
    mockSocketInstance.onCloseCb!();

    // The promise should resolve (caught internally)
    await promise;

    expect(state.reconnectAttempts).toBe(1);
    expect(state.connectionPromise).toBeNull();
  });

  it('trips circuit breaker once when an error is followed by close', async () => {
    const mockSocketInstance = setupMockSocket();
    const state = makeState({ reconnectAttempts: 63 });

    const promise = connectSocket(state);
    mockSocketInstance.onErrorCb!(new Error('test'));
    mockSocketInstance.onCloseCb!();

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

describe('reconnectSocketWithFreshToken', () => {
  it('reuses the current socket and coalesces credential reconnects', async () => {
    const mockSocketInstance = setupMockSocket();
    mockSocketInstance.isConnected.mockReturnValue(true);
    mockSocketInstance.disconnect.mockImplementation((callback?: () => void) => callback?.());
    const state = makeState({
      socket: mockSocketInstance as unknown as Socket,
      connectedToken: 'old-token',
    });

    mockToken.value = 'new-token';
    const first = reconnectSocketWithFreshToken(state);
    const second = reconnectSocketWithFreshToken(state);

    expect(second).toBe(first);
    expect(mockSocketInstance.disconnect).toHaveBeenCalledTimes(1);
    expect(mockSocketInstance.connect).toHaveBeenCalledTimes(1);

    mockSocketInstance.onOpenCb!();
    await first;

    expect(state.connectedToken).toBe('new-token');
    expect(state.connectionPromise).toBeNull();
    expect(mockSocketInstance.off).toHaveBeenCalledWith([1, 3]);
    expect(Socket).not.toHaveBeenCalled();
  });
});
