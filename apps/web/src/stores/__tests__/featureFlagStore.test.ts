/**
 * Tests for featureFlagStore.ts
 *
 * Covers:
 * - Initial state
 * - fetchFlags with caching behavior
 * - refreshFlags (cache bypass)
 * - isEnabled / getVariant selectors
 * - clearCache
 * - Error handling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFeatureFlagStore } from '../featureFlagStore';

// Mock logger
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Helpers

const mockFlags = [
  { name: 'voice_e2ee', type: 'boolean', enabled: true },
  { name: 'file_e2ee', type: 'boolean', enabled: false },
  {
    name: 'theme_variant',
    type: 'variant',
    enabled: true,
    variant: 'dark',
    variants: ['dark', 'light'],
  },
  { name: 'rollout', type: 'percentage', enabled: true, percentage: 50 },
];

function mockFetchSuccess(flags = mockFlags): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({ data: { flags } }),
  });
}

function mockFetchError(status = 500): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: vi.fn().mockResolvedValue({}),
  });
}

function mockFetchNetworkError(): void {
  global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));
}

// Setup / Teardown
beforeEach(() => {
  // Reset store fully
  useFeatureFlagStore.setState({ flags: {}, lastFetched: 0, loading: false, error: null });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Tests

describe('featureFlagStore initial state', () => {
  it('starts with empty flags', () => {
    const state = useFeatureFlagStore.getState();
    expect(state.flags).toEqual({});
    expect(state.lastFetched).toBe(0);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});

describe('fetchFlags', () => {
  it('fetches and normalizes flags into a map', async () => {
    mockFetchSuccess();

    await useFeatureFlagStore.getState().fetchFlags();

    const state = useFeatureFlagStore.getState();
    expect(state.flags).toHaveProperty('voice_e2ee');
    expect(state.flags).toHaveProperty('file_e2ee');
    expect(state.flags).toHaveProperty('theme_variant');
    expect(state.flags.voice_e2ee!.enabled).toBe(true);
    expect(state.flags.file_e2ee!.enabled).toBe(false);
    expect(state.loading).toBe(false);
    expect(state.lastFetched).toBeGreaterThan(0);
  });

  it('skips fetch if cache is fresh', async () => {
    mockFetchSuccess();

    await useFeatureFlagStore.getState().fetchFlags();

    // Call again immediately - should use cache
    await useFeatureFlagStore.getState().fetchFlags();

    // fetch should only be called once
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('skips fetch if already loading', async () => {
    mockFetchSuccess();

    // Set loading to true manually
    useFeatureFlagStore.setState({ loading: true });

    await useFeatureFlagStore.getState().fetchFlags();

    // fetch should not have been called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles HTTP error responses', async () => {
    mockFetchError(500);

    await useFeatureFlagStore.getState().fetchFlags();

    const state = useFeatureFlagStore.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toContain('500');
    expect(Object.keys(state.flags)).toHaveLength(0);
  });

  it('handles network errors', async () => {
    mockFetchNetworkError();

    await useFeatureFlagStore.getState().fetchFlags();

    const state = useFeatureFlagStore.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Network failure');
  });

  it('sends correct headers and credentials', async () => {
    mockFetchSuccess();

    await useFeatureFlagStore.getState().fetchFlags();

    expect(global.fetch).toHaveBeenCalledWith('/api/v1/feature-flags', {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  });

  it('normalizes flat array response (data.flags fallback to flags key)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ flags: mockFlags }),
    });

    await useFeatureFlagStore.getState().fetchFlags();

    expect(useFeatureFlagStore.getState().flags).toHaveProperty('voice_e2ee');
  });

  it('normalizes data-only response (data.data fallback)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ data: mockFlags }),
    });

    await useFeatureFlagStore.getState().fetchFlags();

    expect(useFeatureFlagStore.getState().flags).toHaveProperty('voice_e2ee');
  });
});

describe('refreshFlags', () => {
  it('bypasses cache and fetches fresh flags', async () => {
    mockFetchSuccess();

    // First fetch
    await useFeatureFlagStore.getState().fetchFlags();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Refresh should reset lastFetched and fetch again
    await useFeatureFlagStore.getState().refreshFlags();

    // fetch should have been called twice total
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe('isEnabled', () => {
  it('returns true for enabled flags', async () => {
    mockFetchSuccess();
    await useFeatureFlagStore.getState().fetchFlags();

    expect(useFeatureFlagStore.getState().isEnabled('voice_e2ee')).toBe(true);
  });

  it('returns false for disabled flags', async () => {
    mockFetchSuccess();
    await useFeatureFlagStore.getState().fetchFlags();

    expect(useFeatureFlagStore.getState().isEnabled('file_e2ee')).toBe(false);
  });

  it('returns false for unknown flags', () => {
    expect(useFeatureFlagStore.getState().isEnabled('nonexistent')).toBe(false);
  });
});

describe('getVariant', () => {
  it('returns variant for variant-type flags', async () => {
    mockFetchSuccess();
    await useFeatureFlagStore.getState().fetchFlags();

    expect(useFeatureFlagStore.getState().getVariant('theme_variant')).toBe('dark');
  });

  it('returns undefined for non-variant flags', async () => {
    mockFetchSuccess();
    await useFeatureFlagStore.getState().fetchFlags();

    expect(useFeatureFlagStore.getState().getVariant('voice_e2ee')).toBeUndefined();
  });

  it('returns undefined for unknown flags', () => {
    expect(useFeatureFlagStore.getState().getVariant('nonexistent')).toBeUndefined();
  });
});

describe('clearCache', () => {
  it('clears flags and resets lastFetched', async () => {
    mockFetchSuccess();
    await useFeatureFlagStore.getState().fetchFlags();

    useFeatureFlagStore.getState().clearCache();

    const state = useFeatureFlagStore.getState();
    expect(state.flags).toEqual({});
    expect(state.lastFetched).toBe(0);
  });
});
