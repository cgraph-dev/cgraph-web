import { useState } from 'react';
import type { ReactNode } from 'react';
import { useMessageRequest } from '../hooks/use-message-request';

interface MessageRequestBannerProps {
  /** The conversation this request belongs to. */
  readonly conversationId: string;
  /** Display name of the requester. */
  readonly requesterName: string;
  /** Avatar URL of the requester (null for default avatar). */
  readonly requesterAvatar: string | null;
  /** Number of groups shared between requester and recipient. */
  readonly sharedGroupCount: number;
  /** Called after the request is accepted. */
  readonly onAccepted: () => void;
  /** Called after the request is rejected or blocked. */
  readonly onRejected: () => void;
}

/**
 * Approval banner shown at the top of a conversation when a stranger sends a DM.
 *
 * Mirrors Signal's MessageRequestsBottomView:
 * - Shows requester info and shared group count
 * - Accept button: approves the conversation
 * - Delete button: deletes the conversation
 * - Block button: blocks the sender (expandable for report spam)
 *
 * @see MessageRequestRepository.java
 */
export function MessageRequestBanner({
  conversationId,
  requesterName,
  requesterAvatar,
  sharedGroupCount,
  onAccepted,
  onRejected,
}: MessageRequestBannerProps): ReactNode {
  const { isPending, isProcessing, acceptRequest, rejectRequest, blockRequest, blockAndReport } =
    useMessageRequest({ conversationId });

  const [showBlockOptions, setShowBlockOptions] = useState(false);

  if (!isPending) {
    return null;
  }

  async function handleAccept(): Promise<void> {
    await acceptRequest();
    onAccepted();
  }

  async function handleReject(): Promise<void> {
    await rejectRequest();
    onRejected();
  }

  async function handleBlock(): Promise<void> {
    await blockRequest();
    onRejected();
  }

  async function handleBlockAndReport(): Promise<void> {
    await blockAndReport('spam');
    onRejected();
  }

  return (
    <div className="border-b border-border bg-muted/50 px-4 py-3">
      <div className="mb-3 flex items-center gap-3">
        {requesterAvatar ? (
          <img
            src={requesterAvatar}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {requesterName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            <span className="font-semibold">{requesterName}</span> wants to
            message you
          </p>
          {sharedGroupCount > 0 ? (
            <p className="text-xs text-muted-foreground">
              {sharedGroupCount} shared group
              {sharedGroupCount !== 1 ? 's' : ''}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">No shared groups</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          onClick={handleAccept}
          disabled={isProcessing}
        >
          Accept
        </button>
        <button
          type="button"
          className="flex-1 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50"
          onClick={handleReject}
          disabled={isProcessing}
        >
          Delete
        </button>
        <button
          type="button"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
          onClick={() => setShowBlockOptions((prev) => !prev)}
          disabled={isProcessing}
        >
          Block
        </button>
      </div>

      {showBlockOptions ? (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-md bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
            onClick={handleBlock}
            disabled={isProcessing}
          >
            Block User
          </button>
          <button
            type="button"
            className="flex-1 rounded-md bg-destructive px-3 py-2 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
            onClick={handleBlockAndReport}
            disabled={isProcessing}
          >
            Block & Report Spam
          </button>
        </div>
      ) : null}
    </div>
  );
}
