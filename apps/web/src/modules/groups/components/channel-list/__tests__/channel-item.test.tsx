/** @module channel-item tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@heroicons/react/24/outline', () => ({
  HashtagIcon: (props: Record<string, unknown>) => (
    <svg data-testid="icon-HashtagIcon" {...props} />
  ),
}));

vi.mock('@/lib/animation-presets', () => ({
  tweens: { standard: {} },
  loop: () => ({}),
  springs: { snappy: {} },
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn() },
}));

vi.mock('../constants', () => ({
  channelTypeIcons: {},
  channelTypeColors: {},
}));

import { ChannelItem } from '../channel-item';

describe('ChannelItem', () => {
  const mockChannel = {
    id: 'ch1',
    name: 'general',
    type: 'text' as const,
    position: 0,
    topic: null,
    categoryId: null,
    isNsfw: false,
    slowModeSeconds: 0,
    unreadCount: 0,
    lastMessageAt: null,
  };

  const renderWithRouter = (props: Record<string, unknown> = {}) =>
    render(
      <MemoryRouter initialEntries={['/groups/g1/channels/ch1']}>
        <Routes>
          <Route
            path="/groups/:groupId/channels/:channelId"
            element={
              <ChannelItem channel={mockChannel} isActive={false} {...props} />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

  it('renders channel name', () => {
    renderWithRouter();
    expect(screen.getByText('general')).toBeInTheDocument();
  });

  it('renders hash icon fallback', () => {
    renderWithRouter();
    expect(screen.getByTestId('icon-HashtagIcon')).toBeInTheDocument();
  });

  it('renders as a link', () => {
    renderWithRouter();
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
  });

  it('link points to channel route', () => {
    renderWithRouter();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('/channels/ch1'),
    );
  });

  it('link points voice channels to the mounted voice route', () => {
    renderWithRouter({
      channel: {
        ...mockChannel,
        id: 'voice-1',
        name: 'Voice',
        type: 'voice',
      },
    });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('/groups/g1/voice/voice-1'),
    );
  });
});
