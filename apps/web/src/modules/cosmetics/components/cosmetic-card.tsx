import { Check, Clock3 } from 'lucide-react';
import type { CosmeticItem, Entitlement } from '@cgraph-dev/shared-types';
import { EntitlementBadge } from './entitlement-badge';
import { CosmeticTypeIcon } from './cosmetic-type-icon';
import { RarityBadge } from './rarity-badge';

function entitlementExpired(entitlement: Entitlement | undefined): boolean {
  return Boolean(
    entitlement?.expiresAt && new Date(entitlement.expiresAt).getTime() < Date.now()
  );
}

function expiryLabel(expiresAt: string): string {
  const remainingHours = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 3_600_000);
  if (remainingHours <= 0) return 'Expired';
  if (remainingHours < 24) return `${remainingHours}h left`;
  return `${Math.floor(remainingHours / 24)}d left`;
}

interface CosmeticCardProps {
  readonly item: CosmeticItem;
  readonly owned: boolean;
  readonly equipped: boolean;
  readonly entitlement?: Entitlement | undefined;
  readonly onSelect?: (item: CosmeticItem) => void;
}

export function CosmeticCard({
  item,
  owned,
  equipped,
  entitlement,
  onSelect,
}: CosmeticCardProps) {
  const expired = entitlementExpired(entitlement);
  const premium =
    item.unlockType === 'subscription' || item.unlockCondition.type === 'subscription_tier';

  return (
    <button
      type="button"
      data-testid="cosmetic-card"
      data-state={equipped ? 'equipped' : owned ? 'owned' : 'locked'}
      onClick={() => onSelect?.(item)}
      className="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-[var(--product-line)] bg-[var(--product-surface-raised)] text-left transition-[border-color,background-color] duration-150 hover:border-[var(--product-line-strong)] hover:bg-[var(--product-surface-selected)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--token-interactive-primary)] disabled:cursor-default"
      aria-label={`View ${item.name}`}
    >
      <span className="relative flex aspect-[4/3] w-full items-center justify-center border-b border-[var(--product-line)] bg-[var(--product-surface-recessed)] p-4">
        {item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt=""
            className="h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-md border border-[var(--product-line)] bg-[var(--product-surface-raised)] text-[var(--token-interactive-primary)]">
            <CosmeticTypeIcon type={item.type} className="h-6 w-6" />
          </span>
        )}

        <span className="absolute right-2 top-2">
          {equipped ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--color-brand-green)_36%,transparent)] bg-[color-mix(in_srgb,var(--color-brand-green)_12%,var(--product-surface-raised))] px-2 py-0.5 text-[11px] font-medium text-[var(--color-brand-green)]">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Equipped
            </span>
          ) : (
            <EntitlementBadge entitled={owned && !expired} isPremiumOnly={premium} expired={expired} />
          )}
        </span>
      </span>

      <span className="flex min-h-[5.25rem] w-full flex-col gap-2 p-3">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[var(--token-text-primary)]">
            {item.name}
          </span>
          <span className="mt-0.5 block truncate text-xs capitalize text-[var(--token-text-muted)]">
            {item.type.replaceAll('_', ' ')}
          </span>
        </span>
        <span className="mt-auto flex items-center justify-between gap-2">
          <RarityBadge rarity={item.rarity} />
          {entitlement?.expiresAt && !expired ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--token-status-warning)]">
              <Clock3 className="h-3 w-3" aria-hidden="true" />
              {expiryLabel(entitlement.expiresAt)}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
