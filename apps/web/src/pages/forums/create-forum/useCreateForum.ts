/**
 * useCreateForum hook - state and handlers for forum creation wizard
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForumStore } from '@/modules/forums/store';
import { useAuthStore } from '@/modules/auth/store';
import { forumLogger as logger } from '@/lib/logger';
import { DEFAULT_FORM_DATA, NAME_MIN_LENGTH, NAME_MAX_LENGTH } from './constants';
import type { ForumFormData } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getStringField(value: Record<string, unknown> | undefined, field: string): string | null {
  const fieldValue = value?.[field];
  return typeof fieldValue === 'string' ? fieldValue : null;
}

/**
 * Hook for managing create forum.
 */
export function useCreateForum() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { createForum } = useForumStore();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ForumFormData>(DEFAULT_FORM_DATA);

  // Auto-generate slug from name
  function handleNameChange(inputName: string): void {
    const sanitizedName = inputName.replace(/[^a-zA-Z0-9_]/g, '');
    const slug = sanitizedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    setFormData((prev) => ({ ...prev, name: sanitizedName, slug }));
  }

  // Update form field
  function updateFormData<K extends keyof ForumFormData>(key: K, value: ForumFormData[K]): void {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  // Validate form data
  function validateForm(): string | null {
    if (!formData.name || formData.name.length < NAME_MIN_LENGTH) {
      return `Forum name must be at least ${NAME_MIN_LENGTH} characters long`;
    }
    if (formData.name.length > NAME_MAX_LENGTH) {
      return `Forum name must be at most ${NAME_MAX_LENGTH} characters long`;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.name)) {
      return 'Forum name can only contain letters, numbers, and underscores';
    }
    if (!formData.slug) {
      return 'Forum URL slug is required';
    }
    return null;
  }

  // Check if step 1 is valid for navigation
  function isStep1Valid(): boolean {
    return !!(
      formData.name &&
      formData.slug &&
      formData.name.length >= NAME_MIN_LENGTH &&
      formData.name.length <= NAME_MAX_LENGTH &&
      /^[a-zA-Z0-9_]+$/.test(formData.name)
    );
  }

  // Handle form submission
  async function handleSubmit(): Promise<void> {
    if (!isAuthenticated) {
      setError('You must be logged in to create a forum');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      logger.log('[CreateForum] Submitting:', {
        name: formData.name,
        description: formData.description,
        isNsfw: formData.isNsfw,
        isPrivate: !formData.isPublic,
      });

      const forum = await createForum({
        name: formData.name,
        description: formData.description,
        isNsfw: formData.isNsfw,
        isPrivate: !formData.isPublic,
      });

      logger.log('[CreateForum] Success:', forum);
      navigate(`/forums/${forum.slug}`);
    } catch (err: unknown) {
      logger.error('[CreateForum] Error:', err);
      const response = isRecord(err) && isRecord(err.response) ? err.response : undefined;
      const data = response && isRecord(response.data) ? response.data : undefined;
      const errorData = data?.error;

      let message = 'Failed to create forum. Please try again.';

      if (typeof errorData === 'string') {
        message = errorData;
        const dataMessage = getStringField(data, 'message');
        if (dataMessage) {
          message += `: ${dataMessage}`;
        }
      } else if (isRecord(errorData)) {
        if (typeof errorData.message === 'string') {
          message = errorData.message;
        }
        if (isRecord(errorData.details)) {
          const detailMessages = Object.entries(errorData.details)
            .map(([field, msgs]) => {
              const fieldName = field.replace(/_/g, ' ');
              const msgArray = Array.isArray(msgs) ? msgs : [String(msgs)];
              return `${fieldName}: ${msgArray.join(', ')}`;
            })
            .join('; ');
          if (detailMessages) {
            message = detailMessages;
          }
        }
      } else if (getStringField(data, 'message')) {
        message = getStringField(data, 'message') ?? message;
      } else if (getStringField(isRecord(err) ? err : undefined, 'message')) {
        message = getStringField(isRecord(err) ? err : undefined, 'message') ?? message;
      }

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Navigation
  function goToNextStep(): void {
    if (step < 4) setStep((s) => s + 1);
  }

  function goToPrevStep(): void {
    if (step > 1) setStep((s) => s - 1);
    else navigate('/forums');
  }

  return {
    // State
    step,
    formData,
    isSubmitting,
    error,
    isAuthenticated,
    user,
    // Handlers
    handleNameChange,
    updateFormData,
    setFormData,
    handleSubmit,
    goToNextStep,
    goToPrevStep,
    isStep1Valid,
    // Navigation
    navigate,
  };
}
