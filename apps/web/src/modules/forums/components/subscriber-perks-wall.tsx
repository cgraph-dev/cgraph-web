/**
 * SubscriberPerksWall — full subscription page showing all tiers for a forum.
 *
 * Fetches tiers and current subscription, displays a responsive grid of
 * SubscriberTierCard components, and handles subscribe/cancel flows.
 *
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { SparklesIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { http } from '@/lib/api-client';
import { FADE_IN } from '@/lib/animations/transitions';
import { cn } from '@/lib/utils';
import { SubscriberTierCard } from './subscriber-tier-card';
interface TierPerks {
  readonly flair_text?: string;
  readonly flair_color?: string;
  readonly boost_discount_percent?: number;
  readonly early_access_hours?: number;
  readonly locked_board_ids?: string[];
}

interface TierData {
  readonly id: string;
  readonly name: string;
  readonly monthly_price_nodes: number;
  readonly yearly_price_nodes?: number;
  readonly features: string[];
  readonly perks: TierPerks;
}

interface SubscriptionData {
  readonly id: string;
  readonly tier_id: string;
  readonly tier_name: string;
  readonly status: 'active' | 'cancelled' | 'expired';
  readonly current_period_end: string;
}

interface SubscriberPerksWallProps {
  readonly forumId: string;
}
function getGridColumns(count: number): string {
  if (count <= 1) return 'grid-cols-1 max-w-sm mx-auto';
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto';
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
export function SubscriberPerksWall({ forumId }: SubscriberPerksWallProps) {
  const queryClient = useQueryClient();
  const [subscribingTierId, setSubscribingTierId] = useState<string | null>(null);
  const { data: tiers = [], isLoading: isLoadingTiers } = useQuery<TierData[]>({
    queryKey: ['forum-tiers', forumId],
    queryFn: async () => {
      const res = await http.get<{ data: TierData[] }>(`/api/v1/forums/${forumId}/tiers`);
      return res.data.data;
    },
    staleTime: 60_000,
  });
  const { data: subscription } = useQuery<SubscriptionData | null>({
    queryKey: ['forum-subscription', forumId],
    queryFn: async () => {
      const res = await http.get<{ data: SubscriptionData | null }>(
        `/api/v1/forums/${forumId}/subscription`
      );
      return res.data.data;
    },
    staleTime: 30_000,
  });
  const subscribeMutation = useMutation({
    mutationFn: async (tierId: string) => {
      setSubscribingTierId(tierId);
      await http.post(`/api/v1/forums/${forumId}/subscription`, { tier_id: tierId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-subscription', forumId] });
      queryClient.invalidateQueries({ queryKey: ['forum-tiers', forumId] });
    },
    onSettled: () => {
      setSubscribingTierId(null);
    },
  });
  const cancelMutation = useMutation({
    mutationFn: async () => {
      await http.delete(`/api/v1/forums/${forumId}/subscription`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-subscription', forumId] });
    },
  });
  const activeSubscription = subscription?.status === 'active' ? subscription : null;
  const recommendedIndex = tiers.length === 3 ? 1 : -1;
  if (isLoadingTiers) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-xl bg-[var(--token-bg-secondary)]" />
        ))}
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <motion.div
        {...FADE_IN}
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--token-card-border)] py-16"
      >
        <SparklesIcon className="mb-3 h-10 w-10 text-white/20" />
        <p className="text-sm text-white/40">No subscription tiers available</p>
      </motion.div>
    );
  }

  return (
    <motion.div {...FADE_IN} className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">Subscription Tiers</h2>
        <p className="mt-1 text-sm text-white/40">Support this forum and unlock exclusive perks</p>
      </div>

      {/* Current subscription banner */}
      {activeSubscription && (
        <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-green-400">
              Subscribed to {activeSubscription.tier_name}
            </p>
            <p className="text-xs text-green-400/60">
              Renews {formatDate(activeSubscription.current_period_end)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
          >
            <XCircleIcon className="h-4 w-4" />
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
          </button>
        </div>
      )}

      {/* Tier grid */}
      <div className={cn('grid gap-4', getGridColumns(tiers.length))}>
        {tiers.map((tier, index) => (
          <SubscriberTierCard
            key={tier.id}
            tier={tier}
            isCurrentTier={activeSubscription?.tier_id === tier.id}
            isRecommended={index === recommendedIndex}
            onSubscribe={(id) => subscribeMutation.mutate(id)}
            isSubscribing={subscribingTierId === tier.id}
          />
        ))}
      </div>

      {/* Error states */}
      {subscribeMutation.isError && (
        <p className="text-center text-xs text-red-400">Failed to subscribe. Please try again.</p>
      )}
      {cancelMutation.isError && (
        <p className="text-center text-xs text-red-400">
          Failed to cancel subscription. Please try again.
        </p>
      )}
    </motion.div>
  );
}

export default SubscriberPerksWall;
