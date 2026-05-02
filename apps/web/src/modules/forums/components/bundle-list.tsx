/**
 * BundleList — grid of content bundles for a forum with purchase flow.
 *
 * Fetches bundles via API and renders BundleCard components in a 2-column grid.
 * Forum owners see a "Create Bundle" button to open the bundle creator modal.
 *
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { PlusIcon, RectangleStackIcon } from '@heroicons/react/24/outline';
import { http } from '@/lib/api-client';
import { FADE_IN } from '@/lib/animations/transitions';
import { BundleCard } from './bundle-card';
import { BundleCreatorModal } from './bundle-creator-modal';
interface BundleData {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly price_nodes: number;
  readonly individual_total: number;
  readonly thread_count: number;
  readonly purchase_count: number;
  readonly is_purchased?: boolean;
}

interface BundleListProps {
  readonly forumId: string;
  readonly isOwner?: boolean;
}
export function BundleList({ forumId, isOwner = false }: BundleListProps) {
  const queryClient = useQueryClient();
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const { data: bundles = [], isLoading } = useQuery<BundleData[]>({
    queryKey: ['forum-bundles', forumId],
    queryFn: async () => {
      const res = await http.get<{ data: BundleData[] }>(`/api/v1/forums/${forumId}/bundles`);
      return res.data.data;
    },
    staleTime: 30_000,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (bundleId: string) => {
      setPurchasingId(bundleId);
      await http.post(`/api/v1/forums/${forumId}/bundles/${bundleId}/purchase`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-bundles', forumId] });
    },
    onSettled: () => {
      setPurchasingId(null);
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-[var(--token-bg-secondary)]" />
        ))}
      </div>
    );
  }

  if (bundles.length === 0 && !isOwner) {
    return (
      <motion.div
        {...FADE_IN}
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--token-card-border)] py-12"
      >
        <RectangleStackIcon className="mb-3 h-10 w-10 text-white/20" />
        <p className="text-sm text-white/40">No content bundles available</p>
      </motion.div>
    );
  }

  return (
    <motion.div {...FADE_IN} className="space-y-4">
      {/* Header with create button */}
      {isOwner && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsCreatorOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-500"
          >
            <PlusIcon className="h-4 w-4" />
            Create Bundle
          </button>
        </div>
      )}

      {/* Bundle grid */}
      {bundles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--token-card-border)] py-12">
          <RectangleStackIcon className="mb-3 h-10 w-10 text-white/20" />
          <p className="text-sm text-white/40">
            No content bundles yet. Create one to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {bundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              onPurchase={(id) => purchaseMutation.mutate(id)}
              isPurchasing={purchasingId === bundle.id}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {purchaseMutation.isError && (
        <p className="text-center text-xs text-red-400">
          Failed to complete purchase. Please try again.
        </p>
      )}

      {/* Creator modal */}
      {isOwner && (
        <BundleCreatorModal
          isOpen={isCreatorOpen}
          onClose={() => setIsCreatorOpen(false)}
          forumId={forumId}
        />
      )}
    </motion.div>
  );
}

export default BundleList;
