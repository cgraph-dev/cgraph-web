/**
 * PremiumPostCard Component Tests
 *
 * Tests for the premium post card component.
 * Covers: preview/full content display, unlock flow, price badge,
 * purchase count, author view, and error handling.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { PremiumPost } from '@/modules/groups/types/premium-post';

// --- Mocks ---

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      onClick,
      className,
      ...rest
    }: Record<string, unknown> & {
      children?: React.ReactNode;
      onClick?: (e: unknown) => void;
      className?: string;
    }) => (
      <div onClick={onClick} className={className} {...rest}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@heroicons/react/24/outline', () => ({
  CurrencyDollarIcon: (props: Record<string, unknown>) => (
    <svg data-testid="CurrencyDollarIcon" {...props} />
  ),
  LockClosedIcon: (props: Record<string, unknown>) => (
    <svg data-testid="LockClosedIcon" {...props} />
  ),
  LockOpenIcon: (props: Record<string, unknown>) => <svg data-testid="LockOpenIcon" {...props} />,
  UserCircleIcon: (props: Record<string, unknown>) => (
    <svg data-testid="UserCircleIcon" {...props} />
  ),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
  }),
}));

const mockPurchasePremiumPost = vi.fn();
vi.mock('@/modules/groups/services/premium-post-api', () => ({
  purchasePremiumPost: (...args: unknown[]) => mockPurchasePremiumPost(...args),
}));

import { PremiumPostCard } from '../premium-post-card';

// --- Helpers ---

function createMockPost(overrides: Partial<PremiumPost> = {}): PremiumPost {
  return {
    id: 'pp-1',
    groupId: 'g-1',
    title: 'Exclusive Tutorial',
    content:
      'This is the full content of the premium post. It contains detailed information that only paying members can see. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    mediaUrls: [],
    priceNodes: 50,
    previewLength: 40,
    purchaseCount: 12,
    purchased: false,
    isAuthor: false,
    author: {
      id: 'u-1',
      username: 'creator',
      displayName: 'The Creator',
      avatarUrl: null,
    },
    insertedAt: '2026-03-15T10:00:00Z',
    ...overrides,
  };
}

// --- Tests ---

describe('PremiumPostCard', () => {
  const onPurchaseSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPurchasePremiumPost.mockResolvedValue(createMockPost({ purchased: true }));
  });

  it('renders the post title', () => {
    render(<PremiumPostCard post={createMockPost()} onPurchaseSuccess={onPurchaseSuccess} />);
    expect(screen.getByText('Exclusive Tutorial')).toBeInTheDocument();
  });

  it('renders the author display name', () => {
    render(<PremiumPostCard post={createMockPost()} onPurchaseSuccess={onPurchaseSuccess} />);
    expect(screen.getByText('The Creator')).toBeInTheDocument();
  });

  it('renders the author username when no display name', () => {
    const post = createMockPost({
      author: { id: 'u-1', username: 'creator', displayName: null, avatarUrl: null },
    });
    render(<PremiumPostCard post={post} onPurchaseSuccess={onPurchaseSuccess} />);
    expect(screen.getByText('creator')).toBeInTheDocument();
  });

  it('displays the price badge correctly', () => {
    render(<PremiumPostCard post={createMockPost()} onPurchaseSuccess={onPurchaseSuccess} />);
    expect(screen.getByText('50 Nodes')).toBeInTheDocument();
  });

  it('displays the purchase count', () => {
    render(<PremiumPostCard post={createMockPost()} onPurchaseSuccess={onPurchaseSuccess} />);
    expect(screen.getByText('12 unlocks')).toBeInTheDocument();
  });

  it('displays singular "unlock" for purchase count of 1', () => {
    const post = createMockPost({ purchaseCount: 1 });
    render(<PremiumPostCard post={post} onPurchaseSuccess={onPurchaseSuccess} />);
    expect(screen.getByText('1 unlock')).toBeInTheDocument();
  });

  it('shows truncated preview content for non-purchased posts', () => {
    const post = createMockPost();
    render(<PremiumPostCard post={post} onPurchaseSuccess={onPurchaseSuccess} />);
    // Content should be truncated at previewLength (40 chars) + "..."
    const truncated = post.content.slice(0, 40) + '...';
    expect(screen.getByText(truncated)).toBeInTheDocument();
  });

  it('shows full content for purchased posts', () => {
    const post = createMockPost({ purchased: true });
    render(<PremiumPostCard post={post} onPurchaseSuccess={onPurchaseSuccess} />);
    expect(screen.getByText(post.content)).toBeInTheDocument();
  });

  it('shows full content for author own posts', () => {
    const post = createMockPost({ isAuthor: true });
    render(<PremiumPostCard post={post} onPurchaseSuccess={onPurchaseSuccess} />);
    expect(screen.getByText(post.content)).toBeInTheDocument();
  });

  it('shows "Your post" label for author', () => {
    const post = createMockPost({ isAuthor: true });
    render(<PremiumPostCard post={post} onPurchaseSuccess={onPurchaseSuccess} />);
    expect(screen.getByText('Your post')).toBeInTheDocument();
  });

  it('shows "Unlocked" label for purchased posts', () => {
    const post = createMockPost({ purchased: true });
    render(<PremiumPostCard post={post} onPurchaseSuccess={onPurchaseSuccess} />);
    expect(screen.getByText('Unlocked')).toBeInTheDocument();
  });

  it('shows unlock button with price for non-purchased posts', () => {
    render(<PremiumPostCard post={createMockPost()} onPurchaseSuccess={onPurchaseSuccess} />);
    expect(screen.getByText('Unlock for 50 Nodes')).toBeInTheDocument();
  });

  it('does not show unlock button for purchased posts', () => {
    const post = createMockPost({ purchased: true });
    render(<PremiumPostCard post={post} onPurchaseSuccess={onPurchaseSuccess} />);
    expect(screen.queryByText(/Unlock for/)).not.toBeInTheDocument();
  });

  it('calls purchasePremiumPost API when unlock is clicked', async () => {
    render(<PremiumPostCard post={createMockPost()} onPurchaseSuccess={onPurchaseSuccess} />);
    fireEvent.click(screen.getByText('Unlock for 50 Nodes'));

    await waitFor(() => {
      expect(mockPurchasePremiumPost).toHaveBeenCalledWith('pp-1');
    });
  });

  it('calls onPurchaseSuccess after successful purchase', async () => {
    const updatedPost = createMockPost({ purchased: true });
    mockPurchasePremiumPost.mockResolvedValue(updatedPost);

    render(<PremiumPostCard post={createMockPost()} onPurchaseSuccess={onPurchaseSuccess} />);
    fireEvent.click(screen.getByText('Unlock for 50 Nodes'));

    await waitFor(() => {
      expect(onPurchaseSuccess).toHaveBeenCalledWith(updatedPost);
    });
  });

  it('shows loading state during purchase', async () => {
    const updatedPost = createMockPost({ purchased: true });
    let resolvePurchase: (post: PremiumPost) => void = () => {};
    mockPurchasePremiumPost.mockImplementation(
      () =>
        new Promise<PremiumPost>((resolve) => {
          resolvePurchase = resolve;
        })
    );
    render(<PremiumPostCard post={createMockPost()} onPurchaseSuccess={onPurchaseSuccess} />);
    fireEvent.click(screen.getByText('Unlock for 50 Nodes'));

    expect(screen.getByText('Unlocking...')).toBeInTheDocument();

    resolvePurchase(updatedPost);

    await waitFor(() => {
      expect(onPurchaseSuccess).toHaveBeenCalledWith(updatedPost);
    });
  });

  it('shows insufficient nodes error', async () => {
    mockPurchasePremiumPost.mockRejectedValue(new Error('insufficient balance'));
    render(<PremiumPostCard post={createMockPost()} onPurchaseSuccess={onPurchaseSuccess} />);
    fireEvent.click(screen.getByText('Unlock for 50 Nodes'));

    await waitFor(() => {
      expect(screen.getByText(/Insufficient Nodes/)).toBeInTheDocument();
    });
    expect(onPurchaseSuccess).not.toHaveBeenCalled();
  });

  it('shows generic error for other failures', async () => {
    mockPurchasePremiumPost.mockRejectedValue(new Error('Server error'));
    render(<PremiumPostCard post={createMockPost()} onPurchaseSuccess={onPurchaseSuccess} />);
    fireEvent.click(screen.getByText('Unlock for 50 Nodes'));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('renders author avatar when provided', () => {
    const post = createMockPost({
      author: {
        id: 'u-1',
        username: 'creator',
        displayName: 'The Creator',
        avatarUrl: 'https://example.com/avatar.png',
      },
    });
    render(<PremiumPostCard post={post} onPurchaseSuccess={onPurchaseSuccess} />);
    const img = screen.getByAltText('The Creator');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png');
  });
});
