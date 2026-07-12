/**
 * Register form state and validation hook.
 *
 * Uses React 19 useActionState for form submission + validation.
 *
 */

import { useState, useActionState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store';
import { getApiErrorMessage } from '@/modules/auth/store/authStore.utils';
import { validatePassword } from '@/modules/auth/utils/password-validation';
import { isTurnstileEnabled } from '@/modules/auth/components/turnstile-widget';

interface RegisterFormState {
  error: string | null;
}

/**
 */
/**
 * Hook for managing register form.
 */
export function useRegisterForm() {
  const navigate = useNavigate();
  const { register, error, clearError } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);

  function getFormString(formData: FormData, key: string): string {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
  }

  const [formState, formAction, isPending] = useActionState(
    async (_prev: RegisterFormState, formData: FormData): Promise<RegisterFormState> => {
      clearError();

      const submittedEmail = getFormString(formData, 'email');
      const submittedUsername = getFormString(formData, 'username');
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
        await register(submittedEmail, submittedUsername, password, turnstileToken);
        navigate('/messages');
        return { error: null };
      } catch (error: unknown) {
        setTurnstileToken(null);
        setCaptchaResetSignal((value) => value + 1);
        return { error: getApiErrorMessage(error, 'Registration failed') };
      }
    },
    { error: null }
  );

  const displayError = formState.error || error;

  return {
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    email,
    setEmail,
    username,
    setUsername,
    turnstileToken,
    setTurnstileToken,
    captchaResetSignal,
    displayError,
    isLoading: isPending,
    formAction,
  };
}
