import React, { useState } from 'react';
import { CurrencyDollarIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { PLATFORM_CUT_PERCENT } from '@cgraph-dev/shared-types/nodes';
import { Button } from '@/components/ui/button';
import Card from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useGroupStore } from '@/modules/groups/store';
import { createLogger } from '@/lib/logger';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getGroupPermissionError } from '../../permission-errors';
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
      setError(
        getGroupPermissionError(
          err,
          'You do not have permission to update node-gated access for this group.',
          'Could not save node-gated access. Please try again.'
        )
      );
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
  const platformCut = Math.floor((price * PLATFORM_CUT_PERCENT) / 100);
  const ownerAmount = price - platformCut;
  const ownerPercent = 100 - PLATFORM_CUT_PERCENT;

  return (
    <Card padding="lg">
      <div className="mb-4 flex items-center gap-2">
        <CurrencyDollarIcon
          className="h-5 w-5 text-[var(--token-interactive-primary)]"
          aria-hidden="true"
        />
        <h3 className="font-semibold text-[var(--token-text-primary)]">Node-Gated Access</h3>
      </div>

      <div
        className="cgraph-list-row flex items-center justify-between"
        data-cgraph-material="recessed"
      >
        <div className="min-w-0 pr-4">
          <label
            htmlFor="group-settings-node-gating"
            className="font-medium text-[var(--token-text-primary)]"
          >
            Require Node payment to join
          </label>
          <p className="text-xs text-[var(--token-text-muted)]">
            Members must pay Nodes to access this group
          </p>
        </div>
        <Switch
          id="group-settings-node-gating"
          checked={isEnabled}
          onCheckedChange={setIsEnabled}
          disabled={isSaving}
          ariaLabel="Toggle node gating"
          className="shrink-0"
        />
      </div>

      {isEnabled && (
        <div className="mt-4 space-y-4">
          <Select
            id="group-settings-gate-frequency"
            label="Payment frequency"
            value={gateType}
            options={GATE_TYPE_OPTIONS}
            hint={GATE_TYPE_OPTIONS.find((option) => option.value === gateType)?.description}
            disabled={isSaving}
            onChange={(event) => {
              const option = GATE_TYPE_OPTIONS.find(
                ({ value }) => value === event.target.value
              );
              if (option) setGateType(option.value);
            }}
          />

          <Input
            id="group-settings-gate-price"
            type="number"
            label="Price (Nodes)"
            min={MIN_GATE_PRICE}
            value={price}
            rightIcon={<span className="text-xs">Nodes</span>}
            disabled={isSaving}
            aria-label="Gate price in nodes"
            hint={`Minimum ${MIN_GATE_PRICE} Nodes`}
            onChange={(event) => handlePriceChange(event.target.value)}
          />

          <div className="cgraph-section-surface flex items-start gap-2 p-3">
            <InformationCircleIcon
              className="mt-0.5 h-4 w-4 shrink-0 text-[var(--token-feedback-info)]"
              aria-hidden="true"
            />
            <div className="text-xs text-[var(--token-text-secondary)]">
              <p className="font-medium text-[var(--token-text-primary)]">
                Revenue split: {ownerPercent}/{PLATFORM_CUT_PERCENT}
              </p>
              <p className="mt-1">
                You receive {ownerPercent}% of each payment ({ownerAmount} Nodes per member). The
                platform retains {PLATFORM_CUT_PERCENT}% ({platformCut} Nodes).
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-[var(--product-radius-md)] border border-[color-mix(in_srgb,var(--token-feedback-error)_35%,transparent)] bg-[color-mix(in_srgb,var(--token-feedback-error)_10%,transparent)] p-3 text-sm text-[var(--token-feedback-error)]"
            >
              {error}
            </div>
          )}

          {hasChanges && (
            <Button
              fullWidth
              onClick={() => void handleSave()}
              disabled={isSaving || price < MIN_GATE_PRICE}
              isLoading={isSaving}
            >
              Save gating settings
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
