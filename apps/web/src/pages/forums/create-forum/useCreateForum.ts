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

function stringField(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function getResponseData(error: unknown): Record<string, unknown> | null {
  if (!isRecord(error) || !isRecord(error.response)) {
    return null;
  }

  return isRecord(error.response.data) ? error.response.data : null;
}

function getDetailsMessage(details: unknown): string | null {
  if (!isRecord(details)) {
    return null;
  }

  const detailMessages = Object.entries(details)
    .map(([field, msgs]) => {
      const fieldName = field.replace(/_/g, ' ');
      const msgArray = Array.isArray(msgs) ? msgs.map(String) : [String(msgs)];
      return `${fieldName}: ${msgArray.join(', ')}`;
    })
    .join('; ');

  return detailMessages.length > 0 ? detailMessages : null;
}

function getCreateForumErrorMessage(error: unknown): string {
  const fallback = 'Failed to create forum. Please try again.';
  const responseData = getResponseData(error);
  const errorData = responseData?.error;

  if (typeof errorData === 'string') {
    const responseMessage = responseData ? stringField(responseData, 'message') : null;
    return responseMessage ? `${errorData}: ${responseMessage}` : errorData;
  }

  if (isRecord(errorData)) {
    return getDetailsMessage(errorData.details) ?? stringField(errorData, 'message') ?? fallback;
  }

  if (responseData) {
    const responseMessage = stringField(responseData, 'message');
    if (responseMessage) {
      return responseMessage;
    }
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  if (isRecord(error)) {
    const message = stringField(error, 'message');
    if (message) {
      return message;
    }
  }

  return fallback;
}

/**
 */
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
      setError(getCreateForumErrorMessage(err));
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
