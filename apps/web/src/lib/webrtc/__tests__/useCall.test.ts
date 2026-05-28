import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/modules/auth/store';
import { useCall } from '../useCall';

const mocks = vi.hoisted(() => {
  const mockSocket = { id: 'socket-1' };
  const mockConnectedSocket = { id: 'socket-after-connect' };
  const mockGetSocket = vi.fn().mockReturnValue(mockSocket);
  const mockConnect = vi.fn().mockResolvedValue(undefined);
  const mockOn = vi.fn();
  const mockGetState = vi.fn(() => ({
    roomId: null,
    status: 'idle',
    participants: [],
    localStream: null,
    remoteStreams: new Map(),
    isMuted: false,
    isVideoEnabled: true,
    isScreenSharing: false,
    error: null,
  }));
  const mockManager = {
    on: mockOn,
    getState: mockGetState,
    startCall: vi.fn().mockResolvedValue('room-123'),
    answerCall: vi.fn().mockResolvedValue(true),
    endCall: vi.fn().mockResolvedValue(undefined),
    toggleMute: vi.fn().mockReturnValue(false),
    toggleVideo: vi.fn().mockReturnValue(true),
    startScreenShare: vi.fn().mockResolvedValue(true),
    stopScreenShare: vi.fn().mockResolvedValue(undefined),
  };
  const mockGetWebRTCManager = vi.fn().mockReturnValue(mockManager);
  const mockDestroyWebRTCManager = vi.fn();

  return {
    mockSocket,
    mockConnectedSocket,
    mockGetSocket,
    mockConnect,
    mockManager,
    mockGetWebRTCManager,
    mockDestroyWebRTCManager,
  };
});

vi.mock('@/lib/socket', () => ({
  useSocket: vi.fn(() => ({
    getSocket: mocks.mockGetSocket,
    connect: mocks.mockConnect,
  })),
}));

vi.mock('../webrtcService', () => ({
  getWebRTCManager: mocks.mockGetWebRTCManager,
  destroyWebRTCManager: mocks.mockDestroyWebRTCManager,
}));

describe('useCall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGetSocket.mockReturnValue(mocks.mockSocket);
    mocks.mockConnect.mockResolvedValue(undefined);
    mocks.mockGetWebRTCManager.mockReturnValue(mocks.mockManager);
    useAuthStore.setState({ token: null });
  });

  it('uses an existing socket without reconnecting', async () => {
    renderHook(() => useCall());

    await waitFor(() =>
      expect(mocks.mockGetWebRTCManager).toHaveBeenCalledWith(mocks.mockSocket)
    );
    expect(mocks.mockConnect).not.toHaveBeenCalled();
  });

  it('connects before creating the manager when auth is ready but socket is not', async () => {
    useAuthStore.setState({ token: 'auth-token' });
    mocks.mockGetSocket.mockReturnValueOnce(null).mockReturnValue(mocks.mockConnectedSocket);

    renderHook(() => useCall());

    await waitFor(() => expect(mocks.mockConnect).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(mocks.mockGetWebRTCManager).toHaveBeenCalledWith(mocks.mockConnectedSocket)
    );
  });
});
