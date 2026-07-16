import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CroppedAvatarPayload } from '@/components/avatar/avatar-upload-cropper';
import { apiClient } from '@/lib/api-client';
import { uploadCurrentUserAvatarAndSync } from '@/lib/avatar-upload';
import { applyOwnIdentityPatch } from '@/lib/identity/ownIdentitySync';
import { createLogger } from '@/lib/logger';
import { useAuthStore } from '@/modules/auth/store';
import {
  clearProfileCheckpoint,
  readProfileCheckpoint,
  writeProfileCheckpoint,
} from './profile-checkpoint';

const logger = createLogger('ProfileInitialization');

export function useOnboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const userId = user?.id ?? '';
  const fallbackName = user?.displayName || (user?.phoneNumber ? '' : user?.username) || '';
  const [displayName, setDisplayNameState] = useState(() =>
    readProfileCheckpoint(userId, fallbackName)
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  function setDisplayName(value: string): void {
    setDisplayNameState(value);
    if (userId) writeProfileCheckpoint(userId, value);
    setError(null);
  }

  function handleAvatarCropped(payload: CroppedAvatarPayload): void {
    setAvatarFile(payload.file);
  }

  async function submit(): Promise<void> {
    if (submittingRef.current) return;

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Enter the name people will see.');
      return;
    }
    if (trimmedName.length > 100) {
      setError('Display name must be 100 characters or fewer.');
      return;
    }

    submittingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.profile.completeOnboarding({ display_name: trimmedName });
      if (!result.ok) {
        setError(result.error.message || 'We could not save your profile. Please try again.');
        return;
      }

      const canonicalName = result.data.display_name?.trim() || trimmedName;
      updateUser({
        displayName: canonicalName,
        onboardingCompleted: result.data.onboarding_completed ?? true,
      });
      clearProfileCheckpoint();

      if (avatarFile) {
        try {
          const avatar = await uploadCurrentUserAvatarAndSync(avatarFile);
          updateUser({ avatarUrl: avatar.user?.avatarUrl ?? avatar.avatarUrl });
          applyOwnIdentityPatch({
            avatarUrl: avatar.user?.avatarUrl ?? avatar.avatarUrl,
            avatarBorderId: avatar.user?.avatarBorderId,
            equippedTitleId: avatar.user?.equippedTitleId,
            equippedBadgeIds: avatar.user?.equippedBadgeIds,
            equippedNameplateId: avatar.user?.equippedNameplateId,
            profileTheme: avatar.user?.profileTheme,
            chatTheme: avatar.user?.chatTheme,
          });
        } catch (avatarError) {
          logger.warn('Optional avatar upload failed after profile initialization', avatarError);
        }
      }

      navigate('/messages', { replace: true });
    } catch (submissionError) {
      logger.error('Profile initialization failed', submissionError);
      setError('We could not save your profile. Please try again.');
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  }

  return {
    user,
    displayName,
    isLoading,
    error,
    setDisplayName,
    handleAvatarCropped,
    submit,
  };
}
