import { z } from 'zod';

export const MessageRequestStatusSchema = z.enum([
  'pending',
  'accepted',
  'rejected',
  'blocked',
]);

export const MessageRequestItemSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  requester_id: z.string().uuid(),
  requester_username: z.string().nullable(),
  requester_display_name: z.string().nullable(),
  requester_avatar_url: z.string().nullable(),
  requester_is_verified: z.boolean(),
  shared_group_count: z.number().int().nonnegative(),
  inserted_at: z.string(),
});

export const MessageRequestInfoSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  requester: z.object({
    id: z.string().uuid(),
    username: z.string().nullable(),
    display_name: z.string().nullable(),
    avatar_url: z.string().nullable(),
    is_verified: z.boolean(),
  }),
  status: MessageRequestStatusSchema,
  shared_group_count: z.number().int().nonnegative(),
  auto_accepted: z.boolean(),
  reported_as_spam: z.boolean(),
  inserted_at: z.string(),
});

export const MessageRequestActionResponseSchema = z.object({
  conversation_id: z.string().uuid(),
  status: MessageRequestStatusSchema,
  accepted_at: z.string().optional(),
  reported: z.boolean().optional(),
});

/** Fallback for conversations with no request (status = accepted). */
export const NoRequestSchema = z.object({
  status: z.literal('accepted'),
  conversation_id: z.string().uuid(),
});

export const MessageRequestShowSchema = z.union([
  MessageRequestInfoSchema,
  NoRequestSchema,
]);

export type MessageRequestItem = z.infer<typeof MessageRequestItemSchema>;
export type MessageRequestInfo = z.infer<typeof MessageRequestInfoSchema>;
export type MessageRequestActionResponse = z.infer<
  typeof MessageRequestActionResponseSchema
>;
