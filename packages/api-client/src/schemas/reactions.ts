/**
 * Reaction schemas.
 */
import { z } from 'zod';

export const ReactionSchema = z.object({
  emoji: z.string(),
  user_id: z.string(),
  message_id: z.string(),
});

export type Reaction = z.infer<typeof ReactionSchema>;

export const ReactionSummarySchema = z.object({
  emoji: z.string(),
  count: z.number(),
  reacted_by_me: z.boolean(),
});

export type ReactionSummary = z.infer<typeof ReactionSummarySchema>;
