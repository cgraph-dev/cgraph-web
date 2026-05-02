/**
 * Media endpoints.
 *
 * Conversation media gallery: GET /api/v1/conversations/:id/media
 * Avatar upload:              POST /api/v1/me/avatar
 *
 * (Routes from messaging_routes.ex and user_routes.ex.)
 */
import type { AxiosInstance } from 'axios';
import { z } from 'zod';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import { GalleryResponseSchema, AvatarUploadResultSchema } from '../schemas/media';
import type { MediaType, GalleryResponse, AvatarUploadResult } from '../schemas/media';

/** Passthrough schema for endpoints where strict Zod validation is deferred. */
const PassthroughSchema = z.unknown();

// Re-export types for consumers that import from this module directly.
export type {
  MediaType,
  MediaItem,
  GalleryMeta,
  GalleryResponse,
  AvatarUploadResult,
} from '../schemas/media';

// ---------------------------------------------------------------------------
// Param types
// ---------------------------------------------------------------------------

export interface GetGalleryParams {
  /**
   * Filter by media type.
   * Defaults to `'all'` when omitted (backend default).
   */
  readonly type?: MediaType;
  readonly cursor?: string;
  /**
   * Page size (max 100, defaults to 30 on the server).
   */
  readonly limit?: number;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates media endpoints bound to the provided Axios instance. */
export function createMediaEndpoints(http: AxiosInstance) {
  return {
    /**
     * List media attachments for a conversation with cursor pagination.
     *
     * Use `type` to filter by `images`, `videos`, `files`, `voice`, or `all`.
     * Pass `cursor` from the previous response to retrieve the next page.
     */
    async getGallery(
      conversationId: string,
      params?: GetGalleryParams
    ): Promise<ApiResult<GalleryResponse>> {
      return apiCall(
        () => http.get(`/api/v1/conversations/${conversationId}/media`, { params }),
        GalleryResponseSchema
      );
    },

    /**
     * Upload a new avatar for the authenticated user.
     *
     * Pass a `FormData` object with a `file` field containing the image.
     * Returns the updated user record (including the new `avatar_url`).
     *
     * The backend stores the file and writes the resulting URL directly into
     * the user record — there is no presigned-URL flow.
     */
    async uploadAvatar(formData: FormData): Promise<ApiResult<AvatarUploadResult>> {
      return apiCall(
        () =>
          http.post('/api/v1/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          }),
        AvatarUploadResultSchema
      );
    },

    /**
     * Get all processed variants for an upload.
     *
     * Returns the list of available quality tiers (thumbnail, webp, 480p, etc.).
     */
    async getMediaVariants(uploadId: string): Promise<ApiResult<unknown>> {
      return apiCall(() => http.get(`/api/v1/media/${uploadId}/variants`), PassthroughSchema);
    },

    /**
     * Get a specific variant for an upload.
     *
     * Returns the single variant matching the requested type.
     */
    async getMediaVariant(uploadId: string, variantType: string): Promise<ApiResult<unknown>> {
      return apiCall(
        () => http.get(`/api/v1/media/${uploadId}/variants/${variantType}`),
        PassthroughSchema
      );
    },
  };
}
