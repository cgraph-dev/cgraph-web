/**
 * useOnboarding hook - state and logic for onboarding flow
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import type { CroppedAvatarPayload } from '@/components/avatar/avatar-upload-cropper';
import { uploadCurrentUserAvatar } from '@/lib/avatar-upload';
import { DEFAULT_PROFILE_DATA, ONBOARDING_STEPS } from './constants';
import type { ProfileData, ProfileUpdatePayload } from './types';

const logger = createLogger('Onboarding');

/**
 * Hook for managing onboarding.
 */
export function useOnboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);

  const [profileData, setProfileData] = useState<ProfileData>({
    ...DEFAULT_PROFILE_DATA,
    displayName: user?.displayName || user?.username || '',
    avatarUrl: user?.avatarUrl || null,
  });

  function handleAvatarCropped(payload: CroppedAvatarPayload): void {
    setAvatarFile(payload.file);
    setAvatarPreview(payload.previewUrl);
  }

  async function handleNext(): Promise<void> {
    setError(null);

    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final step - save everything and navigate
      setIsLoading(true);
      try {
        // Upload avatar if changed
        let avatarUrl = profileData.avatarUrl;
        if (avatarFile) {
          const uploadedAvatarUrl = await uploadCurrentUserAvatar(avatarFile);
          if (typeof uploadedAvatarUrl === 'string') {
            avatarUrl = uploadedAvatarUrl;
          }
        }

        // Update profile via API

        const profilePayload: ProfileUpdatePayload = {
          display_name: profileData.displayName,
          bio: profileData.bio,
          avatar_url: avatarUrl,
        };
        await http.put('/api/v1/me', { user: profilePayload });

        // Update local user state
        updateUser({
          displayName: profileData.displayName,
          avatarUrl: avatarUrl,
        });

        // Update notification preferences
        await http.put('/api/v1/settings/notifications', {
          notify_messages: profileData.notifyMessages,
          notify_mentions: profileData.notifyMentions,
          notify_friend_requests: profileData.notifyFriendRequests,
        });

        // Mark onboarding complete
        await http.post('/api/v1/me/onboarding/complete');

        updateUser({
          onboardingCompleted: true,
        });

        navigate('/messages');
      } catch (error) {
        logger.error('Onboarding error:', error);
        setError('We could not save onboarding. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  }

  function handleBack(): void {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  async function handleSkip(): Promise<void> {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await http.post('/api/v1/onboarding/skip');
      updateUser({
        onboardingCompleted: true,
      });
      navigate('/messages');
    } catch (error) {
      logger.error('Failed to skip onboarding:', error);
      setError('We could not skip onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function updateProfileData<K extends keyof ProfileData>(key: K, value: ProfileData[K]): void {
    setProfileData((prev) => ({ ...prev, [key]: value }));
  }

  return {
    currentStep,
    isLoading,
    error,
    avatarPreview,
    profileData,
    handleAvatarCropped,
    handleNext,
    handleBack,
    handleSkip,
    updateProfileData,
    setProfileData,
    totalSteps: ONBOARDING_STEPS.length,
  };
}
