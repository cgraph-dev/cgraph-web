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
  deleteProfile(profileId: string): Promise<boolean>;
  setAllowedMembers(profileId: string, userIds: readonly string[]): Promise<NotificationProfile | null>;
  activateProfile(profileId: string, durationMinutes?: number | null): Promise<boolean>;
  deactivateProfile(): Promise<boolean>;
}

type NotificationProfileStore = NotificationProfileState & NotificationProfileActions;

interface ProfileSnapshot {
  readonly profiles: readonly NotificationProfile[];
  readonly activeProfile: NotificationProfile | null;
}

type ProfileSnapshotResult =
  | { readonly ok: true; readonly data: ProfileSnapshot }
  | { readonly ok: false; readonly message: string };

async function readProfileSnapshot(): Promise<ProfileSnapshotResult> {
  const [profilesResult, activeResult] = await Promise.all([
    apiClient.notificationProfiles.list(),
    apiClient.notificationProfiles.getActive(),
  ]);

  if (!profilesResult.ok) {
    return { ok: false, message: profilesResult.error.message };
  }
  if (!activeResult.ok) {
    return { ok: false, message: activeResult.error.message };
  }

  return {
    ok: true,
    data: {
      profiles: profilesResult.data,
      activeProfile: activeResult.data,
    },
  };
}

export const useNotificationProfileStore = create<NotificationProfileStore>((set, get) => ({
  profiles: [],
  activeProfile: null,
  isLoading: false,
  isMutating: false,
  error: null,

  async fetchProfiles() {
    set({ isLoading: true, error: null });
    try {
      const snapshot = await readProfileSnapshot();
      if (!snapshot.ok) {
        set({ error: snapshot.message, isLoading: false });
        return;
      }

      set({
        ...snapshot.data,
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
    if (get().isMutating) {
      return false;
    }

    set({ isMutating: true, error: null });
    try {
      const deleteResult = await apiClient.notificationProfiles.delete(profileId);
      if (!deleteResult.ok) {
        logger.error('Failed to delete profile', deleteResult.error);
        toast.error(deleteResult.error.message);
        set({ error: deleteResult.error.message, isMutating: false });
        return false;
      }
      if (!deleteResult.data.deleted) {
        const message = 'Profile was not deleted';
        logger.error('Failed to delete profile', message);
        toast.error(message);
        set({ error: message, isMutating: false });
        return false;
      }

      const snapshot = await readProfileSnapshot();
      if (!snapshot.ok) {
        logger.error('Failed to reconcile deleted profile', snapshot.message);
        toast.error(snapshot.message);
        set({ error: snapshot.message, isMutating: false });
        return false;
      }

      set({
        ...snapshot.data,
        isMutating: false,
      });
      toast.success('Profile deleted');
      return true;
    } catch (err) {
      const message = extractErrorMessage(err);
      logger.error('Failed to delete profile', err);
      toast.error(message);
      set({ error: message, isMutating: false });
      return false;
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
