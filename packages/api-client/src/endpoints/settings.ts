/**
 * Settings endpoints.
 *
 * Endpoints under /api/v1/users/me/settings.
 */
import type { AxiosInstance } from 'axios';
import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import {
  AllSettingsSchema,
  SettingsCategorySchema,
  UpdateSettingsResponseSchema,
} from '../schemas/settings';
import { UserSchema } from '../schemas/user';
import type { User } from '../schemas/user';
import type { AllSettings, SettingsCategory } from '../schemas/settings';

export type { AllSettings, SettingsCategory };

/**
 * Creates settings endpoints for managing user preferences.
 *
 * @param http - Axios instance configured with the base URL and auth headers
 * @returns Object containing all settings-related endpoint methods
 */
export function createSettingsEndpoints(http: AxiosInstance) {
  return {
    /** Get all settings for the current user. */
    async getAll(): Promise<ApiResult<AllSettings>> {
      return apiCall(() => http.get('/api/v1/users/me/settings'), AllSettingsSchema);
    },

    /** Get settings for a specific category. */
    async getCategory(category: string): Promise<ApiResult<SettingsCategory>> {
      return apiCall(
        () => http.get(`/api/v1/users/me/settings/${category}`),
        SettingsCategorySchema
      );
    },

    /** Update settings for a specific category. */
    async updateCategory(
      category: string,
      settings: Record<string, unknown>
    ): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(
        () => http.patch(`/api/v1/users/me/settings/${category}`, settings),
        UpdateSettingsResponseSchema
      );
    },

    /** Update profile. */
    async updateProfile(data: {
      readonly display_name?: string;
      readonly bio?: string;
      readonly pronouns?: string;
      readonly status_message?: string;
    }): Promise<ApiResult<User>> {
      return apiCall(() => http.patch('/api/v1/users/me', data), UserSchema);
    },

    /** Get current user profile. */
    async getProfile(): Promise<ApiResult<User>> {
      return apiCall(() => http.get('/api/v1/users/me'), UserSchema);
    },
  };
}
