/**
 * useConversationMedia — Fetches shared media for a conversation.
 *
 * Calls GET /api/v1/conversations/:id/media with type filter and
 * cursor pagination. Used by ChatInfoPanel to populate SharedMediaGrid.
 *
 */

import { useState, useRef } from 'react';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useConversationMedia');

type MediaType = 'images' | 'videos' | 'files' | 'voice' | 'all';

interface MediaMessage {
  readonly id: string;
  readonly content: string;
  readonly content_type: string;
  readonly sender_id: string;
  readonly sender: {
    readonly id: string;
    readonly username: string;
    readonly display_name: string | null;
    readonly avatar_url: string | null;
  } | null;
  readonly conversation_id: string;
  readonly file_url: string | null;
  readonly file_name: string | null;
  readonly file_size: number | null;
  readonly file_mime_type: string | null;
  readonly thumbnail_url: string | null;
  readonly link_preview: Record<string, unknown> | null;
  readonly inserted_at: string;
}

interface MediaResponse {
  readonly data: {
    readonly media: MediaMessage[];
    readonly meta: {
      readonly has_next_page?: boolean;
      readonly end_cursor?: string;
    };
  };
}
/**
 *
 * Description.
 */
export function useConversationMedia(conversationId: string | undefined) {
  const [media, setMedia] = useState<MediaMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | undefined>(undefined);
  const abortRef = useRef<AbortController | null>(null);

  async function fetchMedia(type: MediaType = 'all', append = false): Promise<void> {
    if (!conversationId) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);

    try {
      const params: Record<string, string> = {
        type,
        limit: '30',
      };

      if (append && cursorRef.current) {
        params.cursor = cursorRef.current;
      }

      const response = await http.get<MediaResponse>(
        `/api/v1/conversations/${conversationId}/media`,
        { params, signal: abortRef.current.signal }
      );

      const items = response.data?.data?.media ?? [];
      const meta = response.data?.data?.meta;

      if (append) {
        setMedia((prev) => [...prev, ...items]);
      } else {
        setMedia(items);
      }

      setHasMore(meta?.has_next_page ?? false);
      cursorRef.current = meta?.end_cursor;
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        logger.error('Failed to fetch conversation media', err);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function fetchMore(type: MediaType = 'all'): void {
    if (hasMore && !isLoading) {
      fetchMedia(type, true);
    }
  }

  function reset(): void {
    setMedia([]);
    setHasMore(false);
    cursorRef.current = undefined;
    abortRef.current?.abort();
  }

  return { media, isLoading, hasMore, fetchMedia, fetchMore, reset };
}
