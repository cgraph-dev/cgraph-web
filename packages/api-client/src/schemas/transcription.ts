/**
 * Zod schemas for transcription API responses.
 */
import { z } from 'zod';

export const TranscriptionQueuedSchema = z.object({
  message_id: z.string(),
  status: z.literal('queued'),
});

export const TranscriptionResultSchema = z.object({
  message_id: z.string(),
  text: z.string(),
  language: z.string().nullable(),
  status: z.string(),
});

export type TranscriptionQueued = z.infer<typeof TranscriptionQueuedSchema>;
export type TranscriptionResultData = z.infer<typeof TranscriptionResultSchema>;
