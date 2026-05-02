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

export type VerificationState = 'verifying' | 'success' | 'expired' | 'error' | 'already-verified';

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

  // Verify token on mount
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setState('error');
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

  // Resend verification email
  async function handleResend() {
    if (!user?.email) return;

    setIsResending(true);
    try {
      await http.post('/api/v1/auth/resend-verification', {
        email: user.email,
      });
      setResendSuccess(true);
    } catch (error) {
      logger.warn('Failed to resend verification email', error);
    } finally {
      setIsResending(false);
    }
  }

  return { state, isResending, resendSuccess, handleResend };
}
