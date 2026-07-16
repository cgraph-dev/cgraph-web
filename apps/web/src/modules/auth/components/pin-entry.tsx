import { type ReactNode, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { usePhoneRegistrationStore } from '@/modules/auth/store/registration-store';

const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 20;

interface PinEntryProps {
  readonly sessionId: string | null;
  readonly onNeedHelp: () => void;
}

/**
 * PIN entry during re-registration.
 *
 * Mirrors Signal's PinRestoreEntryFragment: PIN input with attempt counter,
 * exponential backoff lockout display, help/skip buttons.
 *
 * Shown when user tries to re-register with a phone session that has registration
 * lock enabled. Must enter correct PIN to proceed.
 */
function PinEntry({
  sessionId,
  onNeedHelp,
}: PinEntryProps): ReactNode {
  const completeRegistrationLock = usePhoneRegistrationStore(
    (state) => state.completeRegistrationLock
  );
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (pin.length < MIN_PIN_LENGTH || lockoutSeconds > 0) return;

    if (!sessionId) {
      setError('Start over and verify your phone number again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.pin.verifyRegistrationLock(sessionId, pin);

      if (result.ok) {
        const success = await completeRegistrationLock(result.data);

        if (!success) {
          setError(
            usePhoneRegistrationStore.getState().error ??
              'Verification succeeded, but the next step could not be loaded.'
          );
        }
      } else {
        const errorData = result.error;

        if (errorData.code === 'WRONG_PIN') {
          const details = errorData.details;
          const remaining = isAttemptsDetails(details) ? details.attempts_remaining : null;
          const timeLeft = isTimeDetails(details) ? details.time_remaining : 0;

          setAttemptsRemaining(remaining);
          setError('Incorrect PIN. Please try again.');

          if (timeLeft > 0) {
            setLockoutSeconds(timeLeft);
          }
        } else if (errorData.code === 'REGISTRATION_LOCKED') {
          const timeLeft = isTimeDetails(errorData.details) ? errorData.details.time_remaining : 60;
          setLockoutSeconds(timeLeft);
          setError('Too many attempts. Please wait.');
        } else {
          setError('Verification failed. Please try again.');
        }

        logger.warn('pin_entry_failed', { code: errorData.code });
        setPin('');
      }
    } catch (err: unknown) {
      setError('Verification failed. Please try again.');
      logger.error('pin_entry_error', {
        error: err instanceof Error ? err.message : 'unknown',
      });
      setPin('');
    } finally {
      setLoading(false);
    }
  }, [completeRegistrationLock, lockoutSeconds, pin, sessionId]);

  const isLocked = lockoutSeconds > 0;

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 p-6">
      <h2 className="text-xl font-semibold">Enter your PIN</h2>

      <p className="text-muted-foreground text-center text-sm">
        This account is registered with a PIN. Enter it to continue.
      </p>

      <input
        type="tel"
        inputMode="numeric"
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
        onKeyDown={handleKeyDown}
        maxLength={MAX_PIN_LENGTH}
        disabled={isLocked}
        className="w-full rounded-lg border bg-transparent p-3 text-center text-2xl tracking-widest disabled:opacity-50"
        autoFocus
        autoComplete="off"
        aria-label="Enter PIN"
      />

      {error ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-destructive text-center text-sm"
          role="alert"
        >
          {error}
        </motion.p>
      ) : null}

      {attemptsRemaining !== null && attemptsRemaining < 8 ? (
        <p className="text-muted-foreground text-xs">
          {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
        </p>
      ) : null}

      {isLocked ? (
        <div className="text-center">
          <p className="text-destructive text-sm font-medium">
            Locked for {formatCountdown(lockoutSeconds)}
          </p>
        </div>
      ) : null}

      <button
        onClick={handleSubmit}
        disabled={loading || pin.length < MIN_PIN_LENGTH || isLocked}
        className="text-primary-foreground w-full rounded-lg bg-primary py-3 font-medium disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Submit'}
      </button>

      <button
        onClick={onNeedHelp}
        className="text-muted-foreground text-sm underline"
        type="button"
      >
        Need help?
      </button>
    </div>
  );
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function isAttemptsDetails(details: unknown): details is { attempts_remaining: number } {
  if (typeof details !== 'object' || details === null) return false;
  if (!('attempts_remaining' in details)) return false;
  const record: Record<string, unknown> = details;
  return typeof record.attempts_remaining === 'number';
}

function isTimeDetails(details: unknown): details is { time_remaining: number } {
  if (typeof details !== 'object' || details === null) return false;
  if (!('time_remaining' in details)) return false;
  const record: Record<string, unknown> = details;
  return typeof record.time_remaining === 'number';
}

export { PinEntry };
