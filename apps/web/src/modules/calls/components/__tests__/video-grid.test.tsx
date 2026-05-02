
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@heroicons/react/24/outline', () => ({
  MicrophoneIcon: ({ className }: { className?: string }) => (
    <span data-testid="mic-icon" className={className} />
  ),
}));

vi.mock('@heroicons/react/24/solid', () => ({
  VideoCameraSlashIcon: ({ className }: { className?: string }) => (
    <span data-testid="video-off-icon" className={className} />
  ),
}));

import { VideoGrid } from '../video-grid';
import type { CallParticipant } from '@/modules/calls/types';

function makeParticipant(overrides: Partial<CallParticipant> = {}): CallParticipant {
  return {
    id: 'p1',
    username: 'Alice',
    displayName: 'Alice',
    avatarUrl: null,
    isMuted: false,
    isVideoEnabled: true,
    isSpeaking: false,
    isScreenSharing: false,
    connectionQuality: 'excellent',
    joinedAt: new Date().toISOString(),
    ...overrides,
  };
}

const defaultProps = {
  localStream: null,
  remoteStreams: new Map<string, MediaStream>(),
  participants: [] as CallParticipant[],
  isVideoEnabled: true,
  isMuted: false,
};

describe('VideoGrid', () => {
  it('renders local tile with "You" label', () => {
    render(<VideoGrid {...defaultProps} />);
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('renders remote participant tiles', () => {
    const participants = [
      makeParticipant({ id: 'p1', username: 'Alice' }),
      makeParticipant({ id: 'p2', username: 'Bob' }),
    ];
    render(<VideoGrid {...defaultProps} participants={participants} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows participant initial when no avatar and no video', () => {
    const participants = [
      makeParticipant({ id: 'p1', username: 'Charlie', avatarUrl: null, isVideoEnabled: false }),
    ];
    render(<VideoGrid {...defaultProps} participants={participants} />);
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('shows participant avatar image when avatarUrl is provided and video is off', () => {
    const participants = [
      makeParticipant({
        id: 'p1',
        username: 'Dana',
        avatarUrl: 'https://example.com/dana.jpg',
        isVideoEnabled: false,
      }),
    ];
    render(<VideoGrid {...defaultProps} participants={participants} />);
    const img = screen.getByAltText('Dana');
    expect(img).toHaveAttribute('src', 'https://example.com/dana.jpg');
  });

  it('shows muted icon when participant is muted', () => {
    const participants = [makeParticipant({ id: 'p1', username: 'Eve', isMuted: true })];
    render(<VideoGrid {...defaultProps} participants={participants} />);
    // Muted icon is rendered for muted remote + possibly local
    const micIcons = screen.getAllByTestId('mic-icon');
    expect(micIcons.length).toBeGreaterThanOrEqual(1);
  });

  it('does not show muted icon when participant is not muted', () => {
    const participants = [makeParticipant({ id: 'p1', username: 'Frank', isMuted: false })];
    render(<VideoGrid {...defaultProps} isMuted={false} participants={participants} />);
    expect(screen.queryByTestId('mic-icon')).not.toBeInTheDocument();
  });

  it('shows video-off indicator when participant has video disabled', () => {
    const participants = [makeParticipant({ id: 'p1', username: 'Grace', isVideoEnabled: false })];
    render(<VideoGrid {...defaultProps} participants={participants} />);
    expect(screen.getAllByTestId('video-off-icon').length).toBeGreaterThanOrEqual(1);
  });

  it('uses single column grid for 1 participant total', () => {
    const { container } = render(<VideoGrid {...defaultProps} participants={[]} />);
    const gridEl = container.firstElementChild;
    expect(gridEl?.className).toContain('grid-cols-1');
    expect(gridEl?.className).not.toContain('grid-cols-2');
  });

  it('uses 2-column grid for 2-3 participants total', () => {
    const participants = [makeParticipant({ id: 'p1', username: 'A' })];
    const { container } = render(<VideoGrid {...defaultProps} participants={participants} />);
    const gridEl = container.firstElementChild;
    expect(gridEl?.className).toContain('sm:grid-cols-2');
  });

  it('uses 2-column grid for 3-4 participants total', () => {
    const participants = [
      makeParticipant({ id: 'p1', username: 'A' }),
      makeParticipant({ id: 'p2', username: 'B' }),
      makeParticipant({ id: 'p3', username: 'C' }),
    ];
    const { container } = render(<VideoGrid {...defaultProps} participants={participants} />);
    const gridEl = container.firstElementChild;
    expect(gridEl?.className).toContain('grid-cols-2');
  });

  it('uses 3-column grid for 5-6 participants total', () => {
    const participants = Array.from({ length: 5 }, (_, i) =>
      makeParticipant({ id: `p${i}`, username: `User${i}` })
    );
    const { container } = render(<VideoGrid {...defaultProps} participants={participants} />);
    const gridEl = container.firstElementChild;
    expect(gridEl?.className).toContain('sm:grid-cols-3');
  });

  it('uses 4-column grid for 7+ participants total', () => {
    const participants = Array.from({ length: 7 }, (_, i) =>
      makeParticipant({ id: `p${i}`, username: `User${i}` })
    );
    const { container } = render(<VideoGrid {...defaultProps} participants={participants} />);
    const gridEl = container.firstElementChild;
    expect(gridEl?.className).toContain('sm:grid-cols-4');
  });

  it('renders local user info when localUser is provided', () => {
    render(
      <VideoGrid
        {...defaultProps}
        localUser={{ userId: 'me', username: 'MyName', avatarUrl: undefined }}
      />
    );
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('highlights speaking participant with ring style', () => {
    const participants = [makeParticipant({ id: 'p1', username: 'Speaker', isSpeaking: true })];
    const { container } = render(<VideoGrid {...defaultProps} participants={participants} />);
    // The isSpeaking flag applies 'ring-2 ring-primary-500' via VideoTile
    const tiles = container.querySelectorAll('.ring-2');
    expect(tiles.length).toBeGreaterThanOrEqual(1);
  });
});
