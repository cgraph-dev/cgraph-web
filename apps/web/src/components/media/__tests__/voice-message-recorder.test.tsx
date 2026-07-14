import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VoiceMessageRecorder } from '../voice-message-recorder';

vi.mock('../waveform', () => ({
  Waveform: () => <div data-testid="voice-waveform" />,
  generatePlaceholderWaveform: () => [0.2, 0.4, 0.2],
}));

const media = vi.hoisted(() => ({
  getUserMedia: vi.fn(),
  stopTrack: vi.fn(),
  closeAudioContext: vi.fn(),
}));

class MockMediaRecorder {
  static isTypeSupported(): boolean {
    return true;
  }

  state: RecordingState = 'inactive';
  mimeType: string;
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;

  constructor(_stream: MediaStream, options?: MediaRecorderOptions) {
    this.mimeType = options?.mimeType ?? 'audio/webm';
  }

  start(): void {
    this.state = 'recording';
  }

  stop(): void {
    this.state = 'inactive';
    const data = new Blob(['recording'], { type: this.mimeType });
    this.ondataavailable?.({ data } as BlobEvent);
    this.onstop?.();
  }
}

class MockAudioContext {
  createMediaStreamSource() {
    return { connect: vi.fn() };
  }

  createAnalyser() {
    return {
      fftSize: 256,
      frequencyBinCount: 1,
      getByteFrequencyData(values: Uint8Array) {
        values[0] = 64;
      },
    };
  }

  close(): Promise<void> {
    media.closeAudioContext();
    return Promise.resolve();
  }
}

describe('VoiceMessageRecorder', () => {
  const originalMediaDevices = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');

  beforeEach(() => {
    media.getUserMedia.mockReset();
    media.stopTrack.mockReset();
    media.closeAudioContext.mockReset();
    media.getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: media.stopTrack }],
    });

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: media.getUserMedia },
    });
    vi.stubGlobal('MediaRecorder', MockMediaRecorder);
    vi.stubGlobal('AudioContext', MockAudioContext);
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalMediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', originalMediaDevices);
    } else {
      Reflect.deleteProperty(navigator, 'mediaDevices');
    }
  });

  it('starts recording as soon as voice mode mounts', async () => {
    render(<VoiceMessageRecorder onComplete={vi.fn()} />);

    expect(await screen.findByText(/recording:/i)).toBeVisible();
    expect(media.getUserMedia).toHaveBeenCalledTimes(1);
  });

  it('stops and sends the captured recording', async () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(<VoiceMessageRecorder onComplete={onComplete} />);

    await screen.findByText(/recording:/i);
    fireEvent.click(screen.getByRole('button', { name: /stop recording/i }));
    fireEvent.click(screen.getByRole('button', { name: /send voice message/i }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        blob: expect.any(Blob),
        duration: 0,
        waveform: expect.any(Array),
      })
    );
  });

  it('keeps the recording available when upload fails', async () => {
    const onComplete = vi
      .fn()
      .mockRejectedValueOnce(new Error('upload failed'))
      .mockResolvedValueOnce(undefined);
    render(<VoiceMessageRecorder onComplete={onComplete} />);

    await screen.findByText(/recording:/i);
    fireEvent.click(screen.getByRole('button', { name: /stop recording/i }));
    fireEvent.click(screen.getByRole('button', { name: /send voice message/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Voice message was not sent');
    fireEvent.click(screen.getByRole('button', { name: /retry voice message/i }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(2));
  });

  it('shows a retry action when microphone permission is denied', async () => {
    media.getUserMedia.mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'));
    render(<VoiceMessageRecorder onComplete={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Microphone access was denied');
    expect(screen.getByRole('button', { name: /record voice message/i })).toHaveTextContent(
      'Try microphone again'
    );
  });

  it('releases the microphone and audio context on unmount', async () => {
    const { unmount } = render(<VoiceMessageRecorder onComplete={vi.fn()} />);

    await screen.findByText(/recording:/i);
    unmount();

    expect(media.stopTrack).toHaveBeenCalled();
    expect(media.closeAudioContext).toHaveBeenCalled();
  });
});
