/**
 * PulseReactions Component Tests
 *
 * Tests for rendering vote buttons, fade gating by pulse score,
 * vote submission via API, and disabled state after voting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

import { api } from '@/lib/api-client';
import { PulseReactions } from '../pulse-reactions';

const mockPost = api.post as ReturnType<typeof vi.fn>;
const defaultProps = {
  contentId: 'content-1',
  contentType: 'thread',
  authorId: 'author-1',
  forumId: 'forum-1',
};
beforeEach(() => {
  vi.clearAllMocks();
});
describe('PulseReactions', () => {
  describe('rendering', () => {
    it('renders all three reaction buttons', () => {
      render(<PulseReactions {...defaultProps} />);

      expect(screen.getByText(/Resonate/)).toBeTruthy();
      expect(screen.getByText(/Fade/)).toBeTruthy();
      expect(screen.getByText(/Not for me/)).toBeTruthy();
    });

    it('accepts custom className', () => {
      const { container } = render(
        <PulseReactions {...defaultProps} className="custom-reactions" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-reactions');
    });
  });

  describe('fade gating', () => {
    it('disables fade button when userPulse < 50', () => {
      render(<PulseReactions {...defaultProps} userPulse={30} />);

      const fadeButton = screen.getByText(/Fade/).closest('button')!;
      expect(fadeButton).toBeDisabled();
    });

    it('applies opacity class to fade when gated', () => {
      render(<PulseReactions {...defaultProps} userPulse={20} />);

      const fadeButton = screen.getByText(/Fade/).closest('button')!;
      expect(fadeButton.className).toContain('opacity-30');
    });

    it('enables fade button when userPulse >= 50', () => {
      render(<PulseReactions {...defaultProps} userPulse={50} />);

      const fadeButton = screen.getByText(/Fade/).closest('button')!;
      expect(fadeButton).not.toBeDisabled();
    });

    it('enables fade button when userPulse > 50', () => {
      render(<PulseReactions {...defaultProps} userPulse={80} />);

      const fadeButton = screen.getByText(/Fade/).closest('button')!;
      expect(fadeButton).not.toBeDisabled();
    });

    it('shows tooltip explaining fade requirement when gated', () => {
      render(<PulseReactions {...defaultProps} userPulse={10} />);

      const fadeButton = screen.getByText(/Fade/).closest('button')!;
      expect(fadeButton.getAttribute('title')).toContain('Pulse');
      expect(fadeButton.getAttribute('title')).toContain('50');
    });

    it('defaults userPulse to 0 (fade disabled)', () => {
      render(<PulseReactions {...defaultProps} />);

      const fadeButton = screen.getByText(/Fade/).closest('button')!;
      expect(fadeButton).toBeDisabled();
    });
  });

  describe('voting', () => {
    it('sends resonate vote to the API', async () => {
      mockPost.mockResolvedValueOnce({ data: { ok: true } });
      render(<PulseReactions {...defaultProps} userPulse={60} />);

      fireEvent.click(screen.getByText(/Resonate/));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/api/v1/pulse/vote', {
          to_user_id: 'author-1',
          forum_id: 'forum-1',
          content_id: 'content-1',
          content_type: 'thread',
          vote_type: 'resonate',
        });
      });
    });

    it('sends fade vote to the API when eligible', async () => {
      mockPost.mockResolvedValueOnce({ data: { ok: true } });
      render(<PulseReactions {...defaultProps} userPulse={60} />);

      fireEvent.click(screen.getByText(/Fade/));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/api/v1/pulse/vote', {
          to_user_id: 'author-1',
          forum_id: 'forum-1',
          content_id: 'content-1',
          content_type: 'thread',
          vote_type: 'fade',
        });
      });
    });

    it('sends not_for_me vote to the API', async () => {
      mockPost.mockResolvedValueOnce({ data: { ok: true } });
      render(<PulseReactions {...defaultProps} />);

      fireEvent.click(screen.getByText(/Not for me/));

      await waitFor(() => {
        expect(mockPost).toHaveBeenCalledWith('/api/v1/pulse/vote', {
          to_user_id: 'author-1',
          forum_id: 'forum-1',
          content_id: 'content-1',
          content_type: 'thread',
          vote_type: 'not_for_me',
        });
      });
    });

    it('does not call API when fade is clicked and gated', () => {
      render(<PulseReactions {...defaultProps} userPulse={10} />);

      // Button is disabled, click should not trigger API
      fireEvent.click(screen.getByText(/Fade/));
      expect(mockPost).not.toHaveBeenCalled();
    });

    it('disables all buttons after a successful vote', async () => {
      mockPost.mockResolvedValueOnce({ data: { ok: true } });
      render(<PulseReactions {...defaultProps} userPulse={60} />);

      fireEvent.click(screen.getByText(/Resonate/));

      await waitFor(() => {
        const resonateBtn = screen.getByText(/Resonate/).closest('button')!;
        const fadeBtn = screen.getByText(/Fade/).closest('button')!;
        const notForMeBtn = screen.getByText(/Not for me/).closest('button')!;

        expect(resonateBtn).toBeDisabled();
        expect(fadeBtn).toBeDisabled();
        expect(notForMeBtn).toBeDisabled();
      });
    });

    it('applies active styling to the voted button', async () => {
      mockPost.mockResolvedValueOnce({ data: { ok: true } });
      render(<PulseReactions {...defaultProps} userPulse={60} />);

      fireEvent.click(screen.getByText(/Resonate/));

      await waitFor(() => {
        const resonateBtn = screen.getByText(/Resonate/).closest('button')!;
        expect(resonateBtn.className).toContain('bg-green-500/20');
        expect(resonateBtn.className).toContain('text-green-400');
      });
    });

    it('handles API errors without crashing', async () => {
      mockPost.mockRejectedValueOnce(new Error('Server error'));
      render(<PulseReactions {...defaultProps} userPulse={60} />);

      fireEvent.click(screen.getByText(/Resonate/));

      // Should not throw, buttons should remain usable after error
      await waitFor(() => {
        const resonateBtn = screen.getByText(/Resonate/).closest('button')!;
        // After error, activeVote is not set, so button should not be disabled
        // (isLoading returns to false)
        expect(resonateBtn).not.toBeDisabled();
      });
    });
  });

  describe('not_for_me tooltip', () => {
    it('has tooltip explaining algorithmic signal only', () => {
      render(<PulseReactions {...defaultProps} />);

      const notForMeBtn = screen.getByText(/Not for me/).closest('button')!;
      expect(notForMeBtn.getAttribute('title')).toContain('algorithmic');
    });
  });
});
