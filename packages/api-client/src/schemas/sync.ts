/**
 * Sync schemas.
 */
import { z } from 'zod';

export const SyncChangeSchema = z.object({
  type: z.string(),
  id: z.string(),
  data: z.record(z.unknown()),
  timestamp: z.string().optional(),
});

export type SyncChange = z.infer<typeof SyncChangeSchema>;

export const SyncPullResponseSchema = z.object({
  changes: SyncChangeSchema.array(),
  cursor: z.string().nullable().optional(),
  has_more: z.boolean().optional(),
});

export type SyncPullResponse = z.infer<typeof SyncPullResponseSchema>;

export const SyncPushResponseSchema = z.object({
  accepted: z.number().optional(),
  rejected: z.number().optional(),
  errors: z.array(z.record(z.unknown())).optional(),
});

export type SyncPushResponse = z.infer<typeof SyncPushResponseSchema>;
