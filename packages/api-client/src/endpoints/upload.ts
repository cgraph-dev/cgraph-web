/**
 * Upload endpoints.
 *
 * Endpoints under /api/v1/uploads.
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

const MultipartUploadPartSchema = z.object({
  part_number: z.number(),
  presigned_url: z.string(),
});

const MultipartUploadStartSchema = z.object({
  upload_id: z.string(),
  key: z.string(),
  parts: z.array(MultipartUploadPartSchema),
  expires_at: z.string(),
});

const PresignedPartSchema = z.object({
  presigned_url: z.string(),
});

const MultipartUploadCompleteSchema = z.object({
  upload_id: z.string(),
  key: z.string(),
  url: z.string(),
});

export interface StartMultipartUploadInput {
  readonly filename: string;
  readonly content_type: string;
  readonly size: number;
  readonly context?: string;
}

export interface MultipartUploadPart {
  readonly part_number: number;
  readonly presigned_url: string;
}

export interface MultipartUploadStart {
  readonly upload_id: string;
  readonly key: string;
  readonly parts: ReadonlyArray<MultipartUploadPart>;
  readonly expires_at: string;
}

export interface MultipartUploadCompletedPart {
  readonly part_number: number;
  readonly etag: string;
}

export interface CompleteMultipartUploadInput {
  readonly upload_id: string;
  readonly parts: ReadonlyArray<MultipartUploadCompletedPart>;
}

export interface MultipartUploadComplete {
  readonly upload_id: string;
  readonly key: string;
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
          http.post('/api/v1/uploads', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          }),
        UploadResultSchema
      );
    },

    /** Start a direct multipart upload and receive pre-signed URLs for every part. */
    async startMultipartUpload(
      input: StartMultipartUploadInput
    ): Promise<ApiResult<MultipartUploadStart>> {
      return apiCall(
        () => http.post('/api/v1/uploads/start', input),
        MultipartUploadStartSchema
      );
    },

    /** Re-issue a pre-signed URL for one failed multipart part. */
    async presignMultipartPart(
      uploadId: string,
      partNumber: number
    ): Promise<ApiResult<{ readonly presigned_url: string }>> {
      return apiCall(
        () => http.post(`/api/v1/uploads/parts/${uploadId}`, { part_number: partNumber }),
        PresignedPartSchema
      );
    },

    /** Finalize a direct multipart upload after all parts have returned ETags. */
    async completeMultipartUpload(
      input: CompleteMultipartUploadInput
    ): Promise<ApiResult<MultipartUploadComplete>> {
      return apiCall(
        () => http.post('/api/v1/uploads/complete', input),
        MultipartUploadCompleteSchema
      );
    },
  };
}
