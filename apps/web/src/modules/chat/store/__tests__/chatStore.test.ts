import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatStore, toConversation } from '../chatStore.impl';
import type { Message, Conversation } from '../chatStore.types';

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/modules/auth/store', () => ({
  useAuthStore: { getState: vi.fn(() => ({ user: { id: 'me' } })) },
}));
vi.mock('@cgraph-dev/utils', () => ({ createIdempotencyKey: () => 'idem-key-1' }));
vi.mock('@/lib/api-utils', () => ({
  ensureArray: (_d: unknown, key: string) => {
    if (Array.isArray(_d)) return _d;
    if (_d && typeof _d === 'object') {
      const val = (Object.entries(_d).find(([k]) => k === key) ?? [])[1];
      if (Array.isArray(val)) return val;
    }
    return [];
  },
  ensureObject: (_d: unknown, key: string) => {
    if (_d && typeof _d === 'object') {
      const entry = Object.entries(_d).find(([k]) => k === key);
      if (entry) return entry[1];
    }
    return _d;
  },
  normalizeMessage: (m: unknown) => m,
  normalizeConversations: (c: unknown) => c,
}));

import { api } from '@/lib/api';

type MockFn = ReturnType<typeof vi.fn>;
const mockApi = {
  get: api.get as unknown as MockFn,
  post: api.post as unknown as MockFn,
  patch: api.patch as unknown as MockFn,
  delete: api.delete as unknown as MockFn,
};

const makeMsg = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  senderId: 'user-1',
  content: 'hello',
  encryptedContent: null,
  isEncrypted: false,
  messageType: 'text',
  replyToId: null,
  replyTo: null,
  isPinned: false,
  isEdited: false,
  deletedAt: null,
  metadata: {},
  reactions: [],
  sender: { id: 'user-1', username: 'alice', displayName: 'Alice', avatarUrl: null },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const makeConv = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: 'conv-1',
  type: 'direct',
  name: null,
  avatarUrl: null,
  participants: [
    {
      id: 'p1',
      userId: 'me',
      user: { id: 'me', username: 'me', displayName: null, avatarUrl: null, status: 'online' },
      nickname: null,
      isMuted: false,
      mutedUntil: null,
      joinedAt: '',
    },
    {
      id: 'p2',
      userId: 'user-2',
      user: { id: 'user-2', username: 'bob', displayName: null, avatarUrl: null, status: 'online' },
      nickname: null,
      isMuted: false,
      mutedUntil: null,
      joinedAt: '',
    },
  ],
  lastMessage: null,
  unreadCount: 0,
  isMuted: false,
  mutedUntil: null,
  isArchived: false,
  isPinned: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

beforeEach(() => {
  useChatStore.setState({
    conversations: [],
    archivedConversations: [],
    activeConversationId: null,
    messages: {},
    messageIdSets: {},
    isLoadingConversations: false,
    isLoadingArchivedConversations: false,
    isLoadingMessages: false,
    typingUsers: {},
    typingUsersInfo: {},
    hasMoreMessages: {},
    conversationsLastFetchedAt: null,
  });
  vi.clearAllMocks();
});

// 1. Fetch Conversations
describe('fetchConversations', () => {
  it('fetches and stores conversations', async () => {
    const convs = [makeConv()];
    mockApi.get.mockResolvedValueOnce({ data: { conversations: convs } });
    await useChatStore.getState().fetchConversations();
    expect(useChatStore.getState().conversations.map((conv) => conv.id)).toEqual(['conv-1']);
    expect(useChatStore.getState().isLoadingConversations).toBe(false);
  });

  it('skips when already loading', async () => {
    useChatStore.setState({ isLoadingConversations: true });
    await useChatStore.getState().fetchConversations();
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it('skips when cache is fresh', async () => {
    useChatStore.setState({ conversationsLastFetchedAt: Date.now() });
    await useChatStore.getState().fetchConversations();
    expect(mockApi.get).not.toHaveBeenCalled();
  });

  it('sets isLoadingConversations false on error', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('network'));
    await expect(useChatStore.getState().fetchConversations()).rejects.toThrow('network');
    expect(useChatStore.getState().isLoadingConversations).toBe(false);
  });
});

// 1b. toConversation normalizer — tier preservation
describe('toConversation', () => {
  it('preserves conversationType from server payload', () => {
    const cloud = toConversation({
      id: 'c-cloud',
      type: 'direct',
      conversationType: 'cloud',
      createdAt: '2026-04-19T00:00:00Z',
      updatedAt: '2026-04-19T00:00:00Z',
    });
    const secret = toConversation({
      id: 'c-secret',
      type: 'direct',
      conversationType: 'secret',
      createdAt: '2026-04-19T00:00:00Z',
      updatedAt: '2026-04-19T00:00:00Z',
    });
    expect(cloud.conversationType).toBe('cloud');
    expect(secret.conversationType).toBe('secret');
  });

  it('leaves conversationType undefined on pre-migration payloads', () => {
    const legacy = toConversation({
      id: 'c-legacy',
      type: 'direct',
      createdAt: '2026-04-19T00:00:00Z',
      updatedAt: '2026-04-19T00:00:00Z',
    });
    expect(legacy.conversationType).toBeUndefined();
  });

  it('preserves current-user conversation flags from server payloads', () => {
    const conversation = toConversation({
      id: 'c-flags',
      type: 'direct',
      isMuted: true,
      mutedUntil: '2026-05-16T12:00:00Z',
      isArchived: true,
      isPinned: true,
      unreadCount: 3,
      createdAt: '2026-04-19T00:00:00Z',
      updatedAt: '2026-04-19T00:00:00Z',
    });

    expect(conversation.isMuted).toBe(true);
    expect(conversation.mutedUntil).toBe('2026-05-16T12:00:00Z');
    expect(conversation.isArchived).toBe(true);
    expect(conversation.isPinned).toBe(true);
    expect(conversation.unreadCount).toBe(3);
  });
});

// 2. Fetch Messages
describe('fetchMessages', () => {
  it('fetches first page of messages', async () => {
    const msgs = [makeMsg()];
    mockApi.get.mockResolvedValueOnce({ data: { messages: msgs } });
    await useChatStore.getState().fetchMessages('conv-1');
    expect(useChatStore.getState().messages['conv-1']?.map((msg) => msg.id)).toEqual(['msg-1']);
    expect(useChatStore.getState().isLoadingMessages).toBe(false);
  });

  it('prepends older messages when paginating', async () => {
    const existing = makeMsg({ id: 'new' });
    useChatStore.setState({
      messages: { 'conv-1': [existing] },
      messageIdSets: { 'conv-1': new Set(['new']) },
    });
    const older = makeMsg({ id: 'old' });
    mockApi.get.mockResolvedValueOnce({ data: { messages: [older] } });
    await useChatStore.getState().fetchMessages('conv-1', 'before-cursor');
    const msgs = useChatStore.getState().messages['conv-1'];
    expect(msgs![0]!.id).toBe('old');
    expect(msgs![1]!.id).toBe('new');
  });

  it('marks hasMore when 50 messages returned', async () => {
    const msgs = Array.from({ length: 50 }, (_, i) => makeMsg({ id: `m-${i}` }));
    mockApi.get.mockResolvedValueOnce({ data: { messages: msgs } });
    await useChatStore.getState().fetchMessages('conv-1');
    expect(useChatStore.getState().hasMoreMessages['conv-1']).toBe(true);
  });

  it('marks hasMore=false when < 50 messages', async () => {
    mockApi.get.mockResolvedValueOnce({ data: { messages: [makeMsg()] } });
    await useChatStore.getState().fetchMessages('conv-1');
    expect(useChatStore.getState().hasMoreMessages['conv-1']).toBe(false);
  });

  it('sets isLoadingMessages false on error', async () => {
    mockApi.get.mockRejectedValueOnce(new Error('fail'));
    await expect(useChatStore.getState().fetchMessages('conv-1')).rejects.toThrow();
    expect(useChatStore.getState().isLoadingMessages).toBe(false);
  });
});

// 3. Send Message (plaintext path)
describe('sendMessage', () => {
  it('sends plaintext message and adds to store', async () => {
    const msg = makeMsg();
    mockApi.post.mockResolvedValueOnce({ data: { message: msg } });
    await useChatStore.getState().sendMessage('conv-1', 'hello');
    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/v1/conversations/conv-1/messages',
      expect.objectContaining({ content: 'hello' })
    );
  });

  it('includes replyToId in payload', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { message: makeMsg() } });
    await useChatStore.getState().sendMessage('conv-1', 'reply', 'original-id');
    expect(mockApi.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ reply_to_id: 'original-id' })
    );
  });

  it('sends file metadata as root fields plus metadata', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { message: makeMsg({ messageType: 'image' }) } });
    const metadata = {
      fileUrl: 'https://cdn.example.com/photo.png',
      fileName: 'photo.png',
      fileSize: 2048,
      fileMimeType: 'image/png',
      thumbnailUrl: 'https://cdn.example.com/thumb.png',
    };

    await useChatStore.getState().sendMessage('conv-1', 'photo.png', undefined, {
      type: 'image',
      metadata,
    });

    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/v1/conversations/conv-1/messages',
      expect.objectContaining({
        content: 'photo.png',
        content_type: 'image',
        file_url: metadata.fileUrl,
        file_name: metadata.fileName,
        file_size: metadata.fileSize,
        file_mime_type: metadata.fileMimeType,
        thumbnail_url: metadata.thumbnailUrl,
        metadata,
      })
    );
  });

  it('sends paid file lock fields as root fields plus metadata', async () => {
    mockApi.post.mockResolvedValueOnce({ data: { message: makeMsg({ messageType: 'image' }) } });
    const metadata = {
      fileUrl: 'https://cdn.example.com/paid.png',
      fileName: 'paid.png',
      fileSize: 4096,
      fileMimeType: 'image/png',
      paid_dm_file_id: 'paid-file-1',
      nodes_price: 25,
      is_file_locked: true,
    };

    await useChatStore.getState().sendMessage('conv-1', 'paid.png', undefined, {
      type: 'image',
      metadata,
    });

    expect(mockApi.post).toHaveBeenCalledWith(
      '/api/v1/conversations/conv-1/messages',
      expect.objectContaining({
        content: 'paid.png',
        content_type: 'image',
        nodes_price: 25,
        is_file_locked: true,
        metadata,
      })
    );
  });
});

// 4. Edit / Delete Message
describe('editMessage', () => {
  it('patches message via API and updates store', async () => {
    const msg = makeMsg();
    useChatStore.setState({
      messages: { 'conv-1': [msg] },
      messageIdSets: { 'conv-1': new Set(['msg-1']) },
    });
    const edited = { ...msg, content: 'edited' };
    mockApi.patch.mockResolvedValueOnce({ data: { message: edited } });
    await useChatStore.getState().editMessage('msg-1', 'edited');
    expect(mockApi.patch).toHaveBeenCalled();
  });

  it('throws if message not found in any conversation', async () => {
    await expect(useChatStore.getState().editMessage('nope', 'x')).rejects.toThrow(
      'Message not found'
    );
  });
});

describe('deleteMessage', () => {
  it('deletes message via API and removes from store', async () => {
    const msg = makeMsg();
    useChatStore.setState({
      messages: { 'conv-1': [msg] },
      messageIdSets: { 'conv-1': new Set(['msg-1']) },
    });
    mockApi.delete.mockResolvedValueOnce({});
    await useChatStore.getState().deleteMessage('msg-1');
    expect(mockApi.delete).toHaveBeenCalled();
  });

  it('throws if message not found', async () => {
    await expect(useChatStore.getState().deleteMessage('nope')).rejects.toThrow(
      'Message not found'
    );
  });
});

// 5. Reactions
describe('reactions', () => {
  it('addReaction posts to API', async () => {
    mockApi.post.mockResolvedValueOnce({});
    await useChatStore.getState().addReaction('msg-1', '👍');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/messages/msg-1/reactions', { emoji: '👍' });
  });

  it('removeReaction calls delete on API', async () => {
    mockApi.delete.mockResolvedValueOnce({});
    await useChatStore.getState().removeReaction('msg-1', '👍');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/messages/msg-1/reactions/👍');
  });

  it('addReactionToMessage adds reaction to message in state', () => {
    const msg = makeMsg({ reactions: [] });
    useChatStore.setState({ messages: { 'conv-1': [msg] } });
    useChatStore.getState().addReactionToMessage('msg-1', '🎉', 'user-2', 'bob');
    const updated = useChatStore.getState().messages['conv-1']![0]!;
    expect(updated.reactions).toHaveLength(1);
    expect(updated.reactions[0]!.emoji).toBe('🎉');
  });

  it('addReactionToMessage deduplicates same user+emoji', () => {
    const msg = makeMsg({ reactions: [] });
    useChatStore.setState({ messages: { 'conv-1': [msg] } });
    useChatStore.getState().addReactionToMessage('msg-1', '🎉', 'user-2');
    useChatStore.getState().addReactionToMessage('msg-1', '🎉', 'user-2');
    expect(useChatStore.getState().messages['conv-1']![0]!.reactions).toHaveLength(1);
  });

  it('removeReactionFromMessage removes matching reaction', () => {
    const msg = makeMsg({
      reactions: [
        { id: 'r1', emoji: '🎉', userId: 'user-2', user: { id: 'user-2', username: 'bob' } },
      ],
    });
    useChatStore.setState({ messages: { 'conv-1': [msg] } });
    useChatStore.getState().removeReactionFromMessage('msg-1', '🎉', 'user-2');
    expect(useChatStore.getState().messages['conv-1']![0]!.reactions).toHaveLength(0);
  });
});

// 6. Typing Indicators
describe('setTypingUser', () => {
  it('adds a typing user', () => {
    useChatStore.getState().setTypingUser('conv-1', 'user-2', true);
    expect(useChatStore.getState().typingUsers['conv-1']).toContain('user-2');
  });

  it('removes a typing user', () => {
    useChatStore.setState({
      typingUsers: { 'conv-1': ['user-2'] },
      typingUsersInfo: { 'conv-1': [{ userId: 'user-2' }] },
    });
    useChatStore.getState().setTypingUser('conv-1', 'user-2', false);
    expect(useChatStore.getState().typingUsers['conv-1']).not.toContain('user-2');
  });

  it('deduplicates typing users', () => {
    useChatStore.getState().setTypingUser('conv-1', 'user-2', true);
    useChatStore.getState().setTypingUser('conv-1', 'user-2', true);
    expect(useChatStore.getState().typingUsers['conv-1']).toHaveLength(1);
  });

  it('stores startedAt in typingUsersInfo', () => {
    useChatStore.getState().setTypingUser('conv-1', 'user-2', true, '2026-01-01T00:00:00Z');
    const info = useChatStore.getState().typingUsersInfo['conv-1']!;
    expect(info[0]!.startedAt).toBe('2026-01-01T00:00:00Z');
  });
});

// 7. Read Receipts
describe('markAsRead', () => {
  it('posts read receipt and resets unreadCount', async () => {
    useChatStore.setState({ conversations: [makeConv({ unreadCount: 5 })] });
    mockApi.post.mockResolvedValueOnce({});
    await useChatStore.getState().markAsRead('conv-1');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/conversations/conv-1/read');
    expect(useChatStore.getState().conversations[0]!.unreadCount).toBe(0);
  });

  it('silently ignores API errors', async () => {
    mockApi.post.mockRejectedValueOnce(new Error('oops'));
    await expect(useChatStore.getState().markAsRead('conv-1')).resolves.toBeUndefined();
  });
});

// 8. Conversation Management
describe('conversation management', () => {
  it('setActiveConversation stores the id', () => {
    useChatStore.getState().setActiveConversation('conv-1');
    expect(useChatStore.getState().activeConversationId).toBe('conv-1');
  });

  it('setActiveConversation to null clears it', () => {
    useChatStore.setState({ activeConversationId: 'conv-1' });
    useChatStore.getState().setActiveConversation(null);
    expect(useChatStore.getState().activeConversationId).toBeNull();
  });

  it('createConversation calls API and adds to list', async () => {
    const conv = makeConv();
    mockApi.post.mockResolvedValueOnce({ data: { conversation: conv } });
    const result = await useChatStore.getState().createConversation(['user-2']);
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/conversations', {
      participant_ids: ['user-2'],
      type: 'cloud',
    });
    expect(result.id).toBe('conv-1');
    expect(useChatStore.getState().conversations).toHaveLength(1);
  });

  it('preserves explicit secret conversation requests for capable callers', async () => {
    const conv = makeConv({ conversationType: 'secret' });
    mockApi.post.mockResolvedValueOnce({ data: { conversation: conv } });

    await useChatStore.getState().createConversation(['user-2'], { type: 'secret' });

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/conversations', {
      participant_ids: ['user-2'],
      type: 'secret',
    });
  });

  it('addConversation adds new conversation to head', () => {
    const conv = makeConv();
    useChatStore.getState().addConversation(conv);
    expect(useChatStore.getState().conversations[0]!.id).toBe('conv-1');
  });

  it('addConversation deduplicates by id', () => {
    const conv = makeConv();
    useChatStore.setState({ conversations: [conv] });
    useChatStore.getState().addConversation(conv);
    expect(useChatStore.getState().conversations).toHaveLength(1);
  });

  it('updateConversation merges partial updates', () => {
    useChatStore.setState({ conversations: [makeConv()] });
    useChatStore.getState().updateConversation({ id: 'conv-1', name: 'Renamed' });
    expect(useChatStore.getState().conversations[0]!.name).toBe('Renamed');
  });

  it('archiveConversation posts archive and removes the conversation from sidebar state', async () => {
    useChatStore.setState({
      activeConversationId: 'conv-1',
      conversations: [makeConv({ id: 'conv-1' }), makeConv({ id: 'conv-2' })],
    });
    mockApi.post.mockResolvedValueOnce({ data: { data: { archived: true } } });

    await useChatStore.getState().archiveConversation('conv-1');

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/conversations/conv-1/archive');
    expect(useChatStore.getState().activeConversationId).toBeNull();
    expect(useChatStore.getState().conversations.map((conv) => conv.id)).toEqual(['conv-2']);
    expect(useChatStore.getState().archivedConversations[0]!.isArchived).toBe(true);
  });

  it('fetchArchivedConversations loads archived sidebar recovery state', async () => {
    const archived = makeConv({ id: 'archived-1', isArchived: true });
    mockApi.get.mockResolvedValueOnce({ data: { data: [archived] } });

    await useChatStore.getState().fetchArchivedConversations();

    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/conversations/archived');
    expect(useChatStore.getState().archivedConversations.map((conv) => conv.id)).toEqual([
      'archived-1',
    ]);
  });

  it('unarchiveConversation restores archived conversations to the inbox state', async () => {
    useChatStore.setState({
      archivedConversations: [makeConv({ id: 'conv-1', isArchived: true })],
      conversations: [makeConv({ id: 'conv-2' })],
    });
    mockApi.post.mockResolvedValueOnce({});

    await useChatStore.getState().unarchiveConversation('conv-1');

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/conversations/conv-1/unarchive');
    expect(useChatStore.getState().archivedConversations).toHaveLength(0);
    expect(useChatStore.getState().conversations[0]!.id).toBe('conv-1');
    expect(useChatStore.getState().conversations[0]!.isArchived).toBe(false);
  });

  it('pinConversation and muteConversation persist conversation list flags', async () => {
    useChatStore.setState({ conversations: [makeConv({ id: 'conv-1' })] });
    mockApi.post.mockResolvedValue({});
    mockApi.delete.mockResolvedValue({});

    await useChatStore.getState().pinConversation('conv-1', true);
    await useChatStore.getState().muteConversation('conv-1', true);
    expect(useChatStore.getState().conversations[0]!.isPinned).toBe(true);
    expect(useChatStore.getState().conversations[0]!.isMuted).toBe(true);

    await useChatStore.getState().pinConversation('conv-1', false);
    await useChatStore.getState().muteConversation('conv-1', false);
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/conversations/conv-1/pin');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/conversations/conv-1/mute');
    expect(useChatStore.getState().conversations[0]!.isPinned).toBe(false);
    expect(useChatStore.getState().conversations[0]!.isMuted).toBe(false);
  });

  it('markAsUnread persists a visible unread badge locally', async () => {
    useChatStore.setState({ conversations: [makeConv({ id: 'conv-1', unreadCount: 0 })] });
    mockApi.post.mockResolvedValueOnce({});

    await useChatStore.getState().markAsUnread('conv-1');

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/conversations/conv-1/unread');
    expect(useChatStore.getState().conversations[0]!.unreadCount).toBe(1);
  });

  it('getRecipientId returns other participant for direct chats', () => {
    useChatStore.setState({ conversations: [makeConv()] });
    const recipientId = useChatStore.getState().getRecipientId('conv-1', 'me');
    expect(recipientId).toBe('user-2');
  });

  it('getRecipientId returns null for group chats', () => {
    useChatStore.setState({ conversations: [makeConv({ type: 'group' })] });
    expect(useChatStore.getState().getRecipientId('conv-1', 'me')).toBeNull();
  });

  it('getRecipientId returns null for unknown conversation', () => {
    expect(useChatStore.getState().getRecipientId('unknown', 'me')).toBeNull();
  });

  it('applies live identity patches to participants, sidebar previews, and routed messages', () => {
    const friendMessage = makeMsg({
      senderId: 'user-2',
      sender: { id: 'user-2', username: 'bob', displayName: 'Bob', avatarUrl: null },
      replyTo: makeMsg({
        id: 'reply-1',
        senderId: 'user-2',
        sender: { id: 'user-2', username: 'bob', displayName: 'Bob', avatarUrl: null },
      }),
    });
    useChatStore.setState({
      conversations: [makeConv({ lastMessage: friendMessage })],
      archivedConversations: [makeConv({ id: 'archived-1' })],
      messages: { 'conv-1': [friendMessage] },
    });

    useChatStore.getState().applyUserIdentityPatch('user-2', {
      displayName: 'Bobby',
      avatarBorderId: 'border_cyberpunk_epic_01',
      equippedTitleId: 'title-founder',
      equippedBadgeIds: ['badge-founder'],
      equippedNameplateId: 'plate_gilded_sapphire_loop_01',
    });

    const state = useChatStore.getState();
    expect(state.conversations[0]!.participants[1]!.user).toMatchObject({
      displayName: 'Bobby',
      avatarBorderId: 'border_cyberpunk_epic_01',
      equippedTitleId: 'title-founder',
      equippedBadgeIds: ['badge-founder'],
      equippedNameplateId: 'plate_gilded_sapphire_loop_01',
    });
    expect(state.conversations[0]!.lastMessage?.sender).toMatchObject({
      displayName: 'Bobby',
      avatarBorderId: 'border_cyberpunk_epic_01',
      equippedTitleId: 'title-founder',
      equippedBadgeIds: ['badge-founder'],
      equippedNameplateId: 'plate_gilded_sapphire_loop_01',
    });
    expect(state.messages['conv-1']![0]!.sender).toMatchObject({
      displayName: 'Bobby',
      avatarBorderId: 'border_cyberpunk_epic_01',
      equippedTitleId: 'title-founder',
      equippedBadgeIds: ['badge-founder'],
      equippedNameplateId: 'plate_gilded_sapphire_loop_01',
    });
    expect(state.messages['conv-1']![0]!.replyTo?.sender).toMatchObject({
      displayName: 'Bobby',
      avatarBorderId: 'border_cyberpunk_epic_01',
      equippedTitleId: 'title-founder',
      equippedBadgeIds: ['badge-founder'],
      equippedNameplateId: 'plate_gilded_sapphire_loop_01',
    });
    expect(state.archivedConversations[0]!.participants[1]!.user.avatarBorderId).toBe(
      'border_cyberpunk_epic_01'
    );
  });
});

// 9. Add / Update / Remove Message (synchronous ops)
describe('addMessage', () => {
  it('adds a message and updates id set', async () => {
    const msg = makeMsg();
    useChatStore.getState().addMessage(msg);
    // addMessage uses queueMicrotask — wait for it
    await new Promise<void>((r) => queueMicrotask(() => r()));
    expect(useChatStore.getState().messages['conv-1']).toHaveLength(1);
  });

  it('deduplicates by message id', async () => {
    const msg = makeMsg();
    useChatStore.getState().addMessage(msg);
    await new Promise<void>((r) => queueMicrotask(() => r()));
    useChatStore.getState().addMessage(msg);
    await new Promise<void>((r) => queueMicrotask(() => r()));
    expect(useChatStore.getState().messages['conv-1']).toHaveLength(1);
  });
});

describe('updateMessage', () => {
  it('replaces message content in-place', () => {
    useChatStore.setState({ messages: { 'conv-1': [makeMsg()] } });
    useChatStore.getState().updateMessage(makeMsg({ content: 'updated' }));
    expect(useChatStore.getState().messages['conv-1']![0]!.content).toBe('updated');
  });
});

describe('removeMessage', () => {
  it('filters out the message and cleans id set', () => {
    useChatStore.setState({
      messages: { 'conv-1': [makeMsg()] },
      messageIdSets: { 'conv-1': new Set(['msg-1']) },
    });
    useChatStore.getState().removeMessage('msg-1', 'conv-1');
    expect(useChatStore.getState().messages['conv-1']).toHaveLength(0);
    expect(useChatStore.getState().messageIdSets['conv-1']!.has('msg-1')).toBe(false);
  });
});
