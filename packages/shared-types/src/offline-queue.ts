export type QueueItemType =
  | 'message'
  | 'reaction'
  | 'post'
  | 'read_receipt'
  | 'typing'
  | 'attachment'
  | 'custom';

export type QueuePriorityLevel = 1 | 2 | 3 | 4;

export type PendingMessageStatus = 'pending' | 'processing' | 'failed' | 'completed';

export interface OfflineQueueItem<TPayload = unknown> {
  readonly id: string;
  readonly type: QueueItemType;
  readonly endpoint: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly payload: TPayload;
  readonly priority: QueuePriorityLevel;
  readonly headers?: Record<string, string>;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly lastError?: string | null;
  readonly status: PendingMessageStatus;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: number;
  readonly updatedAt?: number;
  readonly ttlMs: number;
}

export const MAX_QUEUE_SIZE = 500;

const HOUR_MS = 60 * 60 * 1000;

export const QUEUE_TTL_MS: Readonly<Record<QueueItemType, number>> = {
  message: 24 * HOUR_MS,
  reaction: 6 * HOUR_MS,
  post: 24 * HOUR_MS,
  read_receipt: HOUR_MS,
  typing: 5 * 60 * 1000,
  attachment: 24 * HOUR_MS,
  custom: 24 * HOUR_MS,
};
