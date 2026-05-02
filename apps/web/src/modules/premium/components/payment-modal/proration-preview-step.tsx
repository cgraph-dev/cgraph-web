/**
 * ProrationPreviewStep — fetches the cost preview for a tier change before
 * the user confirms.
 *
 * Renders the human `summary` string from
 * `GET /api/v1/me/subscription/preview-change?to={tier}` plus the
 * proration amount in dollars. Calls `onConfirm(target)` when the user
 * accepts so the parent can proceed to the existing checkout flow.
 */

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import type { SubscriptionTier } from '@/modules/premium/types';

const logger = createLogger('ProrationPreviewStep');

interface ProrationPreviewPayload {
  readonly amount_due_now: number;
  readonly currency: string;
  readonly proration_amount: number;
  readonly next_renewal_date: string | null;
  readonly summary: string;
}

interface ProrationPreviewResponse {
  readonly data?: ProrationPreviewPayload;
  readonly error?: { readonly code: string; readonly message: string };
}

interface ProrationPreviewStepProps {
  readonly targetTier: SubscriptionTier;
  readonly onConfirm: (tier: SubscriptionTier) => void;
  readonly onCancel: () => void;
}

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly preview: ProrationPreviewPayload }
  | { readonly status: 'error'; readonly message: string };

function formatCents(cents: number, currency: string): string {
  const upper = currency.toUpperCase();
  const dollars = (Math.abs(cents) / 100).toFixed(2);
  if (upper === 'USD') return `$${dollars}`;
  if (upper === 'EUR') return `€${dollars}`;
  if (upper === 'GBP') return `£${dollars}`;
  return `${upper} ${dollars}`;
}

async function fetchPreview(tier: SubscriptionTier): Promise<LoadState> {
  try {
    const response = await http.get<ProrationPreviewResponse>(
      `/api/v1/me/subscription/preview-change?to=${tier}`,
    );
    if (response.data.data) {
      return { status: 'ready', preview: response.data.data };
    }
    const message = response.data.error?.message ?? 'Could not load the preview.';
    return { status: 'error', message };
  } catch (error) {
    logger.error('preview_change_fetch_failed', error);
    return { status: 'error', message: 'Could not load the preview.' };
  }
}

/**
 * Step that renders the proration preview returned by the backend before
 * the user confirms a tier change.
 */
export function ProrationPreviewStep({
  targetTier,
  onConfirm,
  onCancel,
}: ProrationPreviewStepProps): React.ReactElement {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    void fetchPreview(targetTier).then((next) => {
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [targetTier]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-5"
      data-testid="proration-preview-step"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-white">Confirm your plan change</h3>
        <p className="text-sm text-white/60">
          Switching to <span className="font-semibold capitalize">{targetTier}</span>. Here&apos;s
          what your bill will look like.
        </p>
      </div>

      {state.status === 'loading' && (
        <p className="rounded-xl bg-white/5 px-4 py-6 text-center text-sm text-white/60">
          Loading preview…
        </p>
      )}

      {state.status === 'error' && (
        <p
          className="rounded-xl bg-red-500/10 px-4 py-6 text-center text-sm text-red-300"
          role="alert"
        >
          {state.message}
        </p>
      )}

      {state.status === 'ready' && (
        <div className="space-y-3 rounded-xl bg-white/5 p-4">
          <p className="text-sm text-white/80">{state.preview.summary}</p>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-white/40">Charged today</dt>
              <dd className="font-mono text-base font-bold text-white">
                {formatCents(state.preview.amount_due_now, state.preview.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-white/40">Proration</dt>
              <dd className="font-mono text-base font-bold text-white">
                {state.preview.proration_amount < 0 ? '-' : ''}
                {formatCents(state.preview.proration_amount, state.preview.currency)}
              </dd>
            </div>
          </dl>
          {state.preview.next_renewal_date ? (
            <p className="text-xs text-white/40">
              Next renewal: {new Date(state.preview.next_renewal_date).toLocaleDateString()}
            </p>
          ) : null}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => onConfirm(targetTier)}
          disabled={state.status !== 'ready'}
          className="flex-1 rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Confirm change
        </button>
      </div>
    </motion.div>
  );
}

export default ProrationPreviewStep;
