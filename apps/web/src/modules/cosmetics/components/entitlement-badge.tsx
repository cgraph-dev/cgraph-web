/**
 * EntitlementBadge — inline status indicator for cosmetic entitlements.
 *
 * Renders one of four states:
 * - **Owned**: green checkmark
 * - **Premium locked**: gold lock icon
 * - **Expired**: gray clock icon
 * - **Not entitled**: subtle lock
 *
 * Designed to overlay on CosmeticCard thumbnails or sit inline in lists.
 *
 */
import { Check, Clock3, LockKeyhole } from 'lucide-react';

// Props
interface EntitlementBadgeProps {
  /** User owns (or has active entitlement for) this item. */
  readonly entitled: boolean;
  /** Item requires a premium subscription to unlock. */
  readonly isPremiumOnly: boolean;
  /** Entitlement existed but has expired. */
  readonly expired: boolean;
}
// Component
/** Entitlement Badge. */
export function EntitlementBadge({ entitled, isPremiumOnly, expired }: EntitlementBadgeProps) {
  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-800/80 px-2 py-0.5 text-[11px] font-medium text-gray-400">
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        Expired
      </span>
    );
  }

  if (entitled) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--color-brand-purple)_8%,black)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-brand-purple)]">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        Owned
      </span>
    );
  }

  if (isPremiumOnly) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/80 px-2 py-0.5 text-[11px] font-medium text-amber-400">
        <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
        Premium
      </span>
    );
  }

  // Not entitled, not premium — subtle lock
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-gray-500">
      <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
      Locked
    </span>
  );
}
