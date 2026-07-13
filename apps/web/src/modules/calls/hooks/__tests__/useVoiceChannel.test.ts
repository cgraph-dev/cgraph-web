/**
 * useVoiceChannel Hook Unit Tests
 *
 * Tests for voice channel connection, mute/deafen/video toggles,
 * and Phoenix channel lifecycle management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
const { callsSettings } = vi.hoisted(() => ({
  callsSettings: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    defaultVideoResolution: '1080p' as const,
  },
}));

const mockVoiceState = {
  currentChannelId: null as string | null,
  isConnecting: false,
  isMuted: false,
  isDeafened: false,
  isVideoOn: false,
  error: null as string | null,
  setConnected: vi.fn(),
  setDisconnected: vi.fn(),
  setConnecting: vi.fn(),
  toggleMute: vi.fn(),
  toggleDeafen: vi.fn(),
  toggleVideo: vi.fn(),
  setError: vi.fn(),
  addChannelMember: vi.fn(),
  removeChannelMember: vi.fn(),
  updateMemberState: vi.fn(),
  setChannelMembers: vi.fn(),
};

vi.mock('@/stores/voiceStateStore', () => ({
  useVoiceStateStore: Object.assign(
    vi.fn(() => mockVoiceState),
    {
      getState: () => mockVoiceState,
    }
  ),
}));

const mockChannelPush = vi.fn();
const mockChannelLeave = vi.fn();
const mockChannelOn = vi.fn();
const mockChannelJoin = vi.fn(() => ({
  receive: vi.fn(function (
    this: Record<string, unknown>,
    event: string,
    cb: (resp: unknown) => void
  ) {
    if (event === 'ok') {
      // Schedule callback to simulate async join
      setTimeout(() => cb({ token: 'lk-token', room_name: 'room-1' }), 0);
    }
    return this;
  }),
}));

const mockSocket = {
  channel: vi.fn(() => ({
    join: mockChannelJoin,
    on: mockChannelOn,
    push: mockChannelPush,
    leave: mockChannelLeave,
  })),
};

const mockGetSocket = vi.fn((): typeof mockSocket | null => mockSocket);
const mockLiveKitConnect = vi.fn().mockResolvedValue({
  localParticipant: {
    setMicrophoneEnabled: vi.fn(),
    setCameraEnabled: vi.fn(),
  },
});
const mockLiveKitDisconnect = vi.fn().mockResolvedValue(undefined);
const mockLiveKitPublishLocalTracks = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/socket', () => ({
  useSocket: vi.fn(() => ({
    getSocket: mockGetSocket,
  })),
}));

vi.mock('@/lib/webrtc/livekitService', () => ({
  LiveKitService: {
    connect: (...args: unknown[]) => mockLiveKitConnect(...args),
    disconnect: (...args: unknown[]) => mockLiveKitDisconnect(...args),
    publishLocalTracks: (...args: unknown[]) => mockLiveKitPublishLocalTracks(...args),
  },
}));

vi.mock('@/modules/settings/store', () => ({
  useSettingsStore: (selector: (state: { settings: { calls: object } }) => unknown) =>
    selector({
      settings: {
        calls: callsSettings,
      },
    }),
}));

import { useVoiceChannel } from '../useVoiceChannel';
beforeEach(() => {
  vi.clearAllMocks();
  mockVoiceState.currentChannelId = null;
  mockVoiceState.isConnecting = false;
  mockVoiceState.isMuted = false;
  mockVoiceState.isDeafened = false;
  mockVoiceState.isVideoOn = false;
  mockVoiceState.error = null;
});
describe('useVoiceChannel', () => {
  describe('initial state', () => {
    it('returns initial voice state from store', () => {
      const { result } = renderHook(() => useVoiceChannel());

      expect(result.current.currentChannelId).toBeNull();
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.isMuted).toBe(false);
      expect(result.current.isDeafened).toBe(false);
      expect(result.current.isVideoOn).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('returns all expected action functions', () => {
      const { result } = renderHook(() => useVoiceChannel());

      expect(typeof result.current.joinChannel).toBe('function');
      expect(typeof result.current.leaveChannel).toBe('function');
      expect(typeof result.current.toggleMute).toBe('function');
      expect(typeof result.current.toggleDeafen).toBe('function');
      expect(typeof result.current.toggleVideo).toBe('function');
    });
  });

  describe('joinChannel', () => {
    it('uses the saved Calls defaults for a newly joined voice channel', async () => {
      const { result } = renderHook(() => useVoiceChannel());

      await act(async () => {
        await result.current.joinChannel('ch-1', 'group-1');
      });

      expect(mockLiveKitConnect).toHaveBeenCalledWith(
        'ws://localhost:7880',
        'lk-token',
        undefined,
        callsSettings
      );
      expect(mockLiveKitPublishLocalTracks).toHaveBeenCalledWith(
        expect.anything(),
        { audio: true, video: false },
        callsSettings
      );
    });

    it('does nothing when already in the same channel', async () => {
      mockVoiceState.currentChannelId = 'ch-1';

      const { result } = renderHook(() => useVoiceChannel());

      await act(async () => {
        await result.current.joinChannel('ch-1', 'group-1');
      });

      expect(mockVoiceState.setConnecting).not.toHaveBeenCalled();
    });

    it('sets error when socket is unavailable', async () => {
      mockGetSocket.mockReturnValueOnce(null);

      const { result } = renderHook(() => useVoiceChannel());

      await act(async () => {
        await result.current.joinChannel('ch-1', 'group-1');
      });

      expect(mockVoiceState.setError).toHaveBeenCalledWith('Socket not connected');
    });

    it('sets connecting state when joining', async () => {
      // Make the join never resolve to test the connecting state
      mockChannelJoin.mockReturnValueOnce({
        receive: vi.fn().mockReturnThis(),
      });

      const { result } = renderHook(() => useVoiceChannel());

      // Start join without awaiting
      act(() => {
        result.current.joinChannel('ch-1', 'group-1');
      });

      expect(mockVoiceState.setConnecting).toHaveBeenCalledWith(true);
      expect(mockVoiceState.setError).toHaveBeenCalledWith(null);
    });
  });

  describe('leaveChannel', () => {
    it('calls setDisconnected on store', async () => {
      const { result } = renderHook(() => useVoiceChannel());

      await act(async () => {
        await result.current.leaveChannel();
      });

      expect(mockVoiceState.setDisconnected).toHaveBeenCalled();
    });
  });

  describe('toggleMute', () => {
    it('calls store toggleMute', () => {
      const { result } = renderHook(() => useVoiceChannel());

      act(() => {
        result.current.toggleMute();
      });

      expect(mockVoiceState.toggleMute).toHaveBeenCalled();
    });
  });

  describe('toggleDeafen', () => {
    it('calls store toggleDeafen', () => {
      const { result } = renderHook(() => useVoiceChannel());

      act(() => {
        result.current.toggleDeafen();
      });

      expect(mockVoiceState.toggleDeafen).toHaveBeenCalled();
    });
  });

  describe('toggleVideo', () => {
    it('calls store toggleVideo', () => {
      const { result } = renderHook(() => useVoiceChannel());

      act(() => {
        result.current.toggleVideo();
      });

      expect(mockVoiceState.toggleVideo).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('cleans up channel on unmount', () => {
      const { unmount } = renderHook(() => useVoiceChannel());

      unmount();

      // Should not throw
    });
  });
});
