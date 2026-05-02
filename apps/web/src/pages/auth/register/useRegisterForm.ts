/**
 * Register form state and validation hook.
 *
 * Uses React 19 useActionState for form submission + validation.
 *
 */

import { useState, useEffect, useActionState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';
import { validatePassword } from '@/modules/auth/utils/password-validation';
import { isTurnstileEnabled } from '@/modules/auth/components/turnstile-widget';

interface RegisterFormState {
  error: string | null;
}

/**
 * Hook for managing register form.
 */
export function useRegisterForm() {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);

  function getFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
  }

  const [formState, formAction, isPending] = useActionState(
    async (_prev: RegisterFormState, formData: FormData): Promise<RegisterFormState> => {
      clearError();

      const email = getFormString(formData, 'email');
      const username = getFormString(formData, 'username');
      const password = getFormString(formData, 'password');
      const confirmPassword = getFormString(formData, 'confirmPassword');
      const agreeToTerms = formData.get('agreeToTerms') === 'on';

      if (password !== confirmPassword) {
        return { error: 'Passwords do not match' };
      }

      const validation = validatePassword(password);
      if (!validation.isValid) {
        return { error: validation.errors.join('. ') };
      }

      if (!agreeToTerms) {
        return { error: 'Please agree to the Terms of Service and Privacy Policy' };
      }

      if (isTurnstileEnabled() && !turnstileToken) {
        return { error: 'Complete the verification challenge to continue.' };
      }

      try {
        await register(email, username, password, turnstileToken);
        navigate('/messages');
        return { error: null };
      } catch {
        setTurnstileToken(null);
        setCaptchaResetSignal((value) => value + 1);
        // Error is handled by store
        return { error: null };
      }
    },
    { error: null }
  );

  const displayError = formState.error || error;

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (!displayError) return;
    const timer = setTimeout(() => {
      clearError();
    }, 5000);
    return () => clearTimeout(timer);
  }, [displayError, clearError]);

  return {
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    turnstileToken,
    setTurnstileToken,
    captchaResetSignal,
    displayError,
    isLoading: isPending,
    formAction,
  };
}
