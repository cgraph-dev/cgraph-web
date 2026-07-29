import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FeedTab } from '../tabs/feed-tab';

const { feedState, refetch, setMode } = vi.hoisted(() => ({
  refetch: vi.fn(),
  setMode: vi.fn(),
  feedState: {
    data: undefined as
      | {
          pages: Array<{
            data: Array<{ id: string }>;
          }>;
        }
      | undefined,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isError: false,
    isFetchingNextPage: false,
    isLoading: false,
    refetch: vi.fn(),
  },
}));

vi.mock('@/modules/discovery', () => ({
  FeedModeTabs: () => <div>Feed modes</div>,
  useDiscoveryStore: () => ({
    activeMode: 'pulse',
    selectedCommunityId: null,
    setMode,
  }),
  useFeed: () => ({ ...feedState, refetch }),
}));

vi.mock('@/pages/feed/feed-post-card', () => ({
  FeedPostCard: ({ thread }: { thread: { id: string } }) => <article>{thread.id}</article>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  feedState.data = undefined;
  feedState.hasNextPage = false;
  feedState.isError = false;
  feedState.isFetchingNextPage = false;
  feedState.isLoading = false;
});

describe('FeedTab', () => {
  it('shows a visible retry action for feed failures', () => {
    feedState.isError = true;

    render(
      <MemoryRouter>
        <FeedTab />
      </MemoryRouter>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Feed is unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('uses the canonical empty state when a successful feed has no posts', () => {
    feedState.data = { pages: [{ data: [] }] };

    render(
      <MemoryRouter>
        <FeedTab />
      </MemoryRouter>
    );

    expect(screen.getByRole('status', { name: 'No posts found' })).toBeInTheDocument();
  });
});
