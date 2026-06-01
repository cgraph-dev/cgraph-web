/**
 * Video note recording component.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  PaperAirplaneIcon,
  StopIcon,
  TrashIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/solid';
import { createLogger } from '@/lib/logger';

const logger = createLogger('VideoMessageRecorder');

type RecordingState = 'idle' | 'recording' | 'preview' | 'uploading';

interface VideoMessageRecorderProps {
  readonly onComplete: (data: { blob: Blob; duration: number }) => void;
  readonly onCancel?: () => void;
  readonly maxDuration?: number;
  readonly className?: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function preferredVideoMimeType(): string {
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
    return 'video/webm;codecs=vp9,opus';
  }

  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
    return 'video/webm;codecs=vp8,opus';
  }

  return 'video/webm';
}

/** Camera-backed video note recorder with a send preview. */
export function VideoMessageRecorder({
  onComplete,
  onCancel,
  maxDuration = 60,
  className = '',
}: VideoMessageRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanupStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  const clearPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }, [previewUrl]);

  useEffect(
    () => () => {
      cleanupStream();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [cleanupStream, previewUrl]
  );

  useEffect(() => {
    if (state !== 'recording' || !liveVideoRef.current || !streamRef.current) return;
    if (!(streamRef.current instanceof MediaStream)) return;

    liveVideoRef.current.srcObject = streamRef.current;
    void liveVideoRef.current.play().catch(() => undefined);
  }, [state]);

  async function startRecording() {
    setError(null);
    clearPreview();
    setVideoBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;

      const mimeType = preferredVideoMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const nextPreviewUrl = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setPreviewUrl(nextPreviewUrl);
        setState('preview');
        cleanupStream();
      };

      mediaRecorder.start(100);
      setState('recording');
      setDuration(0);

      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);
        if (elapsed >= maxDuration) stopRecording();
      }, 1000);
    } catch (err) {
      logger.error('Failed to start video note recording:', err);
      setError('Camera or microphone access denied. Please allow camera and microphone access.');
      cleanupStream();
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      cleanupStream();
    }
  }

  function handleCancel() {
    cleanupStream();
    clearPreview();
    setVideoBlob(null);
    setDuration(0);
    setState('idle');
    onCancel?.();
  }

  function handleSend() {
    if (!videoBlob) return;
    setState('uploading');
    onComplete({ blob: videoBlob, duration });
    cleanupStream();
    clearPreview();
    setVideoBlob(null);
    setDuration(0);
    setState('idle');
  }

  if (state === 'idle') {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Start video note"
        >
          <VideoCameraIcon className="h-5 w-5" />
          <span className="text-sm">Video note</span>
        </button>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  if (state === 'recording') {
    return (
      <div
        className={`flex w-full max-w-sm flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20 ${className}`}
      >
        <video
          ref={liveVideoRef}
          muted
          playsInline
          className="aspect-square w-full rounded-lg bg-black object-cover"
          aria-label="Video note preview"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            Recording: {formatTime(duration)} / {formatTime(maxDuration)}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={stopRecording}
              className="rounded-full bg-red-500 p-2 text-white transition-colors hover:bg-red-600"
              aria-label="Stop video note"
            >
              <StopIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Cancel video note"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'preview') {
    return (
      <div
        className={`flex w-full max-w-sm flex-col gap-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-800 ${className}`}
      >
        {previewUrl && (
          <video
            src={previewUrl}
            controls
            playsInline
            className="aspect-square w-full rounded-lg bg-black object-cover"
            aria-label="Recorded video note"
          />
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">{formatTime(duration)}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 text-gray-500 transition-colors hover:text-red-500"
              aria-label="Delete video note"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="rounded-full bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600"
              aria-label="Send video note"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-lg bg-gray-100 p-3 dark:bg-gray-800 ${className}`}
    >
      <ArrowPathIcon className="h-5 w-5 animate-spin" />
      <span className="text-sm text-gray-600 dark:text-gray-400">Sending...</span>
    </div>
  );
}
