/**
 * Rate limit challenge dialog.
 *
 * Shown when the server returns 428 Precondition Required with challenge options.
 * Handles the full challenge flow:
 * 1. Fetch challenge options from server
 * 2. If push available, show "Verifying your device..." with spinner
 * 3. After 10s timeout or manual click, fall back to CAPTCHA
 * 4. On CAPTCHA success, notify parent via onResolved
 *
 * Mirrors Signal's RateLimitChallengeManager client flow: push first, CAPTCHA fallback.
 */
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { logger } from '@/lib/logger';
import { TurnstileWidget } from './turnstile-widget';

interface RateLimitChallengeProps {
  readonly onResolved: () => void;
  readonly onDismiss: () => void;
}

const PUSH_TIMEOUT_MS = 10_000;

/**
 * Rate limit challenge resolution dialog.
 *
 * Presents push challenge waiting UI with automatic CAPTCHA fallback.
 */
function RateLimitChallenge({ onResolved, onDismiss }: RateLimitChallengeProps): ReactNode {
  const [phase, setPhase] = useState<'loading' | 'push_waiting' | 'captcha' | 'resolved' | 'error'>(
    'loading'
  );
  const [, setChallengeOptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initChallenge();
  }, []);

  async function initChallenge(): Promise<void> {
    try {
      const response = await fetch('/api/v1/challenge/options');
      const json = await response.json();
      const options = json.data?.options ?? [];
      setChallengeOptions(options);

      if (options.includes('push')) {
        setPhase('push_waiting');

        // Wait for push challenge to be answered (via service worker / WebSocket)
        // After timeout, fall back to CAPTCHA
        setTimeout(() => {
          setPhase((current) => {
            if (current === 'push_waiting') return 'captcha';
            return current;
          });
        }, PUSH_TIMEOUT_MS);
      } else {
        setPhase('captcha');
      }
    } catch {
      setPhase('error');
      setError('Failed to load challenge');
    }
  }

  const handleCaptchaComplete = useCallback(
    async (token: string): Promise<void> => {
      try {
        const response = await fetch('/api/v1/challenge/captcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ captcha_token: token }),
        });

        if (response.ok) {
          setPhase('resolved');
          onResolved();
        } else {
          setError('CAPTCHA verification failed. Please try again.');
          logger.warn('captcha_challenge_failed');
        }
      } catch {
        setError('CAPTCHA verification failed. Please try again.');
        logger.warn('captcha_challenge_failed');
      }
    },
    [onResolved]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card mx-4 w-full max-w-sm rounded-xl p-6 shadow-xl"
      >
        <AnimatePresence mode="wait">
          {phase === 'loading' ? (
            <motion.div key="loading" className="py-8 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-muted-foreground mt-4 text-sm">Preparing verification...</p>
            </motion.div>
          ) : null}

          {phase === 'push_waiting' ? (
            <motion.div key="push" className="py-8 text-center">
              <div className="bg-primary/20 mx-auto flex h-12 w-12 animate-pulse items-center justify-center rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-6 w-6"
                >
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium">Verifying your device</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Check your device for a verification notification...
              </p>
              <button
                onClick={() => setPhase('captcha')}
                className="mt-4 text-sm text-primary underline"
                type="button"
              >
                Use CAPTCHA instead
              </button>
            </motion.div>
          ) : null}

          {phase === 'captcha' ? (
            <motion.div key="captcha" className="py-4">
              <h3 className="mb-4 text-center text-lg font-medium">Complete verification</h3>
              <p className="text-muted-foreground mb-4 text-center text-sm">
                Please complete the CAPTCHA below to continue.
              </p>

              <TurnstileWidget
                onTokenChange={(token) => token && void handleCaptchaComplete(token)}
              />

              {error ? <p className="text-destructive mt-3 text-center text-sm">{error}</p> : null}
            </motion.div>
          ) : null}

          {phase === 'resolved' ? (
            <motion.div key="resolved" className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-6 w-6 text-green-500"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-muted-foreground mt-4 text-sm">Verification complete!</p>
            </motion.div>
          ) : null}

          {phase === 'error' ? (
            <motion.div key="error" className="py-8 text-center">
              <p className="text-destructive text-sm">{error}</p>
              <button
                onClick={() => initChallenge()}
                className="mt-4 text-sm text-primary underline"
                type="button"
              >
                Try again
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-4 flex justify-end">
          <button onClick={onDismiss} className="text-muted-foreground text-sm" type="button">
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export { RateLimitChallenge };
