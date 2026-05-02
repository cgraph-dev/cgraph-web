import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock the cosmetics store

const { mockStoreState } = vi.hoisted(() => {
  const fetchEntitlements = vi.fn().mockResolvedValue(undefined);
  const isEntitled = vi.fn().mockResolvedValue(false);

  return {
    mockStoreState: {
      entitlements: [] as ReadonlyArray<{
        active: boolean;
        sku: { id: string };
        expiresAt: string | null;
      }>,
      isLoadingEntitlements: false,
      error: null as string | null,
      fetchEntitlements,
      isEntitled,
    },
  };
});

vi.mock('../../store/cosmetics-store', () => ({
  useCosmeticsStore: (selector: (s: typeof mockStoreState) => unknown) => selector(mockStoreState),
}));

import { useEntitlements } from '../use-entitlements';

// Helpers

function makeEntitlement(_id: string, active: boolean, skuId: string) {
  return {
    active,
    sku: { id: skuId },
    expiresAt: null,
  };
}

// Tests

describe('useEntitlements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.entitlements = [];
    mockStoreState.isLoadingEntitlements = false;
    mockStoreState.error = null;
  });

  it('returns entitlements from the store', () => {
    const ent = makeEntitlement('e1', true, 'sku-1');
    mockStoreState.entitlements = [ent];

    const { result } = renderHook(() => useEntitlements());

    expect(result.current.entitlements).toEqual([ent]);
  });

  it('auto-fetches entitlements on mount when store is empty', () => {
    mockStoreState.entitlements = [];

    renderHook(() => useEntitlements());

    expect(mockStoreState.fetchEntitlements).toHaveBeenCalledOnce();
  });

  it('does NOT auto-fetch when entitlements already exist', () => {
    mockStoreState.entitlements = [makeEntitlement('e1', true, 'sku-1')];

    renderHook(() => useEntitlements());

    expect(mockStoreState.fetchEntitlements).not.toHaveBeenCalled();
  });

  it('computes entitledSkuIds Set from active entitlements only', () => {
    mockStoreState.entitlements = [
      makeEntitlement('e1', true, 'sku-active'),
      makeEntitlement('e2', false, 'sku-inactive'),
      makeEntitlement('e3', true, 'sku-also-active'),
    ];

    const { result } = renderHook(() => useEntitlements());

    expect(result.current.entitledSkuIds.has('sku-active')).toBe(true);
    expect(result.current.entitledSkuIds.has('sku-also-active')).toBe(true);
    expect(result.current.entitledSkuIds.has('sku-inactive')).toBe(false);
  });

  it('returns empty Set when there are no entitlements', () => {
    mockStoreState.entitlements = [];

    const { result } = renderHook(() => useEntitlements());

    expect(result.current.entitledSkuIds.size).toBe(0);
  });

  it('isEntitled returns true for active SKU IDs', () => {
    mockStoreState.entitlements = [makeEntitlement('e1', true, 'sku-1')];

    const { result } = renderHook(() => useEntitlements());

    expect(result.current.isEntitled('sku-1')).toBe(true);
    expect(result.current.isEntitled('sku-unknown')).toBe(false);
  });

  it('checkEntitledAsync returns true immediately for cached active SKU', async () => {
    mockStoreState.entitlements = [makeEntitlement('e1', true, 'sku-cached')];

    const { result } = renderHook(() => useEntitlements());

    const entitled = await result.current.checkEntitledAsync('sku-cached');
    expect(entitled).toBe(true);
    expect(mockStoreState.isEntitled).not.toHaveBeenCalled();
  });

  it('checkEntitledAsync falls back to store for unknown SKU', async () => {
    mockStoreState.entitlements = [];
    mockStoreState.isEntitled.mockResolvedValue(true);

    const { result } = renderHook(() => useEntitlements());

    const entitled = await result.current.checkEntitledAsync('sku-remote');
    expect(entitled).toBe(true);
    expect(mockStoreState.isEntitled).toHaveBeenCalledWith('sku-remote');
  });

  it('checkEntitledAsync returns false when store says not entitled', async () => {
    mockStoreState.entitlements = [];
    mockStoreState.isEntitled.mockResolvedValue(false);

    const { result } = renderHook(() => useEntitlements());

    const entitled = await result.current.checkEntitledAsync('sku-nope');
    expect(entitled).toBe(false);
  });

  it('exposes isLoading state', () => {
    mockStoreState.isLoadingEntitlements = true;

    const { result } = renderHook(() => useEntitlements());

    expect(result.current.isLoading).toBe(true);
  });

  it('exposes error state', () => {
    mockStoreState.error = 'Failed to fetch';

    const { result } = renderHook(() => useEntitlements());

    expect(result.current.error).toBe('Failed to fetch');
  });

  it('exposes fetchEntitlements action for manual refresh', () => {
    const { result } = renderHook(() => useEntitlements());

    expect(result.current.fetchEntitlements).toBe(mockStoreState.fetchEntitlements);
  });

  it('handles duplicate SKU IDs in entitlements (Set deduplication)', () => {
    mockStoreState.entitlements = [
      makeEntitlement('e1', true, 'sku-dup'),
      makeEntitlement('e2', true, 'sku-dup'),
    ];

    const { result } = renderHook(() => useEntitlements());

    expect(result.current.entitledSkuIds.size).toBe(1);
    expect(result.current.isEntitled('sku-dup')).toBe(true);
  });

  it('excludes inactive entitlements from Set even when they exist', () => {
    mockStoreState.entitlements = [makeEntitlement('e1', false, 'sku-revoked')];

    const { result } = renderHook(() => useEntitlements());

    expect(result.current.entitledSkuIds.size).toBe(0);
    expect(result.current.isEntitled('sku-revoked')).toBe(false);
  });
});
