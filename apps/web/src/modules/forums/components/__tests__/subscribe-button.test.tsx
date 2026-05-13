/** @module subscribe-button tests */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/lib/api', () => ({ api: { post: vi.fn(), delete: vi.fn(), put: vi.fn() } }));
vi.mock('@/shared/components/ui', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { SubscribeButton } from '../subscribe-button';

describe('SubscribeButton', () => {
  const defaultProps = {
    targetType: 'forum' as const,
    targetId: 'forum-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bell icon', () => {
    const { container } = render(<SubscribeButton {...defaultProps} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with initial subscription level', () => {
    const { container } = render(
      <SubscribeButton
        {...defaultProps}
        subscription={{ id: 'sub-1', notification_level: 'all' }}
      />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows dropdown on button click', () => {
    render(
      <SubscribeButton
        {...defaultProps}
        subscription={{ id: 'sub-1', notification_level: 'all' }}
      />
    );
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(screen.getByText(/All Activity/)).toBeInTheDocument();
    expect(screen.getByText(/Mentions Only/)).toBeInTheDocument();
  });

  it('renders chevron down icon when subscribed', () => {
    const { container } = render(
      <SubscribeButton
        {...defaultProps}
        subscription={{ id: 'sub-1', notification_level: 'all' }}
      />
    );
    expect(container.querySelectorAll('button svg')).toHaveLength(2);
  });
});
