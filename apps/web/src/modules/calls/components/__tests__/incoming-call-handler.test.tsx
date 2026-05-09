
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockDeclineCall = vi.fn();
const mockIncomingCallStore: {
  incomingCall: import('@/modules/calls/store').IncomingCall | null;
  declineCall: ReturnType<typeof vi.fn>;
} = {
  incomingCall: null,
  declineCall: mockDeclineCall,
};

vi.mock('@/modules/calls/store', () => ({
  useIncomingCallStore: () => mockIncomingCallStore,
}));

vi.mock('@/modules/chat/store', () => ({
  useChatStore: {
    getState: () => ({
      conversations: [
        {
          id: 'conv-1',
          participants: [{ userId: 'caller-1' }],
        },
      ],
    }),
  },
}));

vi.mock('@/modules/chat/store/chatStore.impl', () => ({
  useChatStore: {
    getState: () => ({
      conversations: [
        {
          id: 'conv-1',
          participants: [{ userId: 'caller-1' }],
        },
      ],
    }),
  },
}));

vi.mock('../incoming-call-modal', () => ({
  IncomingCallModal: ({
    call,
    onAccept,
    onDecline,
  }: {
    call: { callerName: string; roomId: string; type: string };
    onAccept: (roomId: string, isVideo: boolean) => void;
    onDecline: () => void;
  }) => (
    <div data-testid="incoming-call-modal">
      <span data-testid="caller-name">{call.callerName}</span>
      <button data-testid="accept-btn" onClick={() => onAccept(call.roomId, call.type === 'video')}>
        Accept
      </button>
      <button data-testid="decline-btn" onClick={() => onDecline()}>
        Decline
      </button>
    </div>
  ),
}));

import { IncomingCallHandler } from '../incoming-call-handler';
import type { IncomingCall } from '@/modules/calls/store';

function makeCall(overrides: Partial<IncomingCall> = {}): IncomingCall {
  return {
    roomId: 'room-1',
    callerId: 'caller-1',
    callerName: 'Bob',
    callerAvatar: null,
    type: 'audio',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('IncomingCallHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIncomingCallStore.incomingCall = null;
  });

  afterEach(() => {
    mockIncomingCallStore.incomingCall = null;
  });

  it('does not render modal when there is no incoming call', () => {
    render(<IncomingCallHandler />);
    expect(screen.queryByTestId('incoming-call-modal')).not.toBeInTheDocument();
  });

  it('renders modal when there is an incoming call', () => {
    mockIncomingCallStore.incomingCall = makeCall();
    render(<IncomingCallHandler />);
    expect(screen.getByTestId('incoming-call-modal')).toBeInTheDocument();
  });

  it('displays the caller name from the incoming call', () => {
    mockIncomingCallStore.incomingCall = makeCall({ callerName: 'Charlie' });
    render(<IncomingCallHandler />);
    expect(screen.getByTestId('caller-name')).toHaveTextContent('Charlie');
  });

  it('calls declineCall when decline button is clicked', () => {
    mockIncomingCallStore.incomingCall = makeCall();
    render(<IncomingCallHandler />);
    fireEvent.click(screen.getByTestId('decline-btn'));
    expect(mockDeclineCall).toHaveBeenCalledOnce();
  });

  it('navigates to conversation and clears call on accept', () => {
    mockIncomingCallStore.incomingCall = makeCall({ callerId: 'caller-1' });
    render(<IncomingCallHandler />);
    fireEvent.click(screen.getByTestId('accept-btn'));

    // Should navigate to conversation URL with query params
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/messages/conv-1'));
    expect(mockDeclineCall).toHaveBeenCalled();
  });

  it('handles accept with keyboard shortcut A', () => {
    mockIncomingCallStore.incomingCall = makeCall({ callerId: 'caller-1' });
    render(<IncomingCallHandler />);

    act(() => {
      fireEvent.keyDown(window, { key: 'a' });
    });

    expect(mockNavigate).toHaveBeenCalled();
    expect(mockDeclineCall).toHaveBeenCalled();
  });

  it('handles decline with keyboard shortcut D', () => {
    mockIncomingCallStore.incomingCall = makeCall();
    render(<IncomingCallHandler />);

    act(() => {
      fireEvent.keyDown(window, { key: 'd' });
    });

    expect(mockDeclineCall).toHaveBeenCalledOnce();
  });

  it('handles uppercase keyboard shortcuts', () => {
    mockIncomingCallStore.incomingCall = makeCall();
    render(<IncomingCallHandler />);

    act(() => {
      fireEvent.keyDown(window, { key: 'D' });
    });

    expect(mockDeclineCall).toHaveBeenCalledOnce();
  });

  it('does not respond to keyboard shortcuts when no incoming call', () => {
    mockIncomingCallStore.incomingCall = null;
    render(<IncomingCallHandler />);

    act(() => {
      fireEvent.keyDown(window, { key: 'a' });
      fireEvent.keyDown(window, { key: 'd' });
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockDeclineCall).not.toHaveBeenCalled();
  });

  it('ignores unrelated key presses', () => {
    mockIncomingCallStore.incomingCall = makeCall();
    render(<IncomingCallHandler />);

    act(() => {
      fireEvent.keyDown(window, { key: 'x' });
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockDeclineCall).not.toHaveBeenCalled();
  });
});
