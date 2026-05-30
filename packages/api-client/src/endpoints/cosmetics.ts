/**
 * Cosmetics endpoints.
 *
 * Endpoints under /api/v1/cosmetics for inventory management,
 * equip/unequip operations, shop browsing, and purchases.
 */
import type { AxiosInstance } from 'axios';
import { z } from 'zod';
import { apiCall } from '../schemas/api-result';
import {
  InventoryResponseSchema,
  EquippedCosmeticsSchema,
  ShopResponseSchema,
  EquipResponseSchema,
  PurchaseResponseSchema,
  ProfileEffectSchema,
  ProfileEffectListResponseSchema,
  ProfileEffectEquipResponseSchema,
  AvatarFrameSchema,
  AvatarFrameListResponseSchema,
  AvatarFrameEquipResponseSchema,
  AnimatedBorderSchema,
  AnimatedBorderListResponseSchema,
  AnimatedBorderEquipResponseSchema,
} from '../schemas/cosmetics';
import type {
  CosmeticType,
  InventoryItem,
  InventoryResponse,
  EquippedCosmetics,
  ShopResponse,
  EquipResponse,
  PurchaseResponse,
  ProfileEffect,
  ProfileEffectListResponse,
  ProfileEffectEquipResponse,
  AvatarFrame,
  AvatarFrameListResponse,
  AvatarFrameEquipResponse,
  AnimatedBorder,
  AnimatedBorderListResponse,
  AnimatedBorderEquipResponse,
} from '../schemas/cosmetics';
import type { ApiResult } from '../schemas/api-result';

export type {
  CosmeticType,
  RarityTier,
  AnimationType,
  UnlockType,
  CosmeticItem,
  InventoryItem,
  InventoryResponse,
  CatalogItemSummary,
  EquippedCosmetics,
  ShopItem,
  ShopResponse,
  EquipResponse,
  PurchaseResponse,
  ProfileEffect,
  ProfileEffectListResponse,
  ProfileEffectEquipResponse,
  EffectCategory,
  EffectType,
  AvatarFrame,
  AvatarFrameListResponse,
  AvatarFrameEquipResponse,
  FrameUnlockType,
  AnimatedBorder,
  AnimatedBorderListResponse,
  AnimatedBorderEquipResponse,
  BorderAnimationType,
} from '../schemas/cosmetics';

/**
 * Creates cosmetics endpoints for managing inventory, equipping items,
 * browsing the shop, and purchasing cosmetics.
 *
 * @param http - Axios instance configured with the base URL and auth headers
 * @returns Object containing all cosmetics-related endpoint methods
 */
export function createCosmeticsEndpoints(http: AxiosInstance) {
  return {
    /**
     * Get the current user's cosmetic inventory.
     * Optionally filter by item type.
     */
    async getInventory(params?: {
      readonly item_type?: CosmeticType;
    }): Promise<ApiResult<InventoryResponse>> {
      return apiCall(
        () => http.get('/api/v1/cosmetics/inventory', { params }),
        InventoryResponseSchema
      );
    },

    /** Get all currently equipped cosmetics for the current user. */
    async getEquipped(): Promise<ApiResult<EquippedCosmetics>> {
      return apiCall(() => http.get('/api/v1/cosmetics/equipped'), EquippedCosmeticsSchema);
    },

    /**
     * Get the cosmetics shop listing.
     * Optionally filter by type or rarity.
     */
    async getShop(params?: {
      readonly item_type?: CosmeticType;
      readonly rarity?: string;
      readonly cursor?: string;
      readonly limit?: number;
    }): Promise<ApiResult<ShopResponse>> {
      return apiCall(() => http.get('/api/v1/cosmetics/shop', { params }), ShopResponseSchema);
    },

    /**
     * Equip a cosmetic item.
     * Sends item_type and item_id in the request body.
     */
    async equip(itemType: CosmeticType, itemId: string): Promise<ApiResult<EquipResponse>> {
      return apiCall(
        () => http.put('/api/v1/cosmetics/equip', { item_type: itemType, item_id: itemId }),
        EquipResponseSchema
      );
    },

    /**
     * Unequip a cosmetic item.
     * Sends item_type and item_id in the request body.
     */
    async unequip(itemType: CosmeticType, itemId: string): Promise<ApiResult<EquipResponse>> {
      return apiCall(
        () =>
          http.delete('/api/v1/cosmetics/unequip', {
            data: { item_type: itemType, item_id: itemId },
          }),
        EquipResponseSchema
      );
    },

    /**
     * Purchase a cosmetic item from the shop.
     * Returns the new inventory item and updated balance.
     */
    async purchase(itemId: string): Promise<ApiResult<PurchaseResponse>> {
      return apiCall(
        () => http.post('/api/v1/cosmetics/purchase', { item_id: itemId }),
        PurchaseResponseSchema
      );
    },

    /**
     * Get a single inventory item by its inventory entry ID.
     * Useful for refreshing state after an equip/unequip.
     */
    async getInventoryItem(inventoryItemId: string): Promise<ApiResult<InventoryItem>> {
      return apiCall(
        () => http.get(`/api/v1/cosmetics/inventory/${inventoryItemId}`),
        InventoryResponseSchema.shape.items.element
      );
    },

    // ----- Profile Effects -----

    /** List all active profile effects with optional filtering. */
    async listProfileEffects(params?: {
      readonly rarity?: string;
      readonly category?: string;
      readonly cursor?: string;
      readonly limit?: number;
    }): Promise<ApiResult<ProfileEffectListResponse>> {
      return apiCall(
        () => http.get('/api/v1/cosmetics/profile-effects', { params }),
        ProfileEffectListResponseSchema
      );
    },

    /** Get a single profile effect by ID. */
    async getProfileEffect(effectId: string): Promise<ApiResult<ProfileEffect>> {
      return apiCall(
        () => http.get(`/api/v1/cosmetics/profile-effects/${effectId}`),
        ProfileEffectSchema
      );
    },

    /** Equip a profile effect. */
    async equipProfileEffect(effectId: string): Promise<ApiResult<ProfileEffectEquipResponse>> {
      return apiCall(
        () => http.post('/api/v1/cosmetics/profile-effects/equip', { effect_id: effectId }),
        ProfileEffectEquipResponseSchema
      );
    },

    /** Unequip the current profile effect. */
    async unequipProfileEffect(): Promise<ApiResult<unknown>> {
      return apiCall(
        () => http.post('/api/v1/cosmetics/profile-effects/unequip'),
        z.unknown()
      );
    },

    /** Get a user's active profile effect. */
    async getUserProfileEffect(userId: string): Promise<ApiResult<ProfileEffect | null>> {
      return apiCall(
        () => http.get(`/api/v1/users/${userId}/profile-effect`),
        ProfileEffectSchema.nullable()
      );
    },

    // ----- Avatar Frames -----

    /** List all active avatar frames with optional filtering. */
    async listAvatarFrames(params?: {
      readonly rarity?: string;
      readonly is_animated?: boolean;
      readonly cursor?: string;
      readonly limit?: number;
    }): Promise<ApiResult<AvatarFrameListResponse>> {
      return apiCall(
        () => http.get('/api/v1/cosmetics/avatar-frames', { params }),
        AvatarFrameListResponseSchema
      );
    },

    /** Get a single avatar frame by ID. */
    async getAvatarFrame(frameId: string): Promise<ApiResult<AvatarFrame>> {
      return apiCall(
        () => http.get(`/api/v1/cosmetics/avatar-frames/${frameId}`),
        AvatarFrameSchema
      );
    },

    /** Equip an avatar frame. */
    async equipAvatarFrame(frameId: string): Promise<ApiResult<AvatarFrameEquipResponse>> {
      return apiCall(
        () => http.post('/api/v1/cosmetics/avatar-frames/equip', { frame_id: frameId }),
        AvatarFrameEquipResponseSchema
      );
    },

    /** Unequip the current avatar frame. */
    async unequipAvatarFrame(): Promise<ApiResult<unknown>> {
      return apiCall(
        () => http.post('/api/v1/cosmetics/avatar-frames/unequip'),
        z.unknown()
      );
    },

    /** Get a user's active avatar frame. */
    async getUserAvatarFrame(userId: string): Promise<ApiResult<AvatarFrame | null>> {
      return apiCall(
        () => http.get(`/api/v1/users/${userId}/avatar-frame`),
        AvatarFrameSchema.nullable()
      );
    },

    // ----- Animated Borders -----

    /** List all active animated borders with optional filtering. */
    async listAnimatedBorders(params?: {
      readonly rarity?: string;
      readonly animation_type?: string;
      readonly cursor?: string;
      readonly limit?: number;
    }): Promise<ApiResult<AnimatedBorderListResponse>> {
      return apiCall(
        () => http.get('/api/v1/cosmetics/borders', { params }),
        AnimatedBorderListResponseSchema
      );
    },

    /** Get a single animated border by ID. */
    async getAnimatedBorder(borderId: string): Promise<ApiResult<AnimatedBorder>> {
      return apiCall(
        () => http.get(`/api/v1/cosmetics/borders/${borderId}`),
        AnimatedBorderSchema
      );
    },

    /** Equip an animated border. */
    async equipAnimatedBorder(borderId: string): Promise<ApiResult<AnimatedBorderEquipResponse>> {
      return apiCall(
        () => http.post('/api/v1/cosmetics/borders/equip', { border_id: borderId }),
        AnimatedBorderEquipResponseSchema
      );
    },

    /** Unequip the current animated border. */
    async unequipAnimatedBorder(): Promise<ApiResult<unknown>> {
      return apiCall(
        () => http.post('/api/v1/cosmetics/borders/unequip'),
        z.unknown()
      );
    },

    /** Get a user's active animated border. */
    async getUserAnimatedBorder(userId: string): Promise<ApiResult<AnimatedBorder | null>> {
      return apiCall(
        () => http.get(`/api/v1/users/${userId}/border`),
        AnimatedBorderSchema.nullable()
      );
    },
  };
}
