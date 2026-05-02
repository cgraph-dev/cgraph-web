
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockConnect = vi.fn();
const mockToggleMute = vi.fn();
const mockToggleVideo = vi.fn();
const mockStartScreenShare = vi.fn();
const mockStopScreenShare = vi.fn();
const mockLeaveRoom = vi.fn().mockResolvedValue(undefined);

let mockHookReturn: Record<string, unknown>;

vi.mock('@/modules/calls/hooks/useLiveKitRoom', () => ({
  useLiveKitRoom: () => mockHookReturn,
}));

vi.mock('@/modules/calls/components/livekit-participant-tile', () => ({
  LiveKitParticipantTile: ({
    participant,
    isLocal,
  }: {
    participant: { identity: string };
    isLocal?: boolean;
  }) => (
    <div data-testid={`participant-tile-${isLocal ? 'local' : participant.identity}`}>
      {isLocal ? 'Local' : participant.identity}
    </div>
  ),
}));

vi.mock('@/modules/calls/components/encryption-indicator', () => ({
  EncryptionIndicator: ({ status }: { status: string }) => (
    <div data-testid="encryption-indicator" data-status={status} />
  ),
}));

vi.mock('@heroicons/react/24/solid', () => ({
  MicrophoneIcon: ({ className }: { className?: string }) => (
    <span data-testid="mic-on-icon" className={className} />
  ),
  VideoCameraIcon: ({ className }: { className?: string }) => (
    <span data-testid="video-on-icon" className={className} />
  ),
  PhoneXMarkIcon: ({ className }: { className?: string }) => (
    <span data-testid="phone-end-icon" className={className} />
  ),
  ComputerDesktopIcon: ({ className }: { className?: string }) => (
    <span data-testid="screen-share-icon" className={className} />
  ),
  LockClosedIcon: ({ className }: { className?: string }) => (
    <span data-testid="lock-closed-icon" className={className} />
  ),
  LockOpenIcon: ({ className }: { className?: string }) => (
    <span data-testid="lock-open-icon" className={className} />
  ),
}));

vi.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: ({ className }: { className?: string }) => (
    <span data-testid="mic-off-icon" className={className} />
  ),
  VideoCameraSlashIcon: ({ className }: { className?: string }) => (
    <span data-testid="video-off-icon" className={className} />
  ),
  ExclamationTriangleIcon: ({ className }: { className?: string }) => (
    <span data-testid="warning-icon" className={className} />
  ),
}));

vi.mock('livekit-client', () => ({
  ConnectionState: {
    Connecting: 'connecting',
    Connected: 'connected',
    Disconnected: 'disconnected',
    Reconnecting: 'reconnecting',
  },
}));

import { GroupCallView } from '../group-call-view';

function resetHookReturn(overrides: Record<string, unknown> = {}) {
  mockHookReturn = {
    connectionState: 'connected',
    participants: [],
    activeSpeakers: [],
    isMuted: false,
    isVideoOn: true,
    isScreenSharing: false,
    isE2EEEnabled: false,
    room: {
      localParticipant: { identity: 'me', sid: 'sid-me' },
      remoteParticipants: new Map(),
    },
    connect: mockConnect,
    toggleMute: mockToggleMute,
    toggleVideo: mockToggleVideo,
    startScreenShare: mockStartScreenShare,
    stopScreenShare: mockStopScreenShare,
    leaveRoom: mockLeaveRoom,
    error: null,
    ...overrides,
  };
}

const defaultProps = {
  roomName: 'test-room',
  channelId: 'ch-1',
};

describe('GroupCallView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHookReturn();
  });

  it('shows join button when connection state is idle', () => {
    resetHookReturn({ connectionState: 'idle' });
    render(<GroupCallView {...defaultProps} />);
    expect(screen.getByText('Join Call')).toBeInTheDocument();
    expect(screen.getByText(/Ready to join test-room/)).toBeInTheDocument();
  });

  it('calls connect when join button is clicked', async () => {
    resetHookReturn({ connectionState: 'idle' });
    const user = userEvent.setup();
    render(<GroupCallView {...defaultProps} />);
    await user.click(screen.getByText('Join Call'));
    expect(mockConnect).toHaveBeenCalledOnce();
  });

  it('shows connecting spinner when connecting', () => {
    resetHookReturn({ connectionState: 'connecting' });
    render(<GroupCallView {...defaultProps} />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('shows error message and retry button when error occurs', () => {
    resetHookReturn({ error: 'Network failure' });
    render(<GroupCallView {...defaultProps} />);
    expect(screen.getByText('Network failure')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('calls connect when retry button is clicked', async () => {
    resetHookReturn({ error: 'Timeout' });
    const user = userEvent.setup();
    render(<GroupCallView {...defaultProps} />);
    await user.click(screen.getByText('Retry'));
    expect(mockConnect).toHaveBeenCalledOnce();
  });

  it('renders local participant tile when connected', () => {
    render(<GroupCallView {...defaultProps} />);
    expect(screen.getByTestId('participant-tile-local')).toBeInTheDocument();
  });

  it('renders remote participant tiles', () => {
    const remotes = new Map([
      [
        'user-2',
        {
          identity: 'user-2',
          sid: 'sid-2',
          name: 'Alice',
          isSpeaking: false,
          isMicrophoneEnabled: true,
          isCameraEnabled: true,
          isScreenShareEnabled: false,
          connectionQuality: 3,
        },
      ],
    ]);
    resetHookReturn({
      room: {
        localParticipant: { identity: 'me', sid: 'sid-me' },
        remoteParticipants: remotes,
      },
    });
    render(<GroupCallView {...defaultProps} />);
    expect(screen.getByTestId('participant-tile-user-2')).toBeInTheDocument();
  });

  it('shows mute button with correct aria label', () => {
    render(<GroupCallView {...defaultProps} />);
    expect(screen.getByLabelText('Mute')).toBeInTheDocument();
  });

  it('toggles mute when mute button is clicked', async () => {
    const user = userEvent.setup();
    render(<GroupCallView {...defaultProps} />);
    await user.click(screen.getByLabelText('Mute'));
    expect(mockToggleMute).toHaveBeenCalledOnce();
  });

  it('shows unmute label when muted', () => {
    resetHookReturn({ isMuted: true });
    render(<GroupCallView {...defaultProps} />);
    expect(screen.getByLabelText('Unmute')).toBeInTheDocument();
  });

  it('toggles video when video button is clicked', async () => {
    const user = userEvent.setup();
    render(<GroupCallView {...defaultProps} />);
    await user.click(screen.getByLabelText('Turn off camera'));
    expect(mockToggleVideo).toHaveBeenCalledOnce();
  });

  it('shows "Turn on camera" when video is off', () => {
    resetHookReturn({ isVideoOn: false });
    render(<GroupCallView {...defaultProps} />);
    expect(screen.getByLabelText('Turn on camera')).toBeInTheDocument();
  });

  it('calls startScreenShare when screen share button is clicked', async () => {
    const user = userEvent.setup();
    render(<GroupCallView {...defaultProps} />);
    await user.click(screen.getByLabelText('Share screen'));
    expect(mockStartScreenShare).toHaveBeenCalledOnce();
  });

  it('calls stopScreenShare when already sharing', async () => {
    resetHookReturn({ isScreenSharing: true });
    const user = userEvent.setup();
    render(<GroupCallView {...defaultProps} />);
    await user.click(screen.getByLabelText('Stop screen share'));
    expect(mockStopScreenShare).toHaveBeenCalledOnce();
  });

  it('calls leaveRoom and onCallEnd when leave button is clicked', async () => {
    const onCallEnd = vi.fn();
    const user = userEvent.setup();
    render(<GroupCallView {...defaultProps} onCallEnd={onCallEnd} />);
    await user.click(screen.getByLabelText('Leave call'));
    expect(mockLeaveRoom).toHaveBeenCalledOnce();
    // Wait for async leaveRoom to resolve
    await vi.waitFor(() => {
      expect(onCallEnd).toHaveBeenCalledOnce();
    });
  });

  it('shows encryption indicator as enabled when E2EE is on', () => {
    resetHookReturn({ isE2EEEnabled: true });
    render(<GroupCallView {...defaultProps} />);
    const indicator = screen.getByTestId('encryption-indicator');
    expect(indicator).toHaveAttribute('data-status', 'enabled');
  });

  it('shows encryption indicator as disabled when E2EE is off', () => {
    resetHookReturn({ isE2EEEnabled: false });
    render(<GroupCallView {...defaultProps} />);
    const indicator = screen.getByTestId('encryption-indicator');
    expect(indicator).toHaveAttribute('data-status', 'disabled');
  });

  it('displays participant count', () => {
    render(<GroupCallView {...defaultProps} />);
    expect(screen.getByText('1 participant')).toBeInTheDocument();
  });

  it('pluralizes participant count for multiple participants', () => {
    resetHookReturn({ participants: [{ identity: 'a' }, { identity: 'b' }] });
    render(<GroupCallView {...defaultProps} />);
    expect(screen.getByText('3 participants')).toBeInTheDocument();
  });
});
