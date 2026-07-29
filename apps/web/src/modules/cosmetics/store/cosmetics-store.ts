/**
 * Cosmetics Store — Zustand state management for cosmetics.
 *
 * Connects the ShopPage and InventoryPage to the backend
 * CosmeticsController via the cosmeticsApi service.
 * Also manages entitlements.
 *
 */

import { create } from 'zustand';
import type { CosmeticItem, UserCosmeticInventory, Entitlement } from '@cgraph-dev/shared-types';
import type {
  MarketplaceListing,
  CosmeticBundle,
  InventoryItem,
  MarketplaceFilters,
} from '@cgraph-dev/shared-types';
import type { UserProgression, UnlockEntry, UpcomingUnlock } from '@cgraph-dev/shared-types';
import type { ProfileEffect, AvatarFrame, AnimatedBorder } from '@cgraph-dev/api-client';
import type { ProfileUpdatedEvent } from '@/lib/socket/cosmetic-events';
import { apiClient, http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { cosmeticsApi } from '../services/cosmetics-api';
import { entitlementsApi } from '../services/entitlements-api';

/** Upper bound for cached cosmetics catalogue + inventory entries. */
const MAX_COSMETICS_CATALOGUE = 1000;
const MAX_COSMETICS_INVENTORY = 500;

const logger = createLogger('CosmeticsStore');

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

/** Hard cap on cached cosmetic items to prevent unbounded growth. */
const MAX_COSMETICS_ITEMS = 500;
const MAX_MARKETPLACE_ITEMS = 200;
// Types
interface CosmeticsState {
  /** Full catalogue of available cosmetics (shop). */
  readonly catalogue: CosmeticItem[];
  /** User's owned cosmetic inventory. */
  readonly inventory: UserCosmeticInventory[];
  /** Available filter values from the API. */
  readonly availableThemes: string[];
  readonly availableRarities: string[];
  /** Loading states. */
  readonly isLoadingCatalogue: boolean;
  readonly isLoadingInventory: boolean;
  readonly isEquipping: boolean;
  /** Error message. */
  readonly error: string | null;

  /** User's entitlements. */
  readonly entitlements: readonly Entitlement[];
  readonly isLoadingEntitlements: boolean;

  /** Cached cosmetic data for other users (from socket events). */
  readonly memberCosmetics: ReadonlyMap<string, ProfileUpdatedEvent>;

  /** Cursor pagination state for inventory. */
  readonly inventoryCursor: string | null;
  readonly inventoryHasMore: boolean;

  /** Profile effects state. */
  readonly availableEffects: readonly ProfileEffect[];
  readonly equippedEffect: ProfileEffect | null;
  readonly isLoadingEffects: boolean;

  /** Avatar frames state. */
  readonly availableFrames: readonly AvatarFrame[];
  readonly equippedFrame: AvatarFrame | null;
  readonly isLoadingFrames: boolean;

  /** Animated borders state. */
  readonly availableBorders: readonly AnimatedBorder[];
  readonly equippedBorder: AnimatedBorder | null;
  readonly isLoadingBorders: boolean;

  /** Progression state. */
  readonly progression: UserProgression | null;
  readonly isLoadingProgression: boolean;
  readonly unlockHistory: readonly UnlockEntry[];
  readonly upcomingUnlocks: readonly UpcomingUnlock[];

  /** Marketplace state. */
  readonly marketplaceListings: readonly MarketplaceListing[];
  readonly marketplaceFeatured: readonly MarketplaceListing[];
  readonly marketplaceBundles: readonly CosmeticBundle[];
  readonly marketplaceInventory: readonly InventoryItem[];
  readonly isLoadingMarketplace: boolean;
  readonly isLoadingMarketplaceInventory: boolean;
  readonly marketplaceError: string | null;

  // Actions
  fetchCatalogue: () => Promise<void>;
  fetchInventory: () => Promise<void>;
  equipItem: (item: CosmeticItem) => Promise<void>;
  unequipItem: (item: CosmeticItem) => Promise<void>;

  // Entitlement actions
  fetchEntitlements: () => Promise<void>;
  isEntitled: (skuId: string) => Promise<boolean>;
  purchaseEntitlement: (skuId: string) => Promise<void>;
  fetchInventoryPage: (cursor?: string) => Promise<void>;

  // Profile effects actions
  fetchEffects: () => Promise<void>;
  equipEffect: (effectId: string) => Promise<void>;
  unequipEffect: () => Promise<void>;

  // Avatar frames actions
  fetchFrames: () => Promise<void>;
  equipFrame: (frameId: string) => Promise<void>;
  unequipFrame: () => Promise<void>;

  // Animated borders actions
  fetchBorders: () => Promise<void>;
  equipBorder: (borderId: string) => Promise<void>;
  unequipBorder: () => Promise<void>;

  // Progression actions
  fetchProgression: () => Promise<void>;
  fetchUnlockHistory: () => Promise<void>;
  fetchUpcomingUnlocks: () => Promise<void>;

  // Fetch active cosmetics for a user
  fetchUserActiveCosmetics: (userId: string) => Promise<void>;

  // Accent actions
  updateAccentColor: (hex: string) => Promise<void>;

  // Marketplace actions
  fetchMarketplaceListings: (filters?: MarketplaceFilters) => Promise<void>;
  fetchMarketplaceFeatured: () => Promise<void>;
  fetchMarketplaceBundles: () => Promise<void>;
  fetchMarketplaceInventory: (category?: string) => Promise<void>;
  purchaseMarketplaceItem: (params: Record<string, unknown>) => Promise<void>;

  // Member cosmetics actions (from socket events)
  updateOwnProfile: (changes: ProfileUpdatedEvent) => void;
  updateMemberCosmetics: (userId: string, changes: ProfileUpdatedEvent) => void;
  getMemberCosmetics: (userId: string) => ProfileUpdatedEvent | undefined;

  reset: () => void;
}
// Action names for Omit in initial state
type ActionKeys =
  | 'fetchCatalogue'
  | 'fetchInventory'
  | 'equipItem'
  | 'unequipItem'
  | 'fetchEntitlements'
  | 'isEntitled'
  | 'purchaseEntitlement'
  | 'fetchInventoryPage'
  | 'fetchEffects'
  | 'equipEffect'
  | 'unequipEffect'
  | 'fetchFrames'
  | 'equipFrame'
  | 'unequipFrame'
  | 'fetchBorders'
  | 'equipBorder'
  | 'unequipBorder'
  | 'fetchProgression'
  | 'fetchUnlockHistory'
  | 'fetchUpcomingUnlocks'
  | 'fetchUserActiveCosmetics'
  | 'updateAccentColor'
  | 'fetchMarketplaceListings'
  | 'fetchMarketplaceFeatured'
  | 'fetchMarketplaceBundles'
  | 'fetchMarketplaceInventory'
  | 'purchaseMarketplaceItem'
  | 'updateOwnProfile'
  | 'updateMemberCosmetics'
  | 'getMemberCosmetics'
  | 'reset';
// Initial state
const initialState: Omit<CosmeticsState, ActionKeys> = {
  catalogue: [],
  inventory: [],
  availableThemes: [],
  availableRarities: [],
  isLoadingCatalogue: false,
  isLoadingInventory: false,
  isEquipping: false,
  error: null,
  entitlements: [],
  isLoadingEntitlements: false,
  memberCosmetics: new Map<string, ProfileUpdatedEvent>(),
  inventoryCursor: null,
  inventoryHasMore: true,
  availableEffects: [],
  equippedEffect: null,
  isLoadingEffects: false,
  availableFrames: [],
  equippedFrame: null,
  isLoadingFrames: false,
  availableBorders: [],
  equippedBorder: null,
  isLoadingBorders: false,
  progression: null,
  isLoadingProgression: false,
  unlockHistory: [],
  upcomingUnlocks: [],
  marketplaceListings: [],
  marketplaceFeatured: [],
  marketplaceBundles: [],
  marketplaceInventory: [],
  isLoadingMarketplace: false,
  isLoadingMarketplaceInventory: false,
  marketplaceError: null,
};
// Store
export const useCosmeticsStore = create<CosmeticsState>()((set, get) => ({
  ...initialState,

  fetchCatalogue: async () => {
    set({ isLoadingCatalogue: true, error: null });
    try {
      const catalogue = (await cosmeticsApi.listCatalogue()).slice(0, MAX_COSMETICS_CATALOGUE);
      const availableThemes = [...new Set(catalogue.map((item) => item.surface))];
      const availableRarities = [...new Set(catalogue.map((item) => item.rarity))];

      set({
        catalogue,
        availableThemes,
        availableRarities,
        isLoadingCatalogue: false,
      });
    } catch (err) {
      set({
        isLoadingCatalogue: false,
        error: err instanceof Error ? err.message : 'Failed to load cosmetics catalogue',
      });
    }
  },

  fetchInventory: async () => {
    set({ isLoadingInventory: true, error: null });
    try {
      const result = await cosmeticsApi.getInventory();
      const inventory = result.inventory.slice(0, MAX_COSMETICS_INVENTORY);

      set({ inventory, isLoadingInventory: false });
    } catch (err) {
      set({
        isLoadingInventory: false,
        error: err instanceof Error ? err.message : 'Failed to load inventory',
      });
    }
  },

  equipItem: async (item: CosmeticItem) => {
    set({ isEquipping: true, error: null });
    try {
      if (item.type === 'avatar_border') {
        await cosmeticsApi.equipBorder(item.id);
      } else if (item.type === 'theme' || item.type === 'profile_theme') {
        await cosmeticsApi.activateTheme(item.id);
      } else {
        await cosmeticsApi.equip(item.type, item.id);
      }

      // Optimistic update: mark this item as equipped in the inventory
      const { inventory } = get();
      set({
        inventory: inventory.map((entry) =>
          entry.cosmetic.id === item.id
            ? { ...entry, equipped: true }
            : entry.cosmetic.type === item.type
              ? { ...entry, equipped: false }
              : entry
        ),
        isEquipping: false,
      });
    } catch (err) {
      set({
        isEquipping: false,
        error: err instanceof Error ? err.message : 'Failed to equip item',
      });
    }
  },

  unequipItem: async (item: CosmeticItem) => {
    set({ isEquipping: true, error: null });
    try {
      await cosmeticsApi.unequip(item.type, item.id);

      // Optimistic update: mark this item as unequipped
      const { inventory } = get();
      set({
        inventory: inventory.map((entry) =>
          entry.cosmetic.id === item.id ? { ...entry, equipped: false } : entry
        ),
        isEquipping: false,
      });
    } catch (err) {
      set({
        isEquipping: false,
        error: err instanceof Error ? err.message : 'Failed to unequip item',
      });
    }
  },

  fetchEntitlements: async () => {
    set({ isLoadingEntitlements: true, error: null });
    try {
      const result = await entitlementsApi.fetchEntitlements();
      set({ entitlements: result.data, isLoadingEntitlements: false });
    } catch (err) {
      set({
        isLoadingEntitlements: false,
        error: err instanceof Error ? err.message : 'Failed to load entitlements',
      });
    }
  },

  isEntitled: async (skuId: string): Promise<boolean> => {
    try {
      return await entitlementsApi.checkEntitlement(skuId);
    } catch {
      return false;
    }
  },

  purchaseEntitlement: async (skuId: string) => {
    const { entitlements: prev } = get();
    // Optimistic: create a placeholder entitlement
    const optimistic: Entitlement = {
      id: `optimistic-${Date.now()}`,
      sku: {
        id: skuId,
        slug: '',
        name: '',
        type: 'badge',
        assetHash: null,
        cosmeticId: null,
        priceNodes: 0,
        stripePriceId: null,
        isPremiumOnly: false,
        isAvailable: true,
        collection: null,
        version: 1,
      },
      type: 'purchase',
      source: 'shop_purchase',
      grantedAt: new Date().toISOString(),
      expiresAt: null,
      active: true,
    };
    set({ entitlements: [...prev, optimistic], error: null });
    try {
      const real = await entitlementsApi.purchaseEntitlement(skuId);
      // Replace optimistic with real
      set({
        entitlements: get().entitlements.map((e) => (e.id === optimistic.id ? real : e)),
      });
    } catch (err) {
      // Rollback
      set({
        entitlements: prev,
        error: err instanceof Error ? err.message : 'Failed to purchase entitlement',
      });
    }
  },

  fetchInventoryPage: async (cursor?: string) => {
    set({ isLoadingEntitlements: true, error: null });
    try {
      const result = await entitlementsApi.fetchEntitlements(cursor, 20);
      const { entitlements: existing } = get();
      const merged = cursor ? [...existing, ...result.data] : result.data;
      set({
        entitlements: merged,
        inventoryCursor: result.nextCursor,
        inventoryHasMore: result.hasMore,
        isLoadingEntitlements: false,
      });
    } catch (err) {
      set({
        isLoadingEntitlements: false,
        error: err instanceof Error ? err.message : 'Failed to load inventory page',
      });
    }
  },
  // ----- Profile Effects -----

  fetchEffects: async () => {
    set({ isLoadingEffects: true, error: null });
    try {
      const result = await apiClient.cosmetics.listProfileEffects();
      if (result.ok) {
        const effects = result.data.data.slice(0, MAX_COSMETICS_ITEMS);
        // Detect currently equipped effect (sorted first by backend, or check user endpoint)
        const { equippedEffect: current } = get();
        set({ availableEffects: effects, isLoadingEffects: false, equippedEffect: current });
      } else {
        set({ isLoadingEffects: false, error: 'Failed to load profile effects' });
      }
    } catch (err) {
      logger.warn('fetchEffects failed:', err);
      set({
        isLoadingEffects: false,
        error: err instanceof Error ? err.message : 'Failed to load profile effects',
      });
    }
  },

  equipEffect: async (effectId: string) => {
    set({ error: null });
    try {
      const result = await apiClient.cosmetics.equipProfileEffect(effectId);
      if (result.ok) {
        set({ equippedEffect: result.data.data.effect });
      }
    } catch (err) {
      logger.warn('equipEffect failed:', err);
      set({ error: err instanceof Error ? err.message : 'Failed to equip effect' });
    }
  },

  unequipEffect: async () => {
    set({ error: null });
    try {
      const result = await apiClient.cosmetics.unequipProfileEffect();
      if (result.ok) {
        set({ equippedEffect: null });
      }
    } catch (err) {
      logger.warn('unequipEffect failed:', err);
      set({ error: err instanceof Error ? err.message : 'Failed to unequip effect' });
    }
  },

  // ----- Avatar Frames -----

  fetchFrames: async () => {
    set({ isLoadingFrames: true, error: null });
    try {
      const result = await apiClient.cosmetics.listAvatarFrames();
      if (result.ok) {
        const frames = result.data.data.slice(0, MAX_COSMETICS_ITEMS);
        set({ availableFrames: frames, isLoadingFrames: false });
      } else {
        set({ isLoadingFrames: false, error: 'Failed to load avatar frames' });
      }
    } catch (err) {
      logger.warn('fetchFrames failed:', err);
      set({
        isLoadingFrames: false,
        error: err instanceof Error ? err.message : 'Failed to load avatar frames',
      });
    }
  },

  equipFrame: async (frameId: string) => {
    set({ error: null });
    try {
      const result = await apiClient.cosmetics.equipAvatarFrame(frameId);
      if (result.ok) {
        set({ equippedFrame: result.data.data.frame });
      }
    } catch (err) {
      logger.warn('equipFrame failed:', err);
      set({ error: err instanceof Error ? err.message : 'Failed to equip frame' });
    }
  },

  unequipFrame: async () => {
    set({ error: null });
    try {
      const result = await apiClient.cosmetics.unequipAvatarFrame();
      if (result.ok) {
        set({ equippedFrame: null });
      }
    } catch (err) {
      logger.warn('unequipFrame failed:', err);
      set({ error: err instanceof Error ? err.message : 'Failed to unequip frame' });
    }
  },

  // ----- Animated Borders -----

  fetchBorders: async () => {
    set({ isLoadingBorders: true, error: null });
    try {
      const result = await apiClient.cosmetics.listAnimatedBorders();
      if (result.ok) {
        const borders = result.data.data.slice(0, MAX_COSMETICS_ITEMS);
        set({ availableBorders: borders, isLoadingBorders: false });
      } else {
        set({ isLoadingBorders: false, error: 'Failed to load animated borders' });
      }
    } catch (err) {
      logger.warn('fetchBorders failed:', err);
      set({
        isLoadingBorders: false,
        error: err instanceof Error ? err.message : 'Failed to load animated borders',
      });
    }
  },

  equipBorder: async (borderId: string) => {
    set({ error: null });
    try {
      const result = await apiClient.cosmetics.equipAnimatedBorder(borderId);
      if (result.ok) {
        set({ equippedBorder: result.data.data.border });
      }
    } catch (err) {
      logger.warn('equipBorder failed:', err);
      set({ error: err instanceof Error ? err.message : 'Failed to equip border' });
    }
  },

  unequipBorder: async () => {
    set({ error: null });
    try {
      const result = await apiClient.cosmetics.unequipAnimatedBorder();
      if (result.ok) {
        set({ equippedBorder: null });
      }
    } catch (err) {
      logger.warn('unequipBorder failed:', err);
      set({ error: err instanceof Error ? err.message : 'Failed to unequip border' });
    }
  },

  // ----- User Active Cosmetics -----

  fetchUserActiveCosmetics: async (userId: string) => {
    try {
      const [effectResult, frameResult, borderResult] = await Promise.allSettled([
        apiClient.cosmetics.getUserProfileEffect(userId),
        apiClient.cosmetics.getUserAvatarFrame(userId),
        apiClient.cosmetics.getUserAnimatedBorder(userId),
      ]);

      if (effectResult.status === 'fulfilled' && effectResult.value.ok) {
        set({ equippedEffect: effectResult.value.data });
      }

      if (frameResult.status === 'fulfilled' && frameResult.value.ok) {
        set({ equippedFrame: frameResult.value.data });
      }

      if (borderResult.status === 'fulfilled' && borderResult.value.ok) {
        set({ equippedBorder: borderResult.value.data });
      }
    } catch (err) {
      logger.warn('fetchUserActiveCosmetics failed:', err);
    }
  },

  updateAccentColor: async (hex: string) => {
    set({ error: null });
    try {
      await cosmeticsApi.updateAccentColor(hex);
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update accent color',
      });
    }
  },

  // ----- Progression -----

  fetchProgression: async () => {
    set({ isLoadingProgression: true });
    try {
      const res = await http.get('/api/v1/users/me/progression');
      const data = res.data?.data;
      if (data) {
        const progression: UserProgression = {
          userId: data.user_id ?? '',
          level: data.level,
          xp: data.xp,
          xpToNextLevel: data.xp_to_next_level,
          unlockedCount: data.unlocked_count ?? 0,
          totalCount: data.total_count ?? 0,
          progressPercent: data.progress_percent,
          totalMessages: data.total_messages,
          totalPosts: data.total_posts,
          totalReactionsGiven: data.total_reactions_given,
          totalReactionsReceived: data.total_reactions_received,
          loginStreak: data.login_streak,
          longestLoginStreak: data.longest_login_streak,
          lastLoginDate: data.last_login_date,
          recentUnlocks: data.recent_unlocks ?? [],
          upcomingUnlocks: data.upcoming_unlocks ?? [],
        };
        set({ progression, isLoadingProgression: false });
      } else {
        set({ isLoadingProgression: false });
      }
    } catch (err) {
      logger.warn('fetchProgression failed:', err);
      set({ isLoadingProgression: false });
    }
  },

  fetchUnlockHistory: async () => {
    try {
      const res = await http.get('/api/v1/users/me/unlocks');
      const items = res.data?.data ?? [];
      const entries: UnlockEntry[] = items.map((e: Record<string, unknown>) => {
        const sku = isRecord(e.sku) ? e.sku : {};
        return {
          sku: {
            id: sku.id,
            slug: sku.slug,
            name: sku.name,
            type: sku.type,
            rarity: sku.rarity ?? null,
            thumbnailUrl: sku.thumbnail_url ?? null,
            animationUrl: sku.animation_url ?? null,
          },
          unlockedAt: e.unlocked_at,
          conditionType: e.condition_type,
          conditionDescription: e.condition_description ?? null,
        };
      });
      set({ unlockHistory: entries });
    } catch (err) {
      logger.warn('fetchUnlockHistory failed:', err);
    }
  },

  fetchUpcomingUnlocks: async () => {
    try {
      const res = await http.get('/api/v1/unlocks/upcoming', { params: { limit: 5 } });
      const items = res.data?.data ?? [];
      const upcoming: UpcomingUnlock[] = items.map((u: Record<string, unknown>) => {
        const sku = isRecord(u.sku) ? u.sku : {};
        return {
          sku: {
            id: sku.id,
            slug: sku.slug,
            name: sku.name,
            type: sku.type,
            rarity: sku.rarity ?? null,
            thumbnailUrl: sku.thumbnail_url ?? null,
          },
          condition: u.condition,
          progressPercent: u.progress_percent,
          remainingDescription: u.remaining_description,
        };
      });
      set({ upcomingUnlocks: upcoming });
    } catch (err) {
      logger.warn('fetchUpcomingUnlocks failed:', err);
    }
  },

  // ----- Marketplace -----

  fetchMarketplaceListings: async (filters?: MarketplaceFilters) => {
    set({ isLoadingMarketplace: true, marketplaceError: null });
    try {
      const params: Record<string, unknown> = {};
      if (filters?.category) params.category = filters.category;
      if (filters?.rarity) params.rarity = filters.rarity;
      if (filters?.minPrice !== undefined) params.min_price = filters.minPrice;
      if (filters?.maxPrice !== undefined) params.max_price = filters.maxPrice;
      if (filters?.sort) params.sort = filters.sort;
      if (filters?.cursor) params.cursor = filters.cursor;
      if (filters?.limit) params.limit = filters.limit;

      const res = await http.get('/api/v1/marketplace/listings', { params });
      const listings = (res.data?.data ?? []).slice(0, MAX_MARKETPLACE_ITEMS);
      set({ marketplaceListings: listings, isLoadingMarketplace: false });
    } catch (err) {
      logger.warn('fetchMarketplaceListings failed:', err);
      set({
        isLoadingMarketplace: false,
        marketplaceError: err instanceof Error ? err.message : 'Failed to load marketplace',
      });
    }
  },

  fetchMarketplaceFeatured: async () => {
    try {
      const res = await http.get('/api/v1/marketplace/featured');
      const featured = res.data?.data ?? [];
      set({ marketplaceFeatured: featured });
    } catch (err) {
      logger.warn('fetchMarketplaceFeatured failed:', err);
    }
  },

  fetchMarketplaceBundles: async () => {
    try {
      const res = await http.get('/api/v1/marketplace/bundles');
      const bundles = res.data?.data ?? [];
      set({ marketplaceBundles: bundles });
    } catch (err) {
      logger.warn('fetchMarketplaceBundles failed:', err);
    }
  },

  fetchMarketplaceInventory: async (category?: string) => {
    set({ isLoadingMarketplaceInventory: true });
    try {
      const params: Record<string, unknown> = {};
      if (category) params.category = category;

      const res = await http.get('/api/v1/marketplace/inventory', { params });
      const items = res.data?.data ?? [];
      set({ marketplaceInventory: items, isLoadingMarketplaceInventory: false });
    } catch (err) {
      logger.warn('fetchMarketplaceInventory failed:', err);
      set({ isLoadingMarketplaceInventory: false });
    }
  },

  purchaseMarketplaceItem: async (params: Record<string, unknown>) => {
    const res = await http.post('/api/v1/marketplace/purchase', params);
    if (res.data?.error) {
      throw new Error(res.data.error.message ?? res.data.error ?? 'Purchase failed');
    }
    // Refresh entitlements after purchase
    const { fetchEntitlements } = get();
    await fetchEntitlements();
  },

  reset: () => set(initialState),
  updateOwnProfile: (_changes: ProfileUpdatedEvent) => {
    // Group profile archived (Phase 44) — no-op for now
  },

  updateMemberCosmetics: (userId: string, changes: ProfileUpdatedEvent) => {
    const { memberCosmetics } = get();
    const existing = memberCosmetics.get(userId);
    const merged: ProfileUpdatedEvent = { ...existing, ...changes };
    const next = new Map(memberCosmetics);
    next.set(userId, merged);
    set({ memberCosmetics: next });
  },

  getMemberCosmetics: (userId: string): ProfileUpdatedEvent | undefined => {
    return get().memberCosmetics.get(userId);
  },
}));
