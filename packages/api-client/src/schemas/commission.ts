import { z } from 'zod';
import { UserBasicSchema, CursorMetaSchema } from './common';

export const CommissionStatusSchema = z.enum([
  'open',
  'claimed',
  'in_progress',
  'delivered',
  'accepted',
  'disputed',
  'cancelled',
]);

export type CommissionStatus = z.infer<typeof CommissionStatusSchema>;

export const CommissionSchema = z.object({
  id: z.string(),
  board_id: z.string(),
  requester_id: z.string(),
  claimed_by: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  bounty_nodes: z.number(),
  status: CommissionStatusSchema,
  dispute_reason: z.string().nullable().optional(),
  dispute_opened_at: z.string().nullable().optional(),
  delivered_at: z.string().nullable().optional(),
  accepted_at: z.string().nullable().optional(),
  cancelled_at: z.string().nullable().optional(),
  auto_accept_at: z.string().nullable().optional(),
  inserted_at: z.string().optional(),
  updated_at: z.string().optional(),
  requester: UserBasicSchema.optional(),
  claimer: UserBasicSchema.optional(),
});

export type Commission = z.infer<typeof CommissionSchema>;

export const CommissionListResponseSchema = z.object({
  data: z.array(CommissionSchema),
  meta: CursorMetaSchema,
});

export type CommissionListResponse = z.infer<typeof CommissionListResponseSchema>;
