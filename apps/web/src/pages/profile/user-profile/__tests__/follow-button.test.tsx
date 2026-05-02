import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';

const mockState = {
  following: {} as Record<string, boolean>,
  counts: {} as Record<string, { following: number; followers: number }>,
  follow: vi.fn(),
  unfollow: vi.fn(),
  fetchCounts: vi.fn(),
};

vi.mock('@/modules/social/store/followStore', () => ({
  useFollowStore: <T,>(selector: (state: typeof mockState) => T): T => selector(mockState),
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: { light: vi.fn(), medium: vi.fn(), success: vi.fn() },
}));

vi.mock('@/hooks/useMotionSafe', () => ({
  useMotionSafe: () => ({
    tapScale: () => ({ scale: 1 }),
    hoverScale: () => ({ scale: 1 }),
    shouldAnimate: false,
  }),
}));

import { FollowButton } from '../follow-button';

describe('FollowButton', () => {
  beforeEach(() => {
    mockState.following = {};
    mockState.counts = {};
    mockState.follow.mockReset().mockResolvedValue(undefined);
    mockState.unfollow.mockReset().mockResolvedValue(undefined);
    mockState.fetchCounts.mockReset().mockResolvedValue(undefined);
  });

  it('renders Follow when not following the target', () => {
    render(<FollowButton userId="user-1" />);
    expect(screen.getByRole('button', { name: /follow user/i })).toBeInTheDocument();
  });

  it('renders Following when already following', () => {
    mockState.following['user-1'] = true;
    render(<FollowButton userId="user-1" />);
    expect(screen.getByRole('button', { name: /unfollow user/i })).toBeInTheDocument();
  });

  it('fetches counts on mount', () => {
    render(<FollowButton userId="user-1" />);
    expect(mockState.fetchCounts).toHaveBeenCalledWith('user-1');
  });

  it('calls follow() when Follow is clicked', async () => {
    render(<FollowButton userId="user-1" />);
    await userEvent.click(screen.getByRole('button', { name: /follow user/i }));
    expect(mockState.follow).toHaveBeenCalledWith('user-1');
  });

  it('calls unfollow() when Unfollow is clicked', async () => {
    mockState.following['user-2'] = true;
    render(<FollowButton userId="user-2" />);
    await userEvent.click(screen.getByRole('button', { name: /unfollow user/i }));
    expect(mockState.unfollow).toHaveBeenCalledWith('user-2');
  });

  it('renders compact-formatted following / followers counts', () => {
    mockState.counts['user-1'] = { following: 1234, followers: 56 };
    render(<FollowButton userId="user-1" />);
    expect(screen.getByText(/following/i)).toBeInTheDocument();
    expect(screen.getByText(/followers/i)).toBeInTheDocument();
  });
});
