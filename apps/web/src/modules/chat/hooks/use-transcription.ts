/**
 * Hook for managing voice message transcription state.
 *
 * Handles requesting transcription via the API, listening for
 * WebSocket events (transcription:complete, transcription:failed),
 * and exposing the current status per message.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import type {
  TranscriptionStatus,
  TranscriptionCompleteEvent,
  TranscriptionFailedEvent,
  TranscriptionProcessingEvent,
} from '@cgraph-dev/shared-types';
import type { Channel } from 'phoenix';

const logger = createLogger('Transcription');

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTranscriptionCompleteEvent(payload: unknown): payload is TranscriptionCompleteEvent {
  if (!isRecord(payload)) return false;
  return (
    typeof payload.message_id === 'string' &&
    typeof payload.text === 'string' &&
    typeof payload.language === 'string'
  );
}

function isTranscriptionFailedEvent(payload: unknown): payload is TranscriptionFailedEvent {
  if (!isRecord(payload)) return false;
  return typeof payload.message_id === 'string' && typeof payload.error === 'string';
}

function isTranscriptionProcessingEvent(payload: unknown): payload is TranscriptionProcessingEvent {
  if (!isRecord(payload)) return false;
  return typeof payload.message_id === 'string' && payload.status === 'processing';
}

function extractRetryAfterSeconds(details: unknown): number {
  if (!isRecord(details)) return 60;
  if ('retry_after_seconds' in details && typeof details.retry_after_seconds === 'number') {
    return details.retry_after_seconds;
  }
  return 60;
}

interface TranscriptionState {
  readonly text: string | null;
  readonly language: string | null;
  readonly status: TranscriptionStatus | 'idle';
  readonly error: string | null;
  readonly retryAfter: number | null;
}

const INITIAL_STATE: TranscriptionState = {
  text: null,
  language: null,
  status: 'idle',
  error: null,
  retryAfter: null,
};

interface UseTranscriptionResult {
  /** Request transcription for the given message. */
  readonly requestTranscription: (messageId: string) => Promise<void>;
  /** The transcription text if completed, null otherwise. */
  readonly transcriptionText: string | null;
  /** Detected language code (e.g. "en", "es"). */
  readonly language: string | null;
  /** Current transcription status. */
  readonly status: TranscriptionStatus | 'idle';
  /** Whether a transcription request is in progress. */
  readonly isLoading: boolean;
  /** Error message if transcription failed or was rate limited. */
  readonly error: string | null;
}

/**
 * Manage transcription state for a single message within a conversation channel.
 *
 * @param channel - The Phoenix conversation channel to listen for events on.
 * @param messageId - The message ID to track transcription for.
 * @param initialText - Pre-existing transcription text (from message data).
 */
export function useTranscription(
  channel: Channel | null,
  messageId: string,
  initialText?: string | null
): UseTranscriptionResult {
  const [state, setState] = useState<TranscriptionState>(() => {
    if (initialText) {
      return { ...INITIAL_STATE, text: initialText, status: 'completed' };
    }
    return INITIAL_STATE;
  });

  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for transcription WebSocket events
  useEffect(() => {
    if (!channel) return;

    const handleComplete = (payload: unknown): void => {
      if (!isTranscriptionCompleteEvent(payload)) return;
      if (payload.message_id !== messageId) return;

      setState({
        text: payload.text,
        language: payload.language,
        status: 'completed',
        error: null,
        retryAfter: null,
      });
    };

    const handleFailed = (payload: unknown): void => {
      if (!isTranscriptionFailedEvent(payload)) return;
      if (payload.message_id !== messageId) return;

      setState((prev) => ({
        ...prev,
        status: 'failed',
        error: payload.error || 'Transcription failed',
        retryAfter: null,
      }));
    };

    const handleProcessing = (payload: unknown): void => {
      if (!isTranscriptionProcessingEvent(payload)) return;
      if (payload.message_id !== messageId) return;

      setState((prev) => ({
        ...prev,
        status: 'processing',
        error: null,
      }));
    };

    const refComplete = channel.on('transcription:complete', handleComplete);
    const refFailed = channel.on('transcription:failed', handleFailed);
    const refProcessing = channel.on('transcription:processing', handleProcessing);

    return () => {
      channel.off('transcription:complete', refComplete);
      channel.off('transcription:failed', refFailed);
      channel.off('transcription:processing', refProcessing);
    };
  }, [channel, messageId]);

  // Cleanup retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const requestTranscription = useCallback(async (msgId: string): Promise<void> => {
    setState((prev) => ({ ...prev, status: 'pending', error: null, retryAfter: null }));

    const result = await apiClient.transcription.requestTranscription(msgId);

    if (result.ok) {
      logger.info('Transcription queued', { messageId: msgId });
      setState((prev) => ({ ...prev, status: 'pending' }));
    } else {
      const errorCode = result.error.code;
      if (errorCode === 'rate_limited') {
        const retryAfter = extractRetryAfterSeconds(result.error.details);

        setState((prev) => ({
          ...prev,
          status: 'idle',
          error: `Rate limited — try again in ${retryAfter} seconds`,
          retryAfter,
        }));

        // Auto-clear rate limit error after the retry period
        retryTimerRef.current = setTimeout(() => {
          setState((prev) => {
            if (prev.retryAfter) {
              return { ...prev, error: null, retryAfter: null };
            }
            return prev;
          });
        }, retryAfter * 1000);
      } else {
        setState((prev) => ({
          ...prev,
          status: 'idle',
          error: result.error.message,
        }));
      }
    }
  }, []);

  const isLoading = state.status === 'pending' || state.status === 'processing';

  return {
    requestTranscription,
    transcriptionText: state.text,
    language: state.language,
    status: state.status,
    isLoading,
    error: state.error,
  };
}
