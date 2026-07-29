import { Check, LockKeyhole, X } from 'lucide-react';
import type { CosmeticItem, Entitlement } from '@cgraph-dev/shared-types';
import { Button, IconButton } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CosmeticTypeIcon } from './cosmetic-type-icon';
import { EntitlementBadge } from './entitlement-badge';
import { RarityBadge } from './rarity-badge';

function entitlementExpired(entitlement: Entitlement | undefined): boolean {
  return Boolean(
    entitlement?.expiresAt && new Date(entitlement.expiresAt).getTime() < Date.now()
  );
}

interface EquipPanelProps {
  readonly item: CosmeticItem | null;
  readonly owned: boolean;
  readonly isEquipped: boolean;
  readonly isWorking?: boolean;
  readonly entitlement?: Entitlement | undefined;
  readonly onToggleEquip: (item: CosmeticItem) => void;
  readonly onClose: () => void;
}

export function EquipPanel({
  item,
  owned,
  isEquipped,
  isWorking = false,
  entitlement,
  onToggleEquip,
  onClose,
}: EquipPanelProps) {
  const expired = entitlementExpired(entitlement);
  const canEquip = owned && !expired && (entitlement?.active ?? true);
  const premium =
    item?.unlockType === 'subscription' ||
    item?.unlockCondition.type === 'subscription_tier' ||
    false;

  return (
    <Dialog open={item !== null} onOpenChange={(open) => !open && onClose()}>
      {item ? (
        <DialogContent className="max-w-lg" ariaLabel="Cosmetic details">
          <DialogHeader className="flex flex-row items-center justify-between gap-3">
            <DialogTitle>Cosmetic details</DialogTitle>
            <IconButton
              icon={<X />}
              label="Close cosmetic details"
              size="sm"
              onClick={onClose}
            />
          </DialogHeader>

          <div className="grid gap-5 py-5 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-[var(--product-line)] bg-[var(--product-surface-recessed)] p-4">
              {item.previewUrl ? (
                <img src={item.previewUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <CosmeticTypeIcon
                  type={item.type}
                  className="h-10 w-10 text-[var(--token-interactive-primary)]"
                />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-[var(--token-text-primary)]">{item.name}</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--token-text-secondary)]">
                {item.description || `A ${item.type.replaceAll('_', ' ')} cosmetic for your profile.`}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <RarityBadge rarity={item.rarity} size="md" />
                <EntitlementBadge
                  entitled={owned && !expired}
                  isPremiumOnly={premium}
                  expired={expired}
                />
              </div>
            </div>
          </div>

          {isEquipped ? (
            <div className="cgraph-section-surface flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-brand-green)]">
              <Check className="h-4 w-4" aria-hidden="true" />
              Currently equipped
            </div>
          ) : !owned ? (
            <div className="cgraph-section-surface flex items-start gap-2 px-3 py-2 text-sm text-[var(--token-text-secondary)]">
              <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Preview only. Marketplace checkout remains unavailable until the production
                payment flow is enabled.
              </span>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="ghost" animated={false} onClick={onClose}>
              Close
            </Button>
            {owned ? (
              <Button
                variant={isEquipped ? 'outline' : 'primary'}
                animated={false}
                isLoading={isWorking}
                disabled={!isEquipped && !canEquip}
                onClick={() => onToggleEquip(item)}
              >
                {isEquipped ? 'Unequip' : expired ? 'Expired' : 'Equip'}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
