/**
 * Batch message operation endpoints.
 *
 * Routes under /api/v1/conversations/:conversation_id/messages/batch-*.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const BatchCopyResultSchema = z.object({
  text: z.string(),
  message_count: z.number(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BatchCopyResult = z.infer<typeof BatchCopyResultSchema>;

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates batch message operation endpoints bound to the provided Axios instance. */
export function createBatchEndpoints(http: AxiosInstance) {
  return {
    /**
     * Copy multiple messages as concatenated text with sender attribution.
     *
     * Maximum 30 messages. Messages are ordered by insertion time.
     * Encrypted messages show "[Encrypted]" placeholder.
     */
    async batchCopy(
      conversationId: string,
      messageIds: readonly string[]
    ): Promise<ApiResult<BatchCopyResult>> {
      return apiCall(
        () =>
          http.post(`/api/v1/conversations/${conversationId}/messages/batch-copy`, {
            message_ids: messageIds,
          }),
        BatchCopyResultSchema
      );
    },
  };
}
