/**
 * Bounty schemas.
 */
import { z } from 'zod';

export const BountyStatusSchema = z.enum(['open', 'voting', 'completed', 'cancelled']);

export type BountyStatus = z.infer<typeof BountyStatusSchema>;

export const BountySchema = z.object({
  id: z.string(),
  forum_id: z.string(),
  creator_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  prize_nodes: z.number(),
  entry_fee_nodes: z.number(),
  status: BountyStatusSchema,
  winner_id: z.string().nullable(),
  voting_ends_at: z.string(),
  max_entries: z.number(),
  entry_count: z.number().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Bounty = z.infer<typeof BountySchema>;

export const BountyEntrySchema = z.object({
  id: z.string(),
  bounty_id: z.string(),
  user_id: z.string(),
  content: z.string(),
  media_ids: z.array(z.string()).optional(),
  score: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type BountyEntry = z.infer<typeof BountyEntrySchema>;
