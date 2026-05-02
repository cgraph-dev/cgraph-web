/**
 * Profile endpoints.
 *
 * Covers /api/v1/me, /api/v1/users/:id, /api/v1/profile,
 * and /api/v1/profiles/:username.
 *
 * Route source of truth: apps/backend/lib/cgraph_web/router/user_routes.ex
 *
 *   GET    /api/v1/me                        → UserController.me
 *   PUT    /api/v1/me                        → UserController.update  (wraps body in { user: ... })
 *   POST   /api/v1/me/avatar                 → UserController.upload_avatar
 *   GET    /api/v1/users/:id                 → UserController.show
 *   GET    /api/v1/users/:username/profile   → UserController.profile
 *   GET    /api/v1/profile                   → ProfileController.me
 *   PUT    /api/v1/profile                   → ProfileController.update_me
 *   GET    /api/v1/profiles/:username        → ProfileController.show
 *   PUT    /api/v1/profiles/signature        → ProfileController.update_signature
 *   PUT    /api/v1/profiles/bio              → ProfileController.update_bio
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';
import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import {
  FullUserProfileSchema,
  PublicProfileSchema,
  ReputationEntrySchema,
  ReputationSummarySchema,
} from '../schemas/profile';
import type {
  FullUserProfile,
  PublicProfile,
  UpdateProfileParams,
  ReputationEntry,
  ReputationSummary,
} from '../schemas/profile';

export type {
  FullUserProfile,
  PublicProfile,
  UpdateProfileParams,
  ReputationEntry,
  ReputationSummary,
};

const EmptySchema = z.object({}).passthrough();

// Cursor-paginated list of reputation entries with summary
const ReputationResponseSchema = z.object({
  entries: ReputationEntrySchema.array().optional(),
  summary: ReputationSummarySchema.optional(),
  page_info: z
    .object({
      has_next_page: z.boolean().optional(),
      has_previous_page: z.boolean().optional(),
      end_cursor: z.string().nullable().optional(),
      start_cursor: z.string().nullable().optional(),
    })
    .passthrough()
    .optional(),
});

type ReputationResponse = z.infer<typeof ReputationResponseSchema>;
export type { ReputationResponse };

/**
 * Creates profile endpoints for the authenticated user and for viewing
 * other users' profiles.
 *
 * @param http - Axios instance configured with the base URL and auth headers
 * @returns Object containing all profile-related endpoint methods
 */
export function createProfileEndpoints(http: AxiosInstance) {
  return {
    /**
     * Get the authenticated user's own profile.
     * GET /api/v1/me
     */
    async getMe(): Promise<ApiResult<FullUserProfile>> {
      return apiCall(() => http.get('/api/v1/me'), FullUserProfileSchema);
    },

    /**
     * Update the authenticated user's profile.
     * PUT /api/v1/me — backend expects body wrapped as `{ user: { ... } }`
     */
    async updateProfile(params: UpdateProfileParams): Promise<ApiResult<FullUserProfile>> {
      return apiCall(() => http.put('/api/v1/me', { user: params }), FullUserProfileSchema);
    },

    /**
     * Upload a new avatar for the authenticated user.
     * POST /api/v1/me/avatar — multipart/form-data
     */
    async updateAvatar(formData: FormData): Promise<ApiResult<FullUserProfile>> {
      return apiCall(
        () =>
          http.post('/api/v1/me/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          }),
        FullUserProfileSchema
      );
    },

    /**
     * Update the authenticated user's presence status.
     * PUT /api/v1/me — passes only `{ status }` wrapped in `{ user: ... }`
     */
    async updateStatus(
      status: 'online' | 'idle' | 'dnd' | 'offline' | 'invisible',
      statusMessage?: string
    ): Promise<ApiResult<FullUserProfile>> {
      const payload: Record<string, unknown> = { status };
      if (statusMessage !== undefined) {
        payload.status_message = statusMessage;
      }
      return apiCall(() => http.put('/api/v1/me', { user: payload }), FullUserProfileSchema);
    },

    /**
     * Get a user's profile by ID.
     * GET /api/v1/users/:id
     */
    async getProfile(userId: string): Promise<ApiResult<PublicProfile>> {
      return apiCall(() => http.get(`/api/v1/users/${userId}`), PublicProfileSchema);
    },

    /**
     * Get a user's public profile by username.
     * GET /api/v1/users/:username/profile
     */
    async getPublicProfile(username: string): Promise<ApiResult<PublicProfile>> {
      return apiCall(() => http.get(`/api/v1/users/${username}/profile`), PublicProfileSchema);
    },

    /**
     * Get the enhanced profile for the authenticated user (MyBB-style).
     * GET /api/v1/profile
     */
    async getEnhancedMe(): Promise<ApiResult<FullUserProfile>> {
      return apiCall(() => http.get('/api/v1/profile'), FullUserProfileSchema);
    },

    /**
     * Update the authenticated user's enhanced profile fields
     * (bio, signature, title, location, social_links, etc.).
     * PUT /api/v1/profile
     */
    async updateEnhancedProfile(params: UpdateProfileParams): Promise<ApiResult<FullUserProfile>> {
      return apiCall(() => http.put('/api/v1/profile', params), FullUserProfileSchema);
    },

    /**
     * Get a user's enhanced profile by username.
     * GET /api/v1/profiles/:username
     */
    async getProfileByUsername(username: string): Promise<ApiResult<PublicProfile>> {
      return apiCall(() => http.get(`/api/v1/profiles/${username}`), PublicProfileSchema);
    },

    /**
     * Update the authenticated user's signature.
     * PUT /api/v1/profiles/signature
     */
    async updateSignature(signature: string): Promise<ApiResult<FullUserProfile>> {
      return apiCall(
        () => http.put('/api/v1/profiles/signature', { signature }),
        FullUserProfileSchema
      );
    },

    /**
     * Update the authenticated user's bio.
     * PUT /api/v1/profiles/bio
     */
    async updateBio(bio: string): Promise<ApiResult<FullUserProfile>> {
      return apiCall(() => http.put('/api/v1/profiles/bio', { bio }), FullUserProfileSchema);
    },

    /**
     * Get a user's reputation entries (cursor-paginated).
     * GET /api/v1/profiles/:username/reputation
     */
    async getReputation(
      username: string,
      options?: {
        readonly cursor?: string;
        readonly limit?: number;
        readonly type?: 'positive' | 'negative' | 'all';
      }
    ): Promise<ApiResult<ReputationResponse>> {
      return apiCall(
        () =>
          http.get(`/api/v1/profiles/${username}/reputation`, {
            params: options,
          }),
        ReputationResponseSchema
      );
    },

    /**
     * Give reputation to a user.
     * POST /api/v1/profiles/:username/reputation
     */
    async giveReputation(
      username: string,
      params: {
        readonly value: number;
        readonly comment?: string;
        readonly post_id?: string;
        readonly forum_id?: string;
      }
    ): Promise<ApiResult<ReputationEntry>> {
      return apiCall(
        () => http.post(`/api/v1/profiles/${username}/reputation`, params),
        ReputationEntrySchema
      );
    },

    /**
     * Complete the onboarding flow for the current user.
     * POST /api/v1/me/onboarding/complete
     */
    async completeOnboarding(): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.post('/api/v1/me/onboarding/complete'), EmptySchema);
    },
  };
}
