/**
 * DunningModal — surfaced when the user's subscription is `past_due`.
 *
 * Shows the failed-invoice amount, lets the user open the Stripe billing
 * portal to update their card, manually retries the failed invoice via
 * `POST /api/v1/me/subscription/retry-payment`, or dismisses for 24 hours.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { GlassCard, toast } from '@/shared/components/ui';
import { http } from '@/lib/api-client';
import { safeLocalStorage } from '@/lib/safeStorage';
import { STORAGE_KEYS } from '@/lib/storage/namespaces';
import { createLogger } from '@/lib/logger';
import { usePremiumStore } from '@/modules/premium/store';

const logger = createLogger('DunningModal');

const DISMISS_STORAGE_KEY = STORAGE_KEYS.dunningDismissedUntil;
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Shape of the response from the retry-payment endpoint.
 */
interface RetryPaymentResponse {
  readonly data?: {
    readonly resolved: boolean;
  };
  readonly error?: {
    readonly code: string;
    readonly message: string;
  };
}

interface DunningModalProps {
  readonly amountDueCents: number;
  readonly currency: string;
  readonly onResolved?: () => void;
}

function formatAmount(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(2);
  const upper = currency.toUpperCase();
  if (upper === 'USD') return `$${amount}`;
  if (upper === 'EUR') return `€${amount}`;
  if (upper === 'GBP') return `£${amount}`;
  return `${upper} ${amount}`;
}

function isDismissed(): boolean {
  const raw = safeLocalStorage.getItem(DISMISS_STORAGE_KEY);
  if (typeof raw !== 'string' || raw.length === 0) return false;
  const until = Number.parseInt(raw, 10);
  if (Number.isNaN(until)) return false;
  return until > Date.now();
}

/**
 * Past-due subscription dialog. Mounts only when the premium store reports
 * `status === 'past_due'` and the user hasn't dismissed it in the last 24h.
 */
export function DunningModal({
  amountDueCents,
  currency,
  onResolved,
}: DunningModalProps): React.ReactElement | null {
  const status = usePremiumStore((state) => state.status);
  const openBillingPortal = usePremiumStore((state) => state.openBillingPortal);
  const fetchBillingStatus = usePremiumStore((state) => state.fetchBillingStatus);
  const [isOpen, setIsOpen] = useState<boolean>(() => status === 'past_due' && !isDismissed());
  const [isRetrying, setIsRetrying] = useState(false);

  if (status !== 'past_due' || !isOpen) return null;

  const handleRetry = async (): Promise<void> => {
    setIsRetrying(true);
    try {
      const response = await http.post<RetryPaymentResponse>(
        '/api/v1/me/subscription/retry-payment',
      );
      const body = response.data;

      if (body.data?.resolved) {
        toast.success('Payment retried successfully.');
        await fetchBillingStatus();
        setIsOpen(false);
        onResolved?.();
        return;
      }

      const message = body.error?.message ?? 'Could not retry the payment.';
      toast.error(message);
    } catch (error) {
      logger.error('retry_payment_failed', error);
      toast.error('Could not retry the payment. Please update your card.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleUpdateCard = async (): Promise<void> => {
    try {
      await openBillingPortal();
    } catch (error) {
      logger.error('open_billing_portal_failed', error);
      toast.error('Could not open the billing portal.');
    }
  };

  const handleDismiss = (): void => {
    safeLocalStorage.setItem(
      DISMISS_STORAGE_KEY,
      String(Date.now() + DISMISS_DURATION_MS),
    );
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dunning-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          className="w-full max-w-md"
        >
          <GlassCard variant="crystal" className="relative p-6">
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss for 24 hours"
              className="absolute right-4 top-4 rounded-lg bg-white/5 p-2 transition-colors hover:bg-white/10"
            >
              <XMarkIcon className="h-5 w-5 text-white/60" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-amber-300 ring-1 ring-amber-400/20">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-widest">
                  Payment Failed
                </span>
              </div>
              <h2 id="dunning-modal-title" className="text-xl font-bold text-white">
                We couldn&apos;t process your last payment
              </h2>
              <p className="text-sm leading-relaxed text-white/70">
                {`Your subscription is past due. Stripe was unable to charge ${formatAmount(amountDueCents, currency)}. Update your payment method or retry the charge to keep premium features active.`}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRetrying ? 'Retrying…' : 'Try again'}
              </button>
              <button
                type="button"
                onClick={handleUpdateCard}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                Update payment method
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full rounded-xl px-6 py-2 text-xs font-medium uppercase tracking-widest text-white/40 transition-colors hover:text-white/70"
              >
                Dismiss for 24 hours
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default DunningModal;
