/**
 * NodeGatingSection component
 *
 * Admin-only section in group settings to configure node-gated access.
 * Allows the group owner to toggle node gating, set the gate type, and price.
 *
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CurrencyDollarIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useGroupStore } from '@/modules/groups/store';
import { createLogger } from '@/lib/logger';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { Group } from '@/modules/groups/store';

const logger = createLogger('NodeGatingSection');

const MIN_GATE_PRICE = 10;

const GATE_TYPE_OPTIONS = [
  { value: 'weekly', label: 'Weekly', description: 'Members pay every week' },
  { value: 'monthly', label: 'Monthly', description: 'Members pay every month' },
  { value: 'forever', label: 'Forever', description: 'One-time payment, permanent access' },
] as const;

interface NodeGatingSectionProps {
  readonly group: Group;
  readonly isOwner: boolean;
}

/**
 * Node gating configuration section for group settings.
 * Only visible to group owners.
 */
export function NodeGatingSection({
  group,
  isOwner,
}: NodeGatingSectionProps): React.JSX.Element | null {
  const { updateGroup } = useGroupStore();

  const [isEnabled, setIsEnabled] = useState(group.is_node_gated);
  const [gateType, setGateType] = useState<'weekly' | 'monthly' | 'forever'>(
    group.gate_type ?? 'monthly'
  );
  const [price, setPrice] = useState<number>(group.gate_price_nodes ?? MIN_GATE_PRICE);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOwner) return null;

  function handlePriceChange(value: string): void {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      setPrice(MIN_GATE_PRICE);
      return;
    }
    setPrice(Math.max(MIN_GATE_PRICE, parsed));
  }

  async function handleSave(): Promise<void> {
    setIsSaving(true);
    setError(null);
    try {
      await updateGroup(group.id, {
        is_node_gated: isEnabled,
        gate_type: isEnabled ? gateType : null,
        gate_price_nodes: isEnabled ? price : null,
      });
      HapticFeedback.success();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save gating settings';
      setError(message);
      logger.error('Failed to save node gating settings:', err);
      HapticFeedback.error();
    } finally {
      setIsSaving(false);
    }
  }

  const hasChanges =
    isEnabled !== group.is_node_gated ||
    gateType !== (group.gate_type ?? 'monthly') ||
    price !== (group.gate_price_nodes ?? MIN_GATE_PRICE);

  return (
    <div className="rounded-xl border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] p-6">
      <div className="mb-4 flex items-center gap-2">
        <CurrencyDollarIcon className="h-5 w-5 text-amber-400" />
        <h3 className="font-semibold text-white">Node-Gated Access</h3>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between rounded-lg bg-[var(--token-card-bg)/0.4] p-4">
        <div>
          <span className="font-medium text-white">Require Node Payment to Join</span>
          <p className="text-xs text-gray-400">Members must pay Nodes to access this group</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsEnabled(!isEnabled)}
          className={`h-6 w-12 rounded-full transition-colors ${
            isEnabled ? 'bg-amber-500' : 'bg-[var(--token-card-bg)]'
          }`}
          aria-label="Toggle node gating"
        >
          <motion.div
            animate={{ x: isEnabled ? 24 : 0 }}
            className="h-6 w-6 rounded-full bg-white shadow-lg"
          />
        </motion.button>
      </div>

      {/* Gating options (shown when enabled) */}
      {isEnabled && (
        <div className="mt-4 space-y-4">
          {/* Gate type selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Payment Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GATE_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGateType(option.value)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    gateType === option.value
                      ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                      : 'border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] text-gray-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="mt-0.5 text-xs opacity-70">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Price input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">Price (Nodes)</label>
            <div className="relative">
              <input
                type="number"
                min={MIN_GATE_PRICE}
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-card-bg)/0.4] px-4 py-2 pr-16 text-white focus:border-amber-500 focus:outline-none"
                aria-label="Gate price in nodes"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                Nodes
              </span>
            </div>
            {price < MIN_GATE_PRICE && (
              <p className="mt-1 text-xs text-red-400">Minimum price is {MIN_GATE_PRICE} Nodes</p>
            )}
          </div>

          {/* Revenue split info */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <InformationCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
            <div className="text-xs text-amber-300/80">
              <p className="font-medium text-amber-300">Revenue Split: 80/20</p>
              <p className="mt-1">
                You receive 80% of all node payments ({Math.floor(price * 0.8)} Nodes per member).
                The platform retains 20% ({Math.ceil(price * 0.2)} Nodes).
              </p>
            </div>
          </div>
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Save button */}
          {hasChanges && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => void handleSave()}
              disabled={isSaving || price < MIN_GATE_PRICE}
              className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Gating Settings'}
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
