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
import { getRateLimitRemainingMs, rememberRateLimit } from '@/lib/api-rate-limit';
import { createLogger } from '@/lib/logger';
import { useAuthStore } from '@/modules/auth/store';

const logger = createLogger('VerifyEmail');
const VERIFICATION_RESEND_RATE_LIMIT_SCOPE = 'auth:verification-resend';

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

function getRetryAfterSeconds(response: unknown): number | null {
  if (!(typeof response === 'object' && response !== null && 'data' in response)) {
    return null;
  }

  const data = response.data;
  if (!(typeof data === 'object' && data !== null && 'data' in data)) {
    return null;
  }

  const payload = data.data;
  if (!(typeof payload === 'object' && payload !== null && 'retry_after' in payload)) {
    return null;
  }

  const retryAfter = payload.retry_after;
  return typeof retryAfter === 'number' && Number.isFinite(retryAfter) && retryAfter > 0
    ? Math.ceil(retryAfter)
    : null;
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
  const [isCheckingVerificationStatus, setIsCheckingVerificationStatus] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendEmail, setResendEmail] = useState(searchParams.get('email') ?? user?.email ?? '');
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendCooldownUntil, setResendCooldownUntil] = useState(() => {
    const remainingMs = getRateLimitRemainingMs(VERIFICATION_RESEND_RATE_LIMIT_SCOPE);
    return remainingMs > 0 ? Date.now() + remainingMs : null;
  });
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const resendCooldownSeconds = resendCooldownUntil
    ? Math.max(0, Math.ceil((resendCooldownUntil - currentTime) / 1000))
    : 0;

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
    if (user?.email && resendEmail !== user.email) {
      setResendEmail(user.email);
    }
  }, [resendEmail, user?.email]);

  useEffect(() => {
    if (user?.emailVerifiedAt) {
      setState((currentState) =>
        currentState === 'success' ? currentState : 'already-verified'
      );
    }
  }, [user?.emailVerifiedAt]);

  useEffect(() => {
    if (!resendCooldownUntil) return undefined;

    const cooldownUntil = resendCooldownUntil;

    function updateCooldown() {
      const now = Date.now();
      setCurrentTime(now);

      if (now >= cooldownUntil) {
        setResendCooldownUntil(null);
      }
    }

    updateCooldown();
    const interval = window.setInterval(updateCooldown, 1000);
    return () => window.clearInterval(interval);
  }, [resendCooldownUntil]);

  async function handleVerificationStatusCheck() {
    if (!user || isCheckingVerificationStatus) return;

    setIsCheckingVerificationStatus(true);
    try {
      await checkAuth();
    } catch (error: unknown) {
      logger.warn('Failed to refresh verification status', error);
    } finally {
      setIsCheckingVerificationStatus(false);
    }
  }

  // Resend verification email
  async function handleResend() {
    if (resendCooldownSeconds > 0) return;

    const email = (user?.email ?? resendEmail).trim();
    if (!email) {
      setResendError('Enter the email address for this account.');
      return;
    }

    setIsResending(true);
    setResendError(null);
    try {
      const response = await http.post('/api/v1/auth/resend-verification', {
        email,
      });

      const retryAfterSeconds = getRetryAfterSeconds(response);
      if (retryAfterSeconds !== null) {
        setResendCooldownUntil(Date.now() + retryAfterSeconds * 1000);
      }

      setResendSuccess(true);
    } catch (error: unknown) {
      logger.warn('Failed to resend verification email', error);
      const rateLimitMessage = rememberRateLimit([VERIFICATION_RESEND_RATE_LIMIT_SCOPE], error);
      const remainingMs = getRateLimitRemainingMs(VERIFICATION_RESEND_RATE_LIMIT_SCOPE);

      if (remainingMs > 0) {
        setResendCooldownUntil(Date.now() + remainingMs);
      }

      setResendError(rateLimitMessage ?? getResendErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  }

  return {
    state,
    isResending,
    isCheckingVerificationStatus,
    resendSuccess,
    resendEmail,
    resendError,
    resendCooldownSeconds,
    isResendEmailEditable: !user,
    setResendEmail,
    handleVerificationStatusCheck,
    handleResend,
  };
}
