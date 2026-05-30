/**
 * @file Tests for IncomingCallModal component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

vi.mock('@heroicons/react/24/outline', () => ({
  PhoneIcon: ({ className }: { className?: string }) => (
    <span data-testid="phone-icon" className={className} />
  ),
  VideoCameraIcon: ({ className }: { className?: string }) => (
    <span data-testid="video-icon" className={className} />
  ),
  XMarkIcon: ({ className }: { className?: string }) => (
    <span data-testid="x-icon" className={className} />
  ),
  CheckIcon: ({ className }: { className?: string }) => (
    <span data-testid="check-icon" className={className} />
  ),
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    glow: _glow,
    glowColor: _glowColor,
    borderGradient: _borderGradient,
    hover3D: _hover3D,
    shimmer: _shimmer,
    variant: _variant,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <div data-testid="glass-card" {...props}>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    success: vi.fn(),
    medium: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/animation-presets', () => ({
  tweens: { ambient: 1.5 },
  loop: vi.fn(() => ({ duration: 1.5, repeat: Infinity })),
}));

vi.mock('@/lib/animations/transitions', () => ({
  FADE_IN: { initial: { opacity: 0 }, animate: { opacity: 1 } },
}));

vi.mock('@cgraph-dev/animation-constants', () => ({
  durations: { loop: { ms: 2000 } },
}));

import { IncomingCallModal } from '../incoming-call-modal';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { IncomingCall } from '@/modules/calls/store';

function makeCall(overrides: Partial<IncomingCall> = {}): IncomingCall {
  return {
    roomId: 'room-123',
    callerId: 'user-456',
    callerName: 'Alice',
    callerAvatar: null,
    type: 'audio',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('IncomingCallModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders caller name', () => {
    render(<IncomingCallModal call={makeCall()} onAccept={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('displays voice call type badge for audio calls', () => {
    render(
      <IncomingCallModal
        call={makeCall({ type: 'audio' })}
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );
    expect(screen.getByText('Voice')).toBeInTheDocument();
  });

  it('displays video call type badge for video calls', () => {
    render(
      <IncomingCallModal
        call={makeCall({ type: 'video' })}
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );
    expect(screen.getByText('Video')).toBeInTheDocument();
  });

  it('shows caller initial when no avatar is provided', () => {
    render(
      <IncomingCallModal
        call={makeCall({ callerAvatar: null, callerName: 'Zara' })}
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );
    expect(screen.getByText('Z')).toBeInTheDocument();
  });

  it('shows caller avatar image when provided', () => {
    render(
      <IncomingCallModal
        call={makeCall({ callerAvatar: 'https://example.com/avatar.jpg' })}
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );
    const img = screen.getByAltText('Alice');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('calls onAccept with roomId and isVideo=false for audio call when Accept is clicked', () => {
    const onAccept = vi.fn();
    render(
      <IncomingCallModal
        call={makeCall({ type: 'audio' })}
        onAccept={onAccept}
        onDecline={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Accept'));
    expect(onAccept).toHaveBeenCalledWith('room-123', false);
  });

  it('calls onAccept with roomId and isVideo=true for video call when Accept is clicked', () => {
    const onAccept = vi.fn();
    render(
      <IncomingCallModal
        call={makeCall({ type: 'video' })}
        onAccept={onAccept}
        onDecline={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Accept'));
    expect(onAccept).toHaveBeenCalledWith('room-123', true);
  });

  it('calls onDecline when Decline is clicked', () => {
    const onDecline = vi.fn();
    render(<IncomingCallModal call={makeCall()} onAccept={vi.fn()} onDecline={onDecline} />);
    fireEvent.click(screen.getByText('Decline'));
    expect(onDecline).toHaveBeenCalledOnce();
  });

  it('triggers haptic feedback on accept', () => {
    render(<IncomingCallModal call={makeCall()} onAccept={vi.fn()} onDecline={vi.fn()} />);
    fireEvent.click(screen.getByText('Accept'));
    expect(HapticFeedback.success).toHaveBeenCalled();
  });

  it('triggers haptic feedback on decline', () => {
    render(<IncomingCallModal call={makeCall()} onAccept={vi.fn()} onDecline={vi.fn()} />);
    fireEvent.click(screen.getByText('Decline'));
    expect(HapticFeedback.medium).toHaveBeenCalled();
  });

  it('auto-declines after 30 seconds', () => {
    const onDecline = vi.fn();
    render(<IncomingCallModal call={makeCall()} onAccept={vi.fn()} onDecline={onDecline} />);

    // Advance 30 seconds
    act(() => {
      vi.advanceTimersByTime(31000);
    });

    expect(onDecline).toHaveBeenCalled();
  });

  it('shows auto-declining warning near timeout', () => {
    render(<IncomingCallModal call={makeCall()} onAccept={vi.fn()} onDecline={vi.fn()} />);

    act(() => {
      vi.advanceTimersByTime(26000);
    });

    expect(screen.getByText(/auto-declining soon/)).toBeInTheDocument();
  });

  it('shows keyboard shortcut hints', () => {
    render(<IncomingCallModal call={makeCall()} onAccept={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.getByText(/to accept or/)).toBeInTheDocument();
    expect(screen.getByText(/to decline/)).toBeInTheDocument();
  });

  it('renders Decline and Accept buttons', () => {
    render(<IncomingCallModal call={makeCall()} onAccept={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.getByText('Decline')).toBeInTheDocument();
    expect(screen.getByText('Accept')).toBeInTheDocument();
  });

  it('shows ringing time counter', () => {
    render(<IncomingCallModal call={makeCall()} onAccept={vi.fn()} onDecline={vi.fn()} />);
    expect(screen.getByText('Ringing for 0s')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('Ringing for 5s')).toBeInTheDocument();
  });
});
