/**
 * Shared types for batch message operations (delete, forward, copy).
 */

/** Available batch operations. */
export type BatchOperation = 'delete' | 'forward' | 'copy';

/** Result of a batch copy operation. */
export interface BatchCopyResult {
  readonly text: string;
  readonly message_count: number;
}

/** Maximum messages per batch operation. */
export const MAX_BATCH_COPY = 30;
export const MAX_BATCH_DELETE = 100;
export const MAX_BATCH_FORWARD = 30;
