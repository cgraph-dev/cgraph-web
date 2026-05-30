/**
 * Inventory Page — browse and manage owned cosmetic entitlements.
 *
 * Cursor-based pagination, entitlement grouping, IntersectionObserver infinite scroll.
 * Expired items greyed out. Sorted: active first, then by grantedAt desc.
 *
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Entitlement, EntitlementType } from '@cgraph-dev/shared-types';
import { useCosmeticsStore } from '../store/cosmetics-store';
import { EntitlementBadge } from '../components/entitlement-badge';
import { FADE_IN } from '@/lib/animations/transitions';
type GroupId = EntitlementType | 'all';

const GROUP_TABS: readonly { id: GroupId; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'purchase', label: 'Permanent' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'gift', label: 'Gifts' },
  { id: 'reward', label: 'Rewards' },
];

function isExpired(ent: Entitlement): boolean {
  return ent.expiresAt ? new Date(ent.expiresAt).getTime() < Date.now() : false;
}

function sortEntitlements(items: readonly Entitlement[]): Entitlement[] {
  return [...items].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime();
  });
}

/** Displays the user's owned cosmetic entitlements with equip/unequip controls. */
export function InventoryPage() {
  const entitlements = useCosmeticsStore((s) => s.entitlements);
  const isLoading = useCosmeticsStore((s) => s.isLoadingEntitlements);
  const error = useCosmeticsStore((s) => s.error);
  const inventoryCursor = useCosmeticsStore((s) => s.inventoryCursor);
  const inventoryHasMore = useCosmeticsStore((s) => s.inventoryHasMore);
  const fetchInventoryPage = useCosmeticsStore((s) => s.fetchInventoryPage);
  const [activeGroup, setActiveGroup] = useState<GroupId>('all');
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (entitlements.length === 0) void fetchInventoryPage();
  }, [entitlements.length, fetchInventoryPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && inventoryHasMore && !isLoading && inventoryCursor) {
          void fetchInventoryPage(inventoryCursor);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [inventoryCursor, inventoryHasMore, isLoading, fetchInventoryPage]);

  const filteredItems =
    activeGroup === 'all' ? entitlements : entitlements.filter((e: Entitlement) => e.type === activeGroup);
  const filtered = sortEntitlements(filteredItems);

  function handleSelect(_ent: Entitlement) {
    /* future detail panel */
  }

  if (isLoading && entitlements.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black/95">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/95 text-white">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <h1 className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
            My Inventory
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {entitlements.length} entitlement{entitlements.length !== 1 ? 's' : ''}
          </p>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </div>
        <div className="mx-auto max-w-7xl overflow-x-auto px-6">
          <div className="flex gap-1 pb-2">
            {GROUP_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveGroup(tab.id)}
                className={`relative whitespace-nowrap px-4 py-2 text-sm font-medium transition-all ${
                  activeGroup === tab.id ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
                {activeGroup === tab.id && (
                  <motion.div
                    layoutId="inventoryTab"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-cyan-400"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 pb-12">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            <motion.div
              key="grid"
              {...FADE_IN}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            >
              {filtered.map((ent) => {
                const expired = isExpired(ent);
                return (
                  <motion.button
                    key={ent.id}
                    type="button"
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => handleSelect(ent)}
                    className={`relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all ${
                      expired
                        ? 'border-white/5 bg-white/[0.02] opacity-50 grayscale'
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    {expired && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/40">
                        <span className="text-sm font-medium text-gray-400">Expired</span>
                      </div>
                    )}
                    <span className="truncate text-sm font-medium text-white">
                      {ent.sku.name || ent.sku.slug}
                    </span>
                    <span className="text-xs capitalize text-gray-500">
                      {ent.sku.type.replace('_', ' ')}
                    </span>
                    <EntitlementBadge
                      entitled={ent.active && !expired}
                      isPremiumOnly={ent.sku.isPremiumOnly}
                      expired={expired}
                    />
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              {...FADE_IN}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <span className="text-5xl">📦</span>
              <p className="mt-4 text-lg font-medium text-gray-400">No items found</p>
              <p className="mt-1 text-sm text-gray-600">Visit the shop to start collecting!</p>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={sentinelRef} className="h-4" />
        {isLoading && entitlements.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}

export default InventoryPage;
