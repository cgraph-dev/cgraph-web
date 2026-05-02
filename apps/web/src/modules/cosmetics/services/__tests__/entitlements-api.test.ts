import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({ api: mockApi }));

import { entitlementsApi } from '../entitlements-api';

describe('entitlementsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches paginated entitlements and maps fallback enum values safely', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: [
          {
            id: 'ent-1',
            sku: {
              id: 'sku-1',
              slug: 'founder-pack',
              name: 'Founder Pack',
              type: 'not-a-real-type',
              assetHash: 'hash-1',
              cosmeticId: 'cosmetic-1',
              priceNodes: 1500,
              stripePriceId: 'price_123',
              isPremiumOnly: true,
              isAvailable: true,
              collection: 'founders',
              version: 3,
            },
            type: 'mystery-type',
            source: 'unknown-source',
            grantedAt: '2026-03-22T00:00:00Z',
            expiresAt: null,
            active: true,
          },
        ],
        nextCursor: 'cursor-2',
        hasMore: true,
      },
    });

    const result = await entitlementsApi.fetchEntitlements();

    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/entitlements', {
      params: {},
    });
    expect(result).toEqual({
      data: [
        {
          id: 'ent-1',
          sku: {
            id: 'sku-1',
            slug: 'founder-pack',
            name: 'Founder Pack',
            type: 'badge',
            assetHash: 'hash-1',
            cosmeticId: 'cosmetic-1',
            priceNodes: 1500,
            stripePriceId: 'price_123',
            isPremiumOnly: true,
            isAvailable: true,
            collection: 'founders',
            version: 3,
          },
          type: 'purchase',
          source: 'shop_purchase',
          grantedAt: '2026-03-22T00:00:00Z',
          expiresAt: null,
          active: true,
        },
      ],
      nextCursor: 'cursor-2',
      hasMore: true,
    });
  });

  it('passes cursor and limit when fetching entitlements', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        data: [],
        nextCursor: null,
        hasMore: false,
      },
    });

    await entitlementsApi.fetchEntitlements('cursor-1', 25);

    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/entitlements', {
      params: { cursor: 'cursor-1', limit: 25 },
    });
  });

  it('checks whether a sku is entitled', async () => {
    mockApi.get.mockResolvedValue({
      data: { entitled: true },
    });

    await expect(entitlementsApi.checkEntitlement('sku-99')).resolves.toBe(true);
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/entitlements/check', {
      params: { sku_id: 'sku-99' },
    });
  });

  it('purchases an entitlement and preserves valid enum values', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        id: 'ent-2',
        sku: {
          id: 'sku-2',
          slug: 'seasonal-theme',
          name: 'Seasonal Theme',
          type: 'theme',
          assetHash: null,
          cosmeticId: 'theme-2',
          priceNodes: 700,
          stripePriceId: null,
          isPremiumOnly: false,
          isAvailable: true,
          collection: null,
          version: 1,
        },
        type: 'gift',
        source: 'gift',
        grantedAt: '2026-03-22T12:00:00Z',
        expiresAt: '2026-04-22T12:00:00Z',
        active: false,
      },
    });

    const result = await entitlementsApi.purchaseEntitlement('sku-2');

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/entitlements', {
      sku_id: 'sku-2',
    });
    expect(result).toEqual({
      id: 'ent-2',
      sku: {
        id: 'sku-2',
        slug: 'seasonal-theme',
        name: 'Seasonal Theme',
        type: 'theme',
        assetHash: null,
        cosmeticId: 'theme-2',
        priceNodes: 700,
        stripePriceId: null,
        isPremiumOnly: false,
        isAvailable: true,
        collection: null,
        version: 1,
      },
      type: 'gift',
      source: 'gift',
      grantedAt: '2026-03-22T12:00:00Z',
      expiresAt: '2026-04-22T12:00:00Z',
      active: false,
    });
  });
});
