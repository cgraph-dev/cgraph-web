/**
 * NodeGateModal component
 *
 * Modal shown when a user tries to join a node-gated group.
 * Displays the group info, gate type, price, and handles the payment flow.
 *
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LockClosedIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { FADE_IN } from '@/lib/animations/transitions';
import { subscribeToGroup } from '@/modules/groups/services/group-subscription-api';
import { createLogger } from '@/lib/logger';
import type { Group } from '@/modules/groups/store';

const logger = createLogger('NodeGateModal');

interface NodeGateModalProps {
  readonly group: Group;
  readonly onSuccess: () => void;
  readonly onClose: () => void;
}

const GATE_TYPE_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  forever: 'Forever',
};

function formatGateDescription(gateType: string | null): string {
  if (gateType === 'forever') {
    return 'One-time payment — permanent access';
  }
  return 'Recurring — auto-renews. Cancel anytime.';
}

/**
 * Modal for node-gated group join flow.
 * Shows payment details and handles subscription.
 */
export function NodeGateModal({
  group,
  onSuccess,
  onClose,
}: NodeGateModalProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePayAndJoin(): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      await subscribeToGroup(group.id);
      onSuccess();
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message.includes('insufficient')
          ? 'Insufficient Nodes. Earn or purchase more to join.'
          : err instanceof Error
            ? err.message
            : 'Payment failed. Please try again.';
      setError(message);
      logger.error('Failed to subscribe to group:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      {...FADE_IN}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-2xl border border-[var(--token-card-border)] bg-[var(--token-card-bg)] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Group Info */}
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl">
            {group.iconUrl ? (
              <img src={group.iconUrl} alt={group.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-600 to-purple-600">
                <span className="text-xl font-bold text-white">
                  {group.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-white">{group.name}</h2>
            {group.description && (
              <p className="truncate text-sm text-gray-400">{group.description}</p>
            )}
          </div>
        </div>

        {/* Gate Info */}
        <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <LockClosedIcon className="h-5 w-5 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">
              This group requires a Node payment to join
            </span>
          </div>

          {/* Gate type badge */}
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
              {GATE_TYPE_LABELS[group.gate_type ?? ''] ?? 'Payment'}
            </span>
          </div>

          {/* Price display */}
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="h-6 w-6 text-amber-400" />
            <span className="text-2xl font-bold text-white">{group.gate_price_nodes ?? 0}</span>
            <span className="text-lg text-gray-400">Nodes</span>
          </div>

          {/* Recurring info */}
          <p className="mt-2 text-xs text-gray-400">{formatGateDescription(group.gate_type)}</p>
        </div>
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-[var(--token-card-bg)/0.6] py-3 text-gray-300 transition-colors hover:bg-[var(--token-card-bg)/0.8] disabled:opacity-50"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => void handlePayAndJoin()}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-amber-600 py-3 font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : 'Pay & Join'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
