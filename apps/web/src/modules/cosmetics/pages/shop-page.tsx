import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, ShoppingBag } from 'lucide-react';
import type { CosmeticItem, CosmeticType, Entitlement } from '@cgraph-dev/shared-types';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import Skeleton from '@/components/ui/skeleton';
import { CosmeticCard } from '../components/cosmetic-card';
import { CosmeticTypeIcon } from '../components/cosmetic-type-icon';
import { EquipPanel } from '../components/equip-panel';
import { useCosmeticsStore } from '../store/cosmetics-store';

type ShopFilter = 'all' | 'owned' | 'available' | 'premium';

const FILTERS: readonly { id: ShopFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'owned', label: 'Owned' },
  { id: 'available', label: 'Available' },
  { id: 'premium', label: 'Premium' },
];

const CATEGORY_LABELS: Partial<Record<CosmeticType, string>> = {
  avatar_border: 'Avatar borders',
  avatar_frame: 'Avatar frames',
  badge: 'Badges',
  nameplate: 'Nameplates',
  title: 'Titles',
  profile_effect: 'Profile effects',
  profile_theme: 'Themes',
};

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

function filterCatalogue(
  catalogue: readonly CosmeticItem[],
  filter: ShopFilter,
  ownedIds: ReadonlySet<string>,
  query: string
): CosmeticItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return catalogue.filter((item) => {
    const owned = ownedIds.has(item.id);
    const premium =
      item.unlockType === 'subscription' || item.unlockCondition.type === 'subscription_tier';
    const matchesFilter =
      filter === 'all' ||
      (filter === 'owned' && owned) ||
      (filter === 'available' && !owned && item.available && !premium) ||
      (filter === 'premium' && premium);
    const matchesQuery =
      normalizedQuery.length === 0 ||
      item.name.toLocaleLowerCase().includes(normalizedQuery) ||
      item.type.replaceAll('_', ' ').includes(normalizedQuery);
    return matchesFilter && matchesQuery;
  });
}

function ShopSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-lg border border-[var(--product-line)]">
            <Skeleton className="aspect-[4/3] rounded-none" />
            <div className="space-y-2 p-3">
              <Skeleton variant="text" width="72%" />
              <Skeleton variant="text" width="44%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ShopPage() {
  const catalogue = useCosmeticsStore((state) => state.catalogue);
  const inventory = useCosmeticsStore((state) => state.inventory);
  const entitlements = useCosmeticsStore((state) => state.entitlements);
  const isLoading = useCosmeticsStore(
    (state) =>
      state.isLoadingCatalogue || state.isLoadingInventory || state.isLoadingEntitlements
  );
  const isEquipping = useCosmeticsStore((state) => state.isEquipping);
  const error = useCosmeticsStore((state) => state.error);
  const fetchCatalogue = useCosmeticsStore((state) => state.fetchCatalogue);
  const fetchInventory = useCosmeticsStore((state) => state.fetchInventory);
  const fetchEntitlements = useCosmeticsStore((state) => state.fetchEntitlements);
  const equipItem = useCosmeticsStore((state) => state.equipItem);
  const unequipItem = useCosmeticsStore((state) => state.unequipItem);
  const [activeFilter, setActiveFilter] = useState<ShopFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<CosmeticItem | null>(null);

  const refresh = useCallback(
    () => Promise.all([fetchCatalogue(), fetchInventory(), fetchEntitlements()]),
    [fetchCatalogue, fetchEntitlements, fetchInventory]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const ownedIds = useMemo(
    () => new Set(inventory.map((entry) => entry.cosmetic.id)),
    [inventory]
  );
  const equippedIds = useMemo(
    () => new Set(inventory.filter((entry) => entry.equipped).map((entry) => entry.cosmetic.id)),
    [inventory]
  );
  const visibleItems = useMemo(
    () => filterCatalogue(catalogue, activeFilter, ownedIds, query),
    [activeFilter, catalogue, ownedIds, query]
  );
  const sections = useMemo(() => {
    const grouped = new Map<CosmeticType, CosmeticItem[]>();
    for (const item of visibleItems) {
      grouped.set(item.type, [...(grouped.get(item.type) ?? []), item]);
    }
    return [...grouped.entries()];
  }, [visibleItems]);

  const selectedInventory = selectedItem
    ? inventory.find((entry) => entry.cosmetic.id === selectedItem.id)
    : undefined;
  const selectedEntitlement = selectedItem
    ? entitlementForItem(selectedItem, entitlements)
    : undefined;

  const toggleEquip = (item: CosmeticItem) => {
    void (equippedIds.has(item.id) ? unequipItem(item) : equipItem(item));
  };

  if (isLoading && catalogue.length === 0) {
    return <ShopSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <label className="relative block">
          <span className="sr-only">Search cosmetics</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-brand-green)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search cosmetics"
            className="h-10 w-full rounded-lg border border-[var(--product-line)] bg-[var(--product-surface-recessed)] pl-10 pr-3 text-sm text-[var(--token-text-primary)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--token-text-muted)] focus:border-[var(--token-interactive-primary)] focus:ring-1 focus:ring-[var(--color-brand-green)]"
          />
        </label>

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
            {visibleItems.length} item{visibleItems.length === 1 ? '' : 's'}
          </span>
        </div>
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

      {sections.length > 0 ? (
        <div className="space-y-7">
          {sections.map(([type, items]) => (
            <section key={type} aria-labelledby={`shop-${type}`}>
              <div className="mb-3 flex items-center gap-2">
                <CosmeticTypeIcon
                  type={type}
                  className="h-4 w-4 text-[var(--token-interactive-primary)]"
                />
                <h3
                  id={`shop-${type}`}
                  className="text-sm font-semibold text-[var(--token-text-primary)]"
                >
                  {CATEGORY_LABELS[type] ?? type.replaceAll('_', ' ')}
                </h3>
                <span className="text-xs text-[var(--token-text-muted)]">{items.length}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                  <CosmeticCard
                    key={`${item.type}:${item.id}`}
                    item={item}
                    owned={ownedIds.has(item.id)}
                    equipped={equippedIds.has(item.id)}
                    entitlement={entitlementForItem(item, entitlements)}
                    onSelect={setSelectedItem}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<ShoppingBag className="h-7 w-7" />}
          title={query ? 'No cosmetics found' : 'No cosmetics in this view'}
          message={
            query
              ? 'Try another name or cosmetic category.'
              : 'Choose another filter to browse the available catalogue.'
          }
        />
      )}

      <EquipPanel
        item={selectedItem}
        owned={Boolean(selectedInventory)}
        isEquipped={selectedInventory?.equipped ?? false}
        isWorking={isEquipping}
        entitlement={selectedEntitlement}
        onToggleEquip={toggleEquip}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}

export default ShopPage;
