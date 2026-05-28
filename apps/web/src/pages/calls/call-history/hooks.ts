/**
 * Call history data fetching hooks.
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/lib/api-client';
import { useAuthStore } from '@/modules/auth/store';
import type { CallRecord, CallFilter, CallSection } from './types';

/**
 * Formats seconds to human-readable duration.
 */
export function formatDuration(seconds: number): string {
  if (seconds === 0) return 'No answer';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    return `${hours}h ${remaining}m`;
  }
  return `${mins}m ${secs}s`;
}

/**
 * Formats a timestamp to relative time.
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) {
    const mins = Math.floor(diff / (1000 * 60));
    return `${mins}m ago`;
  }
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDateSection(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const callDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (callDate.getTime() === today.getTime()) return 'Today';
  if (callDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

interface ApiCallRecord {
  id: string;
  type: string;
  state: string;
  creator_id: string;
  group_id?: string | null;
  participant_ids?: string[] | null;
  started_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number | null;
  end_reason?: string | null;
  missed_seen?: boolean | null;
  inserted_at: string;
}

interface CallHistoryResponse {
  data?: ApiCallRecord[];
}

function getRecipientId(call: ApiCallRecord, currentUserId?: string | null): string {
  const participants = call.participant_ids ?? [];
  const otherParticipant = participants.find((participantId) => participantId !== currentUserId);

  if (otherParticipant) return otherParticipant;
  if (call.creator_id !== currentUserId) return call.creator_id;
  return call.group_id ?? call.creator_id;
}

function getRecipientName(call: ApiCallRecord): string {
  return call.group_id || call.type.startsWith('group_') ? 'Group call' : 'Call participant';
}

/**
 * Converts backend call records into call-history list rows.
 */
export function normalizeCallHistory(
  calls: ApiCallRecord[],
  currentUserId?: string | null
): CallRecord[] {
  return calls.map((call) => {
    const recipientId = getRecipientId(call, currentUserId);
    const wasMissed = call.end_reason === 'missed' || call.state === 'missed';
    const direction =
      wasMissed
        ? 'missed'
        : call.creator_id === currentUserId
          ? 'outgoing'
          : 'incoming';

    return {
      id: call.id,
      recipientId,
      recipientName: getRecipientName(call),
      type: call.type.includes('video') ? 'video' : 'audio',
      direction,
      duration: call.duration_seconds ?? 0,
      timestamp: call.started_at ?? call.ended_at ?? call.inserted_at,
    };
  });
}

/**
 * Hook for managing call history.
 */
export function useCallHistory() {
  const [filter, setFilter] = useState<CallFilter>('all');
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);

  const {
    data: calls = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['call-history', currentUserId],
    queryFn: async () => {
      const res = await http.get<CallHistoryResponse>('/api/v1/calls');
      return normalizeCallHistory(res.data.data ?? [], currentUserId);
    },
    retry: 1,
    staleTime: 30_000,
  });

  const filteredCalls = useMemo(() => {
    let result = calls;
    if (filter === 'missed') {
      result = result.filter((c) => c.direction === 'missed');
    }
    return result;
  }, [calls, filter]);

  const sections = useMemo<CallSection[]>(() => {
    const groups: Record<string, CallRecord[]> = {};
    for (const call of filteredCalls) {
      const section = getDateSection(call.timestamp);
      if (!groups[section]) groups[section] = [];
      groups[section].push(call);
    }
    return Object.entries(groups).map(([title, sectionCalls]) => ({
      title,
      calls: sectionCalls,
    }));
  }, [filteredCalls]);

  return {
    sections,
    filter,
    setFilter,
    isLoading,
    error,
    refetch,
    isEmpty: filteredCalls.length === 0,
  };
}
