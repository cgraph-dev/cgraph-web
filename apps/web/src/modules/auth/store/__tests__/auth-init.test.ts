/**
 * Auth Store Initialization Tests
 *
 * Tests for token handler registration and safety timeout.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AuthState } from '../authStore.types';
const mockRegisterTokenHandlers = vi.fn();

vi.mock('@/lib/tokenService', () => ({
  registerTokenHandlers: (...args: unknown[]) => mockRegisterTokenHandlers(...args),
}));

vi.mock('@/lib/logger', () => ({
  authLogger: {
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

import { initializeAuthStore } from '../auth-init';
function createMockStore() {
  const state: Partial<AuthState> = {
    token: 'access-tok',
    refreshToken: 'refresh-tok',
    isLoading: false,
  };

  const store = {
    getState: vi.fn(() => ({
      ...state,
      logout: vi.fn(),
    })),
    setState: vi.fn((updates: Partial<AuthState>) => {
      Object.assign(state, updates);
    }),
    subscribe: vi.fn(),
    destroy: vi.fn(),
  };

  return { store, state };
}
describe('initializeAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('registers token handlers with tokenService', () => {
    const { store } = createMockStore();
    initializeAuthStore(store as never);

    expect(mockRegisterTokenHandlers).toHaveBeenCalledTimes(1);
    const handlers = mockRegisterTokenHandlers.mock.calls[0]![0];
    expect(handlers).toHaveProperty('getAccessToken');
    expect(handlers).toHaveProperty('getRefreshToken');
    expect(handlers).toHaveProperty('setTokens');
    expect(handlers).toHaveProperty('onLogout');
  });

  it('getAccessToken handler returns current token from store', () => {
    const { store } = createMockStore();
    initializeAuthStore(store as never);

    const handlers = mockRegisterTokenHandlers.mock.calls[0]![0];
    expect(handlers.getAccessToken()).toBe('access-tok');
  });

  it('getRefreshToken handler returns current refresh token from store', () => {
    const { store } = createMockStore();
    initializeAuthStore(store as never);

    const handlers = mockRegisterTokenHandlers.mock.calls[0]![0];
    expect(handlers.getRefreshToken()).toBe('refresh-tok');
  });

  it('setTokens handler updates tokens in store', () => {
    const { store } = createMockStore();
    initializeAuthStore(store as never);

    const handlers = mockRegisterTokenHandlers.mock.calls[0]![0];
    handlers.setTokens({ accessToken: 'new-access', refreshToken: 'new-refresh' });

    expect(store.setState).toHaveBeenCalledWith({
      token: 'new-access',
      refreshToken: 'new-refresh',
    });
  });

  it('setTokens keeps existing refresh token when not provided', () => {
    const { store } = createMockStore();
    initializeAuthStore(store as never);

    const handlers = mockRegisterTokenHandlers.mock.calls[0]![0];
    handlers.setTokens({ accessToken: 'new-access' });

    expect(store.setState).toHaveBeenCalledWith({
      token: 'new-access',
      refreshToken: 'refresh-tok',
    });
  });

  it('onLogout clears local auth without calling the server logout action', () => {
    const { store } = createMockStore();
    initializeAuthStore(store as never);

    const handlers = mockRegisterTokenHandlers.mock.calls[0]![0];
    handlers.onLogout();

    expect(store.setState).toHaveBeenCalledWith({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('safety timeout forces isLoading to false if still loading after 3s', () => {
    const { store, state } = createMockStore();
    state.isLoading = true;
    initializeAuthStore(store as never);

    // Before timeout, isLoading should still be true
    vi.advanceTimersByTime(2999);
    expect(store.setState).not.toHaveBeenCalledWith({ isLoading: false });

    // After 3s, safety timeout triggers
    vi.advanceTimersByTime(1);
    expect(store.setState).toHaveBeenCalledWith({ isLoading: false });
  });

  it('safety timeout does not fire when isLoading is already false', () => {
    const { store, state } = createMockStore();
    state.isLoading = false;
    initializeAuthStore(store as never);

    vi.advanceTimersByTime(3000);

    // setState should only have been called by registerTokenHandlers setup, not safety timeout
    // Check that { isLoading: false } was not set by the timeout
    const isLoadingCalls = store.setState.mock.calls.filter(
      (call: unknown[]) => {
        const arg = call[0] as Record<string, unknown>;
        return 'isLoading' in arg && Object.keys(arg).length === 1;
      }
    );
    expect(isLoadingCalls).toHaveLength(0);
  });
});
