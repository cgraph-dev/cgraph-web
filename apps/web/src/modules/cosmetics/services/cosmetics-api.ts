/**
 * Cosmetics API service.
 *
 * Connects the frontend to the backend CosmeticsController endpoints.
 * Backend serializers already return camelCase, so minimal transformation needed.
 *
 */

import { http } from '@/lib/api-client';
import { RARITY_TIERS } from '@cgraph-dev/shared-types';
import type {
  CosmeticItem,
  CosmeticType,
  EquippedCosmetics,
  UserCosmeticInventory,
  RarityTier,
  AnimationType,
  UnlockType,
} from '@cgraph-dev/shared-types';
// API response types (match backend serializer output)
interface ApiBorder {
  id: string;
  slug: string;
  name: string;
  description: string;
  theme: string;
  rarity: RarityTier;
  borderStyle: string;
  animationType: string;
  animationSpeed: number;
  animationIntensity: number;
  colors: string[];
  particleConfig: Record<string, unknown> | null;
  glowConfig: Record<string, unknown> | null;
  isPurchasable: boolean;
  nodeCost: number;
  gemCost: number;
  previewUrl: string | null;
  lottieUrl?: string;
  lottieAssetId?: string;
  lottieConfig?: Record<string, unknown>;
}

interface ApiUserBorder {
  id: string;
  borderId: string;
  isEquipped: boolean;
  unlockSource: string;
  expiresAt: string | null;
  customColors: string[] | null;
  border: ApiBorder | null;
}

interface ApiProfileTheme {
  id: string;
  slug: string;
  name: string | null;
  description: string | null;
  preset?: string;
  rarity: RarityTier | null;
  colors?: Record<string, unknown>;
  backgroundType?: string;
  backgroundConfig?: Record<string, unknown>;
  layoutType?: string;
  hoverEffect?: string;
  glassmorphism?: boolean;
  borderRadius?: string;
  fontFamily?: string;
  isPurchasable?: boolean;
  is_purchasable?: boolean;
  nodeCost?: number;
  coinCost?: number;
  coin_cost?: number;
  gemCost?: number;
  gem_cost?: number;
  previewUrl: string | null;
  preview_url?: string | null;
  animationType?: string;
  animation_type?: string;
  lottieUrl?: string | null;
  lottie_url?: string | null;
  lottieConfig?: Record<string, unknown>;
  lottie_config?: Record<string, unknown>;
  backgroundLottieUrl?: string;
  background_lottie_url?: string;
  particleLottieUrl?: string;
  particle_lottie_url?: string;
  overlayLottieUrl?: string;
  overlay_lottie_url?: string;
}

interface ApiUserProfileTheme {
  id: string;
  themeId: string;
  isActive: boolean;
  unlockSource: string;
  expiresAt: string | null;
  customColors: Record<string, unknown> | null;
  customBackground: Record<string, unknown> | null;
  customLayout: Record<string, unknown> | null;
  customEffects: Record<string, unknown> | null;
  theme: ApiProfileTheme | null;
}

interface ApiInventoryItem {
  id: string;
  itemType?: CosmeticType;
  item_type?: CosmeticType;
  itemId?: string;
  item_id?: string;
  itemSlug?: string | null;
  item_slug?: string | null;
  itemKey?: string;
  item_key?: string;
  equippedAt?: string | null;
  equipped_at?: string | null;
  obtainedAt?: string;
  obtained_at?: string;
  obtainedVia?: string;
  obtained_via?: string;
}

type BorderInventoryEntry = ApiUserBorder | ApiInventoryItem;
type ThemeInventoryEntry = ApiUserProfileTheme | ApiInventoryItem | ApiProfileTheme;

const DEFAULT_ACQUIRED_AT = '';

function firstDefined<T>(...values: readonly (T | null | undefined)[]): T | undefined {
  return values.find((value): value is T => value !== undefined && value !== null);
}

function titleFromKey(value: string | null | undefined, fallback: string): string {
  const key = value?.trim();
  if (!key) {
    return fallback;
  }

  return key
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

// Transformers — convert API responses to shared types
function borderToCosmeticItem(b: ApiBorder): CosmeticItem {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    description: b.description,
    surface: 'avatar_border',
    type: 'avatar_border',
    rarity: b.rarity,
    unlockType: b.isPurchasable ? 'purchase' : 'free',
    unlockCondition: { type: b.isPurchasable ? 'purchase' : 'free', threshold: b.nodeCost },
    animationType: validateAnimationType(b.animationType),
    lottieFile: b.lottieUrl ?? null,
    previewUrl: b.previewUrl,
    colors: b.colors ?? [],
    available: true,
    createdAt: '',
  };
}

function themeToCosmeticItem(t: ApiProfileTheme): CosmeticItem {
  const nodeCost = firstDefined(t.nodeCost, t.coinCost, t.coin_cost) ?? 0;
  const isPurchasable = firstDefined(t.isPurchasable, t.is_purchasable) ?? false;
  const lottieFile =
    firstDefined(t.backgroundLottieUrl, t.background_lottie_url, t.lottieUrl, t.lottie_url) ?? null;

  return {
    id: t.id,
    slug: t.slug ?? t.id,
    name: t.name ?? titleFromKey(t.slug, 'Unknown Theme'),
    description: t.description ?? '',
    surface: 'profile_theme',
    type: 'profile_theme',
    rarity: validateRarityTier(t.rarity),
    unlockType: isPurchasable ? 'purchase' : 'free',
    unlockCondition: { type: isPurchasable ? 'purchase' : 'free', threshold: nodeCost },
    animationType: validateAnimationType(t.animationType),
    lottieFile,
    previewUrl: firstDefined(t.previewUrl, t.preview_url) ?? null,
    colors: [],
    available: true,
    createdAt: '',
  };
}

function userBorderToInventory(ub: ApiUserBorder): UserCosmeticInventory {
  const cosmetic = ub.border
    ? borderToCosmeticItem(ub.border)
    : {
        id: ub.borderId,
        slug: '',
        name: 'Unknown Border',
        description: '',
        surface: 'avatar_border' as const,
        type: 'avatar_border' as const,
        rarity: 'common' as const,
        unlockType: 'free' as const,
        unlockCondition: { type: 'free' as const, threshold: null },
        animationType: 'none' as const,
        lottieFile: null,
        previewUrl: null,
        colors: [],
        available: true,
        createdAt: '',
      };

  return {
    cosmetic,
    equipped: ub.isEquipped,
    acquiredAt: DEFAULT_ACQUIRED_AT,
    source: validateUnlockType(ub.unlockSource),
  };
}

function userThemeToInventory(ut: ApiUserProfileTheme): UserCosmeticInventory {
  const cosmetic = ut.theme
    ? themeToCosmeticItem(ut.theme)
    : {
        id: ut.themeId,
        slug: '',
        name: 'Unknown Theme',
        description: '',
        surface: 'profile_theme' as const,
        type: 'profile_theme' as const,
        rarity: 'common' as const,
        unlockType: 'free' as const,
        unlockCondition: { type: 'free' as const, threshold: null },
        animationType: 'none' as const,
        lottieFile: null,
        previewUrl: null,
        colors: [],
        available: true,
        createdAt: '',
      };

  return {
    cosmetic,
    equipped: ut.isActive,
    acquiredAt: DEFAULT_ACQUIRED_AT,
    source: validateUnlockType(ut.unlockSource),
  };
}

function inventoryItemType(item: ApiInventoryItem): CosmeticType {
  return firstDefined(item.itemType, item.item_type) ?? 'avatar_border';
}

function inventoryItemId(item: ApiInventoryItem): string {
  return firstDefined(item.itemId, item.item_id) ?? item.id;
}

function inventoryItemSlug(item: ApiInventoryItem): string {
  return firstDefined(item.itemSlug, item.item_slug, item.itemKey, item.item_key) ?? '';
}

function inventoryItemEquippedAt(item: ApiInventoryItem): string | null {
  return firstDefined(item.equippedAt, item.equipped_at) ?? null;
}

function inventoryItemObtainedAt(item: ApiInventoryItem): string {
  return firstDefined(item.obtainedAt, item.obtained_at) ?? DEFAULT_ACQUIRED_AT;
}

function inventoryItemObtainedVia(item: ApiInventoryItem): string | undefined {
  return firstDefined(item.obtainedVia, item.obtained_via);
}

function isUnifiedInventoryItem(entry: BorderInventoryEntry | ThemeInventoryEntry): entry is ApiInventoryItem {
  return (
    'itemType' in entry ||
    'item_type' in entry ||
    'itemId' in entry ||
    'item_id' in entry ||
    'obtainedVia' in entry ||
    'obtained_via' in entry
  );
}

function isLegacyUserProfileTheme(entry: ThemeInventoryEntry): entry is ApiUserProfileTheme {
  return 'themeId' in entry && 'isActive' in entry && 'unlockSource' in entry;
}

function unlockConditionTypeForSource(
  source: UnlockType
): CosmeticItem['unlockCondition']['type'] {
  switch (source) {
    case 'purchase':
      return 'purchase';
    case 'gift':
      return 'gift_received';
    case 'admin':
      return 'admin_grant';
    case 'subscription':
      return 'subscription_tier';
    case 'achievement':
    case 'level':
    case 'event':
      return 'achievement_earned';
    case 'free':
    default:
      return 'free';
  }
}

function summaryToCosmeticItem(
  item: ApiProfileTheme,
  type: Extract<CosmeticType, 'avatar_border' | 'profile_theme'>
): CosmeticItem {
  const id = item.id;
  const slug = item.slug ?? id;
  const nodeCost = firstDefined(item.nodeCost, item.coinCost, item.coin_cost) ?? null;
  const isPurchasable = firstDefined(item.isPurchasable, item.is_purchasable) ?? false;
  const lottieFile =
    firstDefined(
      item.backgroundLottieUrl,
      item.background_lottie_url,
      item.lottieUrl,
      item.lottie_url
    ) ?? null;

  return {
    id,
    slug,
    name:
      item.name ??
      titleFromKey(slug, type === 'profile_theme' ? 'Unknown Theme' : 'Unknown Border'),
    description: item.description ?? '',
    surface: type,
    type,
    rarity: validateRarityTier(item.rarity),
    unlockType: isPurchasable ? 'purchase' : 'free',
    unlockCondition: { type: isPurchasable ? 'purchase' : 'free', threshold: nodeCost },
    animationType: validateAnimationType(firstDefined(item.animationType, item.animation_type)),
    lottieFile,
    previewUrl: firstDefined(item.previewUrl, item.preview_url) ?? null,
    colors: [],
    available: true,
    createdAt: '',
  };
}

function inventoryItemToCosmeticInventory(
  item: ApiInventoryItem,
  fallbackType: Extract<CosmeticType, 'avatar_border' | 'profile_theme'>
): UserCosmeticInventory {
  const rawType = inventoryItemType(item);
  const type: Extract<CosmeticType, 'avatar_border' | 'profile_theme'> =
    rawType === 'profile_theme' || rawType === 'theme' ? 'profile_theme' : fallbackType;
  const itemId = inventoryItemId(item);
  const slug = inventoryItemSlug(item);
  const fallbackName = type === 'profile_theme' ? 'Unknown Theme' : 'Unknown Border';
  const source = validateUnlockType(inventoryItemObtainedVia(item));

  return {
    cosmetic: {
      id: itemId,
      slug,
      name: titleFromKey(slug || itemId, fallbackName),
      description: '',
      surface: type,
      type,
      rarity: 'common',
      unlockType: source,
      unlockCondition: {
        type: unlockConditionTypeForSource(source),
        threshold: null,
      },
      animationType: 'none',
      lottieFile: null,
      previewUrl: null,
      colors: [],
      available: true,
      createdAt: '',
    },
    equipped: Boolean(inventoryItemEquippedAt(item)),
    acquiredAt: inventoryItemObtainedAt(item),
    source,
  };
}

function borderEntryToInventory(entry: BorderInventoryEntry): UserCosmeticInventory {
  return isUnifiedInventoryItem(entry)
    ? inventoryItemToCosmeticInventory(entry, 'avatar_border')
    : userBorderToInventory(entry);
}

function themeEntryToInventory(entry: ThemeInventoryEntry): UserCosmeticInventory {
  if (isUnifiedInventoryItem(entry)) {
    return {
      ...inventoryItemToCosmeticInventory(entry, 'profile_theme'),
      equipped: true,
    };
  }

  if (isLegacyUserProfileTheme(entry)) {
    return userThemeToInventory(entry);
  }

  return {
    cosmetic: summaryToCosmeticItem(entry, 'profile_theme'),
    equipped: true,
    acquiredAt: DEFAULT_ACQUIRED_AT,
    source: 'free',
  };
}

// Type validators
const VALID_ANIMATION_TYPES: readonly AnimationType[] = [
  'none',
  'static',
  'lottie',
  'css',
  'sprite',
  'video',
];
const VALID_UNLOCK_TYPES: readonly UnlockType[] = [
  'free',
  'purchase',
  'achievement',
  'subscription',
  'gift',
  'admin',
  'level',
  'event',
];

const UNLOCK_SOURCE_ALIASES: Record<string, UnlockType> = {
  default: 'free',
  unlock: 'achievement',
  reward: 'achievement',
};

function validateAnimationType(value: string | undefined | null): AnimationType {
  const v = value ?? 'none';
  const match = VALID_ANIMATION_TYPES.find((t) => t === v);
  return match ?? 'none';
}

function validateUnlockType(value: string | undefined | null): UnlockType {
  const v = value ? (UNLOCK_SOURCE_ALIASES[value] ?? value) : 'free';
  const match = VALID_UNLOCK_TYPES.find((t) => t === v);
  return match ?? 'free';
}

function validateRarityTier(value: RarityTier | string | undefined | null): RarityTier {
  const v = value ?? 'common';
  const match = RARITY_TIERS.find((t) => t === v);
  return match ?? 'common';
}

// API service
export const cosmeticsApi = {
  async listBorders(params?: {
    theme?: string;
    rarity?: RarityTier;
    animation_type?: string;
  }): Promise<{
    borders: CosmeticItem[];
    themes: string[];
    rarities: string[];
  }> {
    // Backend route is /cosmetics/borders (Animated Borders scope) —
    // see apps/backend/lib/cgraph_web/router/cosmetics_routes.ex.
    const { data } = await http.get('/api/v1/cosmetics/borders', { params });
    return {
      borders: (data.borders ?? data.data ?? []).map(borderToCosmeticItem),
      themes: data.themes ?? [],
      rarities: data.rarities ?? [],
    };
  },

  async getUnlockedBorders(): Promise<{
    inventory: UserCosmeticInventory[];
    equippedId: string | null;
  }> {
    // Public API callers use the semantic avatar-border type; the backend
    // normalizes it to the legacy storage type during the migration.
    const { data } = await http.get('/api/v1/cosmetics/inventory', {
      params: { item_type: 'avatar_border' },
    });
    const entries: BorderInventoryEntry[] = data.items ?? data.unlocked ?? [];
    const inventory = entries.map(borderEntryToInventory);
    return {
      inventory,
      equippedId: data.equipped_id ?? inventory.find((item) => item.equipped)?.cosmetic.id ?? null,
    };
  },

  async equipBorder(borderId: string): Promise<UserCosmeticInventory> {
    const response = await http.post('/api/v1/cosmetics/borders/equip', { id: borderId });
    return borderEntryToInventory(response.data.equipped ?? response.data);
  },

  async purchaseBorder(borderId: string): Promise<UserCosmeticInventory> {
    // Purchases route through the unified marketplace endpoint.
    const response = await http.post('/api/v1/marketplace/purchase', {
      listing_id: borderId,
      type: 'avatar_border',
    });
    return borderEntryToInventory(response.data.unlocked ?? response.data.item ?? response.data);
  },
  async listProfileThemes(params?: { preset?: string; rarity?: RarityTier }): Promise<{
    themes: CosmeticItem[];
    presets: string[];
    rarities: string[];
  }> {
    // Profile themes catalogue route doesn't exist — fall back to the
    // marketplace listings filtered by type. This keeps the shop page
    // functional while the dedicated catalogue endpoint is missing.
    try {
      const { data } = await http.get('/api/v1/marketplace/listings', {
        params: { ...params, type: 'theme' },
      });
      return {
        themes: (data.listings ?? data.themes ?? data.data ?? []).map(themeToCosmeticItem),
        presets: data.presets ?? [],
        rarities: data.rarities ?? [],
      };
    } catch {
      // Empty fallback so the shop page renders the rest of the catalogue
      // even if the marketplace endpoint is unavailable in this env.
      return { themes: [], presets: [], rarities: [] };
    }
  },

  async getActiveTheme(): Promise<UserCosmeticInventory | null> {
    // Active profile-theme is part of the equipped cosmetics bundle.
    const { data } = await http.get('/api/v1/cosmetics/equipped');
    const theme = data.profile_theme ?? data.theme ?? null;
    return theme ? themeEntryToInventory(theme) : null;
  },

  async activateTheme(themeId: string): Promise<UserCosmeticInventory> {
    // Equip via the unified cosmetics/equip endpoint with type metadata.
    const response = await http.put('/api/v1/cosmetics/equip', {
      item_type: 'profile_theme',
      item_id: themeId,
    });
    return themeEntryToInventory(response.data.equipped ?? response.data);
  },
  async getEquipped(): Promise<EquippedCosmetics> {
    const { data } = await http.get('/api/v1/cosmetics/equipped');
    return {
      avatar_border: data.avatar_border ?? null,
      nameplate: data.nameplate ?? null,
      title: data.title ?? null,
      badges: data.badges ?? [],
      profile_theme: data.profile_theme ?? null,
      name_style: data.name_style ?? null,
      profile_effect: data.profile_effect ?? null,
      avatar_frame: data.avatar_frame ?? null,
    };
  },

  async getInventory(itemType?: CosmeticType): Promise<{
    items: ApiInventoryItem[];
    total: number;
  }> {
    const { data } = await http.get('/api/v1/cosmetics/inventory', {
      params: itemType ? { item_type: itemType } : undefined,
    });
    return {
      items: data.items ?? [],
      total: data.total ?? 0,
    };
  },

  async equip(itemType: CosmeticType, itemId: string): Promise<ApiInventoryItem> {
    const response = await http.put('/api/v1/cosmetics/equip', {
      item_type: itemType,
      item_id: itemId,
    });
    return response.data.equipped;
  },

  async unequip(itemType: CosmeticType, itemId: string): Promise<ApiInventoryItem> {
    const response = await http.delete('/api/v1/cosmetics/unequip', {
      data: { item_type: itemType, item_id: itemId },
    });
    return response.data.item ?? response.data.unequipped;
  },
  async uploadBanner(file: File): Promise<{ bannerHash: string }> {
    const formData = new FormData();
    formData.append('banner', file);

    const response = await http.put<{ bannerHash: string }>('/api/v1/me/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { bannerHash: response.data.bannerHash };
  },

  async removeBanner(): Promise<void> {
    await http.delete('/api/v1/me/banner');
  },

  async updateAccentColor(hex: string): Promise<{ accentColor: string }> {
    const response = await http.put<{ accentColor: string }>('/api/v1/me/accent-color', {
      accent_color: hex,
    });
    return { accentColor: response.data.accentColor };
  },
};
