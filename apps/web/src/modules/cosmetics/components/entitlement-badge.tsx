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
// Props
interface EntitlementBadgeProps {
  /** User owns (or has active entitlement for) this item. */
  readonly entitled: boolean;
  /** Item requires a premium subscription to unlock. */
  readonly isPremiumOnly: boolean;
  /** Entitlement existed but has expired. */
  readonly expired: boolean;
}
// Icons (inline SVG to avoid external deps)
function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-3.5 w-3.5"
    >
      <path
        fillRule="evenodd"
        d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-3.5 w-3.5"
    >
      <path
        fillRule="evenodd"
        d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v4A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="h-3.5 w-3.5"
    >
      <path
        fillRule="evenodd"
        d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
// Component
/** Entitlement Badge. */
export function EntitlementBadge({ entitled, isPremiumOnly, expired }: EntitlementBadgeProps) {
  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-800/80 px-2 py-0.5 text-[11px] font-medium text-gray-400">
        <ClockIcon />
        Expired
      </span>
    );
  }

  if (entitled) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--color-brand-purple)_8%,black)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-brand-purple)]">
        <CheckIcon />
        Owned
      </span>
    );
  }

  if (isPremiumOnly) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/80 px-2 py-0.5 text-[11px] font-medium text-amber-400">
        <LockIcon />
        Premium
      </span>
    );
  }

  // Not entitled, not premium — subtle lock
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-gray-500">
      <LockIcon />
      Locked
    </span>
  );
}
