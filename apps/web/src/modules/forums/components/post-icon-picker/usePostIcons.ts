/**
 * Hook to fetch post icons for a forum or board
 */

import { useState, useEffect } from 'react';

import { http } from '@/lib/api-client';

import { getDefaultIcons } from './constants';
import type { PostIcon } from './types';
/**
 *
 * Description.
 */
export function usePostIcons(forumId?: string, boardId?: string) {
  const [icons, setIcons] = useState<PostIcon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchIcons = async () => {
      try {
        setLoading(true);
        let url = '/api/v1/post-icons';
        const params = new URLSearchParams();

        if (forumId) params.set('forum_id', forumId);
        if (boardId) params.set('board_id', boardId);

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const response = await http.get(url);
        const data = response.data;
        setIcons(data.icons || data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        // Fallback to emoji-based defaults
        setIcons(getDefaultIcons());
      } finally {
        setLoading(false);
      }
    };

    fetchIcons();
  }, [forumId, boardId]);

  return { icons, loading, error };
}
