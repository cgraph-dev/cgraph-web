/**
 * useFeed — TanStack infinite query for Discovery feed
 *
 * Fetches from GET /api/v1/feed?mode=X&cursor=Y with cursor pagination.
 *
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { http } from '@/lib/api-client';
import type { FeedMode } from '../store/discoveryStore';

export interface FeedThread {
  id: string;
  title: string;
  slug: string;
  content_preview: string | null;
  thread_type: string;
  is_locked: boolean;
  is_pinned: boolean;
  is_content_gated: boolean;
  gate_price_nodes: number | null;
  view_count: number;
  reply_count: number;
  score: number;
  hot_score: number;
  weighted_resonates: number;
  author: { id: string; username: string } | null;
  board: { id: string; name: string; slug?: string } | null;
  created_at: string;
  updated_at: string;
}

interface FeedResponse {
  data: FeedThread[];
  page_info?: {
    has_next_page: boolean;
    end_cursor: string | null;
  };
  meta?: {
    has_more?: boolean;
    cursor?: string | null;
  };
}

interface NormalizedFeedResponse {
  data: FeedThread[];
  page_info: {
    has_next_page: boolean;
    end_cursor: string | null;
  };
}

function normalizeFeedResponse(response: FeedResponse): NormalizedFeedResponse {
  return {
    data: response.data,
    page_info: response.page_info ?? {
      has_next_page: response.meta?.has_more ?? false,
      end_cursor: response.meta?.cursor ?? null,
    },
  };
}

/** Description. */
/** Hook for feed. */
export function useFeed(mode: FeedMode, communityId?: string | null) {
  return useInfiniteQuery<NormalizedFeedResponse>({
    queryKey: ['feed', mode, communityId ?? null],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ mode });

      if (pageParam) params.set('cursor', String(pageParam));
      if (communityId) params.set('community_id', communityId);

      const res = await http.get<FeedResponse>(`/api/v1/feed?${params.toString()}`);
      return normalizeFeedResponse(res.data);
    },
    initialPageParam: null satisfies string | null,
    getNextPageParam: (lastPage) =>
      lastPage.page_info.has_next_page ? lastPage.page_info.end_cursor : undefined,
    staleTime: 60_000,
    retry: 1,
  });
}
