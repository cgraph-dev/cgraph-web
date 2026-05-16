/**
 * Chat Store — Type Definitions
 *
 * All interfaces and types used across the chat module.
 * Includes message, conversation, participant, reaction,
 * and scheduling types.
 *
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  encryptedContent: string | null;
  isEncrypted: boolean;
  messageType:
    | 'text'
    | 'image'
    | 'video'
    | 'file'
    | 'audio'
    | 'voice'
    | 'sticker'
    | 'gif'
    | 'system'
    | 'contact'
    | 'poll'
    | 'location';
  replyToId: string | null;
  replyTo: Message | null;
  isPinned: boolean;
  isEdited: boolean;
  deletedAt: string | null;
  metadata: MessageMetadata;
  reactions: Reaction[];
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    avatarBorderId?: string | null;
    theme?: string | null;
    // Sender customization fields (populated from backend user_customizations)
    equippedTitleId?: string | null;
    equippedBadgeIds?: readonly string[];
    equippedNameplateId?: string | null;
    bubbleStyle?: string | null;
    bubbleColor?: string | null;
    bubbleRadius?: number | null;
    bubbleOpacity?: number | null;
    messageEffect?: string | null;
    reactionStyle?: string | null;
    chatTheme?: string | null;
    profileTheme?: string | null;
    entranceAnimation?: string | null;
    glassEffect?: string | null;
    textColor?: string | null;
    textSize?: number | null;
    fontFamily?: string | null;
    displayNameFont?: string | null;
    displayNameEffect?: string | null;
    displayNameColor?: string | null;
    displayNameSecondaryColor?: string | null;
  };
  senderTheme?: string | null;
  edits?: EditHistory[];
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
  updatedAt: string;
  // E2EE metadata for decryption
  ephemeralPublicKey?: string;
  nonce?: string;
  senderIdentityKey?: string;
  /** Set to true after successful decryption — drives lock icon in UI */
  decryptionFailed?: boolean;
  /** True when the server deliberately withheld plaintext for this web client. */
  requiresMobile?: boolean;
  /** Protocol version used for encryption (e.g. 'PQXDH_V1', 'CLASSICAL_V2') */
  protocolVersion?: string;
  /** Voice message metadata is encrypted (only present on voice E2EE messages) */
  is_metadata_encrypted?: boolean;
  // Message scheduling
  scheduledAt?: string | null;
  scheduleStatus?: 'immediate' | 'scheduled' | 'sent' | 'cancelled';
  // Forwarding metadata
  forwardedFromId?: string | null;
  forwardedFromUserId?: string | null;
  forwardedFromUserName?: string | null;
  // Ordering and deduplication
  sequence?: number | null;
  clientMessageId?: string | null;
  // Album grouping
  albumId?: string | null;
  // Group E2EE metadata
  senderKeyId?: string | null;
  chainIndex?: number | null;
  // Server-side link preview
  linkPreview?: {
    url?: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    type?: string;
    favicon?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    username?: string;
    userId?: string;
    avatarUrl?: string;
  } | null;
  // View-once media
  isViewOnce?: boolean;
  viewOnceOpenedAt?: string | null;
}

/**
 * Message metadata — extensible with typed common properties
 */
export interface MessageMetadata {
  url?: string;
  filename?: string;
  size?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  duration?: number;
  waveform?: number[];
  width?: number;
  height?: number;
  readBy?: Array<{
    id?: string;
    userId: string;
    readAt: string;
    username?: string;
    avatarUrl?: string;
    displayName?: string;
  }>;
  stickerId?: string;
  stickerPackId?: string;
  gifId?: string;
  gifUrl?: string;
  [key: string]: unknown;
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    username: string;
  };
}

export interface EditHistory {
  id: string;
  messageId: string;
  previousContent: string;
  editNumber: number;
  editedById: string;
  createdAt: string;
}
export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  /**
   * Tier discriminator — orthogonal to `type`. `secret` conversations are
   * post-quantum E2EE and only functional on mobile/desktop (ADR-022).
   * `cloud` conversations are server-readable (AES-256-GCM + KMS) and work
   * on every device including the web. Absent on pre-migration payloads
   * and from group conversations.
   */
  conversationType?: 'secret' | 'cloud';
  name: string | null;
  avatarUrl: string | null;
  participants: ConversationParticipant[];
  lastMessage: Message | null;
  unreadCount: number;
  isGroup?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
  mutedUntil?: string | null;
  isArchived?: boolean;
  isNoteToSelf?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    status: string;
    lastSeenAt?: string | null;
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
    level?: number;
    xp?: number;
    pulse?: number;
    streak?: number;
    bio?: string | null;
    badges?: string[];
    theme?: string | null;
    sharedForums?: Array<{ id: string; name: string }>;
  };
  nickname: string | null;
  isMuted: boolean;
  mutedUntil: string | null;
  joinedAt: string;
}

export interface ChatIdentityPatch {
  username?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  status?: string;
  statusMessage?: string | null;
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
}

export interface TypingUserInfo {
  userId: string;
  startedAt?: string;
}

export interface ChatState {
  readonly conversations: readonly Conversation[];
  readonly archivedConversations: readonly Conversation[];
  readonly activeConversationId: string | null;
  readonly messages: Readonly<Record<string, readonly Message[]>>;
  readonly messageIdSets: Readonly<Record<string, Set<string>>>;
  readonly isLoadingConversations: boolean;
  readonly isLoadingArchivedConversations: boolean;
  readonly isLoadingMessages: boolean;
  readonly typingUsers: Readonly<Record<string, readonly string[]>>;
  readonly typingUsersInfo: Readonly<Record<string, readonly TypingUserInfo[]>>;
  readonly hasMoreMessages: Readonly<Record<string, boolean>>;
  readonly conversationsLastFetchedAt: number | null;
  readonly readReceipts: Readonly<Record<string, Readonly<Record<string, string>>>>; // messageId → userId → readAt

  // Actions
  fetchConversations: () => Promise<void>;
  fetchArchivedConversations: () => Promise<void>;
  fetchMessages: (conversationId: string, before?: string) => Promise<void>;
  applyUserIdentityPatch: (userId: string, patch: ChatIdentityPatch) => void;
  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string,
    options?: { type?: string; metadata?: Record<string, unknown> }
  ) => Promise<void>;
  resendMessage: (conversationId: string, failedMessageId: string) => Promise<void>;
  sendEncryptedMessage: (
    conversationId: string,
    recipientId: string,
    content: string,
    replyToId?: string
  ) => Promise<void>;
  decryptAndAddMessage: (message: Message) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: string, conversationId: string) => void;
  markMessageDeleted: (messageId: string) => void;
  setTypingUser: (
    conversationId: string,
    userId: string,
    isTyping: boolean,
    startedAt?: string
  ) => void;
  updateMessageStatus: (
    conversationId: string,
    messageId: string,
    status: Message['deliveryStatus']
  ) => void;
  addReadReceipt: (
    conversationId: string,
    messageId: string,
    userId: string,
    readAt: string
  ) => void;
  markAsRead: (conversationId: string) => Promise<void>;
  markAsUnread: (conversationId: string) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  unarchiveConversation: (conversationId: string) => Promise<void>;
  pinConversation: (conversationId: string, pinned: boolean) => Promise<void>;
  muteConversation: (conversationId: string, muted: boolean) => Promise<void>;
  createConversation: (
    userIds: string[],
    options?: { readonly type?: 'secret' | 'cloud' }
  ) => Promise<Conversation>;
  getRecipientId: (conversationId: string, currentUserId: string) => string | null;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversation: Partial<Conversation> & { id: string }) => void;
  addReactionToMessage: (
    messageId: string,
    emoji: string,
    userId: string,
    username?: string
  ) => void;
  removeReactionFromMessage: (messageId: string, emoji: string, userId: string) => void;
  reset: () => void;
}
