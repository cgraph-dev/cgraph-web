/**
 * Hook encapsulating email verification state and logic.
 *
 * Handles token verification on mount and resend functionality.
 *
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { useAuthStore } from '@/modules/auth/store';

const logger = createLogger('VerifyEmail');

export type VerificationState =
  | 'verifying'
  | 'pending'
  | 'success'
  | 'expired'
  | 'error'
  | 'already-verified';

/**
 */
/**
 * Hook for managing verify email.
 */
export function useVerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, checkAuth } = useAuthStore();

  const [state, setState] = useState<VerificationState>('verifying');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendEmail, setResendEmail] = useState(searchParams.get('email') ?? user?.email ?? '');
  const [resendError, setResendError] = useState<string | null>(null);

  // Verify token on mount
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setState('pending');
        return;
      }

      try {
        const response = await http.post('/api/v1/auth/verify-email', { token });

        if (response.data.already_verified) {
          setState('already-verified');
        } else {
          setState('success');
          await checkAuth?.();
        }
      } catch (error: unknown) {
        const resp = error instanceof Object && 'response' in error ? error.response : undefined;
        const status =
          resp instanceof Object && 'status' in resp && typeof resp.status === 'number'
            ? resp.status
            : undefined;
        if (status === 410) {
          setState('expired');
        } else {
          setState('error');
        }
      }
    }

    verifyToken();
  }, [token, checkAuth]);

  useEffect(() => {
    if (!resendEmail && user?.email) {
      setResendEmail(user.email);
    }
  }, [resendEmail, user?.email]);

  // Resend verification email
  async function handleResend() {
    const email = (user?.email ?? resendEmail).trim();
    if (!email) {
      setResendError('Enter the email address for this account.');
      return;
    }

    setIsResending(true);
    setResendError(null);
    try {
      await http.post('/api/v1/auth/resend-verification', {
        email,
      });
      setResendSuccess(true);
    } catch (error) {
      logger.warn('Failed to resend verification email', error);
      setResendError('Could not send a new verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  }

  return {
    state,
    isResending,
    resendSuccess,
    resendEmail,
    resendError,
    setResendEmail,
    handleResend,
  };
}
