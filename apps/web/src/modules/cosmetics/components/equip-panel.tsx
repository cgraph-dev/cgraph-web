/**
 * EquipPanel — slide-out panel for previewing and equipping cosmetic items.
 *
 * Entitlement-aware: filters to valid (non-expired) entitlements,
 * shows expired message, client-side validation before equip,
 * and unequip option for equipped slots.
 *
 */

import { motion, AnimatePresence } from 'motion/react';

import type { CosmeticItem, Entitlement } from '@cgraph-dev/shared-types';
import { RarityBadge } from './rarity-badge';
import { EntitlementBadge } from './entitlement-badge';
import { FADE_IN } from '@/lib/animations/transitions';

// Helpers

function equipButtonStyle(isEquipped: boolean, canEquip: boolean): string {
  if (isEquipped) return 'bg-red-500/20 text-red-400 hover:bg-red-500/30';
  if (canEquip) return 'bg-cyan-500 text-white hover:bg-cyan-600';
  return 'cursor-not-allowed bg-gray-800 text-gray-500';
}

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

function isEntitlementExpired(ent: Entitlement | undefined): boolean {
  if (!ent?.expiresAt) return false;
  return new Date(ent.expiresAt).getTime() < Date.now();
}

// Props

interface EquipPanelProps {
  readonly item: CosmeticItem | null;
  readonly isEquipped: boolean;
  readonly entitlement?: Entitlement | undefined;
  readonly onToggleEquip: (item: CosmeticItem) => void;
  readonly onClose: () => void;
}

// Component

/** Detail panel for equipping/unequipping a cosmetic item. */
export function EquipPanel({
  item,
  isEquipped,
  entitlement,
  onToggleEquip,
  onClose,
}: EquipPanelProps) {
  const expired = isEntitlementExpired(entitlement);

  const canEquip = !entitlement ? true : entitlement.active && !expired;

  function handleToggle() {
    if (!item || (!isEquipped && !canEquip)) return;
    onToggleEquip(item);
  }

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            key="backdrop"
            {...FADE_IN}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={onClose}
          />

          <motion.div
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[var(--token-border-muted)] bg-gray-950"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--token-border-muted)] px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Item Details</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Preview */}
            <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-6 py-8">
              <div className="flex aspect-square w-48 items-center justify-center rounded-2xl bg-white/5">
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="h-full w-full rounded-2xl object-contain"
                  />
                ) : (
                  <span className="text-6xl">{TYPE_ICONS[item.type] ?? '🎁'}</span>
                )}
              </div>

              <div className="flex w-full flex-col items-center gap-3 text-center">
                <h3 className="text-xl font-bold text-white">{item.name}</h3>
                <RarityBadge rarity={item.rarity} size="md" />
                <p className="text-sm text-gray-400">{item.description}</p>

                <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                  <span className="rounded-md bg-white/5 px-2 py-1 capitalize">
                    {item.type.replace('_', ' ')}
                  </span>
                  {entitlement && (
                    <EntitlementBadge
                      entitled={entitlement.active && !expired}
                      isPremiumOnly={entitlement.sku.isPremiumOnly}
                      expired={expired}
                    />
                  )}
                </div>
              </div>

              {isEquipped && (
                <div className="flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400">
                  <span>✓</span>
                  <span>Currently Equipped</span>
                </div>
              )}

              {/* Expired message */}
              {expired && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 px-4 py-3 text-center text-sm text-amber-400">
                  This item has expired. Visit the shop to renew.
                </div>
              )}
            </div>

            {/* Action footer */}
            <div className="border-t border-[var(--token-border-muted)] px-6 py-4">
              {expired ? (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-xl bg-gray-800 py-3 text-sm font-semibold text-gray-500"
                >
                  Expired
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleToggle}
                  disabled={!isEquipped && !canEquip}
                  className={`w-full rounded-xl py-3 text-sm font-semibold transition-all ${equipButtonStyle(isEquipped, canEquip)}`}
                >
                  {isEquipped && 'Unequip'}
                  {!isEquipped && canEquip && 'Equip'}
                  {!isEquipped && !canEquip && 'Not Available'}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
