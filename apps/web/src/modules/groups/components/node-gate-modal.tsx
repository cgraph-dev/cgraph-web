/**
 * NodeGateModal component
 *
 * Modal shown when a user tries to join a node-gated group.
 * Displays the group info, gate type, price, and handles the payment flow.
 *
 */

import React, { useState } from 'react';
import { LockClosedIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent ariaLabel={`${group.name} access`}>
        <DialogHeader>
          <div className="flex items-center gap-4">
          <div className="cgraph-empty-icon mb-0 h-14 w-14 flex-shrink-0 overflow-hidden p-0">
            {group.iconUrl ? (
              <img src={group.iconUrl} alt={group.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-xl font-semibold text-[var(--token-text-primary)]">
                  {group.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate">{group.name}</DialogTitle>
            {group.description && (
              <DialogDescription className="truncate">{group.description}</DialogDescription>
            )}
          </div>
        </div>
        </DialogHeader>

        <div className="cgraph-section-surface mt-5 border-amber-500/20 bg-amber-500/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <LockClosedIcon className="h-5 w-5 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">
              This group requires a Node payment to join
            </span>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-md bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-300">
              {GATE_TYPE_LABELS[group.gate_type ?? ''] ?? 'Payment'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="h-6 w-6 text-amber-400" />
            <span className="text-2xl font-semibold text-[var(--token-text-primary)]">
              {group.gate_price_nodes ?? 0}
            </span>
            <span className="text-lg text-[var(--token-text-muted)]">Nodes</span>
          </div>

          <p className="mt-2 text-xs text-[var(--token-text-muted)]">
            {formatGateDescription(group.gate_type)}
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="secondary"
            animated={false}
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            animated={false}
            onClick={() => void handlePayAndJoin()}
            isLoading={isLoading}
          >
            Pay & Join
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
