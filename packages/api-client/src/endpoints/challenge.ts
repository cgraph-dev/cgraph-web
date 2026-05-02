/**
 * Challenge endpoints for rate limit resolution and version checks.
 *
 * Endpoints under /api/v1/challenge and /api/v1/app.
 */
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import { z } from 'zod';
import { challengeOptionsSchema, versionInfoSchema } from '../schemas/challenge';
import type { ChallengeOptions, VersionInfo } from '../schemas/challenge';

const challengeMessageSchema = z.object({
  message: z.string(),
});

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

/** Generic message response from challenge endpoints. */
export interface ChallengeMessageResponse {
  readonly message: string;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates challenge endpoints bound to the provided Axios instance. */
export function createChallengeEndpoints(http: AxiosInstance) {
  return {
    /**
     * Get available challenge options for the current user.
     *
     * Returns a session token and a list of available challenge types
     * (push, captcha). Called when client receives 428 Precondition Required.
     */
    async getOptions(): Promise<ApiResult<ChallengeOptions>> {
      return apiCall(() => http.get('/api/v1/challenge/options'), challengeOptionsSchema);
    },

    /**
     * Submit a push challenge response.
     *
     * Client sends the token received via silent push notification.
     * On success, rate limits are reset.
     */
    async answerPush(challengeToken: string): Promise<ApiResult<ChallengeMessageResponse>> {
      return apiCall(
        () => http.post('/api/v1/challenge/push', { challenge: challengeToken }),
        challengeMessageSchema
      );
    },

    /**
     * Submit a CAPTCHA (Turnstile) challenge response.
     *
     * Fallback when push challenge is unavailable or times out.
     * On success, rate limits are reset.
     */
    async answerCaptcha(captchaToken: string): Promise<ApiResult<ChallengeMessageResponse>> {
      return apiCall(
        () => http.post('/api/v1/challenge/captcha', { captcha_token: captchaToken }),
        challengeMessageSchema
      );
    },

    /**
     * Get version info for a specific platform.
     *
     * Public endpoint (no auth required). Returns min_version, latest_version,
     * force_update flag, update_url, and pending_deprecation version.
     */
    async getVersionInfo(platform?: string): Promise<ApiResult<VersionInfo>> {
      const params = platform ? { platform } : undefined;
      return apiCall(() => http.get('/api/v1/app/version', { params }), versionInfoSchema);
    },
  };
}
