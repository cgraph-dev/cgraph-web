/**
 * Zod schemas for call quality API responses.
 */
import { z } from 'zod';

export const CallQualityReportResponseSchema = z.object({
  id: z.string(),
  rating: z.number(),
  call_id: z.string(),
});

export type CallQualityReportResponseData = z.infer<typeof CallQualityReportResponseSchema>;
