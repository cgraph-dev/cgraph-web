/**
 * Presence schemas.
 */
import { z } from 'zod';

export const OnlineUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  avatar_url: z.string().nullable().optional(),
  status: z.string(),
});

export type OnlineUser = z.infer<typeof OnlineUserSchema>;

export const PresenceResponseSchema = z.object({
  users: z.array(OnlineUserSchema),
  count: z.number(),
});

export type PresenceResponse = z.infer<typeof PresenceResponseSchema>;
