/**
 * useMemberList hook - state and logic for member list
 */

import { useState, useEffect, useCallback } from 'react';
import { http } from '@/lib/api-client';
import { ensureArray, isRecord } from '@/lib/api-utils';
import { createLogger } from '@/lib/logger';
import type { Member, UserGroup, SortField, SortOrder } from './types';

const logger = createLogger('MemberList');
const PER_PAGE = 25;

/** Safely extract a string from an unknown record field */
function str(val: unknown, fallback: string): string {
  return typeof val === 'string' ? val : fallback;
}

/** Safely extract a string | null from an unknown record field */
function strOrNull(val: unknown): string | null {
  return typeof val === 'string' ? val : null;
}

/** Safely extract a number from an unknown record field */
function num(val: unknown, fallback: number): number {
  return typeof val === 'number' ? val : fallback;
}

/** Safely extract a boolean from an unknown record field */
function bool(val: unknown, fallback: boolean): boolean {
  return typeof val === 'boolean' ? val : fallback;
}

/**
 */
/**
 * Hook for managing member list.
 */
export function useMemberList() {
  // State
  const [members, setMembers] = useState<Member[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [totalMembers, setTotalMembers] = useState(0);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [filterJoinedAfter, setFilterJoinedAfter] = useState('');
  const [filterJoinedBefore, setFilterJoinedBefore] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('username');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCursor(null);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch user groups for filter dropdown
  useEffect(() => {
    const fetchUserGroups = async () => {
      try {
        const response = await http.get('/api/v1/user-groups');
        const groups = ensureArray<Record<string, unknown>>(response.data, 'groups');
        setUserGroups(
          groups.map((g) => ({
            id: str(g.id, ''),
            name: str(g.name, 'Unknown'),
            color: strOrNull(g.color),
            memberCount: num(g.member_count, 0),
          }))
        );
      } catch (err) {
        logger.error('[MemberList] Failed to fetch user groups:', err);
      }
    };
    fetchUserGroups();
  }, []);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        limit: PER_PAGE,
        sort_by: sortField,
        sort_order: sortOrder,
      };

      if (cursor) params.cursor = cursor;
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterGroup) params.group_id = filterGroup;
      if (filterOnlineOnly) params.online_only = true;
      if (filterJoinedAfter) params.joined_after = filterJoinedAfter;
      if (filterJoinedBefore) params.joined_before = filterJoinedBefore;

      const response = await http.get('/api/v1/members', { params });
      const data = response.data;
      const memberList = ensureArray<Record<string, unknown>>(data, 'members');
      setMembers(
        memberList.map((m) => ({
          id: str(m.id, ''),
          username: str(m.username, 'Unknown'),
          displayName: strOrNull(m.display_name),
          avatarUrl: strOrNull(m.avatar_url),
          avatarBorderId: strOrNull(m.avatar_border_id) ?? strOrNull(m.avatarBorderId),
          userGroup: str(m.user_group, 'Member'),
          userGroupId: str(m.user_group_id, ''),
          userGroupColor: strOrNull(m.user_group_color),
          isOnline: bool(m.is_online, false),
          lastActive: strOrNull(m.last_active),
          joinedAt: str(m.joined_at, new Date().toISOString()),
          postCount: num(m.post_count, 0),
          threadCount: num(m.thread_count, 0),
          reputation: num(m.reputation, 0),
          stars: num(m.stars, 0),
        }))
      );

      const pi = isRecord(data) && isRecord(data.page_info) ? data.page_info : {};
      setHasNextPage(typeof pi.has_next_page === 'boolean' ? pi.has_next_page : false);
      setTotalMembers(typeof pi.total_count === 'number' ? pi.total_count : memberList.length);
    } catch (err) {
      logger.error('[MemberList] Failed to fetch members:', err);
      setError('Failed to load member list. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [
    cursor,
    debouncedSearch,
    filterGroup,
    filterOnlineOnly,
    filterJoinedAfter,
    filterJoinedBefore,
    sortField,
    sortOrder,
  ]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Handle sort
  function handleSort(field: SortField) {
    setSortField((currentField) => {
      if (currentField === field) {
        setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'));
        return currentField;
      }
      setSortOrder('asc');
      return field;
    });
    setCursor(null);
  }

  // Clear filters
  function clearFilters() {
    setSearchQuery('');
    setFilterGroup('');
    setFilterOnlineOnly(false);
    setFilterJoinedAfter('');
    setFilterJoinedBefore('');
    setCursor(null);
  }

  const hasActiveFilters = !!(
    filterGroup ||
    filterOnlineOnly ||
    filterJoinedAfter ||
    filterJoinedBefore ||
    searchQuery
  );

  return {
    // Data
    members,
    userGroups,
    isLoading,
    error,
    // Pagination
    cursor,
    setCursor,
    hasNextPage,
    totalMembers,
    // Search and filters
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    filterGroup,
    setFilterGroup,
    filterOnlineOnly,
    setFilterOnlineOnly,
    filterJoinedAfter,
    setFilterJoinedAfter,
    filterJoinedBefore,
    setFilterJoinedBefore,
    hasActiveFilters,
    clearFilters,
    // Sorting
    sortField,
    sortOrder,
    handleSort,
    // Actions
    fetchMembers,
  };
}
