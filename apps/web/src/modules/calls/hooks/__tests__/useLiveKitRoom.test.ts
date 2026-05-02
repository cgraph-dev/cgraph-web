/**
 * @file Tests for useLiveKitRoom hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock LiveKit service
const mockLiveKitConnect = vi.fn();
const mockLiveKitDisconnect = vi.fn().mockResolvedValue(undefined);
const mockLiveKitPublishLocalTracks = vi.fn().mockResolvedValue(undefined);
const mockLiveKitAttachEventHandlers = vi.fn().mockReturnValue(vi.fn());
const mockLiveKitEnableE2EE = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/webrtc/livekitService', () => ({
  LiveKitService: {
    connect: (...args: unknown[]) => mockLiveKitConnect(...args),
    disconnect: (...args: unknown[]) => mockLiveKitDisconnect(...args),
    publishLocalTracks: (...args: unknown[]) => mockLiveKitPublishLocalTracks(...args),
    attachEventHandlers: (...args: unknown[]) => mockLiveKitAttachEventHandlers(...args),
    enableE2EE: (...args: unknown[]) => mockLiveKitEnableE2EE(...args),
  },
}));

vi.mock('@/lib/webrtc/callEncryption', () => ({
  decodeRoomKey: vi.fn((_key: string) => new Uint8Array([1, 2, 3])),
}));

const mockApiPost = vi.fn();
vi.mock('@/lib/api', () => ({
  api: {
    post: (...args: unknown[]) => mockApiPost(...args),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

vi.mock('livekit-client', () => ({
  Room: vi.fn(),
  RoomEvent: {
    TrackMuted: 'trackMuted',
    TrackUnmuted: 'trackUnmuted',
  },
  ConnectionState: {
    Connecting: 'connecting',
    Connected: 'connected',
    Disconnected: 'disconnected',
    Reconnecting: 'reconnecting',
  },
}));

import { useLiveKitRoom } from '../../hooks/useLiveKitRoom';

function makeMockRoom() {
  return {
    localParticipant: {
      identity: 'local-user',
      isMicrophoneEnabled: true,
      isCameraEnabled: false,
      setMicrophoneEnabled: vi.fn().mockResolvedValue(undefined),
      setCameraEnabled: vi.fn().mockResolvedValue(undefined),
      setScreenShareEnabled: vi.fn().mockResolvedValue(undefined),
    },
    remoteParticipants: new Map(),
    on: vi.fn(),
    off: vi.fn(),
  };
}

describe('useLiveKitRoom', () => {
  let mockRoom: ReturnType<typeof makeMockRoom>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRoom = makeMockRoom();
    mockLiveKitConnect.mockResolvedValue(mockRoom);
    mockApiPost.mockResolvedValue({
      data: { token: 'test-token', url: 'wss://test.livekit.io' },
    });
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useLiveKitRoom({ roomName: 'test-room' }));
    expect(result.current.connectionState).toBe('idle');
    expect(result.current.room).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns empty participants initially', () => {
    const { result } = renderHook(() => useLiveKitRoom({ roomName: 'test-room' }));
    expect(result.current.participants).toEqual([]);
    expect(result.current.activeSpeakers).toEqual([]);
  });

  it('starts with audio enabled and video disabled by default', () => {
    const { result } = renderHook(() => useLiveKitRoom({ roomName: 'test-room' }));
    expect(result.current.isMuted).toBe(false);
    expect(result.current.isVideoOn).toBe(false);
  });

  it('connects to room and fetches token', async () => {
    const { result } = renderHook(() => useLiveKitRoom({ roomName: 'my-room', channelId: 'ch-1' }));

    await act(async () => {
      await result.current.connect();
    });

    expect(mockApiPost).toHaveBeenCalledWith('/api/v1/livekit/token', {
      room_name: 'my-room',
      channel_id: 'ch-1',
    });
    expect(mockLiveKitConnect).toHaveBeenCalledWith('wss://test.livekit.io', 'test-token');
    expect(result.current.connectionState).toBe('connected');
    expect(result.current.room).toBe(mockRoom);
  });

  it('includes groupId in token request when provided', async () => {
    const { result } = renderHook(() => useLiveKitRoom({ roomName: 'my-room', groupId: 'grp-1' }));

    await act(async () => {
      await result.current.connect();
    });

    expect(mockApiPost).toHaveBeenCalledWith('/api/v1/livekit/token', {
      room_name: 'my-room',
      group_id: 'grp-1',
    });
  });

  it('publishes local tracks after connecting', async () => {
    const { result } = renderHook(() =>
      useLiveKitRoom({ roomName: 'test-room', audioEnabled: true, videoEnabled: true })
    );

    await act(async () => {
      await result.current.connect();
    });

    expect(mockLiveKitPublishLocalTracks).toHaveBeenCalledWith(mockRoom, {
      audio: true,
      video: true,
    });
  });

  it('enables E2EE when backend provides key', async () => {
    mockApiPost.mockResolvedValue({
      data: {
        token: 'token',
        url: 'wss://test.livekit.io',
        e2ee_enabled: true,
        e2ee_key: 'base64key',
      },
    });

    const { result } = renderHook(() => useLiveKitRoom({ roomName: 'test-room' }));

    await act(async () => {
      await result.current.connect();
    });

    expect(mockLiveKitEnableE2EE).toHaveBeenCalled();
    expect(result.current.isE2EEEnabled).toBe(true);
  });

  it('continues unencrypted when E2EE setup fails', async () => {
    mockApiPost.mockResolvedValue({
      data: {
        token: 'token',
        url: 'wss://test.livekit.io',
        e2ee_enabled: true,
        e2ee_key: 'key',
      },
    });
    mockLiveKitEnableE2EE.mockRejectedValue(new Error('E2EE not supported'));

    const { result } = renderHook(() => useLiveKitRoom({ roomName: 'test-room' }));

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.isE2EEEnabled).toBe(false);
    expect(result.current.connectionState).toBe('connected');
  });

  it('sets error state when connection fails', async () => {
    mockLiveKitConnect.mockRejectedValue(new Error('Connection refused'));

    const { result } = renderHook(() => useLiveKitRoom({ roomName: 'test-room' }));

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.error).toBe('Connection refused');
    expect(result.current.connectionState).toBe('disconnected');
  });

  it('sets generic error message for non-Error throws', async () => {
    mockLiveKitConnect.mockRejectedValue('some string error');

    const { result } = renderHook(() => useLiveKitRoom({ roomName: 'test-room' }));

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.error).toBe('Failed to connect to room');
  });

  it('toggles mute state', async () => {
    const { result } = renderHook(() => useLiveKitRoom({ roomName: 'test-room' }));

    await act(async () => {
      await result.current.connect();
    });

    await act(async () => {
      await result.current.toggleMute();
    });

    expect(mockRoom.localParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(false);
    expect(result.current.isMuted).toBe(true);
  });

  it('toggles video state', async () => {
    const { result } = renderHook(() => useLiveKitRoom({ roomName: 'test-room' }));

    await act(async () => {
      await result.current.connect();
    });

    await act(async () => {
      await result.current.toggleVideo();
    });

    expect(mockRoom.localParticipant.setCameraEnabled).toHaveBeenCalledWith(true);
    expect(result.current.isVideoOn).toBe(true);
  });

  it('starts screen sharing', async () => {
    const { result } = renderHook(() => useLiveKitRoom({ roomName: 'test-room' }));

    await act(async () => {
      await result.current.connect();
    });

    await act(async () => {
      await result.current.startScreenShare();
    });

    expect(mockRoom.localParticipant.setScreenShareEnabled).toHaveBeenCalledWith(true);
    expect(result.current.isScreenSharing).toBe(true);
  });

  it('stops screen sharing', async () => {
    const { result } = renderHook(() => useLiveKitRoom({ roomName: 'test-room' }));

    await act(async () => {
      await result.current.connect();
    });

    await act(async () => {
      await result.current.startScreenShare();
    });

    await act(async () => {
      await result.current.stopScreenShare();
    });

    expect(mockRoom.localParticipant.setScreenShareEnabled).toHaveBeenCalledWith(false);
    expect(result.current.isScreenSharing).toBe(false);
  });

  it('leaves room and resets state', async () => {
    const { result } = renderHook(() => useLiveKitRoom({ roomName: 'test-room' }));

    await act(async () => {
      await result.current.connect();
    });

    await act(async () => {
      await result.current.leaveRoom();
    });

    expect(mockLiveKitDisconnect).toHaveBeenCalledWith(mockRoom);
    expect(result.current.connectionState).toBe('idle');
    expect(result.current.room).toBeNull();
    expect(result.current.participants).toEqual([]);
  });

  it('does nothing when toggling mute without a room', async () => {
    const { result } = renderHook(() => useLiveKitRoom({ roomName: 'test-room' }));

    await act(async () => {
      await result.current.toggleMute();
    });

    // Should not throw, isMuted stays at initial
    expect(result.current.isMuted).toBe(false);
  });

  it('auto-connects when autoConnect is true', async () => {
    renderHook(() => useLiveKitRoom({ roomName: 'test-room', autoConnect: true }));

    // Wait for the auto-connect effect
    await vi.waitFor(() => {
      expect(mockApiPost).toHaveBeenCalled();
    });
  });
});
