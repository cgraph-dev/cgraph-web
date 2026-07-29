import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http } from '@/lib/api-client';
import { CommunityDiscoveryTab } from '../community-discovery-tab';

vi.mock('@/lib/api-client', () => ({
  http: {
    get: vi.fn(),
  },
}));

vi.mock('@/lib/error-tracking', () => ({
  captureError: vi.fn(),
}));

const getMock = vi.mocked(http.get);
let intersectionCallback: IntersectionObserverCallback | null = null;

class IntersectionObserverMock {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [0];

  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = callback;
  }

  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn(() => []);
  unobserve = vi.fn();
}

function community(
  id: string,
  type: 'group' | 'forum',
  overrides: Record<string, unknown> = {}
) {
  return {
    id,
    type,
    name: `${type} ${id}`,
    description: null,
    member_count: 1,
    avatar_url: null,
    category: 'technology',
    default_channel_id: type === 'group' ? `channel-${id}` : null,
    created_at: '2026-07-29T00:00:00Z',
    is_verified: false,
    ...overrides,
  };
}

function response(
  communities: unknown[],
  pageInfo: { has_next_page: boolean; end_cursor: string | null }
) {
  return {
    data: {
      data: {
        communities,
        categories: ['technology', 'science'],
        page_info: pageInfo,
      },
    },
  };
}

beforeEach(() => {
  getMock.mockReset();
  intersectionCallback = null;
  window.IntersectionObserver =
    IntersectionObserverMock as unknown as typeof IntersectionObserver;
});

describe('CommunityDiscoveryTab', () => {
  it('uses the backend cursor, filters groups, and deduplicates later pages', async () => {
    getMock
      .mockResolvedValueOnce(
        response(
          [community('one', 'group'), community('forum-one', 'forum')],
          { has_next_page: true, end_cursor: 'cursor-two' }
        )
      )
      .mockResolvedValueOnce(
        response(
          [
            community('one', 'group', { member_count: 2 }),
            community('two', 'group'),
          ],
          { has_next_page: false, end_cursor: null }
        )
      );

    render(
      <MemoryRouter>
        <CommunityDiscoveryTab type="group" />
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: 'View group one group' })).toHaveAttribute(
      'href',
      '/groups/one/channels/channel-one'
    );
    expect(screen.queryByText('forum forum-one')).not.toBeInTheDocument();

    expect(getMock).toHaveBeenNthCalledWith(
      1,
      '/api/v1/explore',
      expect.objectContaining({
        params: {
          type: 'group',
          category: undefined,
          sort: 'popular',
          q: undefined,
          limit: 20,
          cursor: undefined,
        },
        signal: expect.any(AbortSignal),
      })
    );
    expect(getMock.mock.calls[0]?.[1]?.params).not.toHaveProperty('offset');

    await waitFor(() => expect(intersectionCallback).not.toBeNull());
    act(() => {
      intersectionCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(await screen.findByRole('link', { name: 'View group two group' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'View group one group' })).toHaveLength(1);
    expect(screen.getByText('2 members')).toBeInTheDocument();
    expect(getMock.mock.calls[1]?.[1]?.params).toMatchObject({ cursor: 'cursor-two' });
    expect(getMock.mock.calls[1]?.[1]?.params).not.toHaveProperty('offset');
  });

  it('shows a visible retry action when discovery fails', async () => {
    getMock
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce(
        response([community('recovered', 'forum')], {
          has_next_page: false,
          end_cursor: null,
        })
      );

    render(
      <MemoryRouter>
        <CommunityDiscoveryTab />
      </MemoryRouter>
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Discovery is unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('link', { name: 'View forum recovered forum' })
    ).toHaveAttribute('href', '/forums/recovered');
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it('aborts an obsolete request when a debounced search starts', async () => {
    vi.useFakeTimers();
    let resolveInitial: ((value: ReturnType<typeof response>) => void) | undefined;

    getMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveInitial = resolve;
          })
      )
      .mockResolvedValueOnce(
        response([community('search', 'forum')], {
          has_next_page: false,
          end_cursor: null,
        })
      );

    render(
      <MemoryRouter>
        <CommunityDiscoveryTab />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Search communities' }), {
      target: { value: 'search' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(getMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(getMock.mock.calls[1]?.[1]?.params).toMatchObject({ q: 'search' });

    resolveInitial?.(
      response([community('obsolete', 'forum')], {
        has_next_page: false,
        end_cursor: null,
      })
    );
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByText('forum obsolete')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
