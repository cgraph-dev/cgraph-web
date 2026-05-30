/**
 * CosmeticCard — grid card for displaying a single cosmetic item.
 *
 * Shows: thumbnail, name, RarityBadge, entitlement state, expiry countdown.
 * Entitlement-aware: owned → green, expired → grey, premium → lock, purchasable → price.
 *
 */

import type { CosmeticItem, Entitlement } from '@cgraph-dev/shared-types';
import { RarityBadge } from './rarity-badge';
import { EntitlementBadge } from './entitlement-badge';

// Helpers

const TYPE_ICONS: Readonly<Record<string, string>> = {
  border: '🔲',
  title: '🏷️',
  badge: '🛡️',
  nameplate: '📛',
  chat_bubble: '💬',
  emoji_pack: '😀',
  sound_pack: '🔊',
  theme: '🎨',
};

function isExpired(ent: Entitlement): boolean {
  if (!ent.expiresAt) return false;
  return new Date(ent.expiresAt).getTime() < Date.now();
}

function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h left`;
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return `${hours}h ${mins}m left`;
}

// Props

interface CosmeticCardProps {
  readonly item: CosmeticItem;
  readonly owned: boolean;
  readonly equipped: boolean;
  readonly entitlement?: Entitlement | undefined;
  readonly onSelect?: (item: CosmeticItem) => void;
  readonly onPurchase?: (item: CosmeticItem) => void;
}

// Component

/** Cosmetic Card. */
export function CosmeticCard({
  item,
  owned,
  equipped,
  entitlement,
  onSelect,
  onPurchase,
}: CosmeticCardProps) {
  const expired = entitlement ? isExpired(entitlement) : false;
  const entitled = entitlement ? entitlement.active && !expired : owned;
  const isPremiumOnly =
    item.unlockType === 'subscription' || item.unlockCondition.type === 'subscription_tier';
  const isLocked = !entitled;
  const purchasable = !entitled && !expired && item.available && !isPremiumOnly;

  const expiryText =
    !entitlement?.expiresAt || expired ? null : formatCountdown(entitlement.expiresAt);

  const cardClasses = equipped
    ? 'border-cyan-500/60 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
    : expired
      ? 'border-white/5 bg-[var(--token-bg-primary)] opacity-50 grayscale'
      : isLocked
        ? 'border-white/5 bg-[var(--token-bg-primary)] opacity-60 hover:opacity-80'
        : 'border-[var(--token-border-muted)] bg-[var(--token-bg-primary)] hover:border-white/20 hover:bg-[var(--token-card-bg)]';

  return (
    <div
      data-testid="cosmetic-card"
      className={`group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-200 ${cardClasses}`}
    >
      <button
        type="button"
        onClick={() => onSelect?.(item)}
        className="flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        aria-label={`Select ${item.name}`}
      >
        {/* Thumbnail area */}
        <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-white/5 to-transparent p-4">
          {item.previewUrl ? (
            <img
              src={item.previewUrl}
              alt={item.name}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl">
              {TYPE_ICONS[item.type] ?? '🎁'}
            </div>
          )}

          {/* Top-right: equipped or entitlement badge */}
          <div className="absolute right-2 top-2">
            {equipped ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-xs text-white shadow-lg">
                ✓
              </div>
            ) : (
              <EntitlementBadge
                entitled={entitled}
                isPremiumOnly={isPremiumOnly}
                expired={expired}
              />
            )}
          </div>

          {/* Locked / expired overlay */}
          {expired && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-sm font-medium text-gray-400">Expired</span>
            </div>
          )}
          {isLocked && !expired && isPremiumOnly && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-2xl">🔒</span>
            </div>
          )}
        </div>

        {/* Info area */}
        <div className="flex flex-1 flex-col gap-1 px-3 py-2">
          <span className="truncate text-sm font-medium text-white">{item.name}</span>
          <div className="flex items-center justify-between">
            <RarityBadge rarity={item.rarity} />
            {entitlement && (
              <span className="text-[10px] capitalize text-gray-500">{entitlement.type}</span>
            )}
          </div>

          {/* Expiry countdown */}
          {expiryText && <span className="text-[10px] text-amber-400">{expiryText}</span>}
        </div>
      </button>

      {/* Purchase button */}
      {purchasable && onPurchase && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => onPurchase(item)}
            className="w-full rounded-lg bg-purple-600 px-2 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-purple-500"
          >
            {item.unlockCondition.threshold ? `${item.unlockCondition.threshold} Nodes` : 'Get'}
          </button>
        </div>
      )}
    </div>
  );
}
