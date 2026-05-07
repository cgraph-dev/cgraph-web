import { beforeEach, describe, expect, it } from 'vitest';
import {
  STORAGE_KEYS,
  clearAuthScopedStorage,
  clearCGraphCacheStorage,
  clearCGraphQueryCache,
} from '../namespaces';

describe('storage namespaces', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('removes only query cache keys', () => {
    localStorage.setItem(STORAGE_KEYS.queryCache, 'new');
    localStorage.setItem('cgraph-query-cache', 'legacy');
    localStorage.setItem('unrelated', 'keep');

    clearCGraphQueryCache();

    expect(localStorage.getItem(STORAGE_KEYS.queryCache)).toBeNull();
    expect(localStorage.getItem('cgraph-query-cache')).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('keep');
  });

  it('clears namespaced cache data without clearing the app origin', () => {
    localStorage.setItem(STORAGE_KEYS.queryCache, 'query');
    localStorage.setItem('cgraph:v1:cache:avatar', 'avatar');
    localStorage.setItem('other-app', 'keep');

    clearCGraphCacheStorage();

    expect(localStorage.getItem(STORAGE_KEYS.queryCache)).toBeNull();
    expect(localStorage.getItem('cgraph:v1:cache:avatar')).toBeNull();
    expect(localStorage.getItem('other-app')).toBe('keep');
  });

  it('clears auth-scoped session storage without touching unrelated keys', () => {
    sessionStorage.setItem(STORAGE_KEYS.auth, 'auth');
    sessionStorage.setItem(STORAGE_KEYS.socketSessionId, 'new-socket');
    sessionStorage.setItem(STORAGE_KEYS.socketLastSequence, '100');
    sessionStorage.setItem('cgraph-auth-v2', 'legacy-auth');
    sessionStorage.setItem('ws_session_id', 'socket');
    sessionStorage.setItem('other-session', 'keep');
    localStorage.setItem('other-local', 'keep');

    clearAuthScopedStorage();

    expect(sessionStorage.getItem(STORAGE_KEYS.auth)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.socketSessionId)).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEYS.socketLastSequence)).toBeNull();
    expect(sessionStorage.getItem('cgraph-auth-v2')).toBeNull();
    expect(sessionStorage.getItem('ws_session_id')).toBeNull();
    expect(sessionStorage.getItem('other-session')).toBe('keep');
    expect(localStorage.getItem('other-local')).toBe('keep');
  });
});
