import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type {
  CosmeticItem,
  Entitlement,
  UnlockType,
  UserCosmeticInventory,
} from '@cgraph-dev/shared-types';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import Skeleton from '@/components/ui/skeleton';
import { CosmeticCard } from '../components/cosmetic-card';
import { EquipPanel } from '../components/equip-panel';
import { useCosmeticsStore } from '../store/cosmetics-store';

type InventoryFilter = 'all' | 'purchase' | 'subscription' | 'gift' | 'reward';

const FILTERS: readonly { id: InventoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'purchase', label: 'Permanent' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'gift', label: 'Gifts' },
  { id: 'reward', label: 'Rewards' },
];

function sourceMatchesFilter(source: UnlockType, filter: InventoryFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'reward') return ['achievement', 'level', 'event', 'admin'].includes(source);
  return source === filter;
}

function entitlementForItem(
  item: CosmeticItem,
  entitlements: readonly Entitlement[]
): Entitlement | undefined {
  return entitlements.find(
    (entitlement) =>
      entitlement.sku.cosmeticId === item.id ||
      entitlement.sku.id === item.id ||
      entitlement.sku.slug === item.slug
  );
}

function enrichInventory(
  inventory: readonly UserCosmeticInventory[],
  catalogue: readonly CosmeticItem[]
): UserCosmeticInventory[] {
  const byId = new Map(catalogue.map((item) => [item.id, item]));
  const bySlug = new Map(catalogue.map((item) => [item.slug, item]));

  return inventory.map((entry) => ({
    ...entry,
    cosmetic:
      byId.get(entry.cosmetic.id) ??
      bySlug.get(entry.cosmetic.slug) ??
      entry.cosmetic,
  }));
}

function InventorySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-[var(--product-line)]">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="45%" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function InventoryPage() {
  const navigate = useNavigate();
  const catalogue = useCosmeticsStore((state) => state.catalogue);
  const inventory = useCosmeticsStore((state) => state.inventory);
  const entitlements = useCosmeticsStore((state) => state.entitlements);
  const isLoading = useCosmeticsStore(
    (state) =>
      state.isLoadingInventory || state.isLoadingCatalogue || state.isLoadingEntitlements
  );
  const isEquipping = useCosmeticsStore((state) => state.isEquipping);
  const error = useCosmeticsStore((state) => state.error);
  const fetchCatalogue = useCosmeticsStore((state) => state.fetchCatalogue);
  const fetchInventory = useCosmeticsStore((state) => state.fetchInventory);
  const fetchEntitlements = useCosmeticsStore((state) => state.fetchEntitlements);
  const equipItem = useCosmeticsStore((state) => state.equipItem);
  const unequipItem = useCosmeticsStore((state) => state.unequipItem);
  const [activeFilter, setActiveFilter] = useState<InventoryFilter>('all');
  const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);

  const refresh = useCallback(
    () => Promise.all([fetchCatalogue(), fetchInventory(), fetchEntitlements()]),
    [fetchCatalogue, fetchEntitlements, fetchInventory]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const entries = useMemo(
    () =>
      enrichInventory(inventory, catalogue)
        .filter((entry) => sourceMatchesFilter(entry.source, activeFilter))
        .sort((a, b) => {
          if (a.equipped !== b.equipped) return a.equipped ? -1 : 1;
          return b.acquiredAt.localeCompare(a.acquiredAt);
        }),
    [activeFilter, catalogue, inventory]
  );

  const selectedEntry = selectedItem
    ? entries.find((entry) => entry.cosmetic.id === selectedItem.id) ??
      inventory.find((entry) => entry.cosmetic.id === selectedItem.id)
    : undefined;
  const selectedEntitlement = selectedItem
    ? entitlementForItem(selectedItem, entitlements)
    : undefined;

  const toggleEquip = (item: CosmeticItem) => {
    const entry = inventory.find((candidate) => candidate.cosmetic.id === item.id);
    void (entry?.equipped ? unequipItem(item) : equipItem(item));
  };

  if (isLoading && inventory.length === 0) {
    return <InventorySkeleton />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="cgraph-segmented scrollbar-hide max-w-full overflow-x-auto" role="tablist">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={activeFilter === filter.id}
              className="cgraph-segmented-item shrink-0 px-3 text-sm font-medium"
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <span className="text-sm text-[var(--token-text-muted)]">
          {inventory.length} owned
        </span>
      </div>

      {error ? (
        <div
          role="alert"
          className="cgraph-section-surface flex flex-wrap items-center justify-between gap-3 border-[color-mix(in_srgb,var(--token-feedback-error)_35%,transparent)] px-4 py-3"
        >
          <p className="text-sm text-[var(--token-feedback-error)]">{error}</p>
          <Button
            variant="outline"
            size="sm"
            animated={false}
            leftIcon={<RefreshCw />}
            onClick={() => void refresh()}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {entries.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {entries.map((entry) => (
            <CosmeticCard
              key={`${entry.cosmetic.type}:${entry.cosmetic.id}`}
              item={entry.cosmetic}
              owned
              equipped={entry.equipped}
              entitlement={entitlementForItem(entry.cosmetic, entitlements)}
              onSelect={setSelectedItem}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Archive className="h-7 w-7" />}
          title={activeFilter === 'all' ? 'Your inventory is empty' : 'No matching cosmetics'}
          message={
            activeFilter === 'all'
              ? 'Owned cosmetics will appear here when they are unlocked.'
              : 'Choose another ownership filter to see your items.'
          }
          action={
            activeFilter === 'all'
              ? { label: 'Browse Shop', onClick: () => navigate('../shop', { relative: 'path' }) }
              : undefined
          }
        />
      )}

      <EquipPanel
        item={selectedItem}
        owned={Boolean(selectedEntry)}
        isEquipped={selectedEntry?.equipped ?? false}
        isWorking={isEquipping}
        entitlement={selectedEntitlement}
        onToggleEquip={toggleEquip}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}

export default InventoryPage;
