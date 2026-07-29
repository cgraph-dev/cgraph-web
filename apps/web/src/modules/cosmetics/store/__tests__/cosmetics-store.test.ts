import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCosmeticsApi, mockEntitlementsApi } = vi.hoisted(() => ({
  mockCosmeticsApi: {
    listCatalogue: vi.fn(),
    getInventory: vi.fn(),
    equipBorder: vi.fn(),
    activateTheme: vi.fn(),
    equip: vi.fn(),
    unequip: vi.fn(),
    updateAccentColor: vi.fn(),
  },
  mockEntitlementsApi: {
    fetchEntitlements: vi.fn(),
    checkEntitlement: vi.fn(),
    purchaseEntitlement: vi.fn(),
  },
}));

vi.mock('../../services/cosmetics-api', () => ({ cosmeticsApi: mockCosmeticsApi }));
vi.mock('../../services/entitlements-api', () => ({ entitlementsApi: mockEntitlementsApi }));

import { useCosmeticsStore } from '../cosmetics-store';

const borderItem = {
  id: 'border-1',
  slug: 'nova-border',
  name: 'Nova Border',
  description: 'Border item',
  surface: 'avatar_border' as const,
  type: 'avatar_border' as const,
  rarity: 'epic' as const,
  unlockType: 'purchase' as const,
  unlockCondition: { type: 'purchase' as const, threshold: 250 },
  animationType: 'lottie' as const,
  lottieFile: '/lottie/borders/test.json',
  previewUrl: null,
  colors: ['#fff'],
  available: true,
  createdAt: '',
};

const themeItem = {
  id: 'theme-1',
  slug: 'midnight',
  name: 'Midnight',
  description: 'Theme item',
  surface: 'profile_theme' as const,
  type: 'theme' as const,
  rarity: 'rare' as const,
  unlockType: 'free' as const,
  unlockCondition: { type: 'free' as const, threshold: 0 },
  animationType: 'none' as const,
  lottieFile: null,
  previewUrl: null,
  colors: [],
  available: true,
  createdAt: '',
};

const themeInventoryEntry = {
  cosmetic: themeItem,
  equipped: true,
  acquiredAt: '2026-03-22T00:00:00Z',
  source: 'purchase' as const,
};

const borderInventoryEntry = {
  cosmetic: borderItem,
  equipped: false,
  acquiredAt: '2026-03-21T00:00:00Z',
  source: 'purchase' as const,
};

const entitlement = {
  id: 'ent-1',
  sku: {
    id: 'sku-1',
    slug: 'founder-pack',
    name: 'Founder Pack',
    type: 'badge' as const,
    assetHash: null,
    cosmeticId: null,
    priceNodes: 100,
    stripePriceId: null,
    isPremiumOnly: false,
    isAvailable: true,
    collection: null,
    version: 1,
  },
  type: 'purchase' as const,
  source: 'shop_purchase' as const,
  grantedAt: '2026-03-22T00:00:00Z',
  expiresAt: null,
  active: true,
};

const initialState = {
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
  memberCosmetics: new Map(),
  inventoryCursor: null,
  inventoryHasMore: true,
};

describe('useCosmeticsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCosmeticsStore.setState(initialState);
  });

  afterEach(() => {
    useCosmeticsStore.getState().reset();
  });

  it('fetches the normalized catalogue and derives available filters', async () => {
    mockCosmeticsApi.listCatalogue.mockResolvedValue([borderItem, themeItem]);

    await useCosmeticsStore.getState().fetchCatalogue();

    const state = useCosmeticsStore.getState();
    expect(state.catalogue).toEqual([borderItem, themeItem]);
    expect(state.availableThemes).toEqual(['avatar_border', 'profile_theme']);
    expect(state.availableRarities).toEqual(['epic', 'rare']);
    expect(state.isLoadingCatalogue).toBe(false);
    expect(state.error).toBeNull();
  });

  it('records a catalogue fetch error', async () => {
    mockCosmeticsApi.listCatalogue.mockRejectedValue(new Error('catalogue failed'));

    await useCosmeticsStore.getState().fetchCatalogue();

    const state = useCosmeticsStore.getState();
    expect(state.isLoadingCatalogue).toBe(false);
    expect(state.error).toBe('catalogue failed');
  });

  it('fetches the normalized inventory without duplicate legacy lookups', async () => {
    mockCosmeticsApi.getInventory.mockResolvedValue({
      inventory: [borderInventoryEntry, themeInventoryEntry],
      total: 2,
    });

    await useCosmeticsStore.getState().fetchInventory();

    const state = useCosmeticsStore.getState();
    expect(state.inventory).toEqual([borderInventoryEntry, themeInventoryEntry]);
    expect(state.isLoadingInventory).toBe(false);
  });

  it('records an inventory fetch error', async () => {
    mockCosmeticsApi.getInventory.mockRejectedValue(new Error('inventory failed'));

    await useCosmeticsStore.getState().fetchInventory();

    expect(useCosmeticsStore.getState().inventory).toEqual([]);
    expect(useCosmeticsStore.getState().error).toBe('inventory failed');
  });

  it('routes equipItem by cosmetic type and updates equipped flags optimistically', async () => {
    useCosmeticsStore.setState({
      inventory: [
        borderInventoryEntry,
        { ...borderInventoryEntry, cosmetic: { ...borderItem, id: 'border-2' }, equipped: true },
        themeInventoryEntry,
      ],
    });

    await useCosmeticsStore.getState().equipItem(borderItem);
    expect(mockCosmeticsApi.equipBorder).toHaveBeenCalledWith('border-1');
    expect(useCosmeticsStore.getState().inventory).toEqual([
      { ...borderInventoryEntry, equipped: true },
      {
        ...borderInventoryEntry,
        cosmetic: { ...borderItem, id: 'border-2' },
        equipped: false,
      },
      themeInventoryEntry,
    ]);

    await useCosmeticsStore.getState().equipItem(themeItem);
    expect(mockCosmeticsApi.activateTheme).toHaveBeenCalledWith('theme-1');

    const badgeItem = {
      ...themeItem,
      id: 'badge-1',
      type: 'badge' as const,
      surface: 'avatar_border' as const,
    };
    useCosmeticsStore.setState({
      inventory: [
        themeInventoryEntry,
        { cosmetic: badgeItem, equipped: false, acquiredAt: '', source: 'purchase' as const },
      ],
    });
    await useCosmeticsStore.getState().equipItem(badgeItem);
    expect(mockCosmeticsApi.equip).toHaveBeenCalledWith('badge', 'badge-1');
  });

  it('unequips an owned cosmetic without fabricating a purchase', async () => {
    useCosmeticsStore.setState({ inventory: [{ ...borderInventoryEntry, equipped: true }] });

    await useCosmeticsStore.getState().unequipItem(borderItem);
    expect(mockCosmeticsApi.unequip).toHaveBeenCalledWith('avatar_border', 'border-1');
    expect(useCosmeticsStore.getState().inventory[0]?.equipped).toBe(false);
  });

  it('loads entitlements, checks access, paginates inventory, and rolls back failed purchases', async () => {
    mockEntitlementsApi.fetchEntitlements
      .mockResolvedValueOnce({ data: [entitlement], nextCursor: null, hasMore: false })
      .mockResolvedValueOnce({ data: [entitlement], nextCursor: 'cursor-2', hasMore: true })
      .mockResolvedValueOnce({
        data: [{ ...entitlement, id: 'ent-2' }],
        nextCursor: null,
        hasMore: false,
      });
    mockEntitlementsApi.checkEntitlement
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('cache miss'));
    mockEntitlementsApi.purchaseEntitlement.mockRejectedValue(new Error('purchase failed'));

    await useCosmeticsStore.getState().fetchEntitlements();
    expect(useCosmeticsStore.getState().entitlements).toEqual([entitlement]);

    await expect(useCosmeticsStore.getState().isEntitled('sku-1')).resolves.toBe(true);
    await expect(useCosmeticsStore.getState().isEntitled('sku-2')).resolves.toBe(false);

    await useCosmeticsStore.getState().fetchInventoryPage();
    expect(useCosmeticsStore.getState().entitlements).toEqual([entitlement]);
    expect(useCosmeticsStore.getState().inventoryCursor).toBe('cursor-2');
    expect(useCosmeticsStore.getState().inventoryHasMore).toBe(true);

    await useCosmeticsStore.getState().fetchInventoryPage('cursor-2');
    expect(useCosmeticsStore.getState().entitlements).toEqual([
      entitlement,
      { ...entitlement, id: 'ent-2' },
    ]);

    const previous = useCosmeticsStore.getState().entitlements;
    await useCosmeticsStore.getState().purchaseEntitlement('sku-9');
    expect(useCosmeticsStore.getState().entitlements).toEqual(previous);
    expect(useCosmeticsStore.getState().error).toBe('purchase failed');
  });

  it('updates member cosmetics, clears transient errors, and resets to initial state', async () => {
    useCosmeticsStore.setState({ error: 'transient failure' });

    mockCosmeticsApi.updateAccentColor.mockResolvedValue({ accentColor: '#112233' });
    await useCosmeticsStore.getState().updateAccentColor('#112233');
    expect(useCosmeticsStore.getState().error).toBeNull();

    useCosmeticsStore.getState().updateOwnProfile({ avatarBorderId: 'noop' });
    useCosmeticsStore.getState().updateMemberCosmetics('user-1', { avatarBorderId: 'border-1' });
    useCosmeticsStore.getState().updateMemberCosmetics('user-1', { profileFrameId: 'frame-1' });
    expect(useCosmeticsStore.getState().getMemberCosmetics('user-1')).toEqual({
      avatarBorderId: 'border-1',
      profileFrameId: 'frame-1',
    });

    useCosmeticsStore.setState({ catalogue: [borderItem], inventory: [borderInventoryEntry] });
    useCosmeticsStore.getState().reset();
    const state = useCosmeticsStore.getState();
    expect(state.catalogue).toEqual([]);
    expect(state.inventory).toEqual([]);
    expect(state.memberCosmetics.size).toBe(0);
  });
});
