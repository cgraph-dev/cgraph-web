/**
 * Commission Detail Page — Full detail view with status timeline and actions.
 *
 * Shows commission info, status flow, and contextual action buttons
 * based on the current user's role (requester vs claimer) and status.
 *
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCommissionStore } from '@/modules/forums/store/commissionStore';
import { useAuthStore } from '@/stores';
import type { CommissionStatus } from '@/modules/forums/services/commission-service';
const STATUS_STEPS: readonly CommissionStatus[] = [
  'open',
  'claimed',
  'in_progress',
  'delivered',
  'accepted',
];

const STATUS_LABELS: Record<CommissionStatus, string> = {
  open: 'Open',
  claimed: 'Claimed',
  in_progress: 'In Progress',
  delivered: 'Delivered',
  accepted: 'Accepted',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
};

function getStepIndex(status: CommissionStatus): number {
  const idx = STATUS_STEPS.indexOf(status);
  return idx >= 0 ? idx : -1;
}
/** Commission Detail Page. */
export default function CommissionDetailPage() {
  const { forumId, boardId, commissionId } = useParams<{
    forumId: string;
    boardId: string;
    commissionId: string;
  }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const {
    selectedCommission: commission,
    isLoading,
    isActing,
    error,
    fetchCommission,
    claimCommission,
    startWork,
    deliverCommission,
    acceptCommission,
    cancelCommission,
  } = useCommissionStore();

  useEffect(() => {
    if (forumId && boardId && commissionId) {
      fetchCommission(forumId, boardId, commissionId);
    }
  }, [forumId, boardId, commissionId, fetchCommission]);

  if (isLoading || !commission) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <div className="py-20 text-center text-sm text-red-400">{error}</div>;
  }

  const isRequester = user?.id === commission.requester_id;
  const isClaimer = user?.id === commission.claimed_by;
  const currentStep = getStepIndex(commission.status);
  const isTerminal = commission.status === 'accepted' || commission.status === 'cancelled';

  async function handleClaim() {
    if (!forumId || !boardId) return;
    await claimCommission(forumId, boardId, commission!.id);
  }

  async function handleStartWork() {
    if (!forumId || !boardId) return;
    await startWork(forumId, boardId, commission!.id);
  }

  async function handleDeliver() {
    if (!forumId || !boardId) return;
    await deliverCommission(forumId, boardId, commission!.id);
  }

  async function handleAccept() {
    if (!forumId || !boardId) return;
    await acceptCommission(forumId, boardId, commission!.id);
  }

  async function handleCancel() {
    if (!forumId || !boardId) return;
    await cancelCommission(forumId, boardId, commission!.id);
  }

  const requesterName =
    commission.requester?.display_name ?? commission.requester?.username ?? 'Unknown';
  const claimerName = commission.claimer?.display_name ?? commission.claimer?.username;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
      >
        &larr; Back to board
      </button>

      {/* Header */}
      <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold text-zinc-100">{commission.title}</h1>
          <span className="shrink-0 rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-400">
            {commission.bounty_nodes} Nodes
          </span>
        </div>

        {commission.description ? (
          <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-300">{commission.description}</p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-500">
          <span>
            Requester: <span className="text-zinc-300">{requesterName}</span>
          </span>
          {claimerName ? (
            <span>
              Claimed by: <span className="text-zinc-300">{claimerName}</span>
            </span>
          ) : null}
          <span>Posted: {new Date(commission.inserted_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Status Timeline */}
      {!isTerminal && commission.status !== 'disputed' ? (
        <div className="mt-6 rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-6">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">Progress</h2>
          <div className="flex items-center gap-2">
            {STATUS_STEPS.map((step, idx) => {
              const isComplete = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={step} className="flex flex-1 items-center gap-2">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                      isComplete
                        ? isCurrent
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-500/20 text-amber-400'
                        : 'bg-zinc-700 text-zinc-500'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`whitespace-nowrap text-xs ${isComplete ? 'text-zinc-300' : 'text-zinc-600'}`}
                  >
                    {STATUS_LABELS[step]}
                  </span>
                  {idx < STATUS_STEPS.length - 1 ? (
                    <div
                      className={`h-px flex-1 ${idx < currentStep ? 'bg-amber-500/30' : 'bg-zinc-700'}`}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Disputed / Cancelled Banner */}
      {commission.status === 'disputed' ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-400">Disputed</p>
          {commission.dispute_reason ? (
            <p className="mt-1 text-sm text-zinc-400">{commission.dispute_reason}</p>
          ) : null}
        </div>
      ) : null}

      {commission.status === 'cancelled' ? (
        <div className="mt-6 rounded-xl border border-zinc-600/30 bg-zinc-800/50 p-4">
          <p className="text-sm font-medium text-zinc-400">
            This commission has been cancelled. The bounty was refunded.
          </p>
        </div>
      ) : null}

      {commission.status === 'accepted' ? (
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-sm font-medium text-emerald-400">Commission completed and accepted.</p>
        </div>
      ) : null}

      {/* Auto-accept notice */}
      {commission.status === 'delivered' && commission.auto_accept_at ? (
        <div className="bg-purple-500/5 border-purple-500/20 mt-4 rounded-lg border p-3">
          <p className="text-xs text-purple-300">
            Auto-accepts on {new Date(commission.auto_accept_at).toLocaleDateString()} if no action
            is taken.
          </p>
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        {/* Open — anyone except requester can claim */}
        {commission.status === 'open' && !isRequester ? (
          <button
            type="button"
            onClick={handleClaim}
            disabled={isActing}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {isActing ? 'Claiming...' : 'Claim Commission'}
          </button>
        ) : null}

        {/* Open/Claimed — requester can cancel */}
        {(commission.status === 'open' || commission.status === 'claimed') && isRequester ? (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isActing}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {isActing ? 'Cancelling...' : 'Cancel Commission'}
          </button>
        ) : null}

        {/* Claimed — claimer can start work */}
        {commission.status === 'claimed' && isClaimer ? (
          <button
            type="button"
            onClick={handleStartWork}
            disabled={isActing}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
          >
            {isActing ? 'Starting...' : 'Start Work'}
          </button>
        ) : null}

        {/* In Progress — claimer can deliver */}
        {commission.status === 'in_progress' && isClaimer ? (
          <button
            type="button"
            onClick={handleDeliver}
            disabled={isActing}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
          >
            {isActing ? 'Delivering...' : 'Mark as Delivered'}
          </button>
        ) : null}

        {/* Delivered — requester can accept */}
        {commission.status === 'delivered' && isRequester ? (
          <button
            type="button"
            onClick={handleAccept}
            disabled={isActing}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {isActing ? 'Accepting...' : 'Accept & Release Payment'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
