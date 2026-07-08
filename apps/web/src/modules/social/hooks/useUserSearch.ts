/**
 * Hook for user search with debounced Meilisearch integration.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import debounce from 'lodash.debounce';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import {
  formatRateLimitWait,
  getMaxRateLimitRemainingMs,
  rememberRateLimit,
  USER_API_RATE_LIMIT_SCOPE,
} from '@/lib/api-rate-limit';
import { normalizeFriendshipStatus } from '@/modules/social/friendship-status';
import type { FriendshipStatus } from '@/modules/social/types';

const logger = createLogger('useUserSearch');
const USER_SEARCH_RATE_LIMIT_SCOPES = [USER_API_RATE_LIMIT_SCOPE] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export interface UserSearchResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
  friendship_status?: FriendshipStatus;
  is_friend?: boolean;
  is_blocked?: boolean;
  friend_request_sent?: boolean;
  friend_request_received?: boolean;
}

export interface UseUserSearchReturn {
  results: UserSearchResult[];
  isLoading: boolean;
  error: string | null;
}

function getUsersFromResponse(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (typeof data !== 'object' || data === null) return [];

  if ('users' in data && Array.isArray(data.users)) return data.users;
  if ('data' in data && Array.isArray(data.data)) return data.data;
  if (
    'data' in data &&
    typeof data.data === 'object' &&
    data.data !== null &&
    'users' in data.data &&
    Array.isArray(data.data.users)
  ) {
    return data.data.users;
  }

  return [];
}

function toUserSearchResult(value: unknown): UserSearchResult | null {
  if (!isRecord(value)) return null;
  const record = value;
  const id = record.id;
  const username = record.username;
  if (typeof id !== 'string' || typeof username !== 'string') return null;

  const result: UserSearchResult = {
    id,
    username,
    display_name: typeof record.display_name === 'string' ? record.display_name : null,
    avatar_url: typeof record.avatar_url === 'string' ? record.avatar_url : null,
    status: typeof record.status === 'string' ? record.status : 'offline',
  };
  const friendshipStatus = normalizeFriendshipStatus(record.friendship_status);
  if (friendshipStatus) result.friendship_status = friendshipStatus;
  if (typeof record.is_friend === 'boolean') result.is_friend = record.is_friend;
  if (typeof record.is_blocked === 'boolean') result.is_blocked = record.is_blocked;
  if (typeof record.friend_request_sent === 'boolean') {
    result.friend_request_sent = record.friend_request_sent;
  }
  if (typeof record.friend_request_received === 'boolean') {
    result.friend_request_received = record.friend_request_received;
  }

  return result;
}

function getUserSearchCooldownMessage(): string | null {
  const remaining = getMaxRateLimitRemainingMs(USER_SEARCH_RATE_LIMIT_SCOPES);
  return remaining > 0 ? formatRateLimitWait(remaining) : null;
}

/**
 * Debounced user search hook.
 *
 * Calls `GET /api/v1/search/users` when query length >= 2,
 * debounced by 300ms.
 *
 * @param query - The search query string.
 * @returns Search results, loading state, and error.
 */
export function useUserSearch(query: string): UseUserSearchReturn {
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to the latest query to avoid stale closure issues
  const latestQuery = useRef(query);
  latestQuery.current = query;

  // Use useMemo to create a stable debounced function
  const performSearch = useMemo(
    () =>
      debounce(async (q: string) => {
        // Guard: only search if this is still the latest query
        if (q !== latestQuery.current) return;

        const cooldownMessage = getUserSearchCooldownMessage();
        if (cooldownMessage) {
          setResults([]);
          setError(cooldownMessage);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          const response = await http.get('/api/v1/search/users', { params: { q } });
          const users = getUsersFromResponse(response.data)
            .map(toUserSearchResult)
            .filter((user): user is UserSearchResult => user !== null);

          // Only update if query hasn't changed during the request
          if (q === latestQuery.current) {
            setResults(users);
          }
        } catch (err) {
          const rateLimitMessage = rememberRateLimit(USER_SEARCH_RATE_LIMIT_SCOPES, err);
          if (!rateLimitMessage) {
            logger.error('User search failed:', err);
          }
          if (q === latestQuery.current) {
            setError(rateLimitMessage ?? 'Failed to search users');
            setResults([]);
          }
        } finally {
          if (q === latestQuery.current) {
            setIsLoading(false);
          }
        }
      }, 300),
    []
  );

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const cooldownMessage = getUserSearchCooldownMessage();
    if (cooldownMessage) {
      setResults([]);
      setIsLoading(false);
      setError(cooldownMessage);
      return;
    }

    setIsLoading(true);
    performSearch(query);
  }, [query, performSearch]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      performSearch.cancel();
    };
  }, [performSearch]);

  return { results, isLoading, error };
}
