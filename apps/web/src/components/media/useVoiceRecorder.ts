/**
 * useVoiceRecorder - owns microphone capture and the voice-message state machine.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createLogger } from '@/lib/logger';
import { generatePlaceholderWaveform } from './waveform';

const logger = createLogger('useVoiceRecorder');

export type RecordingState = 'idle' | 'initializing' | 'recording' | 'preview' | 'uploading';

interface VoiceRecordingData {
  readonly blob: Blob;
  readonly duration: number;
  readonly waveform: number[];
}

interface UseVoiceRecorderOptions {
  readonly maxDuration?: number;
  readonly onComplete: (data: VoiceRecordingData) => void | Promise<void>;
  readonly onCancel?: () => void;
}

function recordingError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Microphone access was denied. Allow microphone access and try again.';
    }
    if (error.name === 'NotFoundError') {
      return 'No microphone was found.';
    }
  }
  return 'The microphone could not be started. Try again.';
}

function supportedMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  if (typeof MediaRecorder.isTypeSupported !== 'function') return '';

  return (
    ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'].find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType)
    ) ?? ''
  );
}

/** Manages one voice recording from permission request through upload. */
export function useVoiceRecorder({
  maxDuration = 300,
  onComplete,
  onCancel,
}: UseVoiceRecorderOptions) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const startRequestRef = useRef(0);
  const startingRef = useRef(false);
  const mountedRef = useRef(true);

  const releaseCapture = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      void audioContextRef.current.close?.();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    startRequestRef.current += 1;
    startingRef.current = false;
    const recorder = mediaRecorderRef.current;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      if (recorder.state !== 'inactive') recorder.stop();
      mediaRecorderRef.current = null;
    }
    releaseCapture();
  }, [releaseCapture]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const visualizeWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);

    const update = () => {
      const currentAnalyser = analyserRef.current;
      if (!currentAnalyser) return;
      currentAnalyser.getByteFrequencyData(data);
      const average = data.reduce((sum, value) => sum + value, 0) / data.length / 255;
      setWaveformData((previous) => [...previous, average].slice(-100));
      animationRef.current = requestAnimationFrame(update);
    };
    update();
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    releaseCapture();
  }, [releaseCapture]);

  const startRecording = useCallback(async () => {
    if (mediaRecorderRef.current || startingRef.current) return;

    const requestId = ++startRequestRef.current;
    startingRef.current = true;
    setError(null);
    setState('initializing');

    try {
      const mimeType = supportedMimeType();
      if (mimeType === null || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Voice recording is not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 },
      });

      if (!mountedRef.current || requestId !== startRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      if (typeof AudioContext !== 'undefined') {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        audioContext.createMediaStreamSource(stream).connect(analyser);
        analyserRef.current = analyser;
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      const blobType = recorder.mimeType || mimeType || 'audio/webm';
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        mediaRecorderRef.current = null;
        if (!mountedRef.current) return;

        const blob = new Blob(chunksRef.current, { type: blobType });
        if (blob.size === 0) {
          setError('No audio was recorded. Try again.');
          setState('idle');
          return;
        }
        setAudioBlob(blob);
        setState('preview');
      };

      recorder.start(100);
      startingRef.current = false;
      setDuration(0);
      setWaveformData([]);
      setState('recording');

      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setDuration(elapsed);
        if (elapsed >= maxDuration) stopRecording();
      }, 1000);
      visualizeWaveform();
    } catch (startError) {
      if (!mountedRef.current || requestId !== startRequestRef.current) return;
      startingRef.current = false;
      logger.error('Failed to start recording:', startError);
      setError(recordingError(startError));
      setState('idle');
      releaseCapture();
    }
  }, [maxDuration, releaseCapture, stopRecording, visualizeWaveform]);

  const handleCancel = useCallback(() => {
    cleanup();
    setAudioBlob(null);
    setWaveformData([]);
    setDuration(0);
    setError(null);
    setState('idle');
    onCancel?.();
  }, [cleanup, onCancel]);

  const handleSend = useCallback(async () => {
    if (!audioBlob) return;

    setError(null);
    setState('uploading');
    const finalWaveform =
      waveformData.length > 0 ? waveformData : generatePlaceholderWaveform(duration);

    try {
      await onComplete({ blob: audioBlob, duration, waveform: finalWaveform });
      if (!mountedRef.current) return;
      cleanup();
      setAudioBlob(null);
      setWaveformData([]);
      setDuration(0);
      setState('idle');
    } catch (uploadError) {
      logger.error('Failed to send recording:', uploadError);
      if (!mountedRef.current) return;
      setError('Voice message was not sent. Try again.');
      setState('preview');
    }
  }, [audioBlob, cleanup, duration, onComplete, waveformData]);

  return {
    state,
    duration,
    waveformData,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    handleCancel,
    handleSend,
  };
}
