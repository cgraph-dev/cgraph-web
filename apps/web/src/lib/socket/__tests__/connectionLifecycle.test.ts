/**
 * Tests for connectionLifecycle.ts
 *
 * disconnectSocket unit tests.
 * connectSocket requires real Phoenix Socket — tested via integration.
 */
import { describe, it, expect, vi } from 'vitest';

// Mock dependencies (before importing module)
vi.mock('phoenix', () => ({
  Socket: vi.fn(),
  Channel: vi.fn(),
  Presence: vi.fn(),
}));

vi.mock('@cgraph-dev/utils', () => ({
  exponentialBackoffWithJitter: vi.fn(() => () => 1000),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: { getState: vi.fn(() => ({ token: null })) },
}));

vi.mock('../../logger', () => ({
  socketLogger: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { disconnectSocket } from '../connectionLifecycle';
import type { SocketManagerState } from '../connectionLifecycle';

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

// Tests
describe('disconnectSocket', () => {
  it('leaves all channels and clears state', () => {
    const ch1 = { leave: vi.fn() };
    const ch2 = { leave: vi.fn() };
    const mockSocket = { disconnect: vi.fn() };

    const state = makeState({
      socket: mockSocket as never,
      channels: new Map([
        ['ch:1', ch1 as never],
        ['ch:2', ch2 as never],
      ]),
      presences: new Map([['ch:1', {} as never]]),
      onlineUsers: new Map([['lobby', new Set(['u1'])]]),
      channelHandlersSetUp: new Set(['ch:1']),
      lastJoinAttempts: new Map([['ch:1', 1000]]),
      forumCallbacks: new Map([['f1', {} as never]]),
      threadCallbacks: new Map([['t1', {} as never]]),
      connectionPromise: Promise.resolve(),
    });

    disconnectSocket(state);

    expect(ch1.leave).toHaveBeenCalled();
    expect(ch2.leave).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(state.socket).toBeNull();
    expect(state.channels.size).toBe(0);
    expect(state.presences.size).toBe(0);
    expect(state.onlineUsers.size).toBe(0);
    expect(state.channelHandlersSetUp.size).toBe(0);
    expect(state.lastJoinAttempts.size).toBe(0);
    expect(state.forumCallbacks.size).toBe(0);
    expect(state.threadCallbacks.size).toBe(0);
    expect(state.connectionPromise).toBeNull();
  });

  it('handles null socket gracefully', () => {
    const state = makeState();
    expect(() => disconnectSocket(state)).not.toThrow();
  });
});
