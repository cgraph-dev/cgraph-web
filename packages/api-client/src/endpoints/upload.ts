/**
 * Upload endpoints.
 *
 * Endpoints under /api/v1/upload.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const UploadResultSchema = z
  .object({
    url: z.string().optional(),
    file_url: z.string().optional(),
  })
  .passthrough()
  .transform((data) => ({
    url: data.url ?? data.file_url ?? '',
  }));

export interface UploadResult {
  readonly url: string;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates upload endpoint methods bound to the given Axios instance. */
export function createUploadEndpoints(http: AxiosInstance) {
  return {
    /** Upload a file. Returns the URL of the uploaded file. */
    async uploadFile(formData: FormData): Promise<ApiResult<UploadResult>> {
      return apiCall(
        () =>
          http.post('/api/v1/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          }),
        UploadResultSchema
      );
    },
  };
}
