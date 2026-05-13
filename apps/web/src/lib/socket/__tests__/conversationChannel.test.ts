/**
 * Tests for socket/conversationChannel.ts
 *
 * Conversation channel join/leave with debouncing, presence tracking,
 * message/typing/reaction event handlers, and error cleanup.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { joinConversation, leaveConversation, _gapRepairInFlightHas } from '../conversationChannel';

// Mocks
const { MockPresence, mockChatStore, mockHttpGet } = vi.hoisted(() => {
  const MockPresence = vi.fn();
  MockPresence.prototype.onSync = vi.fn();
  MockPresence.prototype.onJoin = vi.fn();
  MockPresence.prototype.onLeave = vi.fn();
  MockPresence.prototype.list = vi.fn();
  const mockChatStore = {
    messages: {},
    conversations: [],
    addMessage: vi.fn(),
    decryptAndAddMessage: vi.fn(),
    updateMessage: vi.fn(),
    removeMessage: vi.fn(),
    setTypingUser: vi.fn(),
    addReactionToMessage: vi.fn(),
    removeReactionFromMessage: vi.fn(),
    updateMessageStatus: vi.fn(),
    addReadReceipt: vi.fn(),
    markMessageDeleted: vi.fn(),
  };
  return { MockPresence, mockChatStore, mockHttpGet: vi.fn() };
});

vi.mock('phoenix', () => ({
  Presence: MockPresence,
}));

vi.mock('@/modules/chat/store/chatStore.impl', () => ({
  useChatStore: {
    getState: vi.fn(() => mockChatStore),
  },
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      user: { id: 'current-user' },
    })),
  },
}));

vi.mock('../../api-client', () => ({
  http: {
    get: mockHttpGet,
  },
}));

vi.mock('../../logger', () => {
  const loggerMock = { log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), info: vi.fn() };
  return {
    socketLogger: loggerMock,
    createLogger: vi.fn(() => ({ ...loggerMock })),
    logger: loggerMock,
    e2eeLogger: loggerMock,
    authLogger: loggerMock,
    apiLogger: loggerMock,
    forumLogger: loggerMock,
    chatLogger: loggerMock,
    themeLogger: loggerMock,
    routeLogger: loggerMock,
  };
});

vi.mock('../../api-utils', () => ({
  normalizeMessage: vi.fn((msg: unknown) => msg),
}));

// Helpers
type PushReceiver = {
  receive: (event: string, cb: (resp: unknown) => void) => PushReceiver;
};

function createMockChannel(state = 'initialized') {
  const handlers: Record<string, (payload: unknown) => void> = {};
  const receivers: Record<string, (resp: unknown) => void> = {};
  const closeCallbacks: Array<() => void> = [];
  const pushObj: PushReceiver = {
    receive(event: string, cb: (resp: unknown) => void) {
      receivers[event] = cb;
      return pushObj;
    },
  };

  return {
    state,
    on: vi.fn((event: string, cb: (payload: unknown) => void) => {
      handlers[event] = cb;
    }),
    onClose: vi.fn((cb: () => void) => {
      closeCallbacks.push(cb);
    }),
    push: vi.fn(() => pushObj),
    join: vi.fn(() => pushObj),
    leave: vi.fn(),
    _handlers: handlers,
    _receivers: receivers,
    _closeCallbacks: closeCallbacks,
    _trigger(event: string, payload: unknown) {
      handlers[event]?.(payload);
    },
    _triggerJoin(event: string, resp: unknown) {
      receivers[event]?.(resp);
    },
    _triggerClose() {
      closeCallbacks.forEach((cb) => cb());
    },
  };
}

function createMockSocket() {
  const mockChannel = createMockChannel();
  return {
    isConnected: vi.fn(() => true),
    channel: vi.fn(() => mockChannel),
    _lastChannel: mockChannel,
  };
}

function makeArgs() {
  return {
    channels: new Map() as Map<string, ReturnType<typeof createMockChannel>>,
    presences: new Map(),
    onlineUsers: new Map<string, Set<string>>(),
    channelHandlersSetUp: new Set<string>(),
    lastJoinAttempts: new Map<string, number>(),
    joinDebounceMs: 500,
    notifyStatusChange: vi.fn(),
    connectFn: vi.fn(() => Promise.resolve()),
  };
}

// Tests
describe('joinConversation', () => {
  let args: ReturnType<typeof makeArgs>;

  beforeEach(() => {
    vi.clearAllMocks();
    args = makeArgs();
    mockChatStore.messages = {};
  });

  it('returns null when socket is null (triggers connectFn)', () => {
    const ch = joinConversation(
      null,
      'conv1',
      args.channels as never,
      args.presences as never,
      args.onlineUsers,
      args.channelHandlersSetUp,
      args.lastJoinAttempts,
      args.joinDebounceMs,
      args.notifyStatusChange,
      args.connectFn
    );
    expect(ch).toBeNull();
    expect(args.connectFn).toHaveBeenCalled();
  });

  it('returns null when socket exists but not connected', () => {
    const socket = createMockSocket();
    socket.isConnected.mockReturnValue(false);

    const ch = joinConversation(
      socket as never,
      'conv1',
      args.channels as never,
      args.presences as never,
      args.onlineUsers,
      args.channelHandlersSetUp,
      args.lastJoinAttempts,
      args.joinDebounceMs,
      args.notifyStatusChange,
      args.connectFn
    );
    expect(ch).toBeNull();
  });

  it('creates channel and joins for new conversation', () => {
    const socket = createMockSocket();
    const ch = joinConversation(
      socket as never,
      'conv1',
      args.channels as never,
      args.presences as never,
      args.onlineUsers,
      args.channelHandlersSetUp,
      args.lastJoinAttempts,
      args.joinDebounceMs,
      args.notifyStatusChange,
      args.connectFn
    );
    expect(ch).not.toBeNull();
    expect(socket.channel).toHaveBeenCalledWith('conversation:conv1', {});
    expect(args.channels.has('conversation:conv1')).toBe(true);
  });

  it('returns existing channel if already joined', () => {
    const existing = createMockChannel('joined');
    args.channels.set('conversation:conv1', existing as never);

    const socket = createMockSocket();
    const ch = joinConversation(
      socket as never,
      'conv1',
      args.channels as never,
      args.presences as never,
      args.onlineUsers,
      args.channelHandlersSetUp,
      args.lastJoinAttempts,
      args.joinDebounceMs,
      args.notifyStatusChange,
      args.connectFn
    );
    expect(ch).toBe(existing);
    expect(socket.channel).not.toHaveBeenCalled();
  });

  it('debounces rapid join attempts', () => {
    const socket = createMockSocket();
    args.lastJoinAttempts.set('conversation:conv1', Date.now());

    const ch = joinConversation(
      socket as never,
      'conv1',
      args.channels as never,
      args.presences as never,
      args.onlineUsers,
      args.channelHandlersSetUp,
      args.lastJoinAttempts,
      args.joinDebounceMs,
      args.notifyStatusChange,
      args.connectFn
    );
    // Should not create a new channel
    expect(socket.channel).not.toHaveBeenCalled();
    expect(ch).toBeNull();
  });

  it('replaces channel in errored state', () => {
    const old = createMockChannel('errored');
    args.channels.set('conversation:conv1', old as never);
    args.channelHandlersSetUp.add('conversation:conv1');

    const socket = createMockSocket();
    const ch = joinConversation(
      socket as never,
      'conv1',
      args.channels as never,
      args.presences as never,
      args.onlineUsers,
      args.channelHandlersSetUp,
      args.lastJoinAttempts,
      args.joinDebounceMs,
      args.notifyStatusChange,
      args.connectFn
    );
    expect(ch).not.toBe(old);
    expect(ch).not.toBeNull();
  });

  it('registers all events on new channel', () => {
    const socket = createMockSocket();
    joinConversation(
      socket as never,
      'conv1',
      args.channels as never,
      args.presences as never,
      args.onlineUsers,
      args.channelHandlersSetUp,
      args.lastJoinAttempts,
      args.joinDebounceMs,
      args.notifyStatusChange,
      args.connectFn
    );

    const ch = socket._lastChannel;
    const events = ch.on.mock.calls.map((c: unknown[]) => c[0]);
    expect(events).toContain('new_message');
    expect(events).toContain('message_history');
    expect(events).toContain('message_updated');
    expect(events).toContain('message_deleted');
    expect(events).toContain('typing');
    expect(events).toContain('reaction_added');
    expect(events).toContain('reaction_removed');
    expect(events).toContain('presence_state');
    expect(events).toContain('presence_diff');
  });

  it('only sets up handlers once (idempotent)', () => {
    const socket = createMockSocket();
    args.channelHandlersSetUp.add('conversation:conv1');
    args.channels.set('conversation:conv1', createMockChannel('errored') as never);
    // Clear the errored channel from handlerSetUp so new channel joins, but
    // re-add it to simulate already set up
    args.channelHandlersSetUp.delete('conversation:conv1');

    joinConversation(
      socket as never,
      'conv1',
      args.channels as never,
      args.presences as never,
      args.onlineUsers,
      args.channelHandlersSetUp,
      args.lastJoinAttempts,
      args.joinDebounceMs,
      args.notifyStatusChange,
      args.connectFn
    );

    // First join sets up handlers
    expect(args.channelHandlersSetUp.has('conversation:conv1')).toBe(true);
  });

  it('cleans up on join error', () => {
    const socket = createMockSocket();
    joinConversation(
      socket as never,
      'conv1',
      args.channels as never,
      args.presences as never,
      args.onlineUsers,
      args.channelHandlersSetUp,
      args.lastJoinAttempts,
      args.joinDebounceMs,
      args.notifyStatusChange,
      args.connectFn
    );

    const ch = socket._lastChannel;
    ch._triggerJoin('error', { reason: 'unauthorized' });

    expect(args.channels.has('conversation:conv1')).toBe(false);
    expect(args.channelHandlersSetUp.has('conversation:conv1')).toBe(false);
    expect(args.lastJoinAttempts.has('conversation:conv1')).toBe(false);
  });

  it('routes message history through the decrypt pipeline', async () => {
    const socket = createMockSocket();

    joinConversation(
      socket as never,
      'conv1',
      args.channels as never,
      args.presences as never,
      args.onlineUsers,
      args.channelHandlersSetUp,
      args.lastJoinAttempts,
      args.joinDebounceMs,
      args.notifyStatusChange,
      args.connectFn
    );

    const ch = socket._lastChannel;
    const historyPayload = {
      messages: [
        {
          id: 'msg-1',
          conversationId: 'conv1',
          senderId: 'user-2',
          content: 'first',
          createdAt: '2026-04-01T00:00:00Z',
          updatedAt: '2026-04-01T00:00:00Z',
          sender: { id: 'user-2', username: 'alice', displayName: null, avatarUrl: null },
          messageType: 'text',
          isEncrypted: false,
          metadata: {},
          reactions: [],
          deliveryStatus: 'sent',
        },
        {
          id: 'msg-2',
          conversationId: 'conv1',
          senderId: 'user-3',
          content: 'second',
          createdAt: '2026-04-01T00:00:01Z',
          updatedAt: '2026-04-01T00:00:01Z',
          sender: { id: 'user-3', username: 'bob', displayName: null, avatarUrl: null },
          messageType: 'text',
          isEncrypted: false,
          metadata: {},
          reactions: [],
          deliveryStatus: 'sent',
        },
      ],
    };

    ch._trigger('message_history', historyPayload);

    await Promise.resolve();
    await Promise.resolve();

    expect(mockChatStore.decryptAndAddMessage).toHaveBeenCalledTimes(2);
    expect(mockChatStore.decryptAndAddMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: 'msg-1',
        conversationId: 'conv1',
        senderId: 'user-2',
        content: 'first',
      })
    );
    expect(mockChatStore.decryptAndAddMessage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: 'msg-2',
        conversationId: 'conv1',
        senderId: 'user-3',
        content: 'second',
      })
    );
  });

  it('repairs sequence gaps through the REST messages endpoint', async () => {
    const socket = createMockSocket();
    mockChatStore.messages = {
      conv1: [
        {
          id: 'msg-1',
          sequence: 1,
          conversationId: 'conv1',
          senderId: 'user-2',
          content: 'first',
          createdAt: '2026-04-01T00:00:00Z',
          updatedAt: '2026-04-01T00:00:00Z',
        },
        {
          id: 'msg-2',
          sequence: 2,
          conversationId: 'conv1',
          senderId: 'user-2',
          content: 'second',
          createdAt: '2026-04-01T00:00:01Z',
          updatedAt: '2026-04-01T00:00:01Z',
        },
        {
          id: 'msg-3',
          sequence: 3,
          conversationId: 'conv1',
          senderId: 'user-2',
          content: 'third',
          createdAt: '2026-04-01T00:00:02Z',
          updatedAt: '2026-04-01T00:00:02Z',
        },
      ],
    };

    mockHttpGet.mockResolvedValue({
      data: {
        data: [
          {
            id: 'msg-4',
            sequence: 4,
            conversationId: 'conv1',
            senderId: 'user-2',
            content: 'fourth',
            createdAt: '2026-04-01T00:00:03Z',
            updatedAt: '2026-04-01T00:00:03Z',
            sender: { id: 'user-2', username: 'alice', displayName: null, avatarUrl: null },
            messageType: 'text',
            isEncrypted: false,
            metadata: {},
            reactions: [],
            deliveryStatus: 'sent',
          },
          {
            id: 'msg-5',
            sequence: 5,
            conversationId: 'conv1',
            senderId: 'user-2',
            content: 'fifth',
            createdAt: '2026-04-01T00:00:04Z',
            updatedAt: '2026-04-01T00:00:04Z',
            sender: { id: 'user-2', username: 'alice', displayName: null, avatarUrl: null },
            messageType: 'text',
            isEncrypted: false,
            metadata: {},
            reactions: [],
            deliveryStatus: 'sent',
          },
        ],
      },
    });

    joinConversation(
      socket as never,
      'conv1',
      args.channels as never,
      args.presences as never,
      args.onlineUsers,
      args.channelHandlersSetUp,
      args.lastJoinAttempts,
      args.joinDebounceMs,
      args.notifyStatusChange,
      args.connectFn
    );

    const ch = socket._lastChannel;
    ch._trigger('new_message', {
      message: {
        id: 'msg-5',
        sequence: 5,
        conversationId: 'conv1',
        senderId: 'user-2',
        content: 'fifth',
        createdAt: '2026-04-01T00:00:04Z',
        updatedAt: '2026-04-01T00:00:04Z',
        sender: { id: 'user-2', username: 'alice', displayName: null, avatarUrl: null },
        messageType: 'text',
        isEncrypted: false,
        metadata: {},
        reactions: [],
        deliveryStatus: 'sent',
      },
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(mockHttpGet).toHaveBeenCalledWith('/api/v1/conversations/conv1/messages', {
      params: { after_sequence: 3, limit: 100 },
    });
    expect(mockChatStore.decryptAndAddMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 'msg-4', sequence: 4, content: 'fourth' })
    );
    expect(mockChatStore.decryptAndAddMessage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: 'msg-5', sequence: 5, content: 'fifth' })
    );
  });
});

describe('leaveConversation', () => {
  it('leaves channel and cleans up all state', () => {
    const ch = createMockChannel('joined');
    const channels = new Map([['conversation:conv1', ch]]);
    const handlers = new Set(['conversation:conv1']);
    const presences = new Map([['conversation:conv1', {}]]);
    const onlineUsers = new Map([['conv1', new Set(['u1'])]]);
    const lastJoinAttempts = new Map([['conversation:conv1', 1000]]);

    leaveConversation(
      'conv1',
      channels as never,
      handlers,
      presences as never,
      onlineUsers,
      lastJoinAttempts
    );

    expect(ch.leave).toHaveBeenCalled();
    expect(channels.has('conversation:conv1')).toBe(false);
    expect(handlers.has('conversation:conv1')).toBe(false);
    expect(presences.has('conversation:conv1')).toBe(false);
    expect(onlineUsers.has('conv1')).toBe(false);
    expect(lastJoinAttempts.has('conversation:conv1')).toBe(false);
  });

  it('does nothing for unknown conversation', () => {
    const channels = new Map();
    expect(() =>
      leaveConversation(
        'unknown',
        channels as never,
        new Set(),
        new Map() as never,
        new Map(),
        new Map()
      )
    ).not.toThrow();
  });

  it('clears gapRepairInFlight entry for the conversation', async () => {
    // Trigger an in-flight gap repair by sending a message with a sequence
    // gap; the repair fetches via http.get, which we hold open with a
    // never-resolving promise so the entry stays in the map.
    let releaseHttp: (value: unknown) => void = () => {};
    mockHttpGet.mockReturnValue(
      new Promise((resolve) => {
        releaseHttp = resolve;
      })
    );
    mockChatStore.messages = {
      'conv-leak': [
        {
          id: 'msg-1',
          sequence: 1,
          conversationId: 'conv-leak',
          senderId: 'user-2',
          content: 'first',
          createdAt: '2026-04-01T00:00:00Z',
          updatedAt: '2026-04-01T00:00:00Z',
        },
      ],
    };

    const local = makeArgs();
    const socket = createMockSocket();
    joinConversation(
      socket as never,
      'conv-leak',
      local.channels as never,
      local.presences as never,
      local.onlineUsers,
      local.channelHandlersSetUp,
      local.lastJoinAttempts,
      local.joinDebounceMs,
      local.notifyStatusChange,
      local.connectFn
    );

    const ch = socket._lastChannel;
    ch._trigger('new_message', {
      message: {
        id: 'msg-9',
        sequence: 9,
        conversationId: 'conv-leak',
        senderId: 'user-2',
        content: 'jump-ahead',
        createdAt: '2026-04-01T00:00:09Z',
        updatedAt: '2026-04-01T00:00:09Z',
        sender: { id: 'user-2', username: 'alice', displayName: null, avatarUrl: null },
        messageType: 'text',
        isEncrypted: false,
        metadata: {},
        reactions: [],
        deliveryStatus: 'sent',
      },
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(_gapRepairInFlightHas('conv-leak')).toBe(true);

    leaveConversation(
      'conv-leak',
      local.channels as never,
      local.channelHandlersSetUp,
      local.presences as never,
      local.onlineUsers,
      local.lastJoinAttempts
    );

    expect(_gapRepairInFlightHas('conv-leak')).toBe(false);

    // Drain the held http.get so the in-flight promise can settle and stop
    // tripping vitest's open-handle warning.
    releaseHttp({ data: { data: [] } });
    await Promise.resolve();
    await Promise.resolve();
  });

  it('clears gapRepairInFlight when channel.onClose fires', async () => {
    let releaseHttp: (value: unknown) => void = () => {};
    mockHttpGet.mockReturnValue(
      new Promise((resolve) => {
        releaseHttp = resolve;
      })
    );
    mockChatStore.messages = {
      'conv-close': [
        {
          id: 'msg-1',
          sequence: 1,
          conversationId: 'conv-close',
          senderId: 'user-2',
          content: 'first',
          createdAt: '2026-04-01T00:00:00Z',
          updatedAt: '2026-04-01T00:00:00Z',
        },
      ],
    };

    const local = makeArgs();
    const socket = createMockSocket();
    joinConversation(
      socket as never,
      'conv-close',
      local.channels as never,
      local.presences as never,
      local.onlineUsers,
      local.channelHandlersSetUp,
      local.lastJoinAttempts,
      local.joinDebounceMs,
      local.notifyStatusChange,
      local.connectFn
    );

    const ch = socket._lastChannel;
    ch._trigger('new_message', {
      message: {
        id: 'msg-9',
        sequence: 9,
        conversationId: 'conv-close',
        senderId: 'user-2',
        content: 'jump-ahead',
        createdAt: '2026-04-01T00:00:09Z',
        updatedAt: '2026-04-01T00:00:09Z',
        sender: { id: 'user-2', username: 'alice', displayName: null, avatarUrl: null },
        messageType: 'text',
        isEncrypted: false,
        metadata: {},
        reactions: [],
        deliveryStatus: 'sent',
      },
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(_gapRepairInFlightHas('conv-close')).toBe(true);

    ch._triggerClose();

    expect(_gapRepairInFlightHas('conv-close')).toBe(false);

    releaseHttp({ data: { data: [] } });
    await Promise.resolve();
    await Promise.resolve();
  });
});

describe('lastJoinAttempts LRU cap', () => {
  it('caps lastJoinAttempts at 200 entries via insertion-order LRU', () => {
    const local = makeArgs();
    const socket = createMockSocket();

    // 250 distinct conversations triggers 250 inserts; the cap should hold at 200.
    for (let i = 0; i < 250; i++) {
      // Force a fresh socket+channel for every join so debounce never trips.
      const freshSocket = createMockSocket();
      joinConversation(
        freshSocket as never,
        `conv-${i}`,
        local.channels as never,
        local.presences as never,
        local.onlineUsers,
        local.channelHandlersSetUp,
        local.lastJoinAttempts,
        local.joinDebounceMs,
        local.notifyStatusChange,
        local.connectFn
      );
    }

    expect(local.lastJoinAttempts.size).toBeLessThanOrEqual(200);
    expect(local.lastJoinAttempts.has('conversation:conv-249')).toBe(true);
    // Oldest should have been evicted
    expect(local.lastJoinAttempts.has('conversation:conv-0')).toBe(false);
    // Avoid unused warning on shared socket arg
    void socket;
  });
});
