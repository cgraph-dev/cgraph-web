/**
 * PromoteThreadModal — modal for promoting a thread with Node-based pricing.
 *
 * Users select a promotion type and duration, see the cost breakdown,
 * then confirm to debit Nodes and activate the promotion.
 *
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import { BoltIcon, SparklesIcon, StarIcon, FireIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { http } from '@/lib/api-client';
import { useNodesStore } from '@/modules/nodes/store/nodesStore';
import { cn } from '@/lib/utils';
type PromotionType = 'boost' | 'highlight' | 'spotlight' | 'bump';

interface PromotionSetting {
  promotion_type: PromotionType;
  enabled: boolean;
  price_per_hour: number;
  max_concurrent: number;
  cooldown_hours: number;
}

interface PromoteThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  forumId: string;
  threadId: string;
  threadTitle: string;
}
const DURATION_OPTIONS = [1, 3, 6, 12, 24, 48, 72] as const;

const TYPE_CONFIG: Record<
  PromotionType,
  {
    label: string;
    icon: typeof BoltIcon;
    color: string;
    bg: string;
  }
> = {
  boost: { label: 'Boost', icon: BoltIcon, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  highlight: {
    label: 'Highlight',
    icon: SparklesIcon,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
  },
  spotlight: {
    label: 'Spotlight',
    icon: StarIcon,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
  },
  bump: { label: 'Bump', icon: FireIcon, color: 'text-orange-400', bg: 'bg-orange-500/15' },
};
export function PromoteThreadModal({
  isOpen,
  onClose,
  forumId,
  threadId,
  threadTitle,
}: PromoteThreadModalProps) {
  const queryClient = useQueryClient();
  const wallet = useNodesStore((s) => s.wallet);
  const [selectedType, setSelectedType] = useState<PromotionType | null>(null);
  const [durationHours, setDurationHours] = useState(6);
  const { data: promotionSettings } = useQuery<PromotionSetting[]>({
    queryKey: ['forum-promotion-settings', forumId],
    queryFn: async () => {
      const res = await http.get<{ data: PromotionSetting[] }>(
        `/api/v1/forums/${forumId}/promotion-settings/public`
      );
      return res.data.data;
    },
    enabled: isOpen,
    staleTime: 30_000,
  });
  const promoteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedType) return;
      await http.post(`/api/v1/forums/${forumId}/threads/${threadId}/promote`, {
        type: selectedType,
        duration_hours: durationHours,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-promotions', forumId] });
      onClose();
    },
  });
  const enabledTypes = (promotionSettings ?? []).filter((s) => s.enabled);
  const selectedSetting = enabledTypes.find((s) => s.promotion_type === selectedType);
  const totalCost = selectedSetting ? selectedSetting.price_per_hour * durationHours : 0;
  const balance = wallet?.available_balance ?? 0;
  const canAfford = balance >= totalCost;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-[var(--token-card-border)] bg-[var(--token-bg-primary)] p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Promote Thread</h3>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-1 line-clamp-1 text-sm text-white/50">{threadTitle}</p>

            {/* No promotions available */}
            {enabledTypes.length === 0 && (
              <p className="mt-6 text-center text-sm text-white/40">
                No promotion types are enabled for this forum.
              </p>
            )}

            {/* Promotion type selection */}
            {enabledTypes.length > 0 && (
              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-medium text-white/60">Select Type</span>
                  <div className="grid grid-cols-2 gap-2">
                    {enabledTypes.map((setting) => {
                      const config = TYPE_CONFIG[setting.promotion_type];
                      const Icon = config.icon;
                      const isSelected = selectedType === setting.promotion_type;

                      return (
                        <button
                          key={setting.promotion_type}
                          type="button"
                          onClick={() => setSelectedType(setting.promotion_type)}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border p-3 text-left transition-all',
                            isSelected
                              ? 'border-primary/50 bg-primary/5'
                              : 'border-[var(--token-card-border)] hover:bg-[var(--token-bg-secondary)]'
                          )}
                        >
                          <Icon className={cn('h-5 w-5', config.color)} />
                          <div>
                            <span className="block text-sm font-medium text-white">
                              {config.label}
                            </span>
                            <span className="text-[10px] text-white/40">
                              {setting.price_per_hour} Nodes/hr
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Duration selection */}
                {selectedType && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-white/60">Duration</span>
                    <div className="flex flex-wrap gap-2">
                      {DURATION_OPTIONS.map((hours) => (
                        <button
                          key={hours}
                          type="button"
                          onClick={() => setDurationHours(hours)}
                          className={cn(
                            'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                            durationHours === hours
                              ? 'bg-primary-600 text-white'
                              : 'bg-[var(--token-bg-secondary)] text-white/60 hover:text-white'
                          )}
                        >
                          {hours}h
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cost breakdown */}
                {selectedType && selectedSetting && (
                  <div className="rounded-lg bg-[var(--token-bg-secondary)] p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">
                        {selectedSetting.price_per_hour} Nodes × {durationHours}h
                      </span>
                      <span className="font-semibold text-white">{totalCost} Nodes</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-white/40">Your balance</span>
                      <span className={canAfford ? 'text-green-400' : 'text-red-400'}>
                        {balance} Nodes
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] text-white/30">
                      Forum owner receives 80% of promotion revenue.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-lg bg-[var(--token-bg-secondary)] px-4 py-2 text-sm font-medium text-white/70 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedType || !canAfford || promoteMutation.isPending}
                    onClick={() => promoteMutation.mutate()}
                    className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-40"
                  >
                    {promoteMutation.isPending ? 'Promoting...' : `Promote for ${totalCost} Nodes`}
                  </button>
                </div>

                {promoteMutation.isError && (
                  <p className="text-center text-xs text-red-400">
                    Failed to promote thread. Please try again.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PromoteThreadModal;
