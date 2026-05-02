/**
 * PaidDmGate
 *
 * Sender-side gate that mounts above the chat composer when the conversation
 * peer has paid DMs enabled and the current user is NOT on their friend list.
 *
 * Flow (matches the per-file paid-DM unlock contract on the backend):
 *   1. Renders peer's price + sender's current Nodes balance.
 *   2. Shows balance preview after the unlock would settle.
 *   3. On "Pay & Send": calls PUT /api/v1/paid-dm/:fileId/unlock with the
 *      pending message id (server debits the sender, credits the creator),
 *      then invokes the parent-supplied `onPaidSend` to push the actual
 *      Cloud Chat message through the normal pipeline.
 *
 * This gate is the UI contract; wiring `peer`, `currentUserId`, `isFriend`,
 * and `balanceNodes` is the responsibility of the conversation page.
 */

import { useState } from 'react';
import { api } from '@/lib/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('PaidDmGate');

/** Peer (recipient) paid-DM configuration. */
export interface PaidDmPeer {
  /** Recipient user id. */
  readonly userId: string;
  /** Whether the recipient currently accepts paid DMs. */
  readonly paidDmEnabled: boolean;
  /** Per-message price in Nodes the sender must pay. */
  readonly nodePrice: number;
  /** Display name for the prompt copy. */
  readonly displayName?: string;
}

export interface PaidDmGateProps {
  readonly peer: PaidDmPeer;
  /** Whether the recipient is on the current user's friend list. Friends bypass the gate. */
  readonly isFriend: boolean;
  /** Sender's current Nodes balance. Null while the wallet is still loading. */
  readonly balanceNodes: number | null;
  /**
   * Identifier of the pending file/message that the unlock applies to. The
   * conversation flow creates this id when the sender drafts a paid DM
   * (typically by calling `POST /api/v1/paid-dm/send` first).
   */
  readonly pendingFileId: string;
  /** Optional message id to flip `is_file_locked = false` after unlock. */
  readonly messageId?: string;
  /** Called after the unlock settles successfully. */
  readonly onPaidSend: () => void | Promise<void>;
  /** Called when the user explicitly cancels the gate. */
  readonly onCancel?: () => void;
  readonly className?: string;
}

/** Network-side unlock call. Resolves on success, throws on failure. */
async function unlockPaidDm(fileId: string, messageId: string | undefined): Promise<void> {
  const body = messageId === undefined ? {} : { message_id: messageId };
  await api.put(`/api/v1/paid-dm/${fileId}/unlock`, body);
}

interface InsufficientBalanceCopyProps {
  readonly priceNodes: number;
  readonly balance: number | null;
}

function InsufficientBalanceCopy({ priceNodes, balance }: InsufficientBalanceCopyProps) {
  return (
    <p
      role="alert"
      className="text-sm text-[var(--token-color-warning,theme(colors.amber.300))]"
    >
      You need {priceNodes - (balance ?? 0)} more Nodes to send this DM.
    </p>
  );
}

interface BalancePreviewProps {
  readonly current: number;
  readonly priceNodes: number;
}

function BalancePreview({ current, priceNodes }: BalancePreviewProps) {
  const after = Math.max(0, current - priceNodes);
  return (
    <p className="text-xs text-[var(--token-text-secondary)]">
      Balance: <span className="font-medium text-white">{current}</span>
      {' → '}
      <span className="font-medium text-[var(--token-primary)]">{after}</span> Nodes after
      send
    </p>
  );
}

/** Sender-side gate above the composer for paid DMs. Hidden for friends and when peer is not gated. */
export function PaidDmGate({
  peer,
  isFriend,
  balanceNodes,
  pendingFileId,
  messageId,
  onPaidSend,
  onCancel,
  className = '',
}: PaidDmGateProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!peer.paidDmEnabled || isFriend) {
    return null;
  }

  const hasFunds = balanceNodes !== null && balanceNodes >= peer.nodePrice;
  const recipient = peer.displayName ?? 'this user';

  async function handlePayAndSend(): Promise<void> {
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await unlockPaidDm(pendingFileId, messageId);
      await onPaidSend();
    } catch (error) {
      logger.error('Paid DM unlock failed', error);
      setErrorMessage('Could not unlock this DM. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      data-testid="paid-dm-gate"
      className={`flex flex-col gap-2 rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)] p-3 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-white">
            Send {peer.nodePrice} Nodes to deliver this message to {recipient}
          </p>
          {balanceNodes !== null && hasFunds ? (
            <BalancePreview current={balanceNodes} priceNodes={peer.nodePrice} />
          ) : null}
          {balanceNodes !== null && !hasFunds ? (
            <InsufficientBalanceCopy priceNodes={peer.nodePrice} balance={balanceNodes} />
          ) : null}
        </div>
      </div>

      {errorMessage !== null && (
        <p role="alert" className="text-xs text-red-400">
          {errorMessage}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={submitting || !hasFunds}
          onClick={() => {
            void handlePayAndSend();
          }}
          className="rounded-md bg-[var(--token-primary)] px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Pay & Send'}
        </button>
        {onCancel !== undefined && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-[var(--token-border-muted)] px-3 py-1.5 text-sm text-white transition-colors hover:bg-[var(--token-card-bg)]"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default PaidDmGate;
