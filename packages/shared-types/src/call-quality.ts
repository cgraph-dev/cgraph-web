/**
 * Call quality feedback types.
 *
 * Used by both web and mobile for post-call quality surveys.
 * Only shown for calls >= 30 seconds duration.
 */

export type CallQualityRating = 1 | 2 | 3 | 4 | 5;

export type CallQualityIssue =
  | 'audio_quality'
  | 'video_quality'
  | 'connection_drops'
  | 'delay_latency'
  | 'echo'
  | 'other';

export const CALL_QUALITY_ISSUES: readonly CallQualityIssue[] = [
  'audio_quality',
  'video_quality',
  'connection_drops',
  'delay_latency',
  'echo',
  'other',
] as const;

export const CALL_QUALITY_ISSUE_LABELS: Readonly<Record<CallQualityIssue, string>> = {
  audio_quality: 'Audio quality',
  video_quality: 'Video quality',
  connection_drops: 'Connection drops',
  delay_latency: 'Delay / Latency',
  echo: 'Echo',
  other: 'Other',
};

export interface CallQualityReportPayload {
  readonly rating: CallQualityRating;
  readonly issues: readonly CallQualityIssue[];
  readonly comment?: string;
  readonly client_telemetry?: Readonly<Record<string, unknown>>;
  readonly call_type?: string;
  readonly call_duration_seconds?: number;
}

export interface CallQualityReportResponse {
  readonly id: string;
  readonly rating: number;
  readonly call_id: string;
}

/** Minimum call duration (seconds) before showing quality feedback */
export const MIN_CALL_DURATION_FOR_FEEDBACK = 30;

/** Auto-dismiss timeout for the feedback sheet (milliseconds) */
export const FEEDBACK_AUTO_DISMISS_MS = 30_000;
