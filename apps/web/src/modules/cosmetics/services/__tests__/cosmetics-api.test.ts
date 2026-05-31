import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({ api: mockApi }));

import { cosmeticsApi } from '../cosmetics-api';

describe('cosmeticsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps border catalogue responses into shared cosmetic items', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        borders: [
          {
            id: 'border-1',
            slug: 'nova',
            name: 'Nova Border',
            description: 'Animated border',
            theme: 'cosmic',
            rarity: 'epic',
            borderStyle: 'glow',
            animationType: 'invalid-animation',
            animationSpeed: 1,
            animationIntensity: 2,
            colors: ['#fff', '#000'],
            particleConfig: null,
            glowConfig: null,
            isPurchasable: true,
            nodeCost: 250,
            gemCost: 5,
            previewUrl: 'https://example.com/border.png',
          },
        ],
        themes: ['cosmic'],
        rarities: ['epic'],
      },
    });

    const result = await cosmeticsApi.listBorders({ theme: 'cosmic' });

    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/cosmetics/borders', {
      params: { theme: 'cosmic' },
    });
    expect(result).toEqual({
      borders: [
        expect.objectContaining({
          id: 'border-1',
          surface: 'avatar_border',
          type: 'avatar_border',
          unlockType: 'purchase',
          unlockCondition: { type: 'purchase', threshold: 250 },
          animationType: 'none',
          previewUrl: 'https://example.com/border.png',
          colors: ['#fff', '#000'],
        }),
      ],
      themes: ['cosmic'],
      rarities: ['epic'],
    });
  });

  it('maps unified border inventory and legacy border fallbacks', async () => {
    mockApi.get.mockResolvedValue({
      data: {
        items: [
          {
            id: 'inventory-1',
            itemType: 'border',
            itemId: 'border-1',
            itemSlug: 'nova',
            itemKey: 'nova',
            equippedAt: '2026-05-31T10:00:00Z',
            obtainedAt: '2026-05-30T09:00:00Z',
            obtainedVia: 'default',
          },
          {
            id: 'inventory-2',
            borderId: 'border-missing',
            isEquipped: false,
            unlockSource: 'mystery',
            expiresAt: null,
            customColors: null,
            border: null,
          },
        ],
        equipped_id: 'border-1',
      },
    });

    const result = await cosmeticsApi.getUnlockedBorders();

    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/cosmetics/inventory', {
      params: { item_type: 'border' },
    });
    expect(result.equippedId).toBe('border-1');
    expect(result.inventory).toEqual([
      expect.objectContaining({
        equipped: true,
        source: 'free',
        acquiredAt: '2026-05-30T09:00:00Z',
        cosmetic: expect.objectContaining({
          id: 'border-1',
          slug: 'nova',
          name: 'Nova',
          type: 'avatar_border',
          unlockType: 'free',
          animationType: 'none',
        }),
      }),
      expect.objectContaining({
        equipped: false,
        source: 'free',
        cosmetic: expect.objectContaining({
          id: 'border-missing',
          name: 'Unknown Border',
          type: 'avatar_border',
          animationType: 'none',
        }),
      }),
    ]);
  });

  it('maps theme catalogue and active theme responses', async () => {
    mockApi.get
      .mockResolvedValueOnce({
        data: {
          themes: [
            {
              id: 'theme-1',
              slug: 'midnight',
              name: 'Midnight',
              description: 'Dark preset',
              preset: 'midnight',
              rarity: 'rare',
              colors: {},
              backgroundType: 'gradient',
              backgroundConfig: {},
              layoutType: 'default',
              hoverEffect: 'lift',
              glassmorphism: true,
              borderRadius: 'xl',
              fontFamily: 'Space Grotesk',
              isPurchasable: false,
              nodeCost: 0,
              gemCost: 0,
              previewUrl: 'https://example.com/theme.png',
            },
          ],
          presets: ['midnight'],
          rarities: ['rare'],
        },
      })
      .mockResolvedValueOnce({
        data: {
          profile_theme: {
            id: 'theme-1',
            slug: 'midnight',
            name: 'Midnight',
            description: 'Dark preset',
            rarity: 'rare',
            animationType: 'static',
            lottieUrl: null,
            lottieConfig: {},
            backgroundLottieUrl: 'https://example.com/theme-bg.json',
          },
        },
      })
      .mockResolvedValueOnce({ data: { profile_theme: null } });

    const listed = await cosmeticsApi.listProfileThemes({ preset: 'midnight' });
    const active = await cosmeticsApi.getActiveTheme();
    const inactive = await cosmeticsApi.getActiveTheme();

    expect(mockApi.get).toHaveBeenNthCalledWith(1, '/api/v1/marketplace/listings', {
      params: { preset: 'midnight', type: 'theme' },
    });
    expect(listed).toEqual({
      themes: [
        expect.objectContaining({
          id: 'theme-1',
          type: 'profile_theme',
          unlockType: 'free',
          animationType: 'none',
          previewUrl: 'https://example.com/theme.png',
        }),
      ],
      presets: ['midnight'],
      rarities: ['rare'],
    });
    expect(active).toEqual(
      expect.objectContaining({
        equipped: true,
        source: 'free',
        cosmetic: expect.objectContaining({
          id: 'theme-1',
          type: 'profile_theme',
          animationType: 'static',
          lottieFile: 'https://example.com/theme-bg.json',
          unlockCondition: { type: 'free', threshold: null },
        }),
      })
    );
    expect(inactive).toBeNull();
  });

  it('maps unified inventory data when activating a theme', async () => {
    mockApi.put.mockResolvedValue({
      data: {
        equipped: {
          id: 'inventory-theme-2',
          itemType: 'profile_theme',
          itemId: 'theme-2',
          itemSlug: 'aurora-glass',
          itemKey: 'aurora-glass',
          equippedAt: '2026-05-31T10:05:00Z',
          obtainedAt: '2026-05-30T10:00:00Z',
          obtainedVia: 'purchase',
        },
      },
    });

    const result = await cosmeticsApi.activateTheme('theme-2');

    expect(mockApi.put).toHaveBeenCalledWith('/api/v1/cosmetics/equip', {
      item_type: 'profile_theme',
      item_id: 'theme-2',
    });
    expect(result).toEqual(
      expect.objectContaining({
        equipped: true,
        source: 'purchase',
        acquiredAt: '2026-05-30T10:00:00Z',
        cosmetic: expect.objectContaining({
          id: 'theme-2',
          slug: 'aurora-glass',
          name: 'Aurora Glass',
          type: 'profile_theme',
        }),
      })
    );
  });

  it('handles inventory and unified equip endpoints', async () => {
    mockApi.get
      .mockResolvedValueOnce({ data: { items: [{ id: 'inventory-1' }], total: 1 } })
      .mockResolvedValueOnce({ data: { items: [], total: 0 } });
    mockApi.put.mockResolvedValue({ data: { equipped: { id: 'inventory-1' } } });
    mockApi.delete.mockResolvedValue({ data: { unequipped: true, item: { id: 'inventory-1' } } });

    const allItems = await cosmeticsApi.getInventory();
    const borderItems = await cosmeticsApi.getInventory('avatar_border');
    const equipped = await cosmeticsApi.equip('theme', 'theme-1');
    const unequipped = await cosmeticsApi.unequip('theme', 'theme-1');

    expect(mockApi.get).toHaveBeenNthCalledWith(1, '/api/v1/cosmetics/inventory', {
      params: undefined,
    });
    expect(mockApi.get).toHaveBeenNthCalledWith(2, '/api/v1/cosmetics/inventory', {
      params: { item_type: 'avatar_border' },
    });
    expect(mockApi.put).toHaveBeenCalledWith('/api/v1/cosmetics/equip', {
      item_type: 'theme',
      item_id: 'theme-1',
    });
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/cosmetics/unequip', {
      data: { item_type: 'theme', item_id: 'theme-1' },
    });
    expect(allItems).toEqual({ items: [{ id: 'inventory-1' }], total: 1 });
    expect(borderItems).toEqual({ items: [], total: 0 });
    expect(equipped).toEqual({ id: 'inventory-1' });
    expect(unequipped).toEqual({ id: 'inventory-1' });
  });

  it('handles border purchase and profile customization endpoints', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        item: {
          id: 'purchase-1',
          itemType: 'border',
          itemId: 'border-9',
          itemSlug: 'aurora-ring',
          itemKey: 'aurora-ring',
          equippedAt: null,
          obtainedAt: '2026-05-30T11:00:00Z',
          obtainedVia: 'purchase',
        },
      },
    });
    mockApi.put
      .mockResolvedValueOnce({ data: { bannerHash: 'banner-hash-1' } })
      .mockResolvedValueOnce({ data: { accentColor: '#112233' } });
    mockApi.delete.mockResolvedValue({ data: {} });

    const purchase = await cosmeticsApi.purchaseBorder('border-9');
    const file = new File(['banner'], 'banner.png', { type: 'image/png' });
    const uploaded = await cosmeticsApi.uploadBanner(file);
    await cosmeticsApi.removeBanner();
    const accent = await cosmeticsApi.updateAccentColor('#112233');

    const uploadCall = mockApi.put.mock.calls[0];
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/marketplace/purchase', {
      listing_id: 'border-9',
      type: 'avatar_border',
    });
    expect(purchase).toEqual(
      expect.objectContaining({
        source: 'purchase',
        acquiredAt: '2026-05-30T11:00:00Z',
        cosmetic: expect.objectContaining({ id: 'border-9', name: 'Aurora Ring' }),
      })
    );
    expect(uploadCall![0]).toBe('/api/v1/me/banner');
    expect(uploadCall![1]).toBeInstanceOf(FormData);
    expect((uploadCall![1] as FormData).get('banner')).toBe(file);
    expect(uploadCall![2]).toEqual({
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/me/banner');
    expect(mockApi.put).toHaveBeenNthCalledWith(2, '/api/v1/me/accent-color', {
      accent_color: '#112233',
    });
    expect(uploaded).toEqual({ bannerHash: 'banner-hash-1' });
    expect(accent).toEqual({ accentColor: '#112233' });
  });
});
