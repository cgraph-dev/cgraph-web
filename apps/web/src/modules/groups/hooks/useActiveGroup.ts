import { useGroupStore } from '../store';
/** Use Active Group. */
export function useActiveGroup() {
  const {
    groups,
    activeGroupId,
    activeChannelId,
    setActiveGroup,
    setActiveChannel,
    fetchGroup,
    updateGroup,
    deleteGroup,
    createInvite,
  } = useGroupStore();

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null;

  const activeChannel = activeGroup?.channels.find((c) => c.id === activeChannelId) ?? null;

  const selectGroup = (groupId: string | null) => {
    setActiveGroup(groupId);
    // Auto-select first text channel
    if (groupId) {
      const group = groups.find((g) => g.id === groupId);
      const firstTextChannel = group?.channels.find((c) => c.type === 'text');
      if (firstTextChannel) {
        setActiveChannel(firstTextChannel.id);
      }
    }
  };

  const selectChannel = (channelId: string | null) => {
    setActiveChannel(channelId);
  };

  const refresh = async () => {
    if (activeGroupId) {
      await fetchGroup(activeGroupId);
    }
  };

  const update = async (data: Parameters<typeof updateGroup>[1]) => {
    if (activeGroupId) {
      return await updateGroup(activeGroupId, data);
    }
    return null;
  };

  const remove = async () => {
    if (activeGroupId) {
      await deleteGroup(activeGroupId);
      setActiveGroup(null);
    }
  };

  const invite = async (options?: { maxUses?: number; expiresIn?: number }) => {
    if (activeGroupId) {
      return await createInvite(activeGroupId, options);
    }
    return null;
  };

  return {
    group: activeGroup,
    channel: activeChannel,
    groupId: activeGroupId,
    channelId: activeChannelId,
    selectGroup,
    selectChannel,
    refresh,
    update,
    remove,
    invite,
  };
}
