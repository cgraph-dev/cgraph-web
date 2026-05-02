/**
 * Invite schemas.
 */
import { z } from 'zod';

export const InviteSchema = z.object({
  id: z.string(),
  code: z.string(),
  uses: z.number(),
  max_uses: z.number(),
  expires_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  inviter: z
    .object({
      id: z.string(),
      username: z.string(),
      display_name: z.string().nullable().optional(),
      avatar_url: z.string().nullable().optional(),
    })
    .optional(),
});

export type Invite = z.infer<typeof InviteSchema>;

export const RedeemInviteResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    nodes_awarded: z.number().optional(),
  })
  .passthrough();

export type RedeemInviteResponse = z.infer<typeof RedeemInviteResponseSchema>;
