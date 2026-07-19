import { useCallback, useEffect, useRef, useState } from 'react';
import type { MessageRequestStatus } from '@cgraph-dev/shared-types';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/api';
import { createLogger } from '@/lib/logger';

const logger = createLogger('MessageRequest');

export type MessageRequestAction =
  | 'accept'
  | 'delete'
  | 'block'
  | 'block-and-report'
  | 'unblock';

export type MessageRequestViewStatus = MessageRequestStatus | 'loading' | 'error';

export interface MessageRequestDetails {
  readonly requesterName: string;
  readonly requesterAvatar: string | null;
  readonly sharedGroupCount: number;
  readonly reportedAsSpam: boolean;
}

export interface MessageRequestController {
  readonly status: MessageRequestViewStatus;
  readonly details: MessageRequestDetails | null;
  readonly activeAction: MessageRequestAction | null;
  readonly error: string | null;
  readonly blocksComposer: boolean;
  readonly retry: () => void;
  readonly accept: () => Promise<boolean>;
  readonly deleteRequest: () => Promise<boolean>;
  readonly block: () => Promise<boolean>;
  readonly blockAndReport: () => Promise<boolean>;
  readonly unblock: () => Promise<boolean>;
}

type MessageRequestActionResult = Awaited<
  ReturnType<typeof apiClient.messageRequests.accept>
>;

type MessageRequestGetResult = Awaited<
  ReturnType<typeof apiClient.messageRequests.get>
>;

type MessageRequestGetPayload = Extract<
  MessageRequestGetResult,
  { ok: true }
>['data'];

function requestDetails(
  data: MessageRequestGetPayload
): MessageRequestDetails | null {
  if (!('requester' in data)) return null;

  return {
    requesterName:
      data.requester.display_name ?? data.requester.username ?? 'Unknown user',
    requesterAvatar: data.requester.avatar_url,
    sharedGroupCount: data.shared_group_count,
    reportedAsSpam: data.reported_as_spam,
  };
}

/**
 * Route-local projection of the recipient-owned message-request contract.
 */
export function useMessageRequest(
  conversationId: string | undefined,
  currentParticipantRequestStatus?: MessageRequestStatus | null
): MessageRequestController {
  const [status, setStatus] = useState<MessageRequestViewStatus>('loading');
  const [details, setDetails] = useState<MessageRequestDetails | null>(null);
  const [activeAction, setActiveAction] =
    useState<MessageRequestAction | null>(null);
  const actionLockRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!conversationId) {
      setStatus('accepted');
      setDetails(null);
      setError(null);
      return;
    }

    if (
      currentParticipantRequestStatus === null ||
      currentParticipantRequestStatus === 'accepted' ||
      currentParticipantRequestStatus === 'rejected'
    ) {
      setStatus(currentParticipantRequestStatus ?? 'accepted');
      setDetails(null);
      setError(null);
      return;
    }

    let isActive = true;
    setStatus('loading');
    setDetails(null);
    setError(null);

    void apiClient.messageRequests
      .get(conversationId)
      .then((result) => {
        if (!isActive) return;

        if (!result.ok) {
          setStatus('error');
          setError(result.error.message);
          return;
        }

        const details = requestDetails(result.data);

        if (!details) {
          setStatus('error');
          setError('Message request details are unavailable.');
          return;
        }

        setStatus(result.data.status);
        setDetails(details);
      })
      .catch((loadError: unknown) => {
        if (!isActive) return;
        setStatus('error');
        setError(getErrorMessage(loadError));
      });

    return () => {
      isActive = false;
    };
  }, [conversationId, currentParticipantRequestStatus, reloadKey]);

  const runAction = useCallback(
    async (
      action: MessageRequestAction,
      operation: (targetConversationId: string) => Promise<MessageRequestActionResult>
    ): Promise<boolean> => {
      if (!conversationId || actionLockRef.current) return false;

      actionLockRef.current = true;
      setActiveAction(action);
      setError(null);

      try {
        const result = await operation(conversationId);
        if (!result.ok) {
          setError(result.error.message);
          return false;
        }

        setStatus(result.data.status);
        if (result.data.status === 'blocked') {
          setDetails((current) =>
            current
              ? {
                  ...current,
                  reportedAsSpam:
                    result.data.reported ?? current.reportedAsSpam,
                }
              : current
          );
        } else {
          setDetails(null);
        }

        logger.info('Message request action completed', {
          action,
          conversationId,
          status: result.data.status,
        });
        return true;
      } catch (actionError: unknown) {
        setError(getErrorMessage(actionError));
        return false;
      } finally {
        actionLockRef.current = false;
        setActiveAction(null);
      }
    },
    [conversationId]
  );

  const accept = useCallback(
    () => runAction('accept', (targetId) => apiClient.messageRequests.accept(targetId)),
    [runAction]
  );

  const deleteRequest = useCallback(
    () => runAction('delete', (targetId) => apiClient.messageRequests.reject(targetId)),
    [runAction]
  );

  const block = useCallback(
    () => runAction('block', (targetId) => apiClient.messageRequests.block(targetId)),
    [runAction]
  );

  const blockAndReport = useCallback(
    () =>
      runAction('block-and-report', (targetId) =>
        apiClient.messageRequests.blockAndReport(targetId, 'spam')
      ),
    [runAction]
  );

  const unblock = useCallback(
    () => runAction('unblock', (targetId) => apiClient.messageRequests.unblock(targetId)),
    [runAction]
  );

  return {
    status,
    details,
    activeAction,
    error,
    blocksComposer:
      status === 'loading' ||
      status === 'error' ||
      status === 'pending' ||
      status === 'blocked',
    retry: () => setReloadKey((value) => value + 1),
    accept,
    deleteRequest,
    block,
    blockAndReport,
    unblock,
  };
}
