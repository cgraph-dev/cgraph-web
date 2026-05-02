/**
 * ForumPromotionPanel — admin panel for managing thread promotion settings.
 *
 * Allows forum owners to configure promotion types (boost, highlight, spotlight, bump)
 * with per-type pricing, max concurrency, and cooldown.
 *
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/api-client';
import { BoltIcon, SparklesIcon, StarIcon, FireIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
type PromotionType = 'boost' | 'highlight' | 'spotlight' | 'bump';

interface PromotionSettings {
  id?: string;
  forum_id: string;
  promotion_type: PromotionType;
  enabled: boolean;
  price_per_hour: number;
  max_concurrent: number;
  cooldown_hours: number;
}

interface ForumPromotionPanelProps {
  forumId: string;
}
const PROMOTION_TYPE_CONFIG: Record<
  PromotionType,
  {
    label: string;
    description: string;
    icon: typeof BoltIcon;
    color: string;
  }
> = {
  boost: {
    label: 'Boost',
    description: 'Increases thread visibility in feed ranking',
    icon: BoltIcon,
    color: 'text-blue-400',
  },
  highlight: {
    label: 'Highlight',
    description: 'Adds colored border and badge to thread card',
    icon: SparklesIcon,
    color: 'text-amber-400',
  },
  spotlight: {
    label: 'Spotlight',
    description: 'Pins thread at top of forum with spotlight badge',
    icon: StarIcon,
    color: 'text-purple-400',
  },
  bump: {
    label: 'Bump',
    description: 'Pushes thread back to top of Latest sort',
    icon: FireIcon,
    color: 'text-orange-400',
  },
};

const PROMOTION_TYPES: PromotionType[] = ['boost', 'highlight', 'spotlight', 'bump'];
export function ForumPromotionPanel({ forumId }: ForumPromotionPanelProps) {
  const queryClient = useQueryClient();
  const [editingType, setEditingType] = useState<PromotionType | null>(null);
  const { data: settings, isLoading } = useQuery<PromotionSettings[]>({
    queryKey: ['forum-promotion-settings', forumId],
    queryFn: async () => {
      const res = await http.get<{ data: PromotionSettings[] }>(
        `/api/v1/forums/${forumId}/promotion-settings`
      );
      return res.data.data;
    },
    staleTime: 60_000,
  });
  const updateMutation = useMutation({
    mutationFn: async ({
      type,
      attrs,
    }: {
      type: PromotionType;
      attrs: Partial<PromotionSettings>;
    }) => {
      await http.put(`/api/v1/forums/${forumId}/promotion-settings/${type}`, attrs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-promotion-settings', forumId] });
      setEditingType(null);
    },
  });
  function getSettingsForType(type: PromotionType): PromotionSettings | undefined {
    return settings?.find((s) => s.promotion_type === type);
  }
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-primary)] p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-48 rounded bg-[var(--token-card-bg)]" />
          <div className="h-20 rounded bg-[var(--token-card-bg)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-primary)] p-6">
      <div>
        <h3 className="text-base font-semibold text-white">Thread Promotions</h3>
        <p className="mt-1 text-xs text-white/50">
          Configure promotion types that members can purchase to boost their threads. You receive
          80% of promotion revenue.
        </p>
      </div>

      <div className="space-y-3">
        {PROMOTION_TYPES.map((type) => {
          const config = PROMOTION_TYPE_CONFIG[type];
          const typeSetting = getSettingsForType(type);
          const isEnabled = typeSetting?.enabled ?? false;
          const Icon = config.icon;

          return (
            <div
              key={type}
              className={cn(
                'rounded-lg border p-4 transition-colors',
                isEnabled
                  ? 'border-[var(--token-card-border)] bg-[var(--token-bg-secondary)]'
                  : 'border-[var(--token-card-border)] bg-[var(--token-bg-primary)] opacity-60'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className={cn('h-5 w-5', config.color)} />
                  <div>
                    <span className="text-sm font-medium text-white">{config.label}</span>
                    <p className="text-xs text-white/50">{config.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEnabled && (
                    <span className="text-xs text-white/50">
                      {typeSetting?.price_per_hour ?? 0} Nodes/hr
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingType(editingType === type ? null : type)}
                    className="rounded px-2 py-1 text-xs text-white/60 hover:bg-[var(--token-card-bg)] hover:text-white"
                  >
                    {editingType === type ? 'Cancel' : 'Configure'}
                  </button>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={isEnabled}
                      onChange={() =>
                        updateMutation.mutate({
                          type,
                          attrs: {
                            enabled: !isEnabled,
                            price_per_hour: typeSetting?.price_per_hour ?? 10,
                          },
                        })
                      }
                    />
                    <div className="h-5 w-9 rounded-full bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary-600 peer-checked:after:translate-x-full" />
                  </label>
                </div>
              </div>

              {/* Expanded editor */}
              {editingType === type && (
                <PromotionTypeEditor
                  type={type}
                  settings={typeSetting}
                  onSave={(attrs) => updateMutation.mutate({ type, attrs })}
                  isSaving={updateMutation.isPending}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
function PromotionTypeEditor({
  type,
  settings,
  onSave,
  isSaving,
}: {
  type: PromotionType;
  settings: PromotionSettings | undefined;
  onSave: (attrs: Partial<PromotionSettings>) => void;
  isSaving: boolean;
}) {
  const [pricePerHour, setPricePerHour] = useState(settings?.price_per_hour ?? 10);
  const [maxConcurrent, setMaxConcurrent] = useState(settings?.max_concurrent ?? 3);
  const [cooldownHours, setCooldownHours] = useState(settings?.cooldown_hours ?? 24);

  return (
    <div className="mt-4 space-y-3 border-t border-[var(--token-card-border)] pt-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-white/50">
            Price per hour (Nodes)
          </label>
          <input
            type="number"
            min={1}
            value={pricePerHour}
            onChange={(e) => setPricePerHour(Number(e.target.value))}
            className="w-full rounded-md border border-[var(--token-card-border)] bg-[var(--token-bg-primary)] px-2.5 py-1.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-white/50">Max concurrent</label>
          <input
            type="number"
            min={1}
            max={10}
            value={maxConcurrent}
            onChange={(e) => setMaxConcurrent(Number(e.target.value))}
            className="w-full rounded-md border border-[var(--token-card-border)] bg-[var(--token-bg-primary)] px-2.5 py-1.5 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-white/50">
            Cooldown (hours)
          </label>
          <input
            type="number"
            min={0}
            value={cooldownHours}
            onChange={(e) => setCooldownHours(Number(e.target.value))}
            className="w-full rounded-md border border-[var(--token-card-border)] bg-[var(--token-bg-primary)] px-2.5 py-1.5 text-sm text-white"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={isSaving || pricePerHour < 1}
          onClick={() =>
            onSave({
              enabled: true,
              price_per_hour: pricePerHour,
              max_concurrent: maxConcurrent,
              cooldown_hours: cooldownHours,
            })
          }
          className="rounded-lg bg-primary-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-500 disabled:opacity-40"
        >
          {isSaving ? 'Saving...' : `Save ${PROMOTION_TYPE_CONFIG[type].label} Settings`}
        </button>
      </div>
    </div>
  );
}

export default ForumPromotionPanel;
