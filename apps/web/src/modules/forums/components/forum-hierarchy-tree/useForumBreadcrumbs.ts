/**
 * useForumBreadcrumbs hook
 */

import { useState, useEffect } from 'react';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import type { Breadcrumb } from './types';

const logger = createLogger('ForumHierarchyTree');

/**
 */
/**
 * Hook for managing forum breadcrumbs.
 *
 * @param forumId - The forum id.
 */
export function useForumBreadcrumbs(forumId: string | undefined) {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!forumId) {
      setBreadcrumbs([]);
      return;
    }

    const fetchBreadcrumbs = async () => {
      try {
        setLoading(true);
        const response = await http.get(`/api/v1/forums/${forumId}/breadcrumbs`);
        setBreadcrumbs(response.data?.data || []);
      } catch (err) {
        logger.error('Failed to fetch breadcrumbs:', err);
        setBreadcrumbs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBreadcrumbs();
  }, [forumId]);

  return { breadcrumbs, loading };
}
