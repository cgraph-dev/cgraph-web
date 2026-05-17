/**
 * Group store action implementations.
 * Contains all zustand action creators for the group store.
 */
import type { StoreApi } from 'zustand';
import { apiClient, http } from '@/lib/api-client';
import { createIdempotencyKey } from '@cgraph/utils';
import { createLogger } from '@/lib/logger';
import { identityFieldsFromApi } from '@/lib/identity';
import { useAuthStore } from '@/modules/auth/store';
import { ensureArray, ensureObject } from '@/lib/api-utils';
import { asStringOrNull, asRecordOrEmpty, asRecordOrUndef, asEnum } from '@/lib/api-utils';
import { normalizeChannelMessage } from './channel-message-normalizer';
import type { Group, GroupState, Channel, ChannelMessage, Member } from './group-types';

const logger = createLogger('GroupActions');

const MAX_MEMBERS_PER_GROUP = 1000;
const MAX_DISCOVERABLE_GROUPS = 100;
const MAX_CHANNEL_MESSAGES = 200; // Per-channel cap (down from 500)
const MAX_TOTAL_MESSAGES = 2000; // Global cap across all channels

/**
 * Evict messages from the channel with the most messages (excluding the
 * active channel) when the global total exceeds MAX_TOTAL_MESSAGES.
 * Mutates channelMessages in place and returns it.
 */
function pruneGlobalMessages(
  channelMessages: Record<string, readonly ChannelMessage[]>,
  activeChannelId: string | null
): Record<string, readonly ChannelMessage[]> {
  let total = 0;
  for (const msgs of Object.values(channelMessages)) {
    total += msgs.length;
  }
  if (total <= MAX_TOTAL_MESSAGES) return channelMessages;

  // Find the inactive channel with the most messages
  let worstId: string | null = null;
  let worstCount = 0;
  for (const [id, msgs] of Object.entries(channelMessages)) {
    if (id !== activeChannelId && msgs.length > worstCount) {
      worstCount = msgs.length;
      worstId = id;
    }
  }

  if (!worstId) return channelMessages;

  const pruneTarget = Math.floor(MAX_CHANNEL_MESSAGES / 2);
  const worstMsgs = channelMessages[worstId] ?? [];
  return { ...channelMessages, [worstId]: worstMsgs.slice(-pruneTarget) };
}

/**
 * Normalize raw API group data (snake_case) to store Group type (camelCase).
 * The API returns snake_case fields; the store and components expect camelCase.
 */
function normalizeGroup(raw: Record<string, unknown>): Group {
  const owner = asRecordOrEmpty(raw.owner);
  const channels = ensureArray<Record<string, unknown>>(raw.channels);
  const roles = ensureArray<Record<string, unknown>>(raw.roles);
  const categories = ensureArray<Record<string, unknown>>(raw.categories);
  const myMemberRaw = asRecordOrUndef(raw.myMember ?? raw.my_member);

  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    slug: String(raw.slug ?? ''),
    description: asStringOrNull(raw.description),
    iconUrl: asStringOrNull(raw.icon_url ?? raw.iconUrl),
    bannerUrl: asStringOrNull(raw.banner_url ?? raw.bannerUrl),
    isPublic: raw.is_public === true || raw.isPublic === true || raw.visibility === 'public',
    memberCount: Number(raw.member_count ?? raw.memberCount ?? 0),
    onlineMemberCount: Number(raw.online_count ?? raw.onlineCount ?? raw.online_member_count ?? 0),
    ownerId: String(raw.owner_id ?? raw.ownerId ?? owner.id ?? ''),
    categories: categories.map((c) => ({
      id: String(c.id ?? ''),
      name: String(c.name ?? ''),
      position: Number(c.position ?? 0),
      channels: ensureArray<Record<string, unknown>>(c.channels).map(normalizeChannel),
    })),
    channels: channels.map(normalizeChannel),
    roles: roles.map((r) => ({
      id: String(r.id ?? ''),
      name: String(r.name ?? ''),
      color: String(r.color ?? ''),
      position: Number(r.position ?? 0),
      permissions: Number(r.permissions ?? 0),
      isDefault: r.is_default === true || r.isDefault === true,
      isMentionable:
        r.is_mentionable === true || r.mentionable === true || r.isMentionable === true,
    })),
    myMember: myMemberRaw ? normalizeGroupMember(myMemberRaw) : null,
    createdAt: String(raw.created_at ?? raw.createdAt ?? raw.inserted_at ?? ''),
    is_node_gated: raw.is_node_gated === true || raw.isNodeGated === true,
    gate_type: (() => {
      const v = raw.gate_type ?? raw.gateType;
      return v === 'weekly' || v === 'monthly' || v === 'forever' ? v : null;
    })(),
    gate_price_nodes: Number(raw.gate_price_nodes ?? raw.gatePriceNodes ?? 0) || null,
  };
}

function normalizeChannel(raw: Record<string, unknown>): Channel {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    type: asEnum(
      raw.type ?? raw.channel_type,
      ['text', 'voice', 'video', 'announcement', 'forum'],
      'text'
    ),
    topic: asStringOrNull(raw.topic),
    categoryId: asStringOrNull(raw.category_id ?? raw.categoryId),
    position: Number(raw.position ?? 0),
    isNsfw: raw.is_nsfw === true || raw.nsfw === true || raw.isNsfw === true,
    slowModeSeconds: Number(
      raw.slow_mode_seconds ?? raw.slowModeSeconds ?? raw.slowmode_seconds ?? 0
    ),
    unreadCount: Number(raw.unread_count ?? raw.unreadCount ?? 0),
    lastMessageAt: asStringOrNull(raw.last_message_at ?? raw.lastMessageAt),
  };
}

function normalizeGroupMember(raw: Record<string, unknown>): Member {
  const user = asRecordOrEmpty(raw.user);
  const identity = identityFieldsFromApi({
    ...raw,
    ...user,
    id: user.id ?? raw.user_id ?? raw.userId ?? '',
  });
  const memberRoles = ensureArray<Record<string, unknown>>(raw.roles);
  return {
    id: String(raw.id ?? ''),
    userId: String(raw.user_id ?? raw.userId ?? user.id ?? ''),
    nickname: asStringOrNull(raw.nickname),
    notifications: (() => {
      const v = raw.notifications;
      return v === 'all' || v === 'mentions' || v === 'none' ? v : undefined;
    })(),
    suppressEveryone: raw.suppress_everyone === true || raw.suppressEveryone === true || undefined,
    user: {
      id: identity.id,
      username: identity.username,
      displayName: identity.displayName,
      avatarUrl: identity.avatarUrl,
      status: identity.status,
      avatarBorderId: identity.avatarBorderId,
      equippedTitleId: identity.equippedTitleId,
      equippedBadgeIds: identity.equippedBadgeIds,
      equippedNameplateId: identity.equippedNameplateId,
      profileTheme: identity.profileTheme,
      chatTheme: identity.chatTheme,
      displayNameFont: identity.displayNameFont,
      displayNameEffect: identity.displayNameEffect,
      displayNameColor: identity.displayNameColor,
      displayNameSecondaryColor: identity.displayNameSecondaryColor,
    },
    roles: memberRoles.map((r) => ({
      id: String(r.id ?? ''),
      name: String(r.name ?? ''),
      color: String(r.color ?? ''),
      position: Number(r.position ?? 0),
      permissions: Number(r.permissions ?? 0),
      isDefault: r.is_default === true || r.isDefault === true,
      isMentionable:
        r.is_mentionable === true || r.mentionable === true || r.isMentionable === true,
    })),
    joinedAt: String(raw.joined_at ?? raw.joinedAt ?? ''),
  };
}

function groupHasChannel(
  group: Pick<Group, 'channels' | 'categories'>,
  channelId: string
): boolean {
  return (
    group.channels.some((channel) => channel.id === channelId) ||
    group.categories.some((category) =>
      category.channels.some((channel) => channel.id === channelId)
    )
  );
}

function getGroupIdForChannel(state: GroupState, channelId: string): string {
  const activeGroup = state.groups.find((group) => group.id === state.activeGroupId);
  if (activeGroup && groupHasChannel(activeGroup, channelId)) {
    return activeGroup.id;
  }

  const matchingGroup = state.groups.find((group) => groupHasChannel(group, channelId));
  if (matchingGroup) {
    return matchingGroup.id;
  }

  if (state.activeGroupId) {
    return state.activeGroupId;
  }

  throw new Error(`Cannot resolve group for channel ${channelId}`);
}

function channelMessagesPath(state: GroupState, channelId: string): string {
  const groupId = getGroupIdForChannel(state, channelId);
  return `/api/v1/groups/${groupId}/channels/${channelId}/messages`;
}

function normalizeGroups(rawList: unknown): Group[] {
  return ensureArray<Record<string, unknown>>(rawList).map(normalizeGroup);
}

type SetState = StoreApi<GroupState>['setState'];
type GetState = StoreApi<GroupState>['getState'];

/**
 */
/**
 * Creates a new group actions.
 *
 * @param set - The set.
 * @param get - The get.
 * @returns The newly created instance.
 */
export function createGroupActions(
  set: SetState,
  get: GetState
): Omit<
  GroupState,
  | 'groups'
  | 'activeGroupId'
  | 'activeChannelId'
  | 'channelMessages'
  | 'members'
  | 'isLoadingGroups'
  | 'isLoadingMessages'
  | 'hasMoreMessages'
  | 'typingUsers'
  | 'justJoinedGroupName'
  | 'clearJoinCelebration'
  | 'discoverableGroups'
  | 'isLoadingDiscover'
  | 'discoverSearch'
  | 'reset'
> {
  return {
    fetchGroups: async () => {
      set({ isLoadingGroups: true });
      try {
        const result = await apiClient.groups.list();
        if (!result.ok) {
          throw new Error(result.error.message);
        }
        set({
          groups: normalizeGroups(result.data),
          isLoadingGroups: false,
        });
      } catch (error) {
        set({ isLoadingGroups: false });
        throw error;
      }
    },

    fetchGroup: async (groupId: string) => {
      const result = await apiClient.groups.get(groupId);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      const raw = ensureObject<Record<string, unknown>>(result.data);
      if (!raw) return;
      const group = normalizeGroup(raw);
      set((state) => ({
        groups: state.groups.some((g) => g.id === groupId)
          ? state.groups.map((g) => (g.id === groupId ? group : g))
          : [...state.groups, group].slice(-200),
      }));
    },

    fetchChannelMessages: async (channelId: string, before?: string) => {
      set({ isLoadingMessages: true });
      try {
        const params = before ? { before, limit: 50 } : { limit: 50 };
        const response = await http.get(channelMessagesPath(get(), channelId), { params });
        const dataMessages = ensureArray<Record<string, unknown>>(response.data, 'data');
        const rawMessages =
          dataMessages.length > 0
            ? dataMessages
            : ensureArray<Record<string, unknown>>(response.data, 'messages');
        const newMessages = rawMessages.map(normalizeChannelMessage);
        const hasMore = newMessages.length === 50;

        // Web is not a Signal-participant device (ADR-022). Group E2EE was
        // scoped to mobile/desktop; in the browser we render any encrypted
        // payload as a locked placeholder so the user knows to open the app.
        for (const msg of newMessages) {
          if (msg.is_encrypted && msg.encrypted_content) {
            msg.content = '🔒 Open on mobile or desktop to read';
            msg.metadata = { ...msg.metadata, decryptionFailed: false };
          }
        }

        set((state) => {
          let merged = before
            ? [...newMessages, ...(state.channelMessages[channelId] || [])]
            : newMessages;

          // Per-channel cap
          if (merged.length > MAX_CHANNEL_MESSAGES) {
            merged = before
              ? merged.slice(0, MAX_CHANNEL_MESSAGES) // scrolling up — keep oldest, prune newest
              : merged.slice(merged.length - MAX_CHANNEL_MESSAGES); // initial — keep newest
          }

          const updatedMessages = pruneGlobalMessages(
            { ...state.channelMessages, [channelId]: merged },
            state.activeChannelId
          );

          return {
            channelMessages: updatedMessages,
            hasMoreMessages: {
              ...state.hasMoreMessages,
              [channelId]: hasMore,
            },
            isLoadingMessages: false,
          };
        });
      } catch (error) {
        set({ isLoadingMessages: false });
        throw error;
      }
    },

    fetchMembers: async (groupId: string) => {
      const result = await apiClient.groups.getMembers(groupId);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      const allMembers = ensureArray<Member>(result.data);
      set((state) => ({
        members: {
          ...state.members,
          [groupId]: allMembers.slice(0, MAX_MEMBERS_PER_GROUP),
        },
      }));
    },

    sendChannelMessage: async (
      channelId: string,
      content: string,
      replyToId?: string,
      options?
    ) => {
      // Web is not a Signal-participant device (ADR-022). Group channels on
      // web send plaintext; sender-key E2EE lives on mobile/desktop only.
      const payload: Record<string, unknown> = {
        content,
        content_type: options?.contentType ?? 'text',
        client_message_id: createIdempotencyKey(),
      };
      if (replyToId) payload.reply_to_id = replyToId;
      if (options?.fileUrl) payload.file_url = options.fileUrl;
      if (options?.fileName) payload.file_name = options.fileName;
      if (options?.fileSize != null) payload.file_size = options.fileSize;
      if (options?.fileMimeType) payload.file_mime_type = options.fileMimeType;
      if (options?.thumbnailUrl) payload.thumbnail_url = options.thumbnailUrl;
      if (options?.metadata && Object.keys(options.metadata).length > 0) {
        payload.metadata = options.metadata;
      }

      const response = await http.post(channelMessagesPath(get(), channelId), payload);
      const raw =
        ensureObject<Record<string, unknown>>(response.data, 'data') ??
        ensureObject<Record<string, unknown>>(response.data, 'message');
      const message = raw ? normalizeChannelMessage(raw) : null;
      if (message) {
        get().addChannelMessage(message);
      }
    },

    setActiveGroup: (groupId: string | null) => {
      set({ activeGroupId: groupId, activeChannelId: null });
    },

    setActiveChannel: (channelId: string | null) => {
      set({ activeChannelId: channelId });
    },

    addChannelMessage: (message: ChannelMessage) => {
      set((state) => {
        const channelMessages = state.channelMessages[message.channelId] || [];
        if (channelMessages.some((m) => m.id === message.id)) {
          return state;
        }
        const updated = [...channelMessages, message];
        const perChannelCapped =
          updated.length > MAX_CHANNEL_MESSAGES
            ? updated.slice(updated.length - MAX_CHANNEL_MESSAGES)
            : updated;

        const updatedMessages = pruneGlobalMessages(
          { ...state.channelMessages, [message.channelId]: perChannelCapped },
          state.activeChannelId
        );

        return { channelMessages: updatedMessages };
      });
    },

    updateChannelMessage: (message: ChannelMessage) => {
      set((state) => ({
        channelMessages: {
          ...state.channelMessages,
          [message.channelId]: (state.channelMessages[message.channelId] || []).map((m) =>
            m.id === message.id ? message : m
          ),
        },
      }));
    },

    removeChannelMessage: (messageId: string, channelId: string) => {
      set((state) => ({
        channelMessages: {
          ...state.channelMessages,
          [channelId]: (state.channelMessages[channelId] || []).filter((m) => m.id !== messageId),
        },
      }));
    },

    toggleChannelReaction: async (channelId: string, messageId: string, emoji: string) => {
      // Optimistic update: find current reaction state and toggle
      const messages = get().channelMessages[channelId] || [];
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      const existingReaction = message.reactions.find((r) => r.emoji === emoji);
      const hasReacted = existingReaction?.hasReacted ?? false;

      // Optimistically update the reactions
      const updatedReactions = hasReacted
        ? message.reactions
            .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, hasReacted: false } : r))
            .filter((r) => r.count > 0)
        : existingReaction
          ? message.reactions.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count + 1, hasReacted: true } : r
            )
          : [...message.reactions, { emoji, count: 1, hasReacted: true }];

      const updatedMessage = { ...message, reactions: updatedReactions };
      set((state) => ({
        channelMessages: {
          ...state.channelMessages,
          [channelId]: (state.channelMessages[channelId] || []).map((m) =>
            m.id === messageId ? updatedMessage : m
          ),
        },
      }));

      try {
        await http.post(`/api/v1/messages/${messageId}/reactions`, { emoji });
      } catch (error) {
        // Revert optimistic update on failure
        logger.error('Failed to toggle reaction:', error);
        set((state) => ({
          channelMessages: {
            ...state.channelMessages,
            [channelId]: (state.channelMessages[channelId] || []).map((m) =>
              m.id === messageId ? message : m
            ),
          },
        }));
      }
    },

    addReactionToChannelMessage: (
      channelId: string,
      messageId: string,
      emoji: string,
      userId: string
    ) => {
      const currentUserId = useAuthStore.getState().user?.id;
      set((state) => {
        const messages = state.channelMessages[channelId] || [];
        return {
          channelMessages: {
            ...state.channelMessages,
            [channelId]: messages.map((m) => {
              if (m.id !== messageId) return m;
              const existing = m.reactions.find((r) => r.emoji === emoji);
              const isCurrentUser = userId === currentUserId;
              const updatedReactions = existing
                ? m.reactions.map((r) =>
                    r.emoji === emoji
                      ? {
                          ...r,
                          count: r.count + 1,
                          hasReacted: r.hasReacted || isCurrentUser,
                        }
                      : r
                  )
                : [...m.reactions, { emoji, count: 1, hasReacted: isCurrentUser }];
              return { ...m, reactions: updatedReactions };
            }),
          },
        };
      });
    },

    removeReactionFromChannelMessage: (
      channelId: string,
      messageId: string,
      emoji: string,
      userId: string
    ) => {
      const currentUserId = useAuthStore.getState().user?.id;
      set((state) => {
        const messages = state.channelMessages[channelId] || [];
        return {
          channelMessages: {
            ...state.channelMessages,
            [channelId]: messages.map((m) => {
              if (m.id !== messageId) return m;
              const isCurrentUser = userId === currentUserId;
              const updatedReactions = m.reactions
                .map((r) =>
                  r.emoji === emoji
                    ? {
                        ...r,
                        count: r.count - 1,
                        hasReacted: isCurrentUser ? false : r.hasReacted,
                      }
                    : r
                )
                .filter((r) => r.count > 0);
              return { ...m, reactions: updatedReactions };
            }),
          },
        };
      });
    },

    setTypingUser: (channelId: string, userId: string, isTyping: boolean) => {
      set((state) => {
        const current = state.typingUsers[channelId] || [];
        const updated = isTyping
          ? [...new Set([...current, userId])]
          : current.filter((id) => id !== userId);
        return {
          typingUsers: {
            ...state.typingUsers,
            [channelId]: updated,
          },
        };
      });
    },

    createGroup: async (data) => {
      const result = await apiClient.groups.create({
        name: data.name,
        description: data.description,
        isPublic: data.isPublic !== false,
      });
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      const raw = ensureObject<Record<string, unknown>>(result.data);
      if (!raw) throw new Error('Invalid response: missing group data');
      const group = normalizeGroup(raw);
      set((state) => ({
        groups: [group, ...state.groups].slice(0, 200),
      }));
      return group;
    },

    joinGroup: async (inviteCode: string) => {
      const result = await apiClient.groups.joinByInvite(inviteCode);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      const raw = ensureObject<Record<string, unknown>>(result.data);
      if (!raw) return null;
      const group = normalizeGroup(raw);
      set((state) => ({
        groups: state.groups.some((g) => g.id === group.id)
          ? state.groups
          : [...state.groups, group].slice(-200),
        justJoinedGroupName: group.name,
      }));
      return group;
    },

    leaveGroup: async (groupId: string) => {
      const result = await apiClient.groups.leave(groupId);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== groupId),
        activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId,
      }));
    },

    updateGroup: async (groupId: string, data) => {
      // Map camelCase props to backend-expected params
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description;
      if (data.isPublic !== undefined) payload.visibility = data.isPublic ? 'public' : 'private';
      if (data.iconUrl !== undefined) payload.icon_url = data.iconUrl;
      if (data.bannerUrl !== undefined) payload.banner_url = data.bannerUrl;
      if (data.is_node_gated !== undefined) payload.is_node_gated = data.is_node_gated;
      if (data.gate_type !== undefined) payload.gate_type = data.gate_type;
      if (data.gate_price_nodes !== undefined) payload.gate_price_nodes = data.gate_price_nodes;

      const result = await apiClient.groups.update(groupId, payload);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      const rawUpdated = ensureObject<Record<string, unknown>>(result.data);
      if (!rawUpdated) throw new Error('Failed to update group');
      const updatedGroup = normalizeGroup(rawUpdated);
      set((state) => ({
        groups: state.groups.map((g) => (g.id === groupId ? updatedGroup : g)),
      }));
      return updatedGroup;
    },

    deleteGroup: async (groupId: string) => {
      const result = await apiClient.groups.delete(groupId);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      set((state) => ({
        groups: state.groups.filter((g) => g.id !== groupId),
        activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId,
      }));
    },

    updateChannelOrder: async (groupId: string, channelIds: string[]) => {
      await http.put(`/api/v1/groups/${groupId}/channels/reorder`, { channel_ids: channelIds });
      // Optimistic update - reorder channels locally
      set((state) => ({
        groups: state.groups.map((g) => {
          if (g.id !== groupId) return g;
          const orderedChannels = channelIds
            .map((id) => g.channels.find((c) => c.id === id))
            .filter((c): c is Channel => c !== undefined);
          return { ...g, channels: orderedChannels };
        }),
      }));
    },

    createInvite: async (groupId: string, options = {}) => {
      const result = await apiClient.groups.createInvite(groupId, {
        max_uses: options.maxUses,
        expires_in: options.expiresIn,
      });
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      const invite: Record<string, unknown> =
        ensureObject<Record<string, unknown>>(result.data) ?? {};
      return {
        code: typeof invite?.code === 'string' ? invite.code : '',
        expiresAt: typeof invite?.expiresAt === 'string' ? invite.expiresAt : '',
      };
    },

    fetchDiscoverableGroups: async (params) => {
      set({ isLoadingDiscover: true, discoverSearch: params?.search ?? '' });
      try {
        const response = await http.get('/api/v1/explore', {
          params: {
            q: params?.search,
            sort: params?.sort,
            cursor: params?.cursor ?? null,
            limit: params?.limit ?? 20,
          },
        });
        set({
          discoverableGroups: normalizeGroups(
            ensureArray<Record<string, unknown>>(response.data, 'communities')
          ).slice(0, MAX_DISCOVERABLE_GROUPS),
          isLoadingDiscover: false,
        });
      } catch (error) {
        set({ isLoadingDiscover: false });
        throw error;
      }
    },

    joinPublicGroup: async (groupId: string) => {
      const result = await apiClient.groups.join(groupId);
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      const raw = ensureObject<Record<string, unknown>>(result.data);
      if (!raw) return null;
      const group = normalizeGroup(raw);
      set((state) => ({
        groups: state.groups.some((g) => g.id === group.id)
          ? state.groups
          : [...state.groups, group].slice(-200),
        justJoinedGroupName: group.name,
        // Remove from discoverable list since user has joined
        discoverableGroups: state.discoverableGroups.filter((g) => g.id !== group.id),
      }));
      return group;
    },

    createRole: async (
      groupId: string,
      data: { name: string; color: string; permissions: number }
    ) => {
      const res = await http.post(`/api/v1/groups/${groupId}/roles`, data);
      const role = ensureObject<import('./group-types').Role>(res.data?.data ?? res.data);
      if (!role) throw new Error('Invalid response: missing role data');
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, roles: [...g.roles, role] } : g
        ),
      }));
      return role;
    },

    updateRole: async (
      groupId: string,
      roleId: string,
      data: Partial<{
        name: string;
        color: string;
        permissions: number;
        hoist: boolean;
        mentionable: boolean;
      }>
    ) => {
      const res = await http.put(`/api/v1/groups/${groupId}/roles/${roleId}`, data);
      const role = ensureObject<import('./group-types').Role>(res.data?.data ?? res.data);
      if (!role) throw new Error('Invalid response: missing role data');
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, roles: g.roles.map((r) => (r.id === roleId ? role : r)) } : g
        ),
      }));
      return role;
    },

    deleteRole: async (groupId: string, roleId: string) => {
      await http.delete(`/api/v1/groups/${groupId}/roles/${roleId}`);
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === groupId ? { ...g, roles: g.roles.filter((r) => r.id !== roleId) } : g
        ),
      }));
    },
  };
}
