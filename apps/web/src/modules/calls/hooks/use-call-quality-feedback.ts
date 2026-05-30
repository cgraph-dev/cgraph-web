/**
 * Hook for post-call quality feedback.
 *
 * Manages the feedback sheet visibility, form state, WebRTC telemetry
 * collection, and API submission. Only triggered for calls >= 30 seconds.
 *
 * Auto-dismisses after 30 seconds of inactivity.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import type { CallQualityRating, CallQualityIssue } from '@cgraph-dev/shared-types';
import { MIN_CALL_DURATION_FOR_FEEDBACK, FEEDBACK_AUTO_DISMISS_MS } from '@cgraph-dev/shared-types';

const logger = createLogger('CallQualityFeedback');

interface CallQualityFeedbackState {
  readonly showFeedback: boolean;
  readonly isSubmitting: boolean;
  readonly isSubmitted: boolean;
  readonly error: string | null;
}

interface UseCallQualityFeedbackResult {
  /** Whether the feedback sheet should be shown. */
  readonly showFeedback: boolean;
  /** Whether feedback is currently being submitted. */
  readonly isSubmitting: boolean;
  /** Whether feedback has been submitted successfully. */
  readonly isSubmitted: boolean;
  /** Error message if submission failed. */
  readonly error: string | null;
  /** Submit call quality feedback. */
  readonly submitFeedback: (
    rating: CallQualityRating,
    issues: readonly CallQualityIssue[],
    comment: string | undefined,
    telemetry: Record<string, unknown>
  ) => Promise<void>;
  /** Dismiss the feedback sheet without submitting. */
  readonly dismiss: () => void;
  /** Trigger the feedback sheet (called when a call ends). */
  readonly triggerFeedback: (callId: string, durationSeconds: number, callType?: string) => void;
}

/**
 * Collect WebRTC statistics from an RTCPeerConnection.
 *
 * Extracts jitter, packet loss, round-trip time, codec, and bytes received
 * from the connection stats.
 */
async function collectWebRTCStats(
  peerConnection: RTCPeerConnection | null
): Promise<Record<string, unknown>> {
  if (!peerConnection) return {};

  try {
    const stats = await peerConnection.getStats();
    const telemetry: Record<string, unknown> = {};

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        telemetry.audio_jitter = report.jitter;
        telemetry.audio_packets_lost = report.packetsLost;
        telemetry.audio_packets_received = report.packetsReceived;
        telemetry.audio_bytes_received = report.bytesReceived;
      }

      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        telemetry.video_packets_lost = report.packetsLost;
        telemetry.video_packets_received = report.packetsReceived;
        telemetry.video_bytes_received = report.bytesReceived;
        telemetry.video_frames_decoded = report.framesDecoded;
      }

      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        telemetry.round_trip_time = report.currentRoundTripTime;
        telemetry.available_outgoing_bitrate = report.availableOutgoingBitrate;
      }

      if (report.type === 'codec') {
        telemetry[`codec_${report.mimeType}`] = report.mimeType;
      }
    });

    return telemetry;
  } catch {
    logger.warn('Failed to collect WebRTC stats');
    return {};
  }
}

/**
 * Manage post-call quality feedback state.
 *
 * @param peerConnection - Optional RTCPeerConnection for telemetry collection.
 * @param featureEnabled - Whether the call quality feedback feature is enabled.
 */
export function useCallQualityFeedback(
  peerConnection?: RTCPeerConnection | null,
  featureEnabled: boolean = true
): UseCallQualityFeedbackResult {
  const [state, setState] = useState<CallQualityFeedbackState>({
    showFeedback: false,
    isSubmitting: false,
    isSubmitted: false,
    error: null,
  });

  const callInfoRef = useRef<{
    callId: string;
    durationSeconds: number;
    callType: string;
  } | null>(null);

  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss after timeout
  useEffect(() => {
    if (state.showFeedback && !state.isSubmitting) {
      dismissTimerRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, showFeedback: false }));
      }, FEEDBACK_AUTO_DISMISS_MS);

      return () => {
        if (dismissTimerRef.current) {
          clearTimeout(dismissTimerRef.current);
        }
      };
    }
    return undefined;
  }, [state.showFeedback, state.isSubmitting]);

  const triggerFeedback = useCallback(
    (callId: string, durationSeconds: number, callType?: string): void => {
      if (!featureEnabled) return;
      if (durationSeconds < MIN_CALL_DURATION_FOR_FEEDBACK) return;

      callInfoRef.current = {
        callId,
        durationSeconds,
        callType: callType ?? 'voice',
      };

      setState({
        showFeedback: true,
        isSubmitting: false,
        isSubmitted: false,
        error: null,
      });
    },
    [featureEnabled]
  );

  const submitFeedback = useCallback(
    async (
      rating: CallQualityRating,
      issues: readonly CallQualityIssue[],
      comment: string | undefined,
      manualTelemetry: Record<string, unknown>
    ): Promise<void> => {
      const callInfo = callInfoRef.current;
      if (!callInfo) return;

      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      // Collect WebRTC stats and merge with manual telemetry
      const webrtcStats = await collectWebRTCStats(peerConnection ?? null);
      const telemetry = { ...webrtcStats, ...manualTelemetry };

      const result = await apiClient.callQuality.submitCallQuality(callInfo.callId, {
        rating,
        issues,
        comment: comment || undefined,
        client_telemetry: telemetry,
        call_type: callInfo.callType,
        call_duration_seconds: callInfo.durationSeconds,
      });

      if (result.ok) {
        logger.info('Call quality feedback submitted', {
          callId: callInfo.callId,
          rating,
        });
        setState({
          showFeedback: false,
          isSubmitting: false,
          isSubmitted: true,
          error: null,
        });
      } else {
        const errorMessage =
          result.error.code === 'already_exists'
            ? 'Feedback already submitted for this call'
            : result.error.message;

        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: errorMessage,
        }));
      }
    },
    [peerConnection]
  );

  const dismiss = useCallback((): void => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    setState((prev) => ({ ...prev, showFeedback: false }));
  }, []);

  return {
    showFeedback: state.showFeedback,
    isSubmitting: state.isSubmitting,
    isSubmitted: state.isSubmitted,
    error: state.error,
    submitFeedback,
    dismiss,
    triggerFeedback,
  };
}
