/**
 * Groups loading overlay.
 */

import Skeleton from '@/components/ui/skeleton';

/**
 */
/**
 * Loading Overlay — loading placeholder.
 */
export function LoadingOverlay() {
  return (
    <div
      className="cgraph-workspace absolute inset-0 z-20 flex items-center justify-center"
      role="status"
      aria-label="Loading groups"
      aria-busy="true"
    >
      <div className="cgraph-card w-full max-w-sm space-y-3 p-4" data-cgraph-material="solid">
        <span className="sr-only">Loading groups</span>
        <Skeleton shape="card" count={3} />
      </div>
    </div>
  );
}
