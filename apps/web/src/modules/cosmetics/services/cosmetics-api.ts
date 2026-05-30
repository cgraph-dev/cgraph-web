/**
 * Cosmetics API service.
 *
 * Connects the frontend to the backend CosmeticsController endpoints.
 * Backend serializers already return camelCase, so minimal transformation needed.
 *
 */

import { http } from '@/lib/api-client';
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
  name: string;
  description: string;
  preset: string;
  rarity: RarityTier;
  colors: Record<string, unknown>;
  backgroundType: string;
  backgroundConfig: Record<string, unknown>;
  layoutType: string;
  hoverEffect: string;
  glassmorphism: boolean;
  borderRadius: string;
  fontFamily: string;
  isPurchasable: boolean;
  nodeCost: number;
  gemCost: number;
  previewUrl: string | null;
  animationType?: string;
  backgroundLottieUrl?: string;
  particleLottieUrl?: string;
  overlayLottieUrl?: string;
  lottieConfig?: Record<string, unknown>;
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
  itemType: CosmeticType;
  itemId: string;
  equippedAt: string | null;
  obtainedAt: string;
  obtainedVia: string;
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
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    description: t.description,
    surface: 'profile_theme',
    type: 'profile_theme',
    rarity: t.rarity,
    unlockType: t.isPurchasable ? 'purchase' : 'free',
    unlockCondition: { type: t.isPurchasable ? 'purchase' : 'free', threshold: t.nodeCost },
    animationType: validateAnimationType(t.animationType),
    lottieFile: t.backgroundLottieUrl ?? null,
    previewUrl: t.previewUrl,
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
    acquiredAt: '',
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
    acquiredAt: '',
    source: validateUnlockType(ut.unlockSource),
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
];

function validateAnimationType(value: string | undefined | null): AnimationType {
  const v = value ?? 'none';
  const match = VALID_ANIMATION_TYPES.find((t) => t === v);
  return match ?? 'none';
}

function validateUnlockType(value: string | undefined | null): UnlockType {
  const v = value ?? 'free';
  const match = VALID_UNLOCK_TYPES.find((t) => t === v);
  return match ?? 'free';
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
    // Unified inventory endpoint scoped to avatar_border type.
    const { data } = await http.get('/api/v1/cosmetics/inventory', {
      params: { type: 'avatar_border' },
    });
    return {
      inventory: (data.items ?? data.unlocked ?? []).map(userBorderToInventory),
      equippedId: data.equipped_id ?? null,
    };
  },

  async equipBorder(borderId: string): Promise<UserCosmeticInventory> {
    const response = await http.post('/api/v1/cosmetics/borders/equip', { id: borderId });
    return userBorderToInventory(response.data.equipped ?? response.data);
  },

  async purchaseBorder(borderId: string): Promise<UserCosmeticInventory> {
    // Purchases route through the unified marketplace endpoint.
    const response = await http.post('/api/v1/marketplace/purchase', {
      listing_id: borderId,
      type: 'avatar_border',
    });
    return userBorderToInventory(response.data.unlocked ?? response.data);
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
    return theme ? userThemeToInventory(theme) : null;
  },

  async activateTheme(themeId: string): Promise<UserCosmeticInventory> {
    // Equip via the unified cosmetics/equip endpoint with type metadata.
    const response = await http.put('/api/v1/cosmetics/equip', {
      item_type: 'profile_theme',
      item_id: themeId,
    });
    return userThemeToInventory(response.data.equipped ?? response.data);
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
    return response.data.unequipped;
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
