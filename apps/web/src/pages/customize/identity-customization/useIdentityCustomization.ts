/**
 * useIdentityCustomization Hook
 *
 * Encapsulates all state, filtering logic, and handlers for the
 * IdentityCustomization page.
 */

import { durations } from '@cgraph/animation-constants';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { http } from '@/lib/api-client';
import { useAuthStore } from '@/modules/auth/store';
import { useCustomizationStore } from '@/modules/settings/store/customization/customizationStore';
import toast from 'react-hot-toast';
import { ALL_BORDERS, type BorderDefinition, type BorderTheme } from '@/data/avatar-borders';
import { ALL_TITLES, type TitleDefinition } from '@/data/titlesCollection';
import { ALL_BADGES, type BadgeDefinition } from '@/data/badgesCollection';
import { NAMEPLATE_REGISTRY } from '@cgraph/animation-constants';

import type { Rarity, Border, Title, Badge } from './types';
import { getV2BorderType } from './constants';

export type SectionId = 'borders' | 'titles' | 'badges' | 'name-styles' | 'nameplates';

type InventoryType = 'avatar_border' | 'title' | 'badge' | 'nameplate';

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

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function normalizeCatalogKey(value: string): string {
  return value.replace(/-/g, '_');
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
  }

  return [...keys];
}

function buildInventoryOwnership(items: readonly InventoryItemPayload[]): InventoryOwnership {
  const owned: Record<InventoryType, Set<string>> = {
    avatar_border: new Set(),
    title: new Set(),
    badge: new Set(),
    nameplate: new Set(),
  };
  const equippedBadges: string[] = [];
  let equippedAvatarBorder: string | null = null;
  let equippedTitle: string | null = null;
  let equippedNameplate: string | null = null;

  for (const item of items) {
    const type = normalizeInventoryType(item.itemType ?? item.item_type);
    const itemKeys = type ? readItemKeys(item, type) : [];
    const itemId = itemKeys[0] ?? null;

    if (!type || !itemId) continue;

    itemKeys.forEach((itemKey) => owned[type].add(itemKey));

    if ((item.equippedAt ?? item.equipped_at) == null) continue;

    if (type === 'avatar_border') equippedAvatarBorder = itemId;
    if (type === 'title') equippedTitle = itemId;
    if (type === 'badge') equippedBadges.push(itemId);
    if (type === 'nameplate') equippedNameplate = itemId;
  }

  return {
    owned,
    equipped: {
      avatarBorder: equippedAvatarBorder,
      title: equippedTitle,
      badges: equippedBadges,
      nameplate: equippedNameplate,
    },
  };
}

function getBorderTypeForId(borderId: string | null) {
  const border = borderId ? ALL_BORDERS.find((b) => b.id === borderId) : null;
  return border ? getV2BorderType(border.animationType) : 'none';
}

function hydrateEquippedCosmetics(ownership: InventoryOwnership) {
  const avatarBorderType = getBorderTypeForId(ownership.equipped.avatarBorder);

  useCustomizationStore.setState({
    selectedBorderId: ownership.equipped.avatarBorder,
    avatarBorderType,
    avatarBorder: avatarBorderType,
    equippedTitle: ownership.equipped.title,
    title: ownership.equipped.title,
    equippedBadges: ownership.equipped.badges,
    equippedNameplate: ownership.equipped.nameplate,
    isDirty: false,
  });
}

/** Map static BorderDefinition to the component's Border type */
function mapBorderDefinition(b: BorderDefinition, ownership: InventoryOwnership): Border {
  return {
    id: b.id,
    name: b.name,
    rarity: b.rarity,
    animation: b.animationType,
    colors: b.colors,
    unlocked: ownership.owned.avatar_border.has(b.id),
    unlockRequirement: b.unlockRequirement,
  };
}

/** Map static TitleDefinition to the component's Title type */
function mapTitleDefinition(t: TitleDefinition, ownership: InventoryOwnership): Title {
  return {
    id: t.id,
    name: t.name,
    animationType: t.animationType,
    gradient: t.gradient,
    unlocked: ownership.owned.title.has(t.id),
    unlockRequirement: t.unlockRequirement,
  };
}

/** Map static BadgeDefinition to the component's Badge type */
function mapBadgeDefinition(b: BadgeDefinition, ownership: InventoryOwnership): Badge {
  return {
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    rarity: b.rarity,
    unlocked: ownership.owned.badge.has(b.id),
    unlockRequirement: b.unlockRequirement,
  };
}

/**
 * Hook for managing identity customization.
 */
export function useIdentityCustomization() {
  const { user } = useAuthStore();
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
    setAvatarBorder,
    selectBorderId,
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

  // API data state
  const [borders, setBorders] = useState<Border[]>([]);
  const [titles, setTitles] = useState<Title[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(true);
  const [ownedNameplateIds, setOwnedNameplateIds] = useState<readonly string[]>([]);

  // Load cosmetic ownership from the backend. Static lists below are metadata only.
  useEffect(() => {
    let canceled = false;

    function applyOwnership(ownership: InventoryOwnership) {
      if (canceled) return;
      setBorders(ALL_BORDERS.map((b) => mapBorderDefinition(b, ownership)));
      setTitles(ALL_TITLES.map((t) => mapTitleDefinition(t, ownership)));
      setBadges(ALL_BADGES.map((b) => mapBadgeDefinition(b, ownership)));
      setOwnedNameplateIds([...ownership.owned.nameplate]);
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
          hydrateEquippedCosmetics(ownership);
          applyOwnership(ownership);
        }
      } catch {
        if (!canceled) {
          applyOwnership(createEmptyOwnership());
          toast.error('Could not load cosmetic inventory');
        }
      }
    }

    void loadIdentity();

    return () => {
      canceled = true;
    };
  }, [user?.id, fetchCustomizations]);

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

  function applyBorderToStore(borderId: string) {
    const border = ALL_BORDERS.find((b) => b.id === borderId);
    if (border) {
      setAvatarBorder(getV2BorderType(border.animationType));
    }
    selectBorderId(borderId);
  }

  function applyTitleToStore(titleId: string | null) {
    setEquippedTitle(titleId);
  }

  // --- Preview helpers ---

  function handlePreviewItem(itemId: string, _type: 'border' | 'title') {
    setPreviewingLockedItem(itemId);
    toast('Previewing item — Purchase premium to save', {
      duration: durations.cinematic.ms,
    });
  }

  function clearPreview() {
    if (previewingLockedItem) {
      setPreviewingLockedItem(null);
    }
  }

  // --- Section handlers ---

  const handleEquipBorder = (borderId: string, border: Border) => {
    if (!border.unlocked) {
      handlePreviewItem(borderId, 'border');
      return;
    }
    clearPreview();
    applyBorderToStore(borderId);
  };

  const handleEquipTitle = (titleId: string, titleItem: Title) => {
    if (!titleItem.unlocked) {
      handlePreviewItem(titleId, 'title');
      return;
    }
    clearPreview();
    applyTitleToStore(titleId);
  };

  const handleToggleBadge = (badgeId: string, badge: Badge) => {
    if (!badge.unlocked) {
      toast.error(`Unlock required: ${badge.unlockRequirement}`);
      return;
    }
    if (equippedBadges.includes(badgeId)) {
      const newBadges = equippedBadges.filter((id) => id !== badgeId);
      setEquippedBadges(newBadges);
    } else if (equippedBadges.length < 5) {
      const newBadges = [...equippedBadges, badgeId];
      setEquippedBadges(newBadges);
    } else {
      toast.error('Maximum 5 badges can be equipped');
    }
  };

  const handleSaveChanges = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }
    if (previewingLockedItem) {
      toast.error('Premium item selected! Purchase premium to save these customizations.', {
        duration: 4000,
      });
      return;
    }
    try {
      await saveCustomizations(user.id);
      toast.success('Identity customizations saved successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save customizations');
    }
  };

  // --- Display Name Style handlers ---
  const handleFontChange = (font: string) => setDisplayNameFont(font);
  const handleEffectChange = (effect: string) => setDisplayNameEffect(effect);
  const handleColorChange = (color: string) => setDisplayNameColor(color);
  const handleSecondaryColorChange = (color: string | null) => setDisplayNameSecondaryColor(color);

  // --- Nameplate handlers ---
  const handleEquipNameplate = (nameplateId: string | null) => {
    if (nameplateId && !ownedNameplateIds.includes(nameplateId)) {
      toast.error('Unlock this nameplate before equipping it');
      return;
    }

    setEquippedNameplate(nameplateId);
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
