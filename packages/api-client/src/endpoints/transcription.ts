/**
 * Transcription endpoints.
 *
 * POST /api/v1/messages/:id/transcribe — Request async transcription (returns 202)
 * GET  /api/v1/messages/:id/transcription — Get transcription result
 */
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import { TranscriptionQueuedSchema, TranscriptionResultSchema } from '../schemas/transcription';
import type { TranscriptionQueued, TranscriptionResultData } from '../schemas/transcription';

export type { TranscriptionQueued, TranscriptionResultData };

/** Creates transcription endpoints bound to the provided Axios instance. */
export function createTranscriptionEndpoints(http: AxiosInstance) {
  return {
    /**
     * Request transcription for a voice message.
     *
     * Returns 202 with `{ data: { message_id, status: "queued" } }`.
     * The actual result arrives via WebSocket `transcription:complete` event.
     */
    async requestTranscription(messageId: string): Promise<ApiResult<TranscriptionQueued>> {
      return apiCall(
        () => http.post(`/api/v1/messages/${messageId}/transcribe`),
        TranscriptionQueuedSchema
      );
    },

    /**
     * Get the transcription result for a message.
     *
     * Returns the transcription text, detected language, and status.
     */
    async getTranscription(messageId: string): Promise<ApiResult<TranscriptionResultData>> {
      return apiCall(
        () => http.get(`/api/v1/messages/${messageId}/transcription`),
        TranscriptionResultSchema
      );
    },
  };
}
