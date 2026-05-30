/**
 * Zustand store for notification profile management.
 *
 * Manages profile CRUD, schedule updates, allowed members,
 * and manual activation/deactivation state.
 */
import { create } from 'zustand';
import type { NotificationProfile, NotificationProfileSchedule } from '@cgraph-dev/shared-types';
import { api as httpClient } from '@/lib/api';
import { createLogger } from '@/lib/logger';
import { toast } from '@/shared/components/ui';

const logger = createLogger('NotificationProfileStore');

interface NotificationProfileState {
  readonly profiles: readonly NotificationProfile[];
  readonly activeProfile: NotificationProfile | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

interface NotificationProfileActions {
  fetchProfiles(): Promise<void>;
  fetchActiveProfile(): Promise<void>;
  createProfile(params: {
    readonly name: string;
    readonly emoji?: string;
    readonly color?: string;
  }): Promise<NotificationProfile | null>;
  updateProfile(
    profileId: string,
    params: {
      readonly name?: string;
      readonly emoji?: string;
      readonly color?: string;
      readonly allow_all_calls?: boolean;
      readonly allow_all_mentions?: boolean;
    }
  ): Promise<void>;
  deleteProfile(profileId: string): Promise<void>;
  updateSchedule(
    profileId: string,
    params: {
      readonly enabled?: boolean;
      readonly start_time?: number;
      readonly end_time?: number;
      readonly days_enabled?: readonly number[];
    }
  ): Promise<void>;
  setAllowedMembers(profileId: string, userIds: readonly string[]): Promise<void>;
  activateProfile(profileId: string, durationMinutes?: number | null): Promise<void>;
  deactivateProfile(): Promise<void>;
}

type NotificationProfileStore = NotificationProfileState & NotificationProfileActions;

/** Envelope shape returned by CGraph API. */
interface ApiEnvelope<T> {
  readonly data: T;
}

async function apiGet<T>(path: string): Promise<ApiEnvelope<T>> {
  const response: { data: ApiEnvelope<T> } = await httpClient.get(path);
  return response.data;
}

async function apiPost<T>(path: string, data?: unknown): Promise<ApiEnvelope<T>> {
  const response: { data: ApiEnvelope<T> } = await httpClient.post(path, data);
  return response.data;
}

async function apiPut<T>(path: string, data?: unknown): Promise<ApiEnvelope<T>> {
  const response: { data: ApiEnvelope<T> } = await httpClient.put(path, data);
  return response.data;
}

async function apiDelete(path: string): Promise<unknown> {
  const response = await httpClient.delete(path);
  return response.data;
}

const BASE_PATH = '/api/v1/notification-profiles';

export const useNotificationProfileStore = create<NotificationProfileStore>((set, get) => ({
  profiles: [],
  activeProfile: null,
  isLoading: false,
  error: null,

  async fetchProfiles() {
    set({ isLoading: true, error: null });
    try {
      const result = await apiGet<NotificationProfile[]>(BASE_PATH);
      set({ profiles: result.data, isLoading: false });
    } catch (err) {
      const message = extractErrorMessage(err);
      logger.error('Failed to fetch profiles', err);
      set({ error: message, isLoading: false });
    }
  },

  async fetchActiveProfile() {
    try {
      const result = await apiGet<NotificationProfile | null>(`${BASE_PATH}/active`);
      set({ activeProfile: result.data });
    } catch (err) {
      logger.error('Failed to fetch active profile', err);
    }
  },

  async createProfile(params) {
    set({ isLoading: true });
    try {
      const result = await apiPost<NotificationProfile>(BASE_PATH, params);
      set((state) => ({
        profiles: [result.data, ...state.profiles],
        isLoading: false,
      }));
      toast.success('Profile created');
      return result.data;
    } catch (err) {
      const message = extractErrorMessage(err);
      logger.error('Failed to create profile', err);
      toast.error(message);
      set({ isLoading: false });
      return null;
    }
  },

  async updateProfile(profileId, params) {
    try {
      const result = await apiPut<NotificationProfile>(`${BASE_PATH}/${profileId}`, params);
      set((state) => ({
        profiles: state.profiles.map((p) => (p.id === profileId ? result.data : p)),
      }));
      toast.success('Profile updated');
    } catch (err) {
      const message = extractErrorMessage(err);
      logger.error('Failed to update profile', err);
      toast.error(message);
    }
  },

  async deleteProfile(profileId) {
    try {
      await apiDelete(`${BASE_PATH}/${profileId}`);
      set((state) => ({
        profiles: state.profiles.filter((p) => p.id !== profileId),
        activeProfile: state.activeProfile?.id === profileId ? null : state.activeProfile,
      }));
      toast.success('Profile deleted');
    } catch (err) {
      const message = extractErrorMessage(err);
      logger.error('Failed to delete profile', err);
      toast.error(message);
    }
  },

  async updateSchedule(profileId, params) {
    try {
      const result = await apiPut<NotificationProfileSchedule>(
        `${BASE_PATH}/${profileId}/schedule`,
        params
      );
      set((state) => ({
        profiles: state.profiles.map((p) =>
          p.id === profileId ? { ...p, schedule: result.data } : p
        ),
      }));
      toast.success('Schedule updated');
    } catch (err) {
      const message = extractErrorMessage(err);
      logger.error('Failed to update schedule', err);
      toast.error(message);
    }
  },

  async setAllowedMembers(profileId, userIds) {
    try {
      const result = await apiPut<NotificationProfile>(`${BASE_PATH}/${profileId}/members`, {
        user_ids: userIds,
      });
      set((state) => ({
        profiles: state.profiles.map((p) => (p.id === profileId ? result.data : p)),
      }));
      toast.success('Allowed contacts updated');
    } catch (err) {
      const message = extractErrorMessage(err);
      logger.error('Failed to update allowed members', err);
      toast.error(message);
    }
  },

  async activateProfile(profileId, durationMinutes) {
    try {
      const result = await apiPost<NotificationProfile | null>(`${BASE_PATH}/activate`, {
        profile_id: profileId,
        duration_minutes: durationMinutes ?? null,
      });
      set({ activeProfile: result.data });
      await get().fetchProfiles();
      toast.success('Profile activated');
    } catch (err) {
      const message = extractErrorMessage(err);
      logger.error('Failed to activate profile', err);
      toast.error(message);
    }
  },

  async deactivateProfile() {
    try {
      await apiPost<null>(`${BASE_PATH}/deactivate`);
      set({ activeProfile: null });
      toast.success('Profile deactivated');
    } catch (err) {
      const message = extractErrorMessage(err);
      logger.error('Failed to deactivate profile', err);
      toast.error(message);
    }
  },
}));

interface ErrorWithResponse {
  readonly response?: {
    readonly data?: {
      readonly error?: {
        readonly message?: string;
      };
    };
  };
}

function isErrorWithResponse(err: unknown): err is ErrorWithResponse {
  return err !== null && typeof err === 'object' && 'response' in err;
}

function extractErrorMessage(err: unknown): string {
  if (isErrorWithResponse(err)) {
    const message = err.response?.data?.error?.message;
    if (message) {
      return message;
    }
  }
  return 'An unexpected error occurred';
}
