/**
 * Zustand store for notification profile management.
 *
 * Manages profile CRUD, allowed members, and manual activation/deactivation
 * state. Profile saves include their schedule so the backend can persist both
 * records in one transaction.
 */
import { create } from 'zustand';
import type {
  CreateNotificationProfileRequest,
  NotificationProfile,
  UpdateNotificationProfileRequest,
} from '@cgraph-dev/shared-types';
import { api as httpClient } from '@/lib/api';
import { apiClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { toast } from '@/shared/components/ui';

const logger = createLogger('NotificationProfileStore');

interface NotificationProfileState {
  readonly profiles: readonly NotificationProfile[];
  readonly activeProfile: NotificationProfile | null;
  readonly isLoading: boolean;
  readonly isMutating: boolean;
  readonly error: string | null;
}

interface NotificationProfileActions {
  fetchProfiles(): Promise<void>;
  createProfile(params: CreateNotificationProfileRequest): Promise<NotificationProfile | null>;
  updateProfile(
    profileId: string,
    params: UpdateNotificationProfileRequest
  ): Promise<NotificationProfile | null>;
  deleteProfile(profileId: string): Promise<void>;
  setAllowedMembers(profileId: string, userIds: readonly string[]): Promise<NotificationProfile | null>;
  activateProfile(profileId: string, durationMinutes?: number | null): Promise<boolean>;
  deactivateProfile(): Promise<boolean>;
}

type NotificationProfileStore = NotificationProfileState & NotificationProfileActions;

async function apiDelete(path: string): Promise<unknown> {
  const response = await httpClient.delete(path);
  return response.data;
}

const BASE_PATH = '/api/v1/notification-profiles';

export const useNotificationProfileStore = create<NotificationProfileStore>((set, get) => ({
  profiles: [],
  activeProfile: null,
  isLoading: false,
  isMutating: false,
  error: null,

  async fetchProfiles() {
    set({ isLoading: true, error: null });
    try {
      const [profilesResult, activeResult] = await Promise.all([
        apiClient.notificationProfiles.list(),
        apiClient.notificationProfiles.getActive(),
      ]);

      if (!profilesResult.ok) {
        set({ error: profilesResult.error.message, isLoading: false });
        return;
      }
      if (!activeResult.ok) {
        set({ error: activeResult.error.message, isLoading: false });
        return;
      }

      set({
        profiles: profilesResult.data,
        activeProfile: activeResult.data,
        isLoading: false,
      });
    } catch (err) {
      const message = extractErrorMessage(err);
      logger.error('Failed to fetch profiles', err);
      set({ error: message, isLoading: false });
    }
  },

  async createProfile(params) {
    set({ isLoading: true, error: null });
    try {
      const result = await apiClient.notificationProfiles.create(params);
      if (!result.ok) {
        logger.error('Failed to create profile', result.error);
        toast.error(result.error.message);
        set({ error: result.error.message, isLoading: false });
        return null;
      }

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
    set({ isLoading: true, error: null });
    try {
      const result = await apiClient.notificationProfiles.update(profileId, params);
      if (!result.ok) {
        logger.error('Failed to update profile', result.error);
        toast.error(result.error.message);
        set({ error: result.error.message, isLoading: false });
        return null;
      }

      set((state) => ({
        profiles: state.profiles.map((p) => (p.id === profileId ? result.data : p)),
        isLoading: false,
      }));
      toast.success('Profile updated');
      return result.data;
    } catch (err) {
      const message = extractErrorMessage(err);
      logger.error('Failed to update profile', err);
      toast.error(message);
      set({ error: message, isLoading: false });
      return null;
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

  async setAllowedMembers(profileId, userIds) {
    set({ isLoading: true, error: null });

    try {
      const result = await apiClient.notificationProfiles.setMembers(profileId, userIds);
      if (!result.ok) {
        logger.error('Failed to update allowed contacts', result.error);
        toast.error(result.error.message);
        set({ error: result.error.message, isLoading: false });
        return null;
      }

      set((state) => ({
        profiles: state.profiles.map((p) => (p.id === profileId ? result.data : p)),
        isLoading: false,
      }));
      toast.success('Allowed contacts updated');
      return result.data;
    } catch (err) {
      const message = extractErrorMessage(err);
      logger.error('Failed to update allowed contacts', err);
      toast.error(message);
      set({ error: message, isLoading: false });
      return null;
    }
  },

  async activateProfile(profileId, durationMinutes) {
    if (get().isMutating) {
      return false;
    }

    set({ isMutating: true, error: null });
    try {
      const result = await apiClient.notificationProfiles.activate({
        profile_id: profileId,
        duration_minutes: durationMinutes ?? null,
      });

      if (!result.ok) {
        logger.error('Failed to activate profile', result.error);
        toast.error(result.error.message);
        set({ error: result.error.message, isMutating: false });
        return false;
      }

      set({ activeProfile: result.data, isMutating: false });
      toast.success('Profile activated');
      return true;
    } catch (err) {
      const message = extractErrorMessage(err);
      logger.error('Failed to activate profile', err);
      toast.error(message);
      set({ error: message, isMutating: false });
      return false;
    }
  },

  async deactivateProfile() {
    if (get().isMutating) {
      return false;
    }

    set({ isMutating: true, error: null });
    try {
      const result = await apiClient.notificationProfiles.deactivate();

      if (!result.ok) {
        logger.error('Failed to deactivate profile', result.error);
        toast.error(result.error.message);
        set({ error: result.error.message, isMutating: false });
        return false;
      }

      set({ activeProfile: null, isMutating: false });
      toast.success('Profile deactivated');
      return true;
    } catch (err) {
      const message = extractErrorMessage(err);
      logger.error('Failed to deactivate profile', err);
      toast.error(message);
      set({ error: message, isMutating: false });
      return false;
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
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'An unexpected error occurred';
}
