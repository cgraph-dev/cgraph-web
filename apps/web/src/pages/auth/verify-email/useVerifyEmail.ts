/**
 * Hook encapsulating email verification state and logic.
 *
 * Handles token verification on mount and resend functionality.
 *
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { http } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/api';
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

function getResponseStatus(error: unknown): number | undefined {
  if (!(typeof error === 'object' && error !== null && 'response' in error)) {
    return undefined;
  }

  const response = error.response;

  if (!(typeof response === 'object' && response !== null && 'status' in response)) {
    return undefined;
  }

  return typeof response.status === 'number' ? response.status : undefined;
}

function isRecoverableVerificationError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const status = getResponseStatus(error);

  return status === 400 || status === 410 || message.includes('expired');
}

function getResendErrorMessage(error: unknown): string {
  const message = getErrorMessage(error).trim();
  return message || 'Could not send a new verification email. Please try again.';
}

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
        if (isRecoverableVerificationError(error)) {
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
    } catch (error: unknown) {
      logger.warn('Failed to resend verification email', error);
      setResendError(getResendErrorMessage(error));
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
