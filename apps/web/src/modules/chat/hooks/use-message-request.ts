import { useCallback } from 'react';
import { useMessageRequestStore } from '../store/message-request-store';
import { apiClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('MessageRequest');

interface UseMessageRequestOptions {
  /** The conversation ID to manage message request state for. */
  readonly conversationId: string;
}

/**
 * Hook for managing message request actions on a conversation.
 *
 * Wraps the apiClient.messageRequests endpoints with store state management.
 * Used by the MessageRequestBanner component.
 *
 * @see MessageRequestRepository.java
 */
export function useMessageRequest({ conversationId }: UseMessageRequestOptions) {
  const setRequestState = useMessageRequestStore((s) => s.setRequestState);
  const removeRequestState = useMessageRequestStore(
    (s) => s.removeRequestState,
  );
  const setProcessingAction = useMessageRequestStore(
    (s) => s.setProcessingAction,
  );
  const setActionError = useMessageRequestStore((s) => s.setActionError);
  const status = useMessageRequestStore(
    (s) => s.requestStates[conversationId],
  );
  const isProcessing = useMessageRequestStore(
    (s) => s.processingAction === conversationId,
  );

  const acceptRequest = useCallback(async () => {
    setProcessingAction(conversationId);
    setActionError(null);
    try {
      const result = await apiClient.messageRequests.accept(conversationId);
      if (result.ok) {
        removeRequestState(conversationId);
        logger.info('Message request accepted', { conversationId });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to accept';
      setActionError(message);
    } finally {
      setProcessingAction(null);
    }
  }, [conversationId, removeRequestState, setProcessingAction, setActionError]);

  const rejectRequest = useCallback(async () => {
    setProcessingAction(conversationId);
    setActionError(null);
    try {
      const result = await apiClient.messageRequests.reject(conversationId);
      if (result.ok) {
        removeRequestState(conversationId);
        logger.info('Message request rejected', { conversationId });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to reject';
      setActionError(message);
    } finally {
      setProcessingAction(null);
    }
  }, [conversationId, removeRequestState, setProcessingAction, setActionError]);

  const blockRequest = useCallback(async () => {
    setProcessingAction(conversationId);
    setActionError(null);
    try {
      const result = await apiClient.messageRequests.block(conversationId);
      if (result.ok) {
        setRequestState(conversationId, 'blocked');
        logger.info('Message request blocked', { conversationId });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to block';
      setActionError(message);
    } finally {
      setProcessingAction(null);
    }
  }, [conversationId, setRequestState, setProcessingAction, setActionError]);

  const blockAndReport = useCallback(
    async (reason?: string) => {
      setProcessingAction(conversationId);
      setActionError(null);
      try {
        const result = await apiClient.messageRequests.blockAndReport(
          conversationId,
          reason,
        );
        if (result.ok) {
          setRequestState(conversationId, 'blocked');
          logger.info('Message request blocked and reported', {
            conversationId,
          });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to block and report';
        setActionError(message);
      } finally {
        setProcessingAction(null);
      }
    },
    [conversationId, setRequestState, setProcessingAction, setActionError],
  );

  return {
    status,
    isProcessing,
    isPending: status === 'pending',
    acceptRequest,
    rejectRequest,
    blockRequest,
    blockAndReport,
  } as const;
}
