/**
 * Hook for fetching online data
 */

import { useState, useEffect, useCallback } from 'react';
import { http } from '@/lib/api-client';
import { ensureArray } from '@/lib/api-utils';
import { createLogger } from '@/lib/logger';
import { useAdaptiveInterval } from '@/hooks/useAdaptiveInterval';
import type { OnlineUser, OnlineStats, ActivityBreakdown } from './types';

const logger = createLogger('WhosOnline');

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
 * Hook for managing online data.
 *
 * @param autoRefresh - The auto refresh.
 */
export function useOnlineData(autoRefresh: boolean) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [stats, setStats] = useState<OnlineStats | null>(null);
  const [activityBreakdown, setActivityBreakdown] = useState<ActivityBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchOnlineData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await http.get('/api/v1/presence/online');
      const data = response.data;

      // Online users
      const users = ensureArray<Record<string, unknown>>(data, 'users');
      setOnlineUsers(
        users.map((u) => ({
          id: str(u.id, ''),
          username: str(u.username, 'Guest'),
          displayName: strOrNull(u.display_name),
          avatarUrl: strOrNull(u.avatar_url),
          avatarBorderId: strOrNull(u.avatar_border_id) ?? strOrNull(u.avatarBorderId),
          userGroup: str(u.user_group, 'Member'),
          userGroupColor: strOrNull(u.user_group_color),
          currentLocation: str(u.current_location, 'Unknown'),
          currentLocationUrl: strOrNull(u.current_location_url),
          device:
            u.device === 'desktop' || u.device === 'mobile' || u.device === 'tablet'
              ? u.device
              : 'unknown',
          ipHash: typeof u.ip_hash === 'string' ? u.ip_hash : undefined,
          lastActivity: str(u.last_activity, new Date().toISOString()),
          invisible: bool(u.invisible, false),
        }))
      );

      // Stats
      setStats({
        totalOnline: data.stats?.total_online || 0,
        members: data.stats?.members || 0,
        guests: data.stats?.guests || 0,
        bots: data.stats?.bots || 0,
        invisible: data.stats?.invisible || 0,
        recordOnline: data.stats?.record_online || 0,
        recordDate: data.stats?.record_date || new Date().toISOString(),
      });

      // Activity breakdown
      const breakdown = ensureArray<Record<string, unknown>>(data, 'activity_breakdown');
      setActivityBreakdown(
        breakdown.map((b) => ({
          location: str(b.location, 'Unknown'),
          count: num(b.count, 0),
          percentage: num(b.percentage, 0),
        }))
      );

      setLastUpdated(new Date());
    } catch (err) {
      logger.error('[WhosOnline] Failed to fetch data:', err);
      setError('Failed to load online users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchOnlineData();
  }, [fetchOnlineData]);

  // Auto-refresh: 30s when active, 120s when tab hidden
  useAdaptiveInterval(fetchOnlineData, 30000, { enabled: autoRefresh });

  return {
    onlineUsers,
    stats,
    activityBreakdown,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchOnlineData,
  };
}
