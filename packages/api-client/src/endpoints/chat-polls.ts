/**
 * Chat poll endpoints.
 *
 * POST   /api/v1/conversations/:id/polls — Create a poll
 * GET    /api/v1/polls/:id               — Get poll with results
 * POST   /api/v1/polls/:id/vote          — Vote on a poll
 * DELETE /api/v1/polls/:id/vote          — Retract a vote
 * POST   /api/v1/polls/:id/close         — Close a poll
 */
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import { ChatPollSchema } from '../schemas/chat-polls';
import type { ChatPollData } from '../schemas/chat-polls';
import type { CreatePollParams, VotePollParams } from '@cgraph/shared-types';

export type { ChatPollData };

/** Creates chat poll endpoints bound to the provided Axios instance. */
export function createChatPollEndpoints(http: AxiosInstance) {
  return {
    /** Create a new poll in a conversation. */
    async createPoll(
      conversationId: string,
      params: CreatePollParams
    ): Promise<ApiResult<ChatPollData>> {
      return apiCall(
        () => http.post(`/api/v1/conversations/${conversationId}/polls`, params),
        ChatPollSchema
      );
    },

    /** Get a poll with its current results. */
    async getPoll(pollId: string): Promise<ApiResult<ChatPollData>> {
      return apiCall(() => http.get(`/api/v1/polls/${pollId}`), ChatPollSchema);
    },

    /** Vote on a poll. */
    async vote(pollId: string, params: VotePollParams): Promise<ApiResult<ChatPollData>> {
      return apiCall(() => http.post(`/api/v1/polls/${pollId}/vote`, params), ChatPollSchema);
    },

    /** Retract a vote from a poll. */
    async retractVote(pollId: string): Promise<ApiResult<ChatPollData>> {
      return apiCall(() => http.delete(`/api/v1/polls/${pollId}/vote`), ChatPollSchema);
    },

    /** Close a poll (creator only). */
    async closePoll(pollId: string): Promise<ApiResult<ChatPollData>> {
      return apiCall(() => http.post(`/api/v1/polls/${pollId}/close`), ChatPollSchema);
    },
  };
}
