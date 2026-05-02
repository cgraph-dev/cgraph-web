/**
 * Zod schemas for view-once API responses.
 */
import { z } from 'zod';

export const ViewOnceOpenResponseSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  isViewOnce: z.literal(true),
  viewOnceOpenedAt: z.string(),
  viewOnceOpenedById: z.string(),
});

export type ViewOnceOpenResponseData = z.infer<typeof ViewOnceOpenResponseSchema>;
