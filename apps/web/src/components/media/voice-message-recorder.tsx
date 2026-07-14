/**
 * Voice message recording component.
 */
import { useEffect } from 'react';
import {
  MicrophoneIcon,
  StopIcon,
  TrashIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid';
import { Waveform, generatePlaceholderWaveform } from './waveform';
import { useVoiceRecorder } from './useVoiceRecorder';

interface VoiceMessageRecorderProps {
  onComplete: (data: {
    blob: Blob;
    duration: number;
    waveform: number[];
  }) => void | Promise<void>;
  onCancel?: () => void;
  maxDuration?: number;
  className?: string;
  autoStart?: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Voice message recorder with live waveform visualization and preview. */
export function VoiceMessageRecorder({
  onComplete,
  onCancel,
  maxDuration = 300,
  className = '',
  autoStart = true,
}: VoiceMessageRecorderProps) {
  const {
    state,
    duration,
    waveformData,
    error,
    startRecording,
    stopRecording,
    handleCancel,
    handleSend,
  } = useVoiceRecorder({ maxDuration, onComplete, onCancel });

  useEffect(() => {
    if (!autoStart) return;
    void startRecording();
  }, [autoStart, startRecording]);

  const placeholder = generatePlaceholderWaveform(50);

  if (state === 'idle') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`}>
        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void startRecording()}
          className="flex h-9 items-center gap-2 rounded-lg border border-[var(--token-border-muted)] px-3 text-sm text-white/75 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          aria-label="Record voice message"
        >
          <MicrophoneIcon className="h-5 w-5" />
          <span>{error ? 'Try microphone again' : 'Start recording'}</span>
        </button>
      </div>
    );
  }

  if (state === 'initializing') {
    return (
      <div
        role="status"
        className={`flex items-center justify-center gap-3 rounded-lg border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] p-3 ${className}`}
      >
        <ArrowPathIcon className="h-5 w-5 animate-spin text-primary-400" />
        <span className="text-sm text-white/70">Starting microphone...</span>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg p-2 text-white/55 hover:bg-white/[0.06] hover:text-white"
          aria-label="Cancel recording"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // Recording state - show live waveform
  if (state === 'recording') {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20 ${className}`}
      >
        <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />

        <div className="min-w-0 flex-1">
          <Waveform
            data={waveformData.length > 0 ? waveformData : placeholder}
            progress={1}
            playedColor="#ef4444"
            unplayedColor="#fca5a5"
            height={32}
          />
          <div className="mt-1 text-sm text-red-600 dark:text-red-400">
            Recording: {formatTime(duration)} / {formatTime(maxDuration)}
          </div>
        </div>

        <button
          type="button"
          onClick={stopRecording}
          className="rounded-full bg-red-500 p-2 text-white transition-colors hover:bg-red-600"
          aria-label="Stop recording"
        >
          <StopIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleCancel}
          className="p-2 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Cancel recording"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // Preview state - show recorded audio
  if (state === 'preview') {
    return (
      <div className={`rounded-lg bg-[var(--token-bg-secondary)] p-3 ${className}`}>
        {error && (
          <p role="alert" className="mb-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Waveform
            data={waveformData.length > 0 ? waveformData : placeholder}
            progress={0}
            height={32}
          />

          <span className="text-sm text-white/55">{formatTime(duration)}</span>

          <button
            type="button"
            onClick={handleCancel}
            className="p-2 text-white/50 transition-colors hover:text-red-400"
            aria-label="Delete recording"
          >
            <TrashIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => void handleSend()}
            className="rounded-full bg-primary-500 p-2 text-white transition-colors hover:bg-primary-400"
            aria-label={error ? 'Retry voice message' : 'Send voice message'}
          >
            <PaperAirplaneIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Uploading state
  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800 ${className}`}
    >
      <ArrowPathIcon className="h-5 w-5 animate-spin" />
      <span role="status" className="text-sm text-gray-600 dark:text-gray-400">
        Sending...
      </span>
    </div>
  );
}
