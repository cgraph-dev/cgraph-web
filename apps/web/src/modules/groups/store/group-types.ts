/**
 * Group store type definitions.
 * All interfaces used by the group store.
 */

export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  isPublic: boolean;
  memberCount: number;
  onlineMemberCount: number;
  ownerId: string;
  categories: ChannelCategory[];
  channels: Channel[];
  roles: Role[];
  myMember: Member | null;
  createdAt: string;
  is_node_gated: boolean;
  gate_type: 'weekly' | 'monthly' | 'forever' | null;
  gate_price_nodes: number | null;
}

export interface GroupSubscription {
  id: string;
  userId: string;
  groupId: string;
  paidAt: string;
  expiresAt: string | null;
  autoRenew: boolean;
  status: 'active' | 'expired' | 'cancelled';
}

export interface ChannelCategory {
  id: string;
  name: string;
  position: number;
  channels: Channel[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'video' | 'announcement' | 'forum';
  topic: string | null;
  categoryId: string | null;
  position: number;
  isNsfw: boolean;
  slowModeSeconds: number;
  unreadCount: number;
  lastMessageAt: string | null;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
  permissions: number;
  isDefault: boolean;
  isHoisted: boolean;
  isMentionable: boolean;
}

export interface Member {
  id: string;
  userId: string;
  nickname: string | null;
  notifications?: 'all' | 'mentions' | 'none';
  suppressEveryone?: boolean;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    status: string;
    avatarBorderId?: string | null;
    equippedTitleId?: string | null;
    equippedBadgeIds?: readonly string[];
    equippedNameplateId?: string | null;
    profileTheme?: string | null;
    chatTheme?: string | null;
    displayNameFont?: string | null;
    displayNameEffect?: string | null;
    displayNameColor?: string | null;
    displayNameSecondaryColor?: string | null;
  };
  roles: Role[];
  joinedAt: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  messageType:
    | 'text'
    | 'image'
    | 'video'
    | 'file'
    | 'audio'
    | 'voice'
    | 'sticker'
    | 'gif'
    | 'system';
  replyToId: string | null;
  replyTo: ChannelMessage | null;
  isPinned: boolean;
  isEdited: boolean;
  deletedAt: string | null;
  metadata: Record<string, unknown>;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileMimeType?: string | null;
  thumbnailUrl?: string | null;
  reactions: { emoji: string; count: number; hasReacted: boolean }[];
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    member: Member | null;
    avatarBorderId?: string | null;
    equippedTitleId?: string | null;
    equippedBadgeIds?: readonly string[];
    equippedNameplateId?: string | null;
    profileTheme?: string | null;
    chatTheme?: string | null;
    displayNameFont?: string | null;
    displayNameEffect?: string | null;
    displayNameColor?: string | null;
    displayNameSecondaryColor?: string | null;
  };
  createdAt: string;
  // E2EE fields (optional — only present on encrypted messages)
  encrypted_content?: string;
  sender_key_id?: string;
  chain_index?: number;
  is_encrypted?: boolean;
}

export interface GroupState {
  readonly groups: readonly Group[];
  readonly activeGroupId: string | null;
  readonly activeChannelId: string | null;
  readonly channelMessages: Readonly<Record<string, readonly ChannelMessage[]>>;
  readonly members: Readonly<Record<string, readonly Member[]>>;
  readonly isLoadingGroups: boolean;
  readonly isLoadingMessages: boolean;
  readonly hasMoreMessages: Readonly<Record<string, boolean>>;
  readonly typingUsers: Readonly<Record<string, readonly string[]>>;
  readonly justJoinedGroupName: string | null;
  /** Discoverable public groups fetched from explore */
  readonly discoverableGroups: readonly Group[];
  /** Loading state for discoverable groups */
  readonly isLoadingDiscover: boolean;
  /** Current discover search term */
  readonly discoverSearch: string;

  // Actions
  fetchGroups: () => Promise<void>;
  fetchGroup: (groupId: string) => Promise<void>;
  fetchChannelMessages: (channelId: string, before?: string) => Promise<void>;
  searchChannelMessages: (channelId: string, query: string) => Promise<readonly ChannelMessage[]>;
  fetchMembers: (groupId: string) => Promise<void>;
  sendChannelMessage: (
    channelId: string,
    content: string,
    replyToId?: string,
    options?: {
      contentType?: ChannelMessage['messageType'];
      fileUrl?: string | null;
      fileName?: string | null;
      fileSize?: number | null;
      fileMimeType?: string | null;
      thumbnailUrl?: string | null;
      metadata?: Record<string, unknown>;
    }
  ) => Promise<void>;
  setActiveGroup: (groupId: string | null) => void;
  setActiveChannel: (channelId: string | null) => void;
  addChannelMessage: (message: ChannelMessage) => void;
  updateChannelMessage: (message: ChannelMessage) => void;
  removeChannelMessage: (messageId: string, channelId: string) => void;
  toggleChannelReaction: (channelId: string, messageId: string, emoji: string) => Promise<void>;
  addReactionToChannelMessage: (
    channelId: string,
    messageId: string,
    emoji: string,
    userId: string
  ) => void;
  removeReactionFromChannelMessage: (
    channelId: string,
    messageId: string,
    emoji: string,
    userId: string
  ) => void;
  setTypingUser: (channelId: string, userId: string, isTyping: boolean) => void;
  createGroup: (data: { name: string; description?: string; isPublic?: boolean }) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<Group | null>;
  leaveGroup: (groupId: string) => Promise<void>;
  updateGroup: (
    groupId: string,
    data: Partial<
      Pick<
        Group,
        | 'name'
        | 'description'
        | 'isPublic'
        | 'iconUrl'
        | 'bannerUrl'
        | 'is_node_gated'
        | 'gate_type'
        | 'gate_price_nodes'
      >
    >
  ) => Promise<Group>;
  deleteGroup: (groupId: string) => Promise<void>;
  createInvite: (
    groupId: string,
    options?: { maxUses?: number; expiresIn?: number }
  ) => Promise<{ code: string; expiresAt: string }>;
  fetchDiscoverableGroups: (params?: {
    search?: string;
    sort?: string;
    cursor?: string | null;
    limit?: number;
  }) => Promise<void>;
  joinPublicGroup: (groupId: string) => Promise<Group | null>;
  createRole: (
    groupId: string,
    data: {
      name: string;
      color: string;
      permissions: number;
      is_hoisted?: boolean;
      is_mentionable?: boolean;
    }
  ) => Promise<Role>;
  updateRole: (
    groupId: string,
    roleId: string,
    data: Partial<{
      name: string;
      color: string;
      permissions: number;
      is_hoisted: boolean;
      is_mentionable: boolean;
    }>
  ) => Promise<Role>;
  reorderRoles: (groupId: string, roleIds: readonly string[]) => Promise<void>;
  deleteRole: (groupId: string, roleId: string) => Promise<void>;
  clearJoinCelebration: () => void;
  reset: () => void;
}
