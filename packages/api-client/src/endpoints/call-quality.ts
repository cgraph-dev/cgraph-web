/**
 * Call quality feedback endpoints.
 *
 * POST /api/v1/calls/:call_id/quality-report — Submit call quality feedback
 */
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import { CallQualityReportResponseSchema } from '../schemas/call-quality';
import type { CallQualityReportResponseData } from '../schemas/call-quality';
import type { CallQualityReportPayload } from '@cgraph/shared-types';

export type { CallQualityReportResponseData };

/** Creates call quality endpoints bound to the provided Axios instance. */
export function createCallQualityEndpoints(http: AxiosInstance) {
  return {
    /**
     * Submit a call quality report after a call ends.
     *
     * Returns 201 on success, 409 if already submitted for this call.
     */
    async submitCallQuality(
      callId: string,
      report: CallQualityReportPayload
    ): Promise<ApiResult<CallQualityReportResponseData>> {
      return apiCall(
        () => http.post(`/api/v1/calls/${callId}/quality-report`, report),
        CallQualityReportResponseSchema
      );
    },
  };
}
