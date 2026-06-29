/**
 * useIdentityCustomization Hook
 *
 * Encapsulates all state, filtering logic, and handlers for the
 * IdentityCustomization page.
 */

import { NAMEPLATE_REGISTRY, durations } from '@cgraph-dev/animation-constants';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { http } from '@/lib/api-client';
import {
  applyOwnIdentityPatch,
  applyOwnItemEquipped,
  applyOwnItemUnequipped,
} from '@/lib/identity';
import { useAuthStore, type User } from '@/modules/auth/store';
import { getApiErrorMessage } from '@/modules/auth/store/authStore.utils';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';
import { userHasPremiumAccess } from '@/modules/settings/store/customization/customizationStore.schema';
import toast from 'react-hot-toast';
import {
  ALL_BORDERS,
  getAvatarBorderDisplayTypeById,
  type BorderDefinition,
  type BorderTheme,
} from '@/data/avatar-borders';
import { ALL_TITLES, type TitleDefinition } from '@/data/titlesCollection';
import { ALL_BADGES, type BadgeDefinition } from '@/data/badgesCollection';
import type { InventoryItemType } from '@cgraph-dev/shared-types';

import type { Rarity, Border, Title, Badge } from './types';

export type SectionId = 'borders' | 'titles' | 'badges' | 'name-styles' | 'nameplates';

type InventoryType = Extract<InventoryItemType, 'avatar_border' | 'title' | 'badge' | 'nameplate'>;
type CustomizationSnapshot = Pick<
  ReturnType<typeof useCustomizationStore.getState>,
  'selectedBorderId' | 'avatarBorderType' | 'avatarBorder' | 'equippedTitle' | 'equippedNameplate'
>;

const GENERIC_BADGE_LOTTIE_URL = '/lottie/effects/placeholder.json';

interface InventoryEquipTarget {
  readonly itemType: InventoryItemType;
  readonly itemId: string;
}

interface InventoryItemPayload {
  readonly itemType?: unknown;
  readonly item_type?: unknown;
  readonly itemId?: unknown;
  readonly item_id?: unknown;
  readonly itemKey?: unknown;
  readonly item_key?: unknown;
  readonly itemSlug?: unknown;
  readonly item_slug?: unknown;
  readonly equippedAt?: unknown;
  readonly equipped_at?: unknown;
}

interface InventoryOwnership {
  readonly owned: Record<InventoryType, ReadonlySet<string>>;
  readonly equipTargets: Record<InventoryType, ReadonlyMap<string, InventoryEquipTarget>>;
  readonly equipped: {
    readonly avatarBorder: string | null;
    readonly title: string | null;
    readonly badges: readonly string[];
    readonly nameplate: string | null;
  };
}

function createEmptyOwnership(): InventoryOwnership {
  return {
    owned: {
      avatar_border: new Set(),
      title: new Set(),
      badge: new Set(),
      nameplate: new Set(),
    },
    equipTargets: {
      avatar_border: new Map(),
      title: new Map(),
      badge: new Map(),
      nameplate: new Map(),
    },
    equipped: {
      avatarBorder: null,
      title: null,
      badges: [],
      nameplate: null,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isInventoryItemPayload(value: unknown): value is InventoryItemPayload {
  return isRecord(value);
}

function readInventoryItems(payload: unknown): InventoryItemPayload[] {
  const envelope = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  const items = isRecord(envelope) ? envelope.items : undefined;
  return Array.isArray(items) ? items.filter(isInventoryItemPayload) : [];
}

function normalizeInventoryType(value: unknown): InventoryType | null {
  if (value === 'avatar_border' || value === 'border') return 'avatar_border';
  if (value === 'title') return 'title';
  if (value === 'badge') return 'badge';
  if (value === 'nameplate') return 'nameplate';
  return null;
}

function normalizeEquipItemType(value: unknown, fallback: InventoryType): InventoryItemType {
  if (value === 'border') return 'border';
  return normalizeInventoryType(value) ?? fallback;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function normalizeCatalogKey(value: string): string {
  return value.replace(/-/g, '_');
}

function addKeyVariant(target: Set<string>, value: string | null | undefined): void {
  if (!value) return;
  target.add(value);
  target.add(value.toLowerCase());
  target.add(value.replace(/-/g, '_'));
  target.add(value.replace(/_/g, '-'));
}

function addPrefixedVariants(target: Set<string>, rawKey: string, type: InventoryType): void {
  const dashKey = rawKey.replace(/_/g, '-').toLowerCase();
  const underscoreKey = rawKey.replace(/-/g, '_').toLowerCase();
  const unprefixedDash = dashKey.replace(/^(badge|title|border|plate|nameplate)-/, '');
  const unprefixedUnderscore = underscoreKey.replace(
    /^(badge|title|border|plate|nameplate)_/,
    ''
  );

  addKeyVariant(target, unprefixedDash);
  addKeyVariant(target, unprefixedUnderscore);

  if (type === 'badge') {
    addKeyVariant(target, `badge-${unprefixedDash}`);
    addKeyVariant(target, `badge_${unprefixedUnderscore}`);
  }

  if (type === 'title') {
    addKeyVariant(target, `title-${unprefixedDash}`);
    addKeyVariant(target, `title_${unprefixedUnderscore}`);
  }

  if (type === 'avatar_border') {
    addKeyVariant(target, `border-${unprefixedDash}`);
    addKeyVariant(target, `border_${unprefixedUnderscore}`);
  }

  if (type === 'nameplate') {
    addKeyVariant(target, `plate-${unprefixedDash}`);
    addKeyVariant(target, `plate_${unprefixedUnderscore}`);
    addKeyVariant(target, `nameplate-${unprefixedDash}`);
    addKeyVariant(target, `nameplate_${unprefixedUnderscore}`);
  }
}

function catalogKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const NAMEPLATE_ALIAS_IDS: Readonly<Record<string, string>> = {
  'default-plate': 'plate_none',
  'simple-gradient': 'plate_none',
  'clean-border': 'plate_none',
  'minimal-dark': 'plate_none',
  'minimal-light': 'plate_none',
  'ocean-wave': 'plate_none',
};

const TITLE_ALIAS_IDS: Readonly<Record<string, string>> = {
  'new-user': 'chatterbox',
  chatter: 'chatterbox',
  'forum-reader': 'forum_founder',
};

const FREE_NAMEPLATE_IDS = new Set(
  NAMEPLATE_REGISTRY.filter((plate) => plate.free).map((plate) => plate.id)
);

export function hasPremiumAccessForCustomization(
  user: Pick<User, 'isPremium' | 'subscription'> | null | undefined
): boolean {
  return userHasPremiumAccess(user ?? null);
}

export function isBorderUnlockedForCustomization(
  border: Pick<BorderDefinition, 'id' | 'unlocked' | 'isPremium'>,
  ownedBorderIds: ReadonlySet<string>,
  hasPremiumAccess: boolean
): boolean {
  return border.unlocked || ownedBorderIds.has(border.id) || (hasPremiumAccess && border.isPremium);
}

export function isTitleUnlockedForCustomization(
  title: Pick<TitleDefinition, 'id' | 'unlocked' | 'isPremium' | 'category'>,
  ownedTitleIds: ReadonlySet<string>,
  hasPremiumAccess: boolean
): boolean {
  return (
    title.unlocked ||
    ownedTitleIds.has(title.id) ||
    (hasPremiumAccess && (title.isPremium || title.category === 'premium'))
  );
}

export function getOwnedNameplateIdsForCustomization(
  ownedNameplateIds: ReadonlySet<string>,
  hasPremiumAccess: boolean
): string[] {
  const premiumNameplateIds = hasPremiumAccess
    ? NAMEPLATE_REGISTRY.filter((plate) => !plate.free).map((plate) => plate.id)
    : [];

  return [...new Set([...FREE_NAMEPLATE_IDS, ...premiumNameplateIds, ...ownedNameplateIds])];
}

function sanitizeHydratedAvatarBorderId(
  borderId: string | null,
  ownership: InventoryOwnership,
  hasPremiumAccess: boolean
): string | null {
  if (!borderId) return null;
  const border = ALL_BORDERS.find((candidate) => candidate.id === borderId);
  if (!border) return null;

  return isBorderUnlockedForCustomization(border, ownership.owned.avatar_border, hasPremiumAccess)
    ? borderId
    : null;
}

function sanitizeHydratedTitleId(
  titleId: string | null,
  ownership: InventoryOwnership,
  hasPremiumAccess: boolean
): string | null {
  if (!titleId) return null;
  const title = ALL_TITLES.find((candidate) => candidate.id === titleId);
  if (!title) return null;

  return isTitleUnlockedForCustomization(title, ownership.owned.title, hasPremiumAccess)
    ? titleId
    : null;
}

function sanitizeHydratedNameplateId(
  nameplateId: string | null,
  ownership: InventoryOwnership,
  hasPremiumAccess: boolean
): string | null {
  if (!nameplateId || nameplateId === 'plate_none') return null;
  const nameplate = NAMEPLATE_REGISTRY.find((candidate) => candidate.id === nameplateId);
  if (!nameplate) return null;

  if (
    nameplate.free ||
    FREE_NAMEPLATE_IDS.has(nameplateId) ||
    ownership.owned.nameplate.has(nameplateId)
  ) {
    return nameplateId;
  }

  return hasPremiumAccess && !nameplate.free ? nameplateId : null;
}

function sanitizeHydratedBadgeIds(
  badgeIds: readonly string[],
  ownership: InventoryOwnership
): string[] {
  return badgeIds.filter((badgeId) => {
    const badge = ALL_BADGES.find((candidate) => candidate.id === badgeId);
    return Boolean(badge?.unlocked || ownership.owned.badge.has(badgeId));
  });
}

function createCatalogLookup(type: InventoryType): ReadonlyMap<string, string> {
  const lookup = new Map<string, string>();
  const add = (key: string | null | undefined, catalogId: string) => {
    if (!key) return;
    lookup.set(key, catalogId);
    lookup.set(catalogKey(key), catalogId);
    lookup.set(key.replace(/-/g, '_'), catalogId);
    lookup.set(key.replace(/_/g, '-'), catalogId);
  };

  if (type === 'avatar_border') {
    for (const border of ALL_BORDERS) {
      add(border.id, border.id);
      add(border.name, border.id);
    }
  }

  if (type === 'title') {
    for (const [key, titleId] of Object.entries(TITLE_ALIAS_IDS)) add(key, titleId);
    for (const title of ALL_TITLES) {
      add(title.id, title.id);
      add(title.name, title.id);
      add(title.displayName, title.id);
      add(title.id.replace(/^title[-_]/, ''), title.id);
    }
  }

  if (type === 'badge') {
    for (const badge of ALL_BADGES) {
      add(badge.id, badge.id);
      add(badge.name, badge.id);
      add(badge.id.replace(/^badge[-_]/, ''), badge.id);
    }
  }

  if (type === 'nameplate') {
    for (const [key, plateId] of Object.entries(NAMEPLATE_ALIAS_IDS)) add(key, plateId);
    for (const plate of NAMEPLATE_REGISTRY) {
      add(plate.id, plate.id);
      add(plate.name, plate.id);
      add(plate.id.replace(/^plate[-_]/, ''), plate.id);
      add(plate.id.replace(/^nameplate[-_]/, ''), plate.id);
    }
  }

  return lookup;
}

const CATALOG_LOOKUPS: Record<InventoryType, ReadonlyMap<string, string>> = {
  avatar_border: createCatalogLookup('avatar_border'),
  title: createCatalogLookup('title'),
  badge: createCatalogLookup('badge'),
  nameplate: createCatalogLookup('nameplate'),
};

function resolveCatalogItemId(type: InventoryType, keys: readonly string[]): string | null {
  const lookup = CATALOG_LOOKUPS[type];

  for (const key of keys) {
    const direct = lookup.get(key) ?? lookup.get(catalogKey(key));
    if (direct) return direct;
  }

  return null;
}

function readItemKeys(item: InventoryItemPayload, type: InventoryType): string[] {
  const rawKeys = [
    readString(item.itemSlug ?? item.item_slug),
    readString(item.itemKey ?? item.item_key),
    readString(item.itemId ?? item.item_id),
  ].filter((value): value is string => value != null);

  const keys = new Set<string>();

  for (const rawKey of rawKeys) {
    if (type === 'avatar_border') {
      keys.add(normalizeCatalogKey(rawKey));
      keys.add(rawKey);
    } else {
      keys.add(rawKey);
      keys.add(normalizeCatalogKey(rawKey));
    }
    addPrefixedVariants(keys, rawKey, type);
  }

  return [...keys];
}

function createMutableEquipTargets(): Record<InventoryType, Map<string, InventoryEquipTarget>> {
  return {
    avatar_border: new Map(),
    title: new Map(),
    badge: new Map(),
    nameplate: new Map(),
  };
}

function buildInventoryOwnership(items: readonly InventoryItemPayload[]): InventoryOwnership {
  const owned: Record<InventoryType, Set<string>> = {
    avatar_border: new Set(),
    title: new Set(),
    badge: new Set(),
    nameplate: new Set(),
  };
  const equipTargets = createMutableEquipTargets();
  const equippedBadges: string[] = [];
  let equippedAvatarBorder: string | null = null;
  let equippedTitle: string | null = null;
  let equippedNameplate: string | null = null;

  for (const item of items) {
    const rawType = readString(item.itemType ?? item.item_type);
    const type = normalizeInventoryType(rawType);
    const itemKeys = type ? readItemKeys(item, type) : [];
    const itemId = type ? (resolveCatalogItemId(type, itemKeys) ?? itemKeys[0] ?? null) : null;
    const serverItemId = readString(item.itemId ?? item.item_id);

    if (!type || !itemId) continue;

    owned[type].add(itemId);
    itemKeys.forEach((itemKey) => owned[type].add(itemKey));
    if (serverItemId) {
      const target = { itemType: normalizeEquipItemType(rawType, type), itemId: serverItemId };
      equipTargets[type].set(itemId, target);
      itemKeys.forEach((itemKey) => equipTargets[type].set(itemKey, target));
    }

    if ((item.equippedAt ?? item.equipped_at) == null) continue;

    if (type === 'avatar_border') equippedAvatarBorder = itemId;
    if (type === 'title') equippedTitle = itemId;
    if (type === 'badge') equippedBadges.push(itemId);
    if (type === 'nameplate') equippedNameplate = itemId;
  }

  return {
    owned,
    equipTargets,
    equipped: {
      avatarBorder: equippedAvatarBorder,
      title: equippedTitle,
      badges: equippedBadges,
      nameplate: equippedNameplate,
    },
  };
}

function hydrateEquippedCosmetics(ownership: InventoryOwnership, hasPremiumAccess: boolean) {
  const current = useCustomizationStore.getState();
  const avatarBorderId = sanitizeHydratedAvatarBorderId(
    ownership.equipped.avatarBorder ?? current.selectedBorderId,
    ownership,
    hasPremiumAccess
  );
  const titleId = sanitizeHydratedTitleId(
    ownership.equipped.title ?? current.equippedTitle,
    ownership,
    hasPremiumAccess
  );
  const nameplateId = sanitizeHydratedNameplateId(
    ownership.equipped.nameplate ?? current.equippedNameplate,
    ownership,
    hasPremiumAccess
  );
  const badgeIds = sanitizeHydratedBadgeIds(
    ownership.equipped.badges.length > 0 ? ownership.equipped.badges : current.equippedBadges,
    ownership
  );
  const avatarBorderType = getAvatarBorderDisplayTypeById(avatarBorderId);

  useCustomizationStore.setState({
    selectedBorderId: avatarBorderId,
    avatarBorderType,
    avatarBorder: avatarBorderType,
    equippedTitle: titleId,
    title: titleId,
    equippedBadges: [...badgeIds],
    equippedNameplate: nameplateId,
    isDirty: false,
  });

  useAuthStore.getState().updateUser({
    avatarBorderId,
    equippedTitleId: titleId,
    equippedBadgeIds: [...badgeIds],
    equippedNameplateId: nameplateId,
  });
}

/** Map static BorderDefinition to the component's Border type */
function mapBorderDefinition(
  b: BorderDefinition,
  ownership: InventoryOwnership,
  hasPremiumAccess: boolean
): Border {
  const equipTarget = ownership.equipTargets.avatar_border.get(b.id);
  return {
    id: b.id,
    name: b.name,
    rarity: b.rarity,
    animation: b.animationType,
    colors: b.colors,
    imageUrl: b.imageUrl,
    previewUrl: b.previewUrl,
    unlocked: isBorderUnlockedForCustomization(b, ownership.owned.avatar_border, hasPremiumAccess),
    serverItemId: equipTarget?.itemId,
    serverItemType: equipTarget?.itemType,
    unlockRequirement: b.unlockRequirement,
  };
}

/** Map static TitleDefinition to the component's Title type */
function mapTitleDefinition(
  t: TitleDefinition,
  ownership: InventoryOwnership,
  hasPremiumAccess: boolean
): Title {
  const equipTarget = ownership.equipTargets.title.get(t.id);
  return {
    id: t.id,
    name: t.name,
    animationType: t.animationType,
    gradient: t.gradient,
    lottieUrl: t.lottieUrl ?? '/lottie/effects/placeholder.json',
    imageUrl: t.imageUrl,
    previewUrl: t.previewUrl,
    unlocked: isTitleUnlockedForCustomization(t, ownership.owned.title, hasPremiumAccess),
    serverItemId: equipTarget?.itemId,
    serverItemType: equipTarget?.itemType,
    unlockRequirement: t.unlockRequirement,
  };
}

/** Map static BadgeDefinition to the component's Badge type */
function mapBadgeDefinition(b: BadgeDefinition, ownership: InventoryOwnership): Badge {
  const equipTarget = ownership.equipTargets.badge.get(b.id);
  return {
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    rarity: b.rarity,
    unlocked: ownership.owned.badge.has(b.id),
    imageUrl: b.imageUrl,
    previewUrl: b.previewUrl,
    lottieUrl: b.animationType === 'static' ? undefined : b.lottieUrl ?? GENERIC_BADGE_LOTTIE_URL,
    animationType: b.animationType ?? 'lottie',
    serverItemId: equipTarget?.itemId,
    serverItemType: equipTarget?.itemType,
    unlockRequirement: b.unlockRequirement,
  };
}

/**
 * Hook for managing identity customization.
 */
export function useIdentityCustomization() {
  const { user } = useAuthStore();
  const hasPremiumAccess = hasPremiumAccessForCustomization(user);
  const store = useCustomizationStore();
  const {
    avatarBorderType,
    selectedBorderId,
    equippedTitle,
    equippedBadges,
    profileCardStyle,
    isSaving,
    error,
    fetchCustomizations,
    saveCustomizations,
    setEquippedTitle,
    setEquippedBadges,
    // New cosmetics
    displayNameFont,
    displayNameEffect,
    displayNameColor,
    displayNameSecondaryColor,
    equippedNameplate,
    setDisplayNameFont,
    setDisplayNameEffect,
    setDisplayNameColor,
    setDisplayNameSecondaryColor,
    setEquippedNameplate,
  } = store;

  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL
  type ThemeFilter = BorderTheme | 'all';
  const validSections: ReadonlySet<string> = new Set([
    'borders',
    'titles',
    'badges',
    'name-styles',
    'nameplates',
  ]);
  function isSectionId(v: string | null): v is SectionId {
    return v != null && validSections.has(v);
  }
  function isThemeFilter(v: string | null): v is ThemeFilter {
    return v != null;
  }

  const sectionParam = searchParams.get('section');
  const initialSection: SectionId = isSectionId(sectionParam) ? sectionParam : 'borders';
  const [activeSection, setActiveSectionState] = useState<SectionId>(initialSection);

  const themeParam = searchParams.get('theme');
  const initialTheme: ThemeFilter = isThemeFilter(themeParam) ? themeParam : 'all';
  const [selectedTheme, setSelectedThemeState] = useState<ThemeFilter>(initialTheme);

  function setActiveSection(section: SectionId) {
    setActiveSectionState(section);
    setSearchParams(
      (prev) => {
        prev.set('section', section);
        return prev;
      },
      { replace: true }
    );
  }

  function setSelectedTheme(theme: ThemeFilter) {
    setSelectedThemeState(theme);
    setSearchParams(
      (prev) => {
        prev.set('theme', theme);
        return prev;
      },
      { replace: true }
    );
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 'all'>('all');
  const [previewingLockedItem, setPreviewingLockedItem] = useState<string | null>(null);
  const [previewSnapshot, setPreviewSnapshot] = useState<CustomizationSnapshot | null>(null);

  // API data state
  const [borders, setBorders] = useState<Border[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(true);
  const [ownedNameplateIds, setOwnedNameplateIds] = useState<readonly string[]>([]);
  const [inventoryEquipTargets, setInventoryEquipTargets] = useState<
    Record<InventoryType, ReadonlyMap<string, InventoryEquipTarget>>
  >(createMutableEquipTargets);

  // Load cosmetic ownership from the backend. Static lists below are metadata only.
  useEffect(() => {
    let canceled = false;

    function applyOwnership(ownership: InventoryOwnership) {
      if (canceled) return;
      setBorders(ALL_BORDERS.map((b) => mapBorderDefinition(b, ownership, hasPremiumAccess)));
      setTitles(ALL_TITLES.map((t) => mapTitleDefinition(t, ownership, hasPremiumAccess)));
      setBadges(ALL_BADGES.map((b) => mapBadgeDefinition(b, ownership)));
      setOwnedNameplateIds(
        getOwnedNameplateIdsForCustomization(ownership.owned.nameplate, hasPremiumAccess)
      );
      setInventoryEquipTargets(ownership.equipTargets);
      setIsLoadingIdentity(false);
    }

    async function loadIdentity() {
      setIsLoadingIdentity(true);

      if (!user?.id) {
        applyOwnership(createEmptyOwnership());
        return;
      }

      try {
        await fetchCustomizations(user.id);
        const response = await http.get('/api/v1/cosmetics/inventory');
        const ownership = buildInventoryOwnership(readInventoryItems(response.data));

        if (!canceled) {
          hydrateEquippedCosmetics(ownership, hasPremiumAccess);
          applyOwnership(ownership);
        }
      } catch {
        if (!canceled) {
          const emptyOwnership = createEmptyOwnership();
          hydrateEquippedCosmetics(emptyOwnership, hasPremiumAccess);
          applyOwnership(emptyOwnership);
          toast.error('Could not load cosmetic inventory');
        }
      }
    }

    void loadIdentity();

    return () => {
      canceled = true;
    };
  }, [
    user?.id,
    user?.isPremium,
    user?.subscription?.tier,
    user?.subscription?.status,
    user?.subscription?.expiresAt,
    fetchCustomizations,
    hasPremiumAccess,
  ]);

  // --- Filtering ---

  const filteredBorders = borders.filter((border) => {
    const matchesSearch = border.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = selectedRarity === 'all' || border.rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  const filteredTitles = titles.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBadges = badges.filter((badge) => {
    const matchesSearch = badge.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = selectedRarity === 'all' || badge.rarity === selectedRarity;
    return matchesSearch && matchesRarity;
  });

  // --- Border / Title store helpers ---

  function applyBorderToStore(borderId: string | null) {
    const avatarBorderType = getAvatarBorderDisplayTypeById(borderId);
    useCustomizationStore.getState().updateSettings({
      selectedBorderId: borderId,
      avatarBorderType,
      avatarBorder: avatarBorderType,
    });
  }

  function applyTitleToStore(titleId: string | null) {
    setEquippedTitle(titleId);
  }

  function resolveEquipTarget(type: InventoryType, itemId: string): InventoryEquipTarget | null {
    return inventoryEquipTargets[type].get(itemId) ?? null;
  }

  function isAlreadyEquippedError(error: unknown): boolean {
    if (isRecord(error)) {
      const response = isRecord(error.response) ? error.response : null;
      if (response?.status === 409) return true;
    }

    return error instanceof Error && /already equipped/i.test(error.message);
  }

  async function persistEquipTarget(
    type: InventoryType,
    itemId: string,
    mode: 'equip' | 'unequip'
  ) {
    const target = resolveEquipTarget(type, itemId);
    if (!target) return;

    try {
      if (mode === 'equip') {
        await http.put('/api/v1/cosmetics/equip', {
          item_type: target.itemType,
          item_id: target.itemId,
        });
      } else {
        await http.delete('/api/v1/cosmetics/unequip', {
          data: {
            item_type: target.itemType,
            item_id: target.itemId,
          },
        });
      }
    } catch (error) {
      if (mode === 'equip' && isAlreadyEquippedError(error)) return;
      throw error;
    }
  }

  // --- Preview helpers ---

  function setPreviewState(
    itemId: string,
    updates: Partial<ReturnType<typeof useCustomizationStore.getState>>
  ) {
    setPreviewSnapshot((current) => {
      if (current) return current;
      const state = useCustomizationStore.getState();

      return {
        selectedBorderId: state.selectedBorderId,
        avatarBorderType: state.avatarBorderType,
        avatarBorder: state.avatarBorder,
        equippedTitle: state.equippedTitle,
        equippedNameplate: state.equippedNameplate,
      };
    });
    useCustomizationStore.setState({ ...updates, isDirty: false });
    setPreviewingLockedItem(itemId);
  }

  function handlePreviewItem(itemId: string, type: 'border' | 'title') {
    if (type === 'title') {
      setPreviewState(itemId, { equippedTitle: itemId, title: itemId });
    } else {
      const avatarBorderType = getAvatarBorderDisplayTypeById(itemId);
      setPreviewState(itemId, {
        selectedBorderId: itemId,
        avatarBorderType,
        avatarBorder: avatarBorderType,
      });
    }

    toast('Previewing item — Purchase premium to save', {
      duration: durations.cinematic.ms,
    });
  }

  function clearPreview() {
    if (previewSnapshot) {
      useCustomizationStore.setState({
        selectedBorderId: previewSnapshot.selectedBorderId,
        avatarBorderType: previewSnapshot.avatarBorderType,
        avatarBorder: previewSnapshot.avatarBorder,
        equippedTitle: previewSnapshot.equippedTitle,
        title: previewSnapshot.equippedTitle,
        equippedNameplate: previewSnapshot.equippedNameplate,
        isDirty: false,
      });
      setPreviewSnapshot(null);
    }
    setPreviewingLockedItem(null);
  }

  // --- Section handlers ---

  const handleEquipBorder = (borderId: string, border: Border) => {
    if (!border.unlocked) {
      handlePreviewItem(borderId, 'border');
      return;
    }
    const previousBorderId = previewSnapshot?.selectedBorderId ?? selectedBorderId;
    clearPreview();
    applyBorderToStore(borderId);
    applyOwnItemEquipped('avatar_border', borderId);

    void persistEquipTarget('avatar_border', borderId, 'equip').catch((error) => {
      if (previousBorderId) {
        applyBorderToStore(previousBorderId);
        applyOwnItemEquipped('avatar_border', previousBorderId);
      } else {
        applyBorderToStore(null);
        applyOwnItemUnequipped('avatar_border');
      }
      toast.error(error instanceof Error ? error.message : 'Could not equip avatar border');
    });
  };

  const handleEquipTitle = (titleId: string, titleItem: Title) => {
    if (!titleItem.unlocked) {
      handlePreviewItem(titleId, 'title');
      return;
    }
    const previousTitle = previewSnapshot?.equippedTitle ?? equippedTitle;
    clearPreview();
    applyTitleToStore(titleId);
    applyOwnItemEquipped('title', titleId);

    void persistEquipTarget('title', titleId, 'equip').catch((error) => {
      applyTitleToStore(previousTitle);
      if (previousTitle) applyOwnItemEquipped('title', previousTitle);
      else applyOwnItemUnequipped('title');
      toast.error(error instanceof Error ? error.message : 'Could not equip title');
    });
  };

  const handleToggleBadge = (badgeId: string, badge: Badge) => {
    if (!badge.unlocked) {
      toast.error(`Unlock required: ${badge.unlockRequirement}`);
      return;
    }
    if (equippedBadges.includes(badgeId)) {
      const newBadges = equippedBadges.filter((id) => id !== badgeId);
      setEquippedBadges(newBadges);
      applyOwnItemUnequipped('badge', badgeId);
      void persistEquipTarget('badge', badgeId, 'unequip').catch((error) => {
        setEquippedBadges([...equippedBadges]);
        applyOwnItemEquipped('badge', badgeId);
        toast.error(error instanceof Error ? error.message : 'Could not unequip badge');
      });
    } else if (equippedBadges.length < 5) {
      const newBadges = [...equippedBadges, badgeId];
      setEquippedBadges(newBadges);
      applyOwnItemEquipped('badge', badgeId);
      void persistEquipTarget('badge', badgeId, 'equip').catch((error) => {
        setEquippedBadges([...equippedBadges]);
        applyOwnItemUnequipped('badge', badgeId);
        toast.error(error instanceof Error ? error.message : 'Could not equip badge');
      });
    } else {
      toast.error('Maximum 5 badges can be equipped');
    }
  };

  const handleSaveChanges = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }
    if (previewingLockedItem && !hasPremiumAccess) clearPreview();
    if (previewingLockedItem && hasPremiumAccess) {
      setPreviewingLockedItem(null);
      setPreviewSnapshot(null);
    }
    try {
      await saveCustomizations(user.id);
      toast.success('Identity customizations saved successfully!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save customizations'));
    }
  };

  // --- Display Name Style handlers ---
  const handleFontChange = (font: string) => {
    setDisplayNameFont(font);
    useAuthStore.getState().updateUser({ displayNameFont: font });
  };
  const handleEffectChange = (effect: string) => {
    setDisplayNameEffect(effect);
    useAuthStore.getState().updateUser({ displayNameEffect: effect });
  };
  const handleColorChange = (color: string) => {
    setDisplayNameColor(color);
    useAuthStore.getState().updateUser({ displayNameColor: color });
  };
  const handleSecondaryColorChange = (color: string | null) => {
    setDisplayNameSecondaryColor(color);
    useAuthStore.getState().updateUser({ displayNameSecondaryColor: color });
  };

  // --- Nameplate handlers ---
  const handleEquipNameplate = (nameplateId: string | null) => {
    const normalizedNameplateId = nameplateId === 'plate_none' ? null : nameplateId;
    const previousNameplateId = equippedNameplate === 'plate_none' ? null : equippedNameplate;

    if (
      normalizedNameplateId &&
      !FREE_NAMEPLATE_IDS.has(normalizedNameplateId) &&
      !hasPremiumAccess &&
      !ownedNameplateIds.includes(normalizedNameplateId)
    ) {
      setPreviewState(normalizedNameplateId, { equippedNameplate: normalizedNameplateId });
      toast('Previewing nameplate — unlock it to save', {
        duration: durations.cinematic.ms,
      });
      return;
    }

    clearPreview();
    setEquippedNameplate(normalizedNameplateId);
    if (normalizedNameplateId) {
      applyOwnItemEquipped('nameplate', normalizedNameplateId);
      void persistEquipTarget('nameplate', normalizedNameplateId, 'equip').catch((error) => {
        setEquippedNameplate(previousNameplateId);
        if (previousNameplateId) applyOwnItemEquipped('nameplate', previousNameplateId);
        else applyOwnItemUnequipped('nameplate');
        toast.error(error instanceof Error ? error.message : 'Could not equip nameplate');
      });
    } else if (previousNameplateId) {
      applyOwnIdentityPatch({ equippedNameplateId: null });
      void persistEquipTarget('nameplate', previousNameplateId, 'unequip').catch((error) => {
        setEquippedNameplate(previousNameplateId);
        applyOwnItemEquipped('nameplate', previousNameplateId);
        toast.error(error instanceof Error ? error.message : 'Could not unequip nameplate');
      });
    }
  };

  return {
    // State
    activeSection,
    setActiveSection,
    selectedTheme,
    setSelectedTheme,
    searchQuery,
    setSearchQuery,
    selectedRarity,
    setSelectedRarity,
    previewingLockedItem,

    // Store values
    avatarBorderType: selectedBorderId ?? avatarBorderType,
    equippedTitle,
    equippedBadges,
    profileCardStyle,
    isSaving,
    error,
    isLoadingIdentity,

    // Data counts (for section tabs)
    bordersCount: borders.length,
    titlesCount: titles.length,
    badgesCount: badges.length,

    // Filtered data
    filteredBorders,
    filteredTitles,
    filteredBadges,

    // Handlers
    handleEquipBorder,
    handleEquipTitle,
    handleToggleBadge,
    handleSaveChanges,

    // Display Name Style
    displayNameFont,
    displayNameEffect,
    displayNameColor,
    displayNameSecondaryColor,
    handleFontChange,
    handleEffectChange,
    handleColorChange,
    handleSecondaryColorChange,

    // Nameplate
    equippedNameplate,
    handleEquipNameplate,
    ownedNameplateIds,
    nameplatesCount: NAMEPLATE_REGISTRY.length,
  };
}
