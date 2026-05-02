/**
 * Transcribe button for voice messages.
 *
 * Appears below the voice waveform. When clicked, requests async
 * transcription from the backend. Shows a spinner while processing
 * and hides once a transcription result is available.
 *
 * Mirrors Telegram's TranscribeButton pattern (premium feature with
 * rate-limited free tier access).
 */
import { type ReactNode, useCallback } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('TranscriptionButton');

interface TranscriptionButtonProps {
  /** The message ID to transcribe. */
  readonly messageId: string;
  /** Whether the message is a voice type. */
  readonly isVoiceMessage: boolean;
  /** Whether the feature flag is enabled. */
  readonly featureEnabled: boolean;
  /** Whether a transcription already exists. */
  readonly hasTranscription: boolean;
  /** Whether a transcription request is loading. */
  readonly isLoading: boolean;
  /** Error message (e.g. rate limit). */
  readonly error: string | null;
  /** Callback to request transcription. */
  readonly onRequestTranscription: (messageId: string) => Promise<void>;
}

/**
 * Button to trigger voice-to-text transcription on a voice message.
 *
 * Hidden when: message is not voice type, feature flag is disabled,
 * or transcription already exists. Shows a spinner during processing.
 */
export function TranscriptionButton(props: TranscriptionButtonProps): ReactNode {
  const {
    messageId,
    isVoiceMessage,
    featureEnabled,
    hasTranscription,
    isLoading,
    error,
    onRequestTranscription,
  } = props;

  const handleClick = useCallback((): void => {
    if (isLoading || hasTranscription) return;
    logger.info('Requesting transcription', { messageId });
    onRequestTranscription(messageId).catch(() => {
      // Error handled by hook state
    });
  }, [messageId, isLoading, hasTranscription, onRequestTranscription]);

  // Don't render if conditions aren't met
  if (!isVoiceMessage || !featureEnabled || hasTranscription) {
    return null;
  }

  return (
    <div className="mt-1 flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="text-muted-foreground hover:bg-muted inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Transcribe voice message"
      >
        {isLoading ? (
          <svg
            className="h-3.5 w-3.5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <svg
            className="h-3.5 w-3.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
        )}
        <span>{isLoading ? 'Transcribing...' : 'Transcribe'}</span>
      </button>
      {error ? (
        <span className="text-destructive text-xs" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
