import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const { mockUseUnlockContent, mockNavigate } = vi.hoisted(() => ({
  mockUseUnlockContent: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock('../../hooks/useNodes', () => ({
  useUnlockContent: mockUseUnlockContent,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({
    children,
    className,
  }: React.PropsWithChildren<{ variant?: string; className?: string }>) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { ContentUnlockOverlay } from '../content-unlock-overlay';
import toast from 'react-hot-toast';

const makeDefaultProps = (overrides?: Record<string, unknown>) => ({
  postId: 'thread-42',
  price: 200,
  ...overrides,
});

const makeMutateFn = () => {
  const mutate = vi.fn();
  mockUseUnlockContent.mockReturnValue({ mutate, isPending: false });
  return mutate;
};

describe('ContentUnlockOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    makeMutateFn();
  });
  it('renders the lock icon and title', () => {
    render(<ContentUnlockOverlay {...makeDefaultProps()} />);

    expect(screen.getByText('Content Gated')).toBeInTheDocument();
  });

  it('renders descriptive text about gated content', () => {
    render(<ContentUnlockOverlay {...makeDefaultProps()} />);

    expect(screen.getByText(/This thread's full content is gated/)).toBeInTheDocument();
  });

  it('renders unlock button with price', () => {
    render(<ContentUnlockOverlay {...makeDefaultProps({ price: 150 })} />);

    expect(screen.getByText('Unlock for 150 Nodes')).toBeInTheDocument();
  });

  it('wraps content in GlassCard', () => {
    render(<ContentUnlockOverlay {...makeDefaultProps()} />);

    expect(screen.getByTestId('glass-card')).toBeInTheDocument();
  });
  it('calls mutate with postId when unlock button is clicked', () => {
    const mutate = makeMutateFn();

    render(<ContentUnlockOverlay {...makeDefaultProps()} />);
    fireEvent.click(screen.getByText('Unlock for 200 Nodes'));

    expect(mutate).toHaveBeenCalledWith(
      'thread-42',
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('shows "Unlocking..." when mutation is pending', () => {
    mockUseUnlockContent.mockReturnValue({ mutate: vi.fn(), isPending: true });

    render(<ContentUnlockOverlay {...makeDefaultProps()} />);

    expect(screen.getByText('Unlocking\u2026')).toBeInTheDocument();
  });

  it('disables button when mutation is pending', () => {
    mockUseUnlockContent.mockReturnValue({ mutate: vi.fn(), isPending: true });

    render(<ContentUnlockOverlay {...makeDefaultProps()} />);

    expect(screen.getByText('Unlocking\u2026')).toBeDisabled();
  });
  it('shows success toast on successful unlock', () => {
    const mutate = vi.fn();
    mockUseUnlockContent.mockReturnValue({ mutate, isPending: false });

    render(<ContentUnlockOverlay {...makeDefaultProps()} />);
    fireEvent.click(screen.getByText('Unlock for 200 Nodes'));

    const { onSuccess } = mutate.mock.calls[0]![1]!;
    onSuccess();

    expect(toast.success).toHaveBeenCalledWith('Content unlocked!');
  });

  it('calls onUnlocked callback on success', () => {
    const mutate = vi.fn();
    mockUseUnlockContent.mockReturnValue({ mutate, isPending: false });
    const onUnlocked = vi.fn();

    render(<ContentUnlockOverlay {...makeDefaultProps({ onUnlocked })} />);
    fireEvent.click(screen.getByText('Unlock for 200 Nodes'));

    const { onSuccess } = mutate.mock.calls[0]![1]!;
    onSuccess();

    expect(onUnlocked).toHaveBeenCalled();
  });
  it('navigates to the canonical wallet shop on insufficient_balance error', () => {
    const mutate = vi.fn();
    mockUseUnlockContent.mockReturnValue({ mutate, isPending: false });

    render(<ContentUnlockOverlay {...makeDefaultProps()} />);
    fireEvent.click(screen.getByText('Unlock for 200 Nodes'));

    const { onError } = mutate.mock.calls[0]![1]!;
    onError({
      response: {
        data: {
          error: 'insufficient_balance',
        },
      },
    });

    expect(toast.error).toHaveBeenCalledWith('Not enough Nodes');
    expect(mockNavigate).toHaveBeenCalledWith('/me/wallet/shop');
  });

  it('shows generic error toast for non-balance errors', () => {
    const mutate = vi.fn();
    mockUseUnlockContent.mockReturnValue({ mutate, isPending: false });

    render(<ContentUnlockOverlay {...makeDefaultProps()} />);
    fireEvent.click(screen.getByText('Unlock for 200 Nodes'));

    const { onError } = mutate.mock.calls[0]![1]!;
    onError(new Error('Network error'));

    expect(toast.error).toHaveBeenCalledWith('Unlock failed. Please try again.');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows generic error for error objects without response shape', () => {
    const mutate = vi.fn();
    mockUseUnlockContent.mockReturnValue({ mutate, isPending: false });

    render(<ContentUnlockOverlay {...makeDefaultProps()} />);
    fireEvent.click(screen.getByText('Unlock for 200 Nodes'));

    const { onError } = mutate.mock.calls[0]![1]!;
    onError({ response: { data: { error: 'some_other_error' } } });

    expect(toast.error).toHaveBeenCalledWith('Unlock failed. Please try again.');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('treats already_unlocked as completed and calls onUnlocked', () => {
    const mutate = vi.fn();
    mockUseUnlockContent.mockReturnValue({ mutate, isPending: false });
    const onUnlocked = vi.fn();

    render(<ContentUnlockOverlay {...makeDefaultProps({ onUnlocked })} />);
    fireEvent.click(screen.getByText('Unlock for 200 Nodes'));

    const { onError } = mutate.mock.calls[0]![1]!;
    onError({
      response: {
        data: {
          error: {
            code: 'already_unlocked',
            message: 'Already unlocked',
          },
        },
      },
    });

    expect(toast.success).toHaveBeenCalledWith('Content already unlocked');
    expect(onUnlocked).toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows rate-limit copy for throttled unlock attempts', () => {
    const mutate = vi.fn();
    mockUseUnlockContent.mockReturnValue({ mutate, isPending: false });

    render(<ContentUnlockOverlay {...makeDefaultProps()} />);
    fireEvent.click(screen.getByText('Unlock for 200 Nodes'));

    const { onError } = mutate.mock.calls[0]![1]!;
    onError({
      response: {
        data: {
          error: {
            code: 'rate_limited',
            message: 'Too many attempts',
          },
        },
      },
    });

    expect(toast.error).toHaveBeenCalledWith(
      'Too many attempts. Please wait a moment and try again.'
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  it('does not crash when onUnlocked is undefined', () => {
    const mutate = vi.fn();
    mockUseUnlockContent.mockReturnValue({ mutate, isPending: false });

    render(<ContentUnlockOverlay postId="thread-1" price={100} />);
    fireEvent.click(screen.getByText('Unlock for 100 Nodes'));

    const { onSuccess } = mutate.mock.calls[0]![1]!;
    expect(() => onSuccess()).not.toThrow();
  });
});
