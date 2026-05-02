/**
 * Message request endpoints.
 *
 * Implements Signal's MessageRequestRepository actions over REST.
 * Gates stranger DMs behind recipient approval.
 *
 * @see MessageRequestRepository.java
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';
import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import {
  MessageRequestItemSchema,
  MessageRequestShowSchema,
  MessageRequestActionResponseSchema,
} from '../schemas/message-requests';
import type {
  MessageRequestItem,
  MessageRequestInfo,
  MessageRequestActionResponse,
} from '../schemas/message-requests';

export type { MessageRequestItem, MessageRequestInfo, MessageRequestActionResponse };

/**
 * Creates message request endpoint methods.
 *
 * @param http - Axios instance configured with base URL and auth headers
 */
export function createMessageRequestEndpoints(http: AxiosInstance) {
  return {
    /** List pending message requests (inbox). Cursor-paginated. */
    list(
      params?: { cursor?: string; limit?: number },
    ): Promise<ApiResult<readonly MessageRequestItem[]>> {
      return apiCall(
        () => http.get('/api/v1/message-requests', { params }),
        z.array(MessageRequestItemSchema),
      );
    },

    /** Get message request state for a conversation. */
    get(
      conversationId: string,
    ): Promise<
      ApiResult<
        | MessageRequestInfo
        | { status: 'accepted'; conversation_id: string }
      >
    > {
      return apiCall(
        () => http.get(`/api/v1/message-requests/${conversationId}`),
        MessageRequestShowSchema,
      );
    },

    /** Accept a pending message request. */
    accept(
      conversationId: string,
    ): Promise<ApiResult<MessageRequestActionResponse>> {
      return apiCall(
        () => http.post(`/api/v1/message-requests/${conversationId}/accept`),
        MessageRequestActionResponseSchema,
      );
    },

    /** Reject (delete) a pending message request. */
    reject(
      conversationId: string,
    ): Promise<ApiResult<MessageRequestActionResponse>> {
      return apiCall(
        () => http.post(`/api/v1/message-requests/${conversationId}/reject`),
        MessageRequestActionResponseSchema,
      );
    },

    /** Block the requester. */
    block(
      conversationId: string,
    ): Promise<ApiResult<MessageRequestActionResponse>> {
      return apiCall(
        () => http.post(`/api/v1/message-requests/${conversationId}/block`),
        MessageRequestActionResponseSchema,
      );
    },

    /** Block and report as spam. */
    blockAndReport(
      conversationId: string,
      reason?: string,
    ): Promise<ApiResult<MessageRequestActionResponse>> {
      return apiCall(
        () =>
          http.post(
            `/api/v1/message-requests/${conversationId}/block-and-report`,
            {
              ...(reason ? { reason } : {}),
            },
          ),
        MessageRequestActionResponseSchema,
      );
    },

    /** Unblock and accept a previously blocked request. */
    unblock(
      conversationId: string,
    ): Promise<ApiResult<MessageRequestActionResponse>> {
      return apiCall(
        () =>
          http.post(
            `/api/v1/message-requests/${conversationId}/unblock`,
          ),
        MessageRequestActionResponseSchema,
      );
    },
  } as const;
}
