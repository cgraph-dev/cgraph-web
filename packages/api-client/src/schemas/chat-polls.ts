/**
 * Zod schemas for chat poll API responses.
 *
 * Validates poll data returned from the backend to catch
 * shape mismatches at the boundary.
 */
import { z } from 'zod';

/** Schema for a single poll option. */
export const ChatPollOptionSchema = z.object({
  id: z.number(),
  text: z.string(),
});

/**
 * Schema for aggregated vote count per option.
 * Accepts both camelCase and snake_case keys from the backend.
 */
export const ChatPollOptionCountSchema = z
  .object({
    optionId: z.number().optional(),
    option_id: z.number().optional(),
    count: z.number(),
  })
  .transform((v) => ({
    optionId: v.optionId ?? v.option_id ?? 0,
    count: v.count,
  }));

/**
 * Schema for voter record in non-anonymous polls.
 * Accepts both camelCase and snake_case keys from the backend.
 */
const chatPollVoterSchema = z
  .object({
    user_id: z.string().optional(),
    userId: z.string().optional(),
    option_ids: z.array(z.number()).optional(),
    optionIds: z.array(z.number()).optional(),
  })
  .transform((v) => ({
    userId: v.userId || v.user_id || '',
    optionIds: v.optionIds || v.option_ids || [],
  }));

/** Schema for a full chat poll response. */
export const ChatPollSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(ChatPollOptionSchema),
  isAnonymous: z.boolean(),
  isMultipleChoice: z.boolean(),
  isQuiz: z.boolean(),
  closeDate: z.string().nullable(),
  totalVoterCount: z.number(),
  isClosed: z.boolean(),
  creatorId: z.string(),
  createdAt: z.string(),
  optionCounts: z.array(ChatPollOptionCountSchema).optional(),
  myVote: z.array(z.number()).nullable().optional(),
  voters: z.array(chatPollVoterSchema).optional(),
  correctOptionId: z.number().nullable().optional(),
  explanation: z.string().nullable().optional(),
});

/** Inferred type from the ChatPollSchema. */
export type ChatPollData = z.infer<typeof ChatPollSchema>;
