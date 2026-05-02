/**
 * Shared Components - Single Export Point
 *
 * All reusable UI components organized by category.
 * Import from '@/shared/components' for module-based architecture.
 *
 */

// UI primitives (Button, Card, Dialog, etc.)
export * from './ui';

// Animated state components (Empty, Error)
export { AnimatedEmptyState, AnimatedErrorState } from './animated-empty-state';

// Error fallback for error boundaries
export { ErrorFallback } from './error-fallback';

// Page transition wrapper
export { PageTransition } from './page-transition';

// Offline indicators (Phase 22)
export { OfflineIndicator } from './offline-indicator';
export { PendingMessageBadge } from './pending-message-badge';

// Connection status (Phase 37)
export { ConnectionStatus } from './connection-status';
