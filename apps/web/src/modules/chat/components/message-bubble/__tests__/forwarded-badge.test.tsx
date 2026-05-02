/** @module ForwardedBadge tests */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ForwardedBadge } from '../forwarded-badge';

vi.mock('@/lib/animations/transitions/helpers', () => ({
  getReducedMotion: () => false,
}));

describe('ForwardedBadge', () => {
  it('displays the known sender name', () => {
    render(<ForwardedBadge forwardedFromUserName="Alice" isOwn={false} />);
    expect(screen.getByText(/Forwarded from Alice/)).toBeInTheDocument();
  });

  it('falls back to "a user" when the sender name is null', () => {
    render(<ForwardedBadge forwardedFromUserName={null} isOwn={false} />);
    expect(screen.getByText(/Forwarded from a user/)).toBeInTheDocument();
  });

  it('falls back to "a user" when the sender name is whitespace only', () => {
    render(<ForwardedBadge forwardedFromUserName="   " isOwn={false} />);
    expect(screen.getByText(/Forwarded from a user/)).toBeInTheDocument();
  });

  it('right-aligns the badge when the message is own', () => {
    render(<ForwardedBadge forwardedFromUserName="Bob" isOwn={true} />);
    const badge = screen.getByTestId('forwarded-badge');
    expect(badge.className).toContain('justify-end');
  });

  it('does not right-align when the message is from another user', () => {
    render(<ForwardedBadge forwardedFromUserName="Bob" isOwn={false} />);
    const badge = screen.getByTestId('forwarded-badge');
    expect(badge.className).not.toContain('justify-end');
  });
});
