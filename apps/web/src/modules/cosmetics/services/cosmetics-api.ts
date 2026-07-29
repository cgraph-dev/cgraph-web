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
  slug?: string | null;
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
  previewUrl?: string | null;
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
  itemType?: string;
  item_type?: string;
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

interface ApiCatalogueItem {
  id: string;
  slug?: string | null;
  name?: string | null;
  description?: string | null;
  type?: string;
  itemType?: string;
  rarity?: RarityTier | null;
  unlockType?: string;
  nodesCost?: number;
  nodeCost?: number;
  previewUrl?: string | null;
  iconUrl?: string | null;
  backgroundUrl?: string | null;
  animationType?: string;
  lottieUrl?: string | null;
  available?: boolean;
}

type BorderInventoryEntry = ApiUserBorder | ApiInventoryItem;
type ThemeInventoryEntry = ApiUserProfileTheme | ApiInventoryItem | ApiProfileTheme;

const DEFAULT_ACQUIRED_AT = '';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(isString) : [];
}

function recordList(value: unknown): unknown[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function unwrapData<T>(body: T | { data: T }): T {
  if (isRecord(body) && 'data' in body) {
    return body['data'];
  }
  return body;
}

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

function normalizeCatalogueType(value: string | undefined): CosmeticType | null {
  switch (value) {
    case 'avatar_border':
    case 'border':
    case 'animated_border':
      return 'avatar_border';
    case 'profile_effect':
      return 'profile_effect';
    case 'avatar_frame':
    case 'profile_frame':
      return 'avatar_frame';
    case 'badge':
      return 'badge';
    case 'nameplate':
      return 'nameplate';
    case 'title':
      return 'title';
    case 'profile_theme':
    case 'theme':
      return 'profile_theme';
    default:
      return null;
  }
}

function surfaceForType(type: CosmeticType): CosmeticItem['surface'] {
  switch (type) {
    case 'badge':
      return 'badge';
    case 'nameplate':
      return 'nameplate';
    case 'title':
      return 'title';
    case 'profile_theme':
    case 'theme':
    case 'profile_effect':
      return 'profile_theme';
    default:
      return 'avatar_border';
  }
}

function catalogueItemToCosmeticItem(raw: ApiCatalogueItem): CosmeticItem | null {
  const type = normalizeCatalogueType(raw.itemType ?? raw.type);
  if (!type) return null;

  const slug = raw.slug ?? raw.id;
  const source = validateUnlockType(raw.unlockType);
  const threshold = raw.nodesCost ?? raw.nodeCost ?? null;

  return {
    id: raw.id,
    slug,
    name: raw.name ?? titleFromKey(slug, 'Untitled cosmetic'),
    description: raw.description ?? '',
    surface: surfaceForType(type),
    type,
    rarity: validateRarityTier(raw.rarity),
    unlockType: source,
    unlockCondition: {
      type: unlockConditionTypeForSource(source),
      threshold,
    },
    animationType: validateAnimationType(raw.animationType),
    lottieFile: raw.lottieUrl ?? null,
    previewUrl: raw.previewUrl ?? raw.iconUrl ?? raw.backgroundUrl ?? null,
    colors: [],
    available: raw.available ?? true,
    createdAt: '',
  };
}

function catalogueItems(payload: unknown, key?: string): ApiCatalogueItem[] {
  const data = unwrapData<unknown>(payload);
  if (Array.isArray(data)) return data.filter(isCatalogueItem);
  if (!isRecord(data)) return [];
  const value = key ? data[key] : data['listings'];
  return recordList(value).filter(isCatalogueItem);
}

function isCatalogueItem(value: unknown): value is ApiCatalogueItem {
  return isRecord(value) && isString(value['id']);
}

function isBorder(value: unknown): value is ApiBorder {
  if (!isRecord(value)) return false;
  return (
    isString(value['id']) &&
    isString(value['slug']) &&
    isString(value['name']) &&
    isString(value['description']) &&
    isString(value['theme']) &&
    isString(value['rarity']) &&
    isString(value['borderStyle']) &&
    isString(value['animationType']) &&
    typeof value['animationSpeed'] === 'number' &&
    typeof value['animationIntensity'] === 'number' &&
    Array.isArray(value['colors']) &&
    typeof value['isPurchasable'] === 'boolean' &&
    typeof value['nodeCost'] === 'number' &&
    typeof value['gemCost'] === 'number' &&
    (value['previewUrl'] === null || isString(value['previewUrl']))
  );
}

function isInventoryItem(value: unknown): value is ApiInventoryItem {
  return isRecord(value) && isString(value['id']);
}

function isUserBorder(value: unknown): value is ApiUserBorder {
  if (!isRecord(value)) return false;
  return (
    isString(value['id']) &&
    isString(value['borderId']) &&
    typeof value['isEquipped'] === 'boolean' &&
    isString(value['unlockSource'])
  );
}

function isUserProfileTheme(value: unknown): value is ApiUserProfileTheme {
  if (!isRecord(value)) return false;
  return (
    isString(value['id']) &&
    isString(value['themeId']) &&
    typeof value['isActive'] === 'boolean' &&
    isString(value['unlockSource'])
  );
}

function isProfileTheme(value: unknown): value is ApiProfileTheme {
  return isRecord(value) && isString(value['id']);
}

function parseBorderEntry(value: unknown): BorderInventoryEntry {
  if (isRecord(value) && (isUserBorder(value) || isInventoryItem(value))) {
    return value;
  }
  throw new Error('Cosmetics API returned an invalid border inventory item');
}

function parseThemeEntry(value: unknown): ThemeInventoryEntry {
  if (
    isRecord(value) &&
    (isUserProfileTheme(value) || isInventoryItem(value) || isProfileTheme(value))
  ) {
    return value;
  }
  throw new Error('Cosmetics API returned an invalid profile theme item');
}

function parseInventoryItem(value: unknown): ApiInventoryItem {
  if (isRecord(value) && isInventoryItem(value)) return value;
  throw new Error('Cosmetics API returned an invalid inventory item');
}

type CatalogItemSummary = NonNullable<EquippedCosmetics['avatar_border']>;

function isCatalogItemSummary(value: CatalogItemSummary | null): value is CatalogItemSummary {
  return value !== null;
}

function catalogItemSummary(value: unknown): CatalogItemSummary | null {
  if (!isRecord(value) || !isString(value['id'])) return null;
  return {
    id: value['id'],
    name: isString(value['name']) ? value['name'] : 'Untitled cosmetic',
    slug: isString(value['slug']) ? value['slug'] : value['id'],
    rarity: validateRarityTier(isString(value['rarity']) ? value['rarity'] : null),
    description: isString(value['description']) ? value['description'] : null,
    animationType: validateAnimationType(
      isString(value['animationType']) ? value['animationType'] : null
    ),
    lottieUrl: isString(value['lottieUrl']) ? value['lottieUrl'] : null,
    lottieConfig: isRecord(value['lottieConfig']) ? value['lottieConfig'] : {},
    ...(isString(value['iconUrl']) ? { iconUrl: value['iconUrl'] } : {}),
    ...(isString(value['backgroundLottieUrl'])
      ? { backgroundLottieUrl: value['backgroundLottieUrl'] }
      : {}),
    ...(isString(value['particleLottieUrl'])
      ? { particleLottieUrl: value['particleLottieUrl'] }
      : {}),
    ...(isString(value['overlayLottieUrl'])
      ? { overlayLottieUrl: value['overlayLottieUrl'] }
      : {}),
  };
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
  const cosmetic: CosmeticItem = ub.border
    ? borderToCosmeticItem(ub.border)
    : {
        id: ub.borderId,
        slug: '',
        name: 'Unknown Border',
        description: '',
        surface: 'avatar_border',
        type: 'avatar_border',
        rarity: 'common',
        unlockType: 'free',
        unlockCondition: { type: 'free', threshold: null },
        animationType: 'none',
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
  const cosmetic: CosmeticItem = ut.theme
    ? themeToCosmeticItem(ut.theme)
    : {
        id: ut.themeId,
        slug: '',
        name: 'Unknown Theme',
        description: '',
        surface: 'profile_theme',
        type: 'profile_theme',
        rarity: 'common',
        unlockType: 'free',
        unlockCondition: { type: 'free', threshold: null },
        animationType: 'none',
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

function inventoryItemType(item: ApiInventoryItem): string {
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
  fallbackType: CosmeticType
): UserCosmeticInventory {
  const rawType = inventoryItemType(item);
  const type = normalizeCatalogueType(rawType) ?? fallbackType;
  const itemId = inventoryItemId(item);
  const slug = inventoryItemSlug(item);
  const fallbackName = `Unknown ${titleFromKey(type, 'Cosmetic')}`;
  const source = validateUnlockType(inventoryItemObtainedVia(item));

  return {
    cosmetic: {
      id: itemId,
      slug,
      name: titleFromKey(slug || itemId, fallbackName),
      description: '',
      surface: surfaceForType(type),
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
    const response = await http.get('/api/v1/cosmetics/borders', { params });
    const data = unwrapData<Record<string, unknown>>(response.data);
    const borderData = data['borders'] ?? data['data'] ?? [];
    return {
      borders: recordList(borderData).filter(isBorder).map(borderToCosmeticItem),
      themes: stringList(data['themes']),
      rarities: stringList(data['rarities']),
    };
  },

  async listCatalogue(): Promise<CosmeticItem[]> {
    const [marketplaceResponse, badgesResponse, nameplatesResponse] = await Promise.all([
      http.get('/api/v1/marketplace/listings'),
      http.get('/api/v1/badges'),
      http.get('/api/v1/nameplates'),
    ]);

    const rawItems = [
      ...catalogueItems(marketplaceResponse.data),
      ...catalogueItems(badgesResponse.data, 'badges').map((item) => ({
        ...item,
        type: 'badge',
        previewUrl: item.iconUrl,
      })),
      ...catalogueItems(nameplatesResponse.data, 'nameplates').map((item) => ({
        ...item,
        type: 'nameplate',
        previewUrl: item.backgroundUrl,
      })),
    ];

    const deduplicated = new Map<string, CosmeticItem>();
    for (const rawItem of rawItems) {
      const item = catalogueItemToCosmeticItem(rawItem);
      if (item) deduplicated.set(`${item.type}:${item.id}`, item);
    }
    return [...deduplicated.values()];
  },

  async getUnlockedBorders(): Promise<{
    inventory: UserCosmeticInventory[];
    equippedId: string | null;
  }> {
    // Public API callers use the semantic avatar-border type; the backend
    // normalizes it to the legacy storage type during the migration.
    const response = await http.get('/api/v1/cosmetics/inventory', {
      params: { item_type: 'avatar_border' },
    });
    const data = unwrapData<Record<string, unknown>>(response.data);
    const entries = recordList(data['items'] ?? data['unlocked']).filter(
      (entry): entry is BorderInventoryEntry => isUserBorder(entry) || isInventoryItem(entry)
    );
    const inventory = entries.map(borderEntryToInventory);
    return {
      inventory,
      equippedId:
        (isString(data['equippedId']) ? data['equippedId'] : undefined) ??
        (isString(data['equipped_id']) ? data['equipped_id'] : undefined) ??
        inventory.find((item) => item.equipped)?.cosmetic.id ??
        null,
    };
  },

  async equipBorder(borderId: string): Promise<UserCosmeticInventory> {
    const response = await http.post('/api/v1/cosmetics/borders/equip', { id: borderId });
    const data = unwrapData<Record<string, unknown>>(response.data);
    return borderEntryToInventory(parseBorderEntry(data['equipped'] ?? data));
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
      const response = await http.get('/api/v1/marketplace/listings', {
        params: { ...params, type: 'theme' },
      });
      const data = unwrapData<Record<string, unknown>>(response.data);
      return {
        themes: recordList(data['listings'] ?? data['themes'] ?? data['data'])
          .filter(isProfileTheme)
          .map(themeToCosmeticItem),
        presets: stringList(data['presets']),
        rarities: stringList(data['rarities']),
      };
    } catch {
      // Empty fallback so the shop page renders the rest of the catalogue
      // even if the marketplace endpoint is unavailable in this env.
      return { themes: [], presets: [], rarities: [] };
    }
  },

  async getActiveTheme(): Promise<UserCosmeticInventory | null> {
    // Active profile-theme is part of the equipped cosmetics bundle.
    const response = await http.get('/api/v1/cosmetics/equipped');
    const data = unwrapData<Record<string, unknown>>(response.data);
    const theme = data['profile_theme'] ?? data['theme'] ?? null;
    return theme ? themeEntryToInventory(parseThemeEntry(theme)) : null;
  },

  async activateTheme(themeId: string): Promise<UserCosmeticInventory> {
    // Equip via the unified cosmetics/equip endpoint with type metadata.
    const response = await http.put('/api/v1/cosmetics/equip', {
      item_type: 'profile_theme',
      item_id: themeId,
    });
    const data = unwrapData<Record<string, unknown>>(response.data);
    return themeEntryToInventory(parseThemeEntry(data['equipped'] ?? data));
  },
  async getEquipped(): Promise<EquippedCosmetics> {
    const response = await http.get('/api/v1/cosmetics/equipped');
    const data = unwrapData<Record<string, unknown>>(response.data);
    return {
      avatar_border: catalogItemSummary(data['avatar_border']),
      nameplate: catalogItemSummary(data['nameplate']),
      title: catalogItemSummary(data['title']),
      badges: recordList(data['badges']).map(catalogItemSummary).filter(isCatalogItemSummary),
      profile_theme: catalogItemSummary(data['profile_theme']),
      name_style: catalogItemSummary(data['name_style']),
      profile_effect: catalogItemSummary(data['profile_effect']),
      avatar_frame: catalogItemSummary(data['avatar_frame']),
    };
  },

  async getInventory(itemType?: CosmeticType): Promise<{
    inventory: UserCosmeticInventory[];
    total: number;
  }> {
    const response = await http.get('/api/v1/cosmetics/inventory', {
      params: itemType ? { item_type: itemType } : undefined,
    });
    const data = unwrapData<Record<string, unknown>>(response.data);
    const items = recordList(data['items']).filter(isInventoryItem);
    return {
      inventory: items.map((item) =>
        inventoryItemToCosmeticInventory(
          item,
          normalizeCatalogueType(inventoryItemType(item)) ?? 'avatar_border'
        )
      ),
      total: Number(data['total'] ?? items.length),
    };
  },

  async equip(itemType: CosmeticType, itemId: string): Promise<ApiInventoryItem> {
    const response = await http.put('/api/v1/cosmetics/equip', {
      item_type: itemType,
      item_id: itemId,
    });
    const data = unwrapData<Record<string, unknown>>(response.data);
    return parseInventoryItem(data['equipped']);
  },

  async unequip(itemType: CosmeticType, itemId: string): Promise<ApiInventoryItem> {
    const response = await http.delete('/api/v1/cosmetics/unequip', {
      data: { item_type: itemType, item_id: itemId },
    });
    const data = unwrapData<Record<string, unknown>>(response.data);
    return parseInventoryItem(data['item'] ?? data['unequipped']);
  },
  async updateAccentColor(hex: string): Promise<{ accentColor: string }> {
    const response = await http.put<{ accentColor: string }>('/api/v1/me/accent-color', {
      accent_color: hex,
    });
    return { accentColor: response.data.accentColor };
  },
};
