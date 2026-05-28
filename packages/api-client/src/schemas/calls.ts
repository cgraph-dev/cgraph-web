/**
 * Call schemas.
 *
 * Shapes returned by the REST call-history endpoints.
 * WebRTC signaling (offer/answer/ICE) happens over the
 * `call:{call_id}` Phoenix channel — not HTTP.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// CallInfo
// ---------------------------------------------------------------------------

export const CallTypeSchema = z.enum(['audio', 'video', 'group_audio', 'group_video']);
export type CallType = z.infer<typeof CallTypeSchema>;

export const CallStateSchema = z.enum([
  'ringing',
  'active',
  'ended',
  'missed',
  'rejected',
  'failed',
]);
export type CallState = z.infer<typeof CallStateSchema>;

export const CallEndReasonSchema = z.enum([
  'completed',
  'rejected',
  'missed',
  'timeout',
  'failed',
  'busy',
]);
export type CallEndReason = z.infer<typeof CallEndReasonSchema>;

export const IceServerSchema = z.object({
  urls: z.union([z.string(), z.array(z.string())]),
  username: z.string().optional(),
  credential: z.string().optional(),
});
export type IceServer = z.infer<typeof IceServerSchema>;

export const CallInfoSchema = z.object({
  id: z.string(),
  room_id: z.string().nullable().optional(),
  type: CallTypeSchema,
  state: CallStateSchema,
  creator_id: z.string(),
  group_id: z.string().nullable().optional(),
  participant_ids: z.array(z.string()),
  max_participants: z.number().optional(),
  started_at: z.string().nullable().optional(),
  ended_at: z.string().nullable().optional(),
  duration_seconds: z.number().nullable().optional(),
  end_reason: CallEndReasonSchema.nullable().optional(),
  missed_seen: z.boolean().optional(),
  inserted_at: z.string(),
});
export type CallInfo = z.infer<typeof CallInfoSchema>;

// ---------------------------------------------------------------------------
// CallHistory  (paginated list of past calls)
// ---------------------------------------------------------------------------

export const CallHistorySchema = z.object({
  calls: z.array(CallInfoSchema),
  cursor: z.string().nullable(),
  has_more: z.boolean(),
});
export type CallHistory = z.infer<typeof CallHistorySchema>;

export const CallHistoryDataSchema = z.array(CallInfoSchema);

// ---------------------------------------------------------------------------
// MissedCallCount
// ---------------------------------------------------------------------------

export const MissedCallCountSchema = z.object({
  missed_count: z.number(),
});
export type MissedCallCount = z.infer<typeof MissedCallCountSchema>;

// ---------------------------------------------------------------------------
// MissedSeenResult
// ---------------------------------------------------------------------------

export const MissedSeenResultSchema = z.object({
  updated: z.number(),
});
export type MissedSeenResult = z.infer<typeof MissedSeenResultSchema>;

// ---------------------------------------------------------------------------
// IceServersResult
// ---------------------------------------------------------------------------

export const IceServersResultSchema = z.object({
  ice_servers: z.array(IceServerSchema),
});
export type IceServersResult = z.infer<typeof IceServersResultSchema>;
