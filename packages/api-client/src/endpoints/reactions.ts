/**
 * Reaction endpoints.
 *
 * Endpoints under /api/v1/conversations/:id/messages/:messageId/reactions.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import { ReactionSchema, ReactionSummarySchema } from '../schemas/reactions';
import type { Reaction, ReactionSummary } from '../schemas/reactions';

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates reaction endpoints bound to the provided Axios instance. */
export function createReactionEndpoints(http: AxiosInstance) {
  return {
    /**
     * Add an emoji reaction to a message in a conversation.
     */
    async add(
      conversationId: string,
      messageId: string,
      emoji: string
    ): Promise<ApiResult<Reaction>> {
      return apiCall(
        () =>
          http.post(`/api/v1/conversations/${conversationId}/messages/${messageId}/reactions`, {
            emoji,
          }),
        ReactionSchema
      );
    },

    /**
     * Remove an emoji reaction from a message in a conversation.
     *
     * Returns an empty-object result on success (server returns 204 / `{}`).
     */
    async remove(
      conversationId: string,
      messageId: string,
      emoji: string
    ): Promise<ApiResult<Record<string, never>>> {
      return apiCall(
        () =>
          http.delete(
            `/api/v1/conversations/${conversationId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`
          ),
        z
          .object({})
          .passthrough()
          .transform((): Record<string, never> => ({}))
      );
    },

    /**
     * Get all reactions for a message in a conversation, grouped by emoji.
     */
    async getReactions(
      conversationId: string,
      messageId: string
    ): Promise<ApiResult<ReactionSummary[]>> {
      return apiCall(
        () => http.get(`/api/v1/conversations/${conversationId}/messages/${messageId}/reactions`),
        z.array(ReactionSummarySchema)
      );
    },
  };
}

export type { Reaction, ReactionSummary } from '../schemas/reactions';
