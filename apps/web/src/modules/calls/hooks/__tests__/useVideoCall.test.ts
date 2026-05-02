/**
 * useVideoCall Hook Unit Tests
 *
 * Tests for video call lifecycle, media controls, duration tracking,
 * and fullscreen toggle.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
const mockStartCall = vi.fn().mockResolvedValue('room-1');
const mockAnswerCall = vi.fn().mockResolvedValue(true);
const mockEndCall = vi.fn().mockResolvedValue(undefined);
const mockToggleMute = vi.fn().mockReturnValue(true);
const mockToggleVideo = vi.fn().mockReturnValue(false);
const mockStartScreenShare = vi.fn().mockResolvedValue(true);
const mockStopScreenShare = vi.fn().mockResolvedValue(undefined);

const mockCallState = {
  status: 'idle' as string,
  roomId: null as string | null,
  participants: [] as unknown[],
  localStream: null,
  remoteStreams: new Map(),
  isMuted: false,
  isVideoEnabled: true,
  isScreenSharing: false,
  error: null,
};

vi.mock('@/modules/calls/hooks/useWebRTC', () => ({
  useWebRTC: vi.fn((options?: Record<string, unknown>) => {
    // Store callbacks for later invocation in tests
    if (options) {
      (globalThis as Record<string, unknown>).__webrtcCallbacks = {
        onCallConnected: options.onCallConnected,
        onCallEnded: options.onCallEnded,
        onError: options.onError,
      };
    }

    return {
      callState: mockCallState,
      localStream: null,
      remoteStream: null,
      startCall: mockStartCall,
      answerCall: mockAnswerCall,
      endCall: mockEndCall,
      toggleMute: mockToggleMute,
      toggleVideo: mockToggleVideo,
      startScreenShare: mockStartScreenShare,
      stopScreenShare: mockStopScreenShare,
      isCallActive: mockCallState.status === 'connected',
      isConnecting: mockCallState.status === 'ringing',
    };
  }),
}));

vi.mock('@/shared/components/ui', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { useVideoCall } from '../useVideoCall';
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockCallState.status = 'idle';
  mockCallState.isScreenSharing = false;
});

afterEach(() => {
  vi.useRealTimers();
});
describe('useVideoCall', () => {
  const defaultOptions = {
    isOpen: false,
    conversationId: 'conv-1',
    otherParticipantId: 'user-2',
    onClose: vi.fn(),
  };

  describe('initial state', () => {
    it('returns initial values', () => {
      const { result } = renderHook(() => useVideoCall(defaultOptions));

      expect(result.current.isFullscreen).toBe(false);
      expect(result.current.duration).toBe(0);
      expect(result.current.localStream).toBeNull();
      expect(result.current.remoteStream).toBeNull();
    });

    it('returns all expected handlers', () => {
      const { result } = renderHook(() => useVideoCall(defaultOptions));

      expect(typeof result.current.handleEndCall).toBe('function');
      expect(typeof result.current.handleToggleMute).toBe('function');
      expect(typeof result.current.handleToggleVideo).toBe('function');
      expect(typeof result.current.handleToggleFullscreen).toBe('function');
      expect(typeof result.current.handleToggleScreenShare).toBe('function');
      expect(typeof result.current.formatDuration).toBe('function');
    });
  });

  describe('formatDuration', () => {
    it('formats 0 seconds as "00:00"', () => {
      const { result } = renderHook(() => useVideoCall(defaultOptions));

      expect(result.current.formatDuration(0)).toBe('00:00');
    });

    it('formats 65 seconds as "01:05"', () => {
      const { result } = renderHook(() => useVideoCall(defaultOptions));

      expect(result.current.formatDuration(65)).toBe('01:05');
    });

    it('formats 3600 seconds as "60:00"', () => {
      const { result } = renderHook(() => useVideoCall(defaultOptions));

      expect(result.current.formatDuration(3600)).toBe('60:00');
    });
  });

  describe('handleEndCall', () => {
    it('calls endCall and onClose', async () => {
      const onClose = vi.fn();
      const { result } = renderHook(() =>
        useVideoCall({ ...defaultOptions, onClose })
      );

      await act(async () => {
        await result.current.handleEndCall();
      });

      expect(mockEndCall).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('resets duration to 0', async () => {
      const { result } = renderHook(() => useVideoCall(defaultOptions));

      await act(async () => {
        await result.current.handleEndCall();
      });

      expect(result.current.duration).toBe(0);
    });
  });

  describe('handleToggleMute', () => {
    it('calls toggleMute and shows toast', () => {
      const { result } = renderHook(() => useVideoCall(defaultOptions));

      act(() => {
        result.current.handleToggleMute();
      });

      expect(mockToggleMute).toHaveBeenCalled();
    });
  });

  describe('handleToggleVideo', () => {
    it('calls toggleVideo and shows toast', () => {
      const { result } = renderHook(() => useVideoCall(defaultOptions));

      act(() => {
        result.current.handleToggleVideo();
      });

      expect(mockToggleVideo).toHaveBeenCalled();
    });
  });

  describe('handleToggleFullscreen', () => {
    it('toggles fullscreen state', () => {
      const { result } = renderHook(() => useVideoCall(defaultOptions));

      expect(result.current.isFullscreen).toBe(false);

      act(() => {
        result.current.handleToggleFullscreen();
      });

      expect(result.current.isFullscreen).toBe(true);

      act(() => {
        result.current.handleToggleFullscreen();
      });

      expect(result.current.isFullscreen).toBe(false);
    });
  });

  describe('handleToggleScreenShare', () => {
    it('starts screen share when not sharing', async () => {
      mockCallState.isScreenSharing = false;

      const { result } = renderHook(() => useVideoCall(defaultOptions));

      await act(async () => {
        await result.current.handleToggleScreenShare();
      });

      expect(mockStartScreenShare).toHaveBeenCalled();
    });

    it('stops screen share when already sharing', async () => {
      mockCallState.isScreenSharing = true;

      const { result } = renderHook(() => useVideoCall(defaultOptions));

      await act(async () => {
        await result.current.handleToggleScreenShare();
      });

      expect(mockStopScreenShare).toHaveBeenCalled();
    });
  });

  describe('call initiation', () => {
    it('starts outgoing call when modal opens without incomingRoomId', () => {
      renderHook(() =>
        useVideoCall({
          ...defaultOptions,
          isOpen: true,
        })
      );

      expect(mockStartCall).toHaveBeenCalledWith('user-2', {
        video: true,
        audio: true,
      });
    });

    it('answers incoming call when incomingRoomId is provided', () => {
      renderHook(() =>
        useVideoCall({
          ...defaultOptions,
          isOpen: true,
          incomingRoomId: 'room-incoming',
        })
      );

      expect(mockAnswerCall).toHaveBeenCalledWith('room-incoming', {
        video: true,
        audio: true,
      });
    });

    it('does not start call when modal is closed', () => {
      renderHook(() =>
        useVideoCall({
          ...defaultOptions,
          isOpen: false,
        })
      );

      expect(mockStartCall).not.toHaveBeenCalled();
      expect(mockAnswerCall).not.toHaveBeenCalled();
    });
  });
});
