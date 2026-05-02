/**
 * Zod schemas for paid DM file endpoints.
 *
 * Paid DMs are file attachments gated behind a node payment.
 * The sender sets a per-file node price; the receiver pays to unlock.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Paid file status
// ---------------------------------------------------------------------------

export const PaidFileStatusSchema = z.enum(['pending', 'unlocked', 'expired']);

export type PaidFileStatus = z.infer<typeof PaidFileStatusSchema>;

// ---------------------------------------------------------------------------
// Core entity
// ---------------------------------------------------------------------------

export const PaidDmFileSchema = z.object({
  id: z.string(),
  sender_id: z.string(),
  receiver_id: z.string(),
  file_url: z.string(),
  file_type: z.string(),
  nodes_required: z.number(),
  status: PaidFileStatusSchema,
  expires_at: z.string().nullable(),
  inserted_at: z.string(),
});

export type PaidDmFile = z.infer<typeof PaidDmFileSchema>;

// ---------------------------------------------------------------------------
// List response
// ---------------------------------------------------------------------------

export const PendingFilesResponseSchema = z.object({
  files: z.array(PaidDmFileSchema),
});

export type PendingFilesResponse = z.infer<typeof PendingFilesResponseSchema>;
