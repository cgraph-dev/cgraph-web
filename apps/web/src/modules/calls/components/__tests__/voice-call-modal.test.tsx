/**
 * @file Tests for VoiceCallModal component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@heroicons/react/24/outline', () => ({
  PhoneXMarkIcon: ({ className }: { className?: string }) => (
    <span data-testid="phone-end-icon" className={className} />
  ),
  MicrophoneIcon: ({ className }: { className?: string }) => (
    <span data-testid="mic-icon" className={className} />
  ),
  SpeakerWaveIcon: ({ className }: { className?: string }) => (
    <span data-testid="speaker-icon" className={className} />
  ),
  XMarkIcon: ({ className }: { className?: string }) => (
    <span data-testid="close-icon" className={className} />
  ),
}));

vi.mock('@cgraph/animation-constants', () => ({
  durations: { loop: { ms: 2000 } },
}));

const mockStartCall = vi.fn();
const mockAnswerCall = vi.fn();
const mockEndCall = vi.fn().mockResolvedValue(undefined);
const mockToggleMute = vi.fn().mockReturnValue(true);

vi.mock('@/modules/calls/hooks/useWebRTC', () => ({
  useWebRTC: ({
    onCallConnected,
    onCallEnded,
    onError,
  }: {
    onCallConnected?: () => void;
    onCallEnded?: (reason: string) => void;
    onError?: (error: string) => void;
  }) => {
    // Store callbacks so tests can invoke them
    (globalThis as Record<string, unknown>).__webrtcCallbacks = {
      onCallConnected,
      onCallEnded,
      onError,
    };
    return {
      callState: (globalThis as Record<string, unknown>).__mockCallState || {
        status: 'idle',
        isMuted: false,
        roomId: null,
        participants: [],
      },
      localStream: null,
      remoteStream: null,
      startCall: mockStartCall,
      answerCall: mockAnswerCall,
      endCall: mockEndCall,
      toggleMute: mockToggleMute,
      isCallActive: false,
      isConnecting: false,
    };
  },
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({ user: { id: 'me', username: 'TestUser' } }),
}));

vi.mock('@/shared/components/ui', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { VoiceCallModal } from '../voice-call-modal';
import { toast } from '@/shared/components/ui';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  conversationId: 'conv-1',
  otherParticipantId: 'user-2',
  otherParticipantName: 'Alice',
};

describe('VoiceCallModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (globalThis as Record<string, unknown>).__mockCallState = {
      status: 'ringing',
      isMuted: false,
      roomId: 'room-1',
      participants: [],
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as Record<string, unknown>).__mockCallState;
    delete (globalThis as Record<string, unknown>).__webrtcCallbacks;
  });

  it('returns null when isOpen is false', () => {
    const { container } = render(<VoiceCallModal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders participant name when open', () => {
    render(<VoiceCallModal {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows participant initial when no avatar provided', () => {
    render(<VoiceCallModal {...defaultProps} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows participant avatar when provided', () => {
    render(<VoiceCallModal {...defaultProps} otherParticipantAvatar="https://example.com/a.jpg" />);
    const img = screen.getByAltText('Alice');
    expect(img).toHaveAttribute('src', 'https://example.com/a.jpg');
  });

  it('shows "Calling..." text when ringing', () => {
    render(<VoiceCallModal {...defaultProps} />);
    expect(screen.getByText('Calling...')).toBeInTheDocument();
  });

  it('shows "Call ended" when call status is ended', () => {
    (globalThis as Record<string, unknown>).__mockCallState = {
      status: 'ended',
      isMuted: false,
      roomId: null,
      participants: [],
    };
    render(<VoiceCallModal {...defaultProps} />);
    expect(screen.getByText('Call ended')).toBeInTheDocument();
  });

  it('starts a new call when modal opens without incomingRoomId', () => {
    render(<VoiceCallModal {...defaultProps} />);
    expect(mockStartCall).toHaveBeenCalledWith('user-2', { video: false, audio: true });
  });

  it('answers an incoming call when incomingRoomId is provided', () => {
    render(<VoiceCallModal {...defaultProps} incomingRoomId="incoming-room-5" />);
    expect(mockAnswerCall).toHaveBeenCalledWith('incoming-room-5', { video: false, audio: true });
  });

  it('calls endCall when end call button is clicked', () => {
    const onClose = vi.fn();
    render(<VoiceCallModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByTitle('End call'));

    expect(mockEndCall).toHaveBeenCalled();
  });

  it('toggles mute and shows toast when mute button is clicked', () => {
    mockToggleMute.mockReturnValue(true);
    render(<VoiceCallModal {...defaultProps} />);

    fireEvent.click(screen.getByTitle('Mute'));

    expect(mockToggleMute).toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith('Microphone muted');
  });

  it('shows unmute toast when toggling from muted to unmuted', () => {
    mockToggleMute.mockReturnValue(false);
    render(<VoiceCallModal {...defaultProps} />);

    fireEvent.click(screen.getByTitle('Mute'));

    expect(toast.info).toHaveBeenCalledWith('Microphone unmuted');
  });

  it('applies muted button style when muted', () => {
    (globalThis as Record<string, unknown>).__mockCallState = {
      status: 'connected',
      isMuted: true,
      roomId: 'r1',
      participants: [],
    };
    render(<VoiceCallModal {...defaultProps} />);
    const muteBtn = screen.getByTitle('Unmute');
    expect(muteBtn.className).toContain('bg-red-600');
  });

  it('renders close button in top right', () => {
    render(<VoiceCallModal {...defaultProps} />);
    expect(screen.getByTestId('close-icon')).toBeInTheDocument();
  });

  it('renders speaker button', () => {
    render(<VoiceCallModal {...defaultProps} />);
    expect(screen.getByTitle('Speaker')).toBeInTheDocument();
  });
});
