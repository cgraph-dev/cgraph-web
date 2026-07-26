/**
 * Loading Components
 *
 * For full-page loading states, use the LoadingSpinner component instead:
 * import { LoadingSpinner } from '@/components/feedback/loading-spinner';
 *
 */

import Skeleton from '@/components/ui/skeleton';
import { InlineLoadingSpinner } from './loading-spinner';

interface LoadingOverlayProps {
  message?: string;
}

/**
 * Overlay loading state for async operations.
 */
export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--token-bg-primary)_86%,transparent)] backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 text-center text-[var(--token-text-secondary)]">
        <InlineLoadingSpinner />
        {message && <p className="text-sm">{message}</p>}
      </div>
    </div>
  );
}

/**
 * Skeleton loader for text content.
 */
export function SkeletonText({
  lines = 1,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Skeleton variant="text" lines={lines} />
    </div>
  );
}

/**
 * Skeleton loader for avatars.
 */
export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return <Skeleton variant="circular" className={sizeClasses[size]} />;
}

/**
 * Skeleton loader for message items in a list.
 */
export function SkeletonMessage() {
  return (
    <div className="p-4">
      <Skeleton shape="message" />
    </div>
  );
}

/**
 * Skeleton loader for conversation list items.
 */
export function SkeletonConversation() {
  return (
    <div className="flex items-center gap-3 p-3">
      <SkeletonAvatar />
      <div className="min-w-0 flex-1">
        <Skeleton variant="text" width="8rem" className="mb-2" />
        <Skeleton variant="text" width="12rem" height="0.75rem" />
      </div>
      <Skeleton variant="text" width="3rem" height="0.75rem" />
    </div>
  );
}

export default LoadingOverlay;
