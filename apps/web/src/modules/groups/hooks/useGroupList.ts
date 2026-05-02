import { useEffect } from 'react';
import { useGroupStore } from '../store';
/** Use Groups. */
export function useGroups() {
  const { groups, isLoadingGroups, fetchGroups, createGroup, joinGroup, leaveGroup } =
    useGroupStore();

  // Fetch groups on mount
  useEffect(() => {
    if (groups.length === 0) {
      fetchGroups();
    }
  }, [groups.length, fetchGroups]);

  const myGroups = groups.filter((g) => g.myMember !== null);
  const publicGroups = groups.filter((g) => g.isPublic);

  const join = async (inviteCode: string) => {
    await joinGroup(inviteCode);
  };

  const leave = async (groupId: string) => {
    await leaveGroup(groupId);
  };

  const create = async (name: string, description?: string, isPublic?: boolean) => {
    return await createGroup({ name, description, isPublic });
  };

  return {
    groups,
    myGroups,
    publicGroups,
    isLoading: isLoadingGroups,
    refresh: fetchGroups,
    join,
    leave,
    create,
  };
}
