import { useEffect } from 'react';
import { useGroupStore } from '../store';
import type { Member } from '../store';
/** Use Group Members. */
export function useGroupMembers(groupId?: string) {
  const { members, fetchMembers } = useGroupStore();

  const groupMembers = groupId ? (members[groupId] ?? []) : [];

  // Fetch members on mount
  useEffect(() => {
    if (groupId && !members[groupId]) {
      fetchMembers(groupId);
    }
  }, [groupId, members, fetchMembers]);

  const onlineMembers = groupMembers.filter((m) => m.user.status !== 'offline');

  const offlineMembers = groupMembers.filter((m) => m.user.status === 'offline');

  const membersByRole = (() => {
    const map: Record<string, Member[]> = {};
    groupMembers.forEach((member) => {
      const topRole = member.roles[0];
      const roleKey = topRole?.id ?? 'default';
      if (!map[roleKey]) {
        map[roleKey] = [];
      }
      map[roleKey].push(member);
    });
    return map;
  })();

  const refresh = async () => {
    if (groupId) {
      await fetchMembers(groupId);
    }
  };

  return {
    members: groupMembers,
    onlineMembers,
    offlineMembers,
    membersByRole,
    count: groupMembers.length,
    onlineCount: onlineMembers.length,
    refresh,
  };
}
