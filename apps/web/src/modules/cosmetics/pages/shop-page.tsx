/**
 * Shop Page — browse and purchase cosmetic items organized by type.
 *
 * Fetches entitlements alongside catalogue. Items show entitlement state.
 * Filter tabs: All | Owned | Available | Premium.
 * Purchase handler uses optimistic updates via store.
 *
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

import type { CosmeticItem, CosmeticType, Entitlement } from '@cgraph/shared-types';
import { CosmeticCard } from '../components/cosmetic-card';
import { EquipPanel } from '../components/equip-panel';
import { useCosmeticsStore } from '../store/cosmetics-store';
import { useEntitlements } from '../hooks/use-entitlements';
import { FADE_UP } from '@/lib/animations/transitions';
// Constants
const SHOP_SECTIONS: readonly { type: CosmeticType; label: string; icon: string }[] = [
  { type: 'badge', label: 'Badges', icon: '🛡️' },
  { type: 'nameplate', label: 'Nameplates', icon: '📛' },
  { type: 'name_style', label: 'Name Styles', icon: '✍️' },
  { type: 'avatar_border', label: 'Avatar Borders', icon: '🔲' },
  { type: 'title', label: 'Titles', icon: '🏷️' },
  { type: 'chat_bubble', label: 'Chat Bubbles', icon: '💬' },
  { type: 'theme', label: 'Themes', icon: '🎨' },
];

type FilterTab = 'all' | 'owned' | 'available' | 'premium';

const FILTER_TABS: readonly { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'owned', label: 'Owned' },
  { id: 'available', label: 'Available' },
  { id: 'premium', label: 'Premium' },
];
// Filter helper (module-level, pure function)
function filterItems(
  items: readonly CosmeticItem[],
  tab: FilterTab,
  entitledIds: ReadonlySet<string>
): CosmeticItem[] {
  switch (tab) {
    case 'owned':
      return items.filter((i) => entitledIds.has(i.id));
    case 'available':
      return items.filter(
        (i) => !entitledIds.has(i.id) && i.available && i.unlockType !== 'subscription'
      );
    case 'premium':
      return items.filter(
        (i) => i.unlockType === 'subscription' || i.unlockCondition.type === 'subscription_tier'
      );
    default:
      return [...items];
  }
}

/** Cosmetics shop — browse, filter, purchase, and equip cosmetic items. */
export function ShopPage() {
  const catalogue = useCosmeticsStore((s) => s.catalogue);
  const inventory = useCosmeticsStore((s) => s.inventory);
  const isLoadingCatalogue = useCosmeticsStore((s) => s.isLoadingCatalogue);
  const error = useCosmeticsStore((s) => s.error);
  const fetchCatalogue = useCosmeticsStore((s) => s.fetchCatalogue);
  const fetchInventory = useCosmeticsStore((s) => s.fetchInventory);
  const equipItem = useCosmeticsStore((s) => s.equipItem);
  const unequipItem = useCosmeticsStore((s) => s.unequipItem);
  const purchaseItem = useCosmeticsStore((s) => s.purchaseItem);

  const { entitlements, entitledSkuIds } = useEntitlements();
  const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  useEffect(() => {
    fetchCatalogue();
    fetchInventory();
  }, [fetchCatalogue, fetchInventory]);

  // Build entitlement lookup by SKU ID
  const entitlementsBySkuId = (() => {
    const map = new Map<string, Entitlement>();
    for (const ent of entitlements) {
      map.set(ent.sku.id, ent);
    }
    return map;
  })();

  const equippedIds = new Set(inventory.filter((e) => e.equipped).map((e) => e.cosmetic.id));

  // Group catalogue by type, apply filter tab
  const itemsByType = (() => {
    const map = new Map<CosmeticType, CosmeticItem[]>();
    const filtered = filterItems(catalogue, activeTab, entitledSkuIds);
    for (const item of filtered) {
      const list = map.get(item.type) ?? [];
      list.push(item);
      map.set(item.type, list);
    }
    return map;
  })();

  const handleToggleEquip = (item: CosmeticItem) => {
      if (equippedIds.has(item.id)) {
        unequipItem(item);
      } else {
        equipItem(item);
      }
      setSelectedItem(null);
    };

  const handlePurchase = (item: CosmeticItem) => {
      void purchaseItem(item);
    };

  if (isLoadingCatalogue && catalogue.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black/95">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <p className="mt-4 text-gray-400">Loading cosmetics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/95 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <h1 className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-3xl font-bold text-transparent">
            Cosmetics Shop
          </h1>
          <p className="mt-1 text-sm text-gray-400">Discover and equip unique cosmetic items</p>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>

        {/* Filter tabs */}
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-1 pb-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative whitespace-nowrap px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.id ? 'text-purple-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="shopFilterTab"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-purple-400"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="mx-auto max-w-7xl space-y-10 px-6 py-8">
        {SHOP_SECTIONS.map((section) => {
          const items = itemsByType.get(section.type) ?? [];
          if (items.length === 0 && activeTab !== 'all') return null;

          return (
            <motion.section key={section.type} {...FADE_UP} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <h2 className="text-xl font-semibold text-white">{section.label}</h2>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-400">
                  {items.length}
                </span>
              </div>

              {items.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {items.map((item) => (
                    <CosmeticCard
                      key={item.id}
                      item={item}
                      owned={entitledSkuIds.has(item.id)}
                      equipped={equippedIds.has(item.id)}
                      entitlement={entitlementsBySkuId.get(item.id)}
                      onSelect={setSelectedItem}
                      onPurchase={handlePurchase}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-gray-600">
                  No {section.label.toLowerCase()} available yet
                </div>
              )}
            </motion.section>
          );
        })}
      </div>

      {/* Equip panel */}
      <EquipPanel
        item={selectedItem}
        isEquipped={selectedItem ? equippedIds.has(selectedItem.id) : false}
        onToggleEquip={handleToggleEquip}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}

export default ShopPage;
