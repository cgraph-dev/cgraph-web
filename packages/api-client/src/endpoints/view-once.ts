/**
 * View-once API endpoints.
 *
 * POST /api/v1/messages/:id/view-once/open
 */
import type { AxiosInstance } from 'axios';
import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import { ViewOnceOpenResponseSchema } from '../schemas/view-once';
import type { ViewOnceOpenResponseData } from '../schemas/view-once';

/** Creates view-once endpoints bound to the provided Axios instance. */
export function createViewOnceEndpoints(http: AxiosInstance) {
  return {
    /**
     * Open a view-once message.
     *
     * Client MUST download the media before calling this endpoint.
     * After this call, the server deletes the attachment permanently.
     *
     * Signal reference: ViewOnceMessageRepository.getMessage() flow.
     */
    async open(messageId: string): Promise<ApiResult<ViewOnceOpenResponseData>> {
      return apiCall(
        () => http.post(`/api/v1/messages/${messageId}/view-once/open`),
        ViewOnceOpenResponseSchema
      );
    },
  };
}
