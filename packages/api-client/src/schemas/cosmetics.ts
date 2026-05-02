/**
 * Cosmetics schemas.
 *
 * Mirrors the shapes produced by CGraphWeb.CosmeticsController and its serializers.
 * All item schemas use `.passthrough()` so unknown backend fields are preserved.
 */
import { z } from 'zod';

export const CosmeticTypeSchema = z.enum([
  'avatar_border',
  'title',
  'badge',
  'nameplate',
  'chat_bubble',
  'theme',
  'name_style',
]);

export type CosmeticType = z.infer<typeof CosmeticTypeSchema>;

export const RarityTierSchema = z.enum([
  'free',
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
]);

export type RarityTier = z.infer<typeof RarityTierSchema>;

export const AnimationTypeSchema = z.enum(['none', 'lottie', 'css', 'sprite', 'video']);

export type AnimationType = z.infer<typeof AnimationTypeSchema>;

export const UnlockTypeSchema = z.enum([
  'free',
  'purchase',
  'achievement',
  'level',
  'event',
  'subscription',
  'gift',
  'admin',
]);

export type UnlockType = z.infer<typeof UnlockTypeSchema>;

/**
 * A single cosmetic item as returned by the backend catalogue endpoints.
 * `.passthrough()` preserves any additional fields the backend may add.
 */
export const CosmeticItemSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    description: z.string().optional(),
    type: CosmeticTypeSchema,
    rarity: RarityTierSchema,
    animation_type: AnimationTypeSchema.optional(),
    lottie_url: z.string().nullable().optional(),
    preview_url: z.string().nullable().optional(),
    colors: z.array(z.string()).optional(),
    is_purchasable: z.boolean().optional(),
    coin_cost: z.number().optional(),
    gem_cost: z.number().optional(),
    available: z.boolean().optional(),
    created_at: z.string().optional(),
  })
  .passthrough();

export type CosmeticItem = z.infer<typeof CosmeticItemSchema>;

/**
 * A single row from a user's inventory as returned by GET /api/v1/cosmetics/inventory.
 * `.passthrough()` preserves any additional fields the backend may add.
 */
export const InventoryItemSchema = z
  .object({
    id: z.string(),
    item_type: CosmeticTypeSchema,
    item_id: z.string(),
    equipped_at: z.string().nullable().optional(),
    obtained_at: z.string().optional(),
    obtained_via: z.string().optional(),
  })
  .passthrough();

export type InventoryItem = z.infer<typeof InventoryItemSchema>;

/** Response shape for GET /api/v1/cosmetics/inventory. */
export const InventoryResponseSchema = z.object({
  items: z.array(InventoryItemSchema),
  total: z.number(),
  page_info: z
    .object({
      has_next_page: z.boolean(),
      has_previous_page: z.boolean(),
      start_cursor: z.string().nullable(),
      end_cursor: z.string().nullable(),
      total_count: z.number().optional(),
    })
    .optional(),
});

export type InventoryResponse = z.infer<typeof InventoryResponseSchema>;

/**
 * A shop listing: a cosmetic item with price and availability metadata.
 * `.passthrough()` preserves any additional fields the backend may add.
 */
export const ShopItemSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    description: z.string().optional(),
    type: CosmeticTypeSchema,
    rarity: RarityTierSchema,
    animation_type: AnimationTypeSchema.optional(),
    preview_url: z.string().nullable().optional(),
    colors: z.array(z.string()).optional(),
    coin_cost: z.number(),
    gem_cost: z.number().optional(),
    is_available: z.boolean(),
    is_limited: z.boolean().optional(),
    available_until: z.string().nullable().optional(),
  })
  .passthrough();

export type ShopItem = z.infer<typeof ShopItemSchema>;

/** Response shape for GET /api/v1/cosmetics/shop. */
export const ShopResponseSchema = z.object({
  items: z.array(ShopItemSchema),
  total: z.number().optional(),
  page_info: z
    .object({
      has_next_page: z.boolean(),
      has_previous_page: z.boolean(),
      start_cursor: z.string().nullable(),
      end_cursor: z.string().nullable(),
      total_count: z.number().optional(),
    })
    .optional(),
});

export type ShopResponse = z.infer<typeof ShopResponseSchema>;

/** Response shape for equip / unequip operations. */
export const EquipResponseSchema = z.object({
  equipped: InventoryItemSchema.optional(),
  unequipped: InventoryItemSchema.optional(),
});

export type EquipResponse = z.infer<typeof EquipResponseSchema>;

/** Response shape for a purchase operation. */
export const PurchaseResponseSchema = z.object({
  item: InventoryItemSchema.optional(),
  balance: z.number().optional(),
});

export type PurchaseResponse = z.infer<typeof PurchaseResponseSchema>;

// ---------------------------------------------------------------------------
// Profile Effects
// ---------------------------------------------------------------------------

export const EffectCategorySchema = z.enum(['sparkles', 'fire', 'snow', 'hearts', 'custom']);
export type EffectCategory = z.infer<typeof EffectCategorySchema>;

export const EffectTypeSchema = z.enum(['particle', 'aura', 'trail']);
export type EffectType = z.infer<typeof EffectTypeSchema>;

export const TierSchema = z.enum(['free', 'premium', 'enterprise']);
export type Tier = z.infer<typeof TierSchema>;

export const ProfileEffectSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  type: EffectTypeSchema,
  rarity: RarityTierSchema,
  category: EffectCategorySchema,
  animation_url: z.string().nullable().optional(),
  preview_url: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  is_animated: z.boolean(),
  tier_required: TierSchema,
  config: z.record(z.unknown()).optional(),
  sort_order: z.number(),
});

export type ProfileEffect = z.infer<typeof ProfileEffectSchema>;

export const ProfileEffectListResponseSchema = z.object({
  data: z.array(ProfileEffectSchema),
  meta: z.object({
    has_next_page: z.boolean().optional(),
    end_cursor: z.string().nullable().optional(),
  }).optional(),
});

export type ProfileEffectListResponse = z.infer<typeof ProfileEffectListResponseSchema>;

export const ProfileEffectEquipResponseSchema = z.object({
  data: z.object({
    equipped: z.boolean(),
    effect: ProfileEffectSchema,
  }),
});

export type ProfileEffectEquipResponse = z.infer<typeof ProfileEffectEquipResponseSchema>;

// ---------------------------------------------------------------------------
// Avatar Frames
// ---------------------------------------------------------------------------

export const FrameUnlockTypeSchema = z.enum([
  'default', 'achievement', 'level', 'purchase', 'event', 'season', 'gift', 'prestige',
]);
export type FrameUnlockType = z.infer<typeof FrameUnlockTypeSchema>;

export const AvatarFrameSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  frame_url: z.string().nullable().optional(),
  lottie_url: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  animated: z.boolean(),
  rarity: RarityTierSchema,
  border_color: z.string().nullable().optional(),
  tier_required: TierSchema,
  unlock_type: FrameUnlockTypeSchema,
  sort_order: z.number(),
});

export type AvatarFrame = z.infer<typeof AvatarFrameSchema>;

export const AvatarFrameListResponseSchema = z.object({
  data: z.array(AvatarFrameSchema),
  meta: z.object({
    has_next_page: z.boolean().optional(),
    end_cursor: z.string().nullable().optional(),
  }).optional(),
});

export type AvatarFrameListResponse = z.infer<typeof AvatarFrameListResponseSchema>;

export const AvatarFrameEquipResponseSchema = z.object({
  data: z.object({
    equipped: z.boolean(),
    frame: AvatarFrameSchema,
  }),
});

export type AvatarFrameEquipResponse = z.infer<typeof AvatarFrameEquipResponseSchema>;

// ---------------------------------------------------------------------------
// Animated Borders
// ---------------------------------------------------------------------------

export const BorderAnimationTypeSchema = z.enum(['loop', 'pulse', 'sparkle', 'glow', 'none']);
export type BorderAnimationType = z.infer<typeof BorderAnimationTypeSchema>;

export const AnimatedBorderSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  theme: z.string().nullable().optional(),
  rarity: RarityTierSchema,
  animation_type: BorderAnimationTypeSchema,
  lottie_url: z.string().nullable().optional(),
  lottie_config: z.record(z.unknown()).optional(),
  preview_static_url: z.string().nullable().optional(),
  preview_animated_url: z.string().nullable().optional(),
  color_primary: z.string().nullable().optional(),
  color_secondary: z.string().nullable().optional(),
  is_animated: z.boolean(),
  tier_required: TierSchema,
  track: z.string().nullable().optional(),
  sort_order: z.number(),
});

export type AnimatedBorder = z.infer<typeof AnimatedBorderSchema>;

export const AnimatedBorderListResponseSchema = z.object({
  data: z.array(AnimatedBorderSchema),
  meta: z.object({
    has_next_page: z.boolean().optional(),
    end_cursor: z.string().nullable().optional(),
  }).optional(),
});

export type AnimatedBorderListResponse = z.infer<typeof AnimatedBorderListResponseSchema>;

export const AnimatedBorderEquipResponseSchema = z.object({
  data: z.object({
    equipped: z.boolean(),
    border: AnimatedBorderSchema,
  }),
});

export type AnimatedBorderEquipResponse = z.infer<typeof AnimatedBorderEquipResponseSchema>;
