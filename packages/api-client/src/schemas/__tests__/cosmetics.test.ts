import { describe, expect, it } from 'vitest';

import {
  AnimationTypeSchema,
  EquippedCosmeticsSchema,
  EquipResponseSchema,
  InventoryItemSchema,
  InventoryResponseSchema,
} from '../cosmetics';

const inventoryItem = {
  id: 'inventory-1',
  itemType: 'border',
  itemId: '11111111-1111-1111-1111-111111111111',
  itemSlug: null,
  itemKey: '11111111-1111-1111-1111-111111111111',
  equippedAt: null,
  obtainedAt: '2026-05-30T09:30:00Z',
  obtainedVia: 'default',
} as const;

const catalogItem = {
  id: 'catalog-1',
  name: 'Signal Noir',
  slug: 'signal-noir',
  rarity: 'free',
  description: null,
  animationType: 'static',
  lottieUrl: null,
  lottieConfig: {},
} as const;

describe('cosmetics schemas', () => {
  it('accepts the backend inventory payload contract', () => {
    const result = InventoryResponseSchema.parse({
      items: [inventoryItem],
      total: 1,
      page_info: {
        has_next_page: false,
        has_previous_page: false,
        start_cursor: null,
        end_cursor: null,
        total_count: 1,
      },
    });

    expect(result.items[0]).toMatchObject({
      itemType: 'border',
      itemId: inventoryItem.itemId,
      itemKey: inventoryItem.itemKey,
      obtainedVia: 'default',
    });
  });

  it('normalizes legacy snake_case inventory rows to the shared camelCase contract', () => {
    const result = InventoryItemSchema.parse({
      id: 'inventory-2',
      item_type: 'avatar_border',
      item_id: '22222222-2222-2222-2222-222222222222',
      item_slug: 'aurora-ring',
      item_key: 'aurora-ring',
      equipped_at: '2026-05-30T09:31:00Z',
      obtained_at: '2026-05-30T09:30:00Z',
      obtained_via: 'purchase',
    });

    expect(result).toMatchObject({
      itemType: 'avatar_border',
      itemId: '22222222-2222-2222-2222-222222222222',
      itemSlug: 'aurora-ring',
      itemKey: 'aurora-ring',
      equippedAt: '2026-05-30T09:31:00Z',
      obtainedAt: '2026-05-30T09:30:00Z',
      obtainedVia: 'purchase',
    });
  });

  it('accepts the backend equipped cosmetics bundle with static catalog summaries', () => {
    expect(AnimationTypeSchema.parse('static')).toBe('static');

    const result = EquippedCosmeticsSchema.parse({
      avatar_border: catalogItem,
      nameplate: null,
      title: null,
      badges: [catalogItem],
      profile_theme: null,
      name_style: null,
      profile_effect: null,
      avatar_frame: null,
    });

    expect(result.avatar_border?.animationType).toBe('static');
    expect(result.badges).toHaveLength(1);
  });

  it('accepts backend equip and unequip response shapes', () => {
    expect(
      EquipResponseSchema.parse({
        type: 'avatar_border',
        item_id: inventoryItem.itemId,
        equipped_at: '2026-05-30T09:32:00Z',
        equipped: {
          ...inventoryItem,
          itemType: 'avatar_border',
          equippedAt: '2026-05-30T09:32:00Z',
        },
      })
    ).toMatchObject({
      type: 'avatar_border',
      equipped: {
        itemType: 'avatar_border',
      },
    });

    expect(
      EquipResponseSchema.parse({
        type: 'avatar_border',
        unequipped: true,
        item: inventoryItem,
      })
    ).toMatchObject({
      type: 'avatar_border',
      unequipped: true,
      item: {
        itemType: 'border',
      },
    });
  });
});
