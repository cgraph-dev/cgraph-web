/** @module LiveKit media defaults tests */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { roomConstructor, createLocalAudioTrack, createLocalVideoTrack } = vi.hoisted(() => ({
  roomConstructor: vi.fn(),
  createLocalAudioTrack: vi.fn(),
  createLocalVideoTrack: vi.fn(),
}));

vi.mock('livekit-client', () => ({
  Room: roomConstructor,
  RoomEvent: {},
  VideoPresets: {
    h720: { resolution: { width: 1280, height: 720 } },
    h1080: { resolution: { width: 1920, height: 1080 } },
  },
  createLocalAudioTrack,
  createLocalVideoTrack,
}));

vi.mock('../callEncryption', () => ({
  cleanupE2EE: vi.fn(),
  isEncrypted: vi.fn(),
  rotateKey: vi.fn(),
  setupE2EE: vi.fn(),
}));

import { LiveKitService } from '../livekitService';

const callsSettings = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  defaultVideoResolution: '1080p' as const,
};

describe('LiveKitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    roomConstructor.mockImplementation(() => ({
      name: 'calls-settings-test',
      connect: vi.fn().mockResolvedValue(undefined),
      localParticipant: { publishTrack: vi.fn().mockResolvedValue(undefined) },
    }));
    createLocalAudioTrack.mockResolvedValue({ kind: 'audio' });
    createLocalVideoTrack.mockResolvedValue({ kind: 'video' });
  });

  it('applies the saved resolution when opening a new room', async () => {
    await LiveKitService.connect('wss://livekit.example', 'token', undefined, callsSettings);

    expect(roomConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        videoCaptureDefaults: { resolution: { width: 1920, height: 1080 } },
      })
    );
  });

  it('uses the saved microphone flags and video resolution for new local tracks', async () => {
    const room = {
      localParticipant: { publishTrack: vi.fn().mockResolvedValue(undefined) },
    };

    await LiveKitService.publishLocalTracks(room as never, { audio: true, video: true }, callsSettings);

    expect(createLocalAudioTrack).toHaveBeenCalledWith({
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    });
    expect(createLocalVideoTrack).toHaveBeenCalledWith({
      resolution: { width: 1920, height: 1080 },
    });
  });

  it('leaves the video resolution unconstrained for the Auto preference', async () => {
    const room = {
      localParticipant: { publishTrack: vi.fn().mockResolvedValue(undefined) },
    };

    await LiveKitService.publishLocalTracks(room as never, { audio: false, video: true }, {
      ...callsSettings,
      defaultVideoResolution: 'auto',
    });

    expect(createLocalVideoTrack).toHaveBeenCalledWith({});
  });
});
