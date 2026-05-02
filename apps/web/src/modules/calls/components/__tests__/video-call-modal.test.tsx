
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUseVideoCall = vi.fn();

vi.mock('@/modules/calls/hooks/useVideoCall', () => ({
  useVideoCall: (opts: unknown) => mockUseVideoCall(opts),
}));

vi.mock('@/modules/calls/components/video-call-top-bar', () => ({
  VideoCallTopBar: ({
    otherParticipantName,
    statusLabel,
    onClose,
  }: {
    otherParticipantName: string;
    statusLabel: string;
    onClose: () => void;
  }) => (
    <div data-testid="top-bar">
      <span data-testid="top-bar-name">{otherParticipantName}</span>
      <span data-testid="top-bar-status">{statusLabel}</span>
      <button data-testid="top-bar-close" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock('@/modules/calls/components/video-call-controls', () => ({
  VideoCallControls: ({
    isMuted,
    isVideoEnabled,
    onToggleMute,
    onEndCall,
    onToggleVideo,
  }: {
    isMuted: boolean;
    isVideoEnabled: boolean;
    onToggleMute: () => void;
    onEndCall: () => void;
    onToggleVideo: () => void;
  }) => (
    <div data-testid="controls">
      <button data-testid="mute-btn" onClick={onToggleMute}>
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
      <button data-testid="end-btn" onClick={onEndCall}>
        End
      </button>
      <button data-testid="video-btn" onClick={onToggleVideo}>
        {isVideoEnabled ? 'Camera Off' : 'Camera On'}
      </button>
    </div>
  ),
}));

vi.mock('@/modules/calls/components/video-grid', () => ({
  VideoGrid: () => <div data-testid="video-grid" />,
}));

vi.mock('@heroicons/react/24/solid', () => ({
  VideoCameraSlashIcon: ({ className }: { className?: string }) => (
    <span data-testid="video-off-icon" className={className} />
  ),
}));

vi.mock('@/lib/animation-presets', () => ({
  tweens: { verySlow: 3 },
  loop: vi.fn(() => ({ duration: 3, repeat: Infinity })),
}));

import { VideoCallModal } from '../video-call-modal';

function makeCallState(overrides: Record<string, unknown> = {}) {
  return {
    status: 'connected',
    isMuted: false,
    isVideoEnabled: true,
    isScreenSharing: false,
    roomId: 'room-abc',
    participants: [],
    remoteStreams: new Map(),
    ...overrides,
  };
}

function makeHookReturn(overrides: Record<string, unknown> = {}) {
  return {
    callState: makeCallState(overrides.callState as Record<string, unknown>),
    localStream: null,
    remoteStream: null,
    localVideoRef: { current: null },
    remoteVideoRef: { current: null },
    isFullscreen: false,
    isConnecting: false,
    duration: 0,
    formatDuration: (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
    handleEndCall: vi.fn(),
    handleToggleMute: vi.fn(),
    handleToggleVideo: vi.fn(),
    handleToggleFullscreen: vi.fn(),
    handleToggleScreenShare: vi.fn(),
    ...overrides,
  };
}

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  conversationId: 'conv-1',
  otherParticipantId: 'user-2',
  otherParticipantName: 'Alice',
};

describe('VideoCallModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVideoCall.mockReturnValue(makeHookReturn());
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<VideoCallModal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders top bar with participant name', () => {
    render(<VideoCallModal {...defaultProps} />);
    expect(screen.getByTestId('top-bar-name')).toHaveTextContent('Alice');
  });

  it('shows "Calling..." status when ringing', () => {
    mockUseVideoCall.mockReturnValue(
      makeHookReturn({ callState: makeCallState({ status: 'ringing' }) })
    );
    render(<VideoCallModal {...defaultProps} />);
    expect(screen.getByTestId('top-bar-status')).toHaveTextContent('Calling...');
  });

  it('shows "Calling..." status when connecting', () => {
    mockUseVideoCall.mockReturnValue(makeHookReturn({ isConnecting: true }));
    render(<VideoCallModal {...defaultProps} />);
    expect(screen.getByTestId('top-bar-status')).toHaveTextContent('Calling...');
  });

  it('shows formatted duration when connected', () => {
    mockUseVideoCall.mockReturnValue(
      makeHookReturn({
        callState: makeCallState({ status: 'connected' }),
        duration: 125,
      })
    );
    render(<VideoCallModal {...defaultProps} />);
    expect(screen.getByTestId('top-bar-status')).toHaveTextContent('2:05');
  });

  it('shows "Call ended" status when ended', () => {
    mockUseVideoCall.mockReturnValue(
      makeHookReturn({ callState: makeCallState({ status: 'ended' }) })
    );
    render(<VideoCallModal {...defaultProps} />);
    expect(screen.getByTestId('top-bar-status')).toHaveTextContent('Call ended');
  });

  it('renders controls with correct mute state', () => {
    mockUseVideoCall.mockReturnValue(
      makeHookReturn({ callState: makeCallState({ isMuted: true }) })
    );
    render(<VideoCallModal {...defaultProps} />);
    expect(screen.getByTestId('mute-btn')).toHaveTextContent('Unmute');
  });

  it('renders controls with correct video state', () => {
    mockUseVideoCall.mockReturnValue(
      makeHookReturn({ callState: makeCallState({ isVideoEnabled: false }) })
    );
    render(<VideoCallModal {...defaultProps} />);
    expect(screen.getByTestId('video-btn')).toHaveTextContent('Camera On');
  });

  it('renders video grid for group calls', () => {
    mockUseVideoCall.mockReturnValue(
      makeHookReturn({
        callState: makeCallState({
          participants: [{ id: '1' }, { id: '2' }],
        }),
      })
    );
    render(<VideoCallModal {...defaultProps} isGroupCall />);
    expect(screen.getByTestId('video-grid')).toBeInTheDocument();
  });

  it('renders video grid when multiple participants exist', () => {
    mockUseVideoCall.mockReturnValue(
      makeHookReturn({
        callState: makeCallState({
          participants: [{ id: '1' }, { id: '2' }],
        }),
      })
    );
    render(<VideoCallModal {...defaultProps} />);
    expect(screen.getByTestId('video-grid')).toBeInTheDocument();
  });

  it('shows participant avatar placeholder when no avatar provided', () => {
    mockUseVideoCall.mockReturnValue(
      makeHookReturn({
        callState: makeCallState({ status: 'ringing' }),
        remoteStream: null,
      })
    );
    render(<VideoCallModal {...defaultProps} />);
    // Shows initial letter when no avatar
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows participant avatar image when provided', () => {
    mockUseVideoCall.mockReturnValue(
      makeHookReturn({
        callState: makeCallState({ status: 'ringing' }),
        remoteStream: null,
      })
    );
    render(<VideoCallModal {...defaultProps} otherParticipantAvatar="https://example.com/a.jpg" />);
    const img = screen.getByAltText('Alice');
    expect(img).toHaveAttribute('src', 'https://example.com/a.jpg');
  });

  it('shows camera-off icon when local video is disabled in 1:1 mode', () => {
    mockUseVideoCall.mockReturnValue(
      makeHookReturn({
        localStream: null,
        callState: makeCallState({ isVideoEnabled: false }),
      })
    );
    render(<VideoCallModal {...defaultProps} />);
    expect(screen.getByTestId('video-off-icon')).toBeInTheDocument();
  });

  it('passes incomingRoomId to useVideoCall hook', () => {
    render(<VideoCallModal {...defaultProps} incomingRoomId="incoming-room-42" />);
    expect(mockUseVideoCall).toHaveBeenCalledWith(
      expect.objectContaining({ incomingRoomId: 'incoming-room-42' })
    );
  });
});
