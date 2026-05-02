/**
 * Voice message transcription types.
 *
 * Used by both web and mobile apps for voice-to-text transcription
 * powered by the Whisper API backend.
 */

export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TranscriptionResult {
  readonly message_id: string;
  readonly text: string;
  readonly language: string;
  readonly status: TranscriptionStatus;
}

export interface TranscriptionQueuedResponse {
  readonly message_id: string;
  readonly status: 'queued';
}

export interface TranscriptionRateLimitError {
  readonly code: 'rate_limited';
  readonly message: string;
  readonly details: {
    readonly retry_after: number;
    readonly remaining: 0;
  };
}

/** Channel event payload for transcription:complete */
export interface TranscriptionCompleteEvent {
  readonly message_id: string;
  readonly text: string;
  readonly language: string;
  readonly status: 'completed';
}

/** Channel event payload for transcription:failed */
export interface TranscriptionFailedEvent {
  readonly message_id: string;
  readonly error: string;
  readonly status: 'failed';
}

/** Channel event payload for transcription:processing */
export interface TranscriptionProcessingEvent {
  readonly message_id: string;
  readonly status: 'processing';
}
