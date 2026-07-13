/**
 * MSW (Mock Service Worker) Handlers
 *
 * Comprehensive API mocks for testing. These handlers simulate the backend
 * API responses for unit and integration tests.
 *
 * @see https://mswjs.io/docs/
 * @updated v0.9.9 - Added comprehensive handlers for all API endpoints
 */

import { http, HttpResponse, delay } from 'msw';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Mock Data Factories

const mockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'user-1',
  uid: '1234567890',
  email: 'demo@example.com',
  username: 'demo',
  displayName: 'Demo User',
  avatarUrl: null,
  level: 1,
  xp: 0,
  pulse: 0,
  isVerified: true,
  isPremium: false,
  isAdmin: false,
  status: 'online',
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const mockMessage = (overrides: Partial<MockMessage> = {}): MockMessage => ({
  id: `msg-${Date.now()}`,
  conversationId: 'conv-1',
  senderId: 'user-1',
  content: 'Test message',
  messageType: 'text',
  isEncrypted: false,
  isEdited: false,
  reactions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const mockConversation = (overrides: Partial<MockConversation> = {}): MockConversation => ({
  id: 'conv-1',
  type: 'direct',
  conversationType: 'cloud',
  name: null,
  participants: [
    {
      id: 'part-1',
      userId: 'user-1',
      user: mockUser(),
      nickname: null,
      isMuted: false,
      mutedUntil: null,
      joinedAt: '2026-01-01T00:00:00Z',
    },
  ],
  lastMessage: null,
  unreadCount: 0,
  isPinned: false,
  isMuted: false,
  isNoteToSelf: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const mockFriend = (overrides: Partial<MockFriend> = {}): MockFriend => ({
  id: 'friend-1',
  username: 'testfriend',
  displayName: 'Test Friend',
  avatarUrl: null,
  status: 'online',
  friendshipId: 'friendship-1',
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

// Type Definitions

interface MockUser {
  id: string;
  uid: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  xp: number;
  pulse: number;
  isVerified: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  status: string;
  createdAt: string;
}

interface MockMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  isEncrypted: boolean;
  isEdited: boolean;
  reactions: Array<{ emoji: string; userId: string }>;
  createdAt: string;
  updatedAt: string;
}

interface MockConversation {
  id: string;
  type: string;
  conversationType: 'secret' | 'cloud';
  name: string | null;
  participants: Array<{
    id: string;
    userId: string;
    user: MockUser;
    nickname: string | null;
    isMuted: boolean;
    mutedUntil: string | null;
    joinedAt: string;
  }>;
  lastMessage: MockMessage | null;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isNoteToSelf: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MockSpace {
  id: string;
  name: string;
  emoji: string;
  position: number;
  includeAllIndividual: boolean;
  includeAllGroups: boolean;
  showOnlyUnread: boolean;
  showMuted: boolean;
  includedConversationIds: string[];
  excludedConversationIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface MockFriend {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  status: string;
  friendshipId: string;
  createdAt: string;
}

type JsonRecord = Record<string, unknown>;
type RouteParams = Record<string, string | readonly string[] | undefined>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null;
}

async function readJsonRecord(request: Request): Promise<JsonRecord> {
  const body: unknown = await request.json();
  return isJsonRecord(body) ? body : {};
}

function readString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function readNullableString(record: JsonRecord, key: string): string | null | undefined {
  const value = record[key];
  if (typeof value === 'string' || value === null) {
    return value;
  }
  return undefined;
}

function readNumber(record: JsonRecord, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' ? value : undefined;
}

function readBoolean(record: JsonRecord, key: string): boolean | undefined {
  const value = record[key];
  return typeof value === 'boolean' ? value : undefined;
}

function readRouteParam(params: RouteParams, key: string): string {
  const value = params[key];
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return '';
}

function toMockUserOverrides(record: JsonRecord): Partial<MockUser> {
  const overrides: Partial<MockUser> = {};

  const id = readString(record, 'id');
  if (id !== undefined) overrides.id = id;

  const uid = readString(record, 'uid');
  if (uid !== undefined) overrides.uid = uid;

  const email = readString(record, 'email');
  if (email !== undefined) overrides.email = email;

  const username = readString(record, 'username');
  if (username !== undefined) overrides.username = username;

  const displayName = readNullableString(record, 'displayName');
  if (displayName !== undefined) overrides.displayName = displayName;

  const avatarUrl = readNullableString(record, 'avatarUrl');
  if (avatarUrl !== undefined) overrides.avatarUrl = avatarUrl;

  const level = readNumber(record, 'level');
  if (level !== undefined) overrides.level = level;

  const xp = readNumber(record, 'xp');
  if (xp !== undefined) overrides.xp = xp;

  const pulse = readNumber(record, 'pulse');
  if (pulse !== undefined) overrides.pulse = pulse;

  const isVerified = readBoolean(record, 'isVerified');
  if (isVerified !== undefined) overrides.isVerified = isVerified;

  const isPremium = readBoolean(record, 'isPremium');
  if (isPremium !== undefined) overrides.isPremium = isPremium;

  const isAdmin = readBoolean(record, 'isAdmin');
  if (isAdmin !== undefined) overrides.isAdmin = isAdmin;

  const status = readString(record, 'status');
  if (status !== undefined) overrides.status = status;

  const createdAt = readString(record, 'createdAt');
  if (createdAt !== undefined) overrides.createdAt = createdAt;

  return overrides;
}

// Health Check Handler

const healthHandlers = [
  http.get(`${API_BASE}/api/v1/health`, () => {
    return HttpResponse.json({ status: 'healthy', timestamp: Date.now() });
  }),
];

// Authentication Handlers

const authHandlers = [
  // Login
  http.post(`${API_BASE}/api/v1/auth/login`, async ({ request }) => {
    const body = await readJsonRecord(request);
    const identifier = readString(body, 'identifier');
    const password = readString(body, 'password');
    const idempotencyKey = request.headers.get('idempotency-key');

    if (!identifier || !password) {
      return HttpResponse.json({ error: 'missing_credentials' }, { status: 400 });
    }

    if (!idempotencyKey) {
      return HttpResponse.json({ error: 'missing_idempotency' }, { status: 400 });
    }

    // Simulate invalid credentials
    if (password === 'wrongpassword') {
      return HttpResponse.json({ error: 'invalid_credentials' }, { status: 401 });
    }

    return HttpResponse.json({
      data: {
        tokens: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
        },
        user: mockUser({ email: `${identifier}@example.com` }),
      },
    });
  }),

  // Register
  http.post(`${API_BASE}/api/v1/auth/register`, async ({ request }) => {
    const body = await readJsonRecord(request);
    const email = readString(body, 'email');
    const password = readString(body, 'password');
    const username = readString(body, 'username');

    if (!email || !password || !username) {
      return HttpResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    return HttpResponse.json(
      {
        data: {
          tokens: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
          },
          user: mockUser({ email, username }),
        },
      },
      { status: 201 }
    );
  }),

  // Logout
  http.post(`${API_BASE}/api/v1/auth/logout`, () => {
    return HttpResponse.json({ data: { message: 'Logged out successfully' } });
  }),

  // Refresh token
  http.post(`${API_BASE}/api/v1/auth/refresh`, async ({ request }) => {
    const body = await readJsonRecord(request);
    const refreshToken = readString(body, 'refresh_token');

    if (!refreshToken || refreshToken === 'expired') {
      return HttpResponse.json({ error: 'invalid_token' }, { status: 401 });
    }

    return HttpResponse.json({
      data: {
        access_token: 'mock-new-access-token',
        refresh_token: 'mock-new-refresh-token',
      },
    });
  }),

  // Get current user
  http.get(`${API_BASE}/api/v1/users/me`, () => {
    return HttpResponse.json({ data: mockUser() });
  }),

  // Update current user
  http.patch(`${API_BASE}/api/v1/users/me`, async ({ request }) => {
    const body = await readJsonRecord(request);
    return HttpResponse.json({ data: mockUser(toMockUserOverrides(body)) });
  }),
];

// Messages Handlers

const messageHandlers = [
  // List Spaces
  http.get(`${API_BASE}/api/v1/spaces`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'space-1',
          name: 'Unread',
          emoji: '!',
          position: 0,
          includeAllIndividual: true,
          includeAllGroups: true,
          showOnlyUnread: true,
          showMuted: true,
          includedConversationIds: [],
          excludedConversationIds: [],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        } satisfies MockSpace,
      ],
    });
  }),

  // Create Space
  http.post(`${API_BASE}/api/v1/spaces`, async ({ request }) => {
    const body = await readJsonRecord(request);
    return HttpResponse.json(
      {
        data: {
          id: `space-${Date.now()}`,
          name: readString(body, 'name') ?? 'New Space',
          emoji: readString(body, 'emoji') ?? '',
          position: 1,
          includeAllIndividual: body.include_all_individual !== false,
          includeAllGroups: body.include_all_groups !== false,
          showOnlyUnread: body.show_only_unread === true,
          showMuted: body.show_muted !== false,
          includedConversationIds: [],
          excludedConversationIds: [],
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        } satisfies MockSpace,
      },
      { status: 201 }
    );
  }),

  // List conversations
  http.get(`${API_BASE}/api/v1/conversations`, () => {
    return HttpResponse.json({
      data: [mockConversation()],
      meta: { page: 1, total: 1 },
    });
  }),

  // Get single conversation
  http.get(`${API_BASE}/api/v1/conversations/:id`, ({ params }) => {
    const id = readRouteParam(params, 'id');
    return HttpResponse.json({
      data: mockConversation({ id }),
    });
  }),

  // Create conversation
  http.post(`${API_BASE}/api/v1/conversations`, async () => {
    return HttpResponse.json(
      {
        data: mockConversation({
          id: `conv-${Date.now()}`,
        }),
      },
      { status: 201 }
    );
  }),

  // Create or fetch web Vault / Note to Self conversation
  http.post(`${API_BASE}/api/v1/conversations/note-to-self`, async () => {
    return HttpResponse.json({
      data: mockConversation({
        id: 'vault-conv-1',
        name: 'Vault',
        isNoteToSelf: true,
      }),
    });
  }),

  // List messages in conversation
  http.get(`${API_BASE}/api/v1/conversations/:id/messages`, ({ params }) => {
    const id = readRouteParam(params, 'id');
    return HttpResponse.json({
      data: [
        mockMessage({ conversationId: id, content: 'First message' }),
        mockMessage({ conversationId: id, content: 'Second message' }),
      ],
      meta: { page: 1, total: 2, hasMore: false },
    });
  }),

  // List shared media in conversation
  http.get('*/api/v1/conversations/:id/media', ({ params }) => {
    return HttpResponse.json({
      data: {
        media: [
          {
            id: 'media-1',
            content: 'https://example.com/photo.jpg',
            content_type: 'image',
            sender_id: 'user-1',
            sender: mockUser({ id: 'user-1' }),
            conversation_id: readRouteParam(params, 'id'),
            file_url: 'https://example.com/photo.jpg',
            file_name: 'photo.jpg',
            file_size: 12345,
            file_mime_type: 'image/jpeg',
            thumbnail_url: 'https://example.com/photo-thumb.jpg',
            link_preview: null,
            inserted_at: '2026-01-01T00:00:00Z',
          },
        ],
        meta: {
          has_next_page: false,
          end_cursor: null,
        },
      },
    });
  }),

  // Send message
  http.post(`${API_BASE}/api/v1/conversations/:id/messages`, async ({ params, request }) => {
    const id = readRouteParam(params, 'id');
    const body = await readJsonRecord(request);
    const content = readString(body, 'content') ?? '';

    await delay(100); // Simulate network latency

    return HttpResponse.json(
      {
        data: mockMessage({
          conversationId: id,
          content,
        }),
      },
      { status: 201 }
    );
  }),

  // Update message (edit)
  http.patch(`${API_BASE}/api/v1/messages/:id`, async ({ params, request }) => {
    const id = readRouteParam(params, 'id');
    const body = await readJsonRecord(request);
    const content = readString(body, 'content') ?? '';

    return HttpResponse.json({
      data: mockMessage({
        id,
        content,
        isEdited: true,
      }),
    });
  }),

  // Delete message
  http.delete(`${API_BASE}/api/v1/messages/:id`, ({ params: _params }) => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Add reaction
  http.post(`${API_BASE}/api/v1/messages/:id/reactions`, async ({ params, request }) => {
    const id = readRouteParam(params, 'id');
    const body = await readJsonRecord(request);
    const emoji = readString(body, 'emoji') ?? '';

    return HttpResponse.json(
      {
        data: { messageId: id, emoji, userId: 'user-1' },
      },
      { status: 201 }
    );
  }),

  // Remove reaction
  http.delete(`${API_BASE}/api/v1/messages/:id/reactions/:emoji`, () => {
    return new HttpResponse(null, { status: 204 });
  }),
];

// Friends Handlers

const friendHandlers = [
  // List friends
  http.get(`${API_BASE}/api/v1/friends`, () => {
    return HttpResponse.json({
      data: [mockFriend(), mockFriend({ id: 'friend-2', username: 'friend2' })],
    });
  }),

  // Send friend request
  http.post(`${API_BASE}/api/v1/friends/requests`, async ({ request }) => {
    const body = await readJsonRecord(request);
    const userId = readString(body, 'userId') ?? '';
    return HttpResponse.json(
      {
        data: { id: 'request-1', userId, status: 'pending' },
      },
      { status: 201 }
    );
  }),

  // List pending requests
  http.get(`${API_BASE}/api/v1/friends/requests`, () => {
    return HttpResponse.json({
      data: {
        incoming: [
          {
            id: 'request-1',
            user: mockUser({ id: 'user-2', username: 'requester' }),
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
        outgoing: [],
      },
    });
  }),

  // Accept friend request
  http.post(`${API_BASE}/api/v1/friends/requests/:id/accept`, ({ params }) => {
    return HttpResponse.json({
      data: mockFriend({ friendshipId: readRouteParam(params, 'id') }),
    });
  }),

  // Reject friend request
  http.post(`${API_BASE}/api/v1/friends/requests/:id/reject`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Remove friend
  http.delete(`${API_BASE}/api/v1/friends/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Block user
  http.post(`${API_BASE}/api/v1/users/:id/block`, () => {
    return HttpResponse.json({ data: { blocked: true } });
  }),

  // Unblock user
  http.delete(`${API_BASE}/api/v1/users/:id/block`, () => {
    return HttpResponse.json({ data: { blocked: false } });
  }),
];

// Settings Handlers

const settingsHandlers = [
  // Get user settings
  http.get(`${API_BASE}/api/v1/settings`, () => {
    return HttpResponse.json({
      data: {
        notifications: { email_enabled: true, push_enabled: true },
        privacy: { online_status_visible: true, read_receipts_enabled: true },
        appearance: { theme: 'system', fontSize: 'medium' },
      },
    });
  }),

  // Update all user settings
  http.put(`${API_BASE}/api/v1/settings`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: body });
  }),

  // Update a server-defined settings section
  http.put(`${API_BASE}/api/v1/settings/:section`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: body });
  }),

  http.post(`${API_BASE}/api/v1/settings/reset`, () => HttpResponse.json({ data: {} })),
];

// Onboarding Handlers

const onboardingHandlers = [
  http.get('*/api/v1/onboarding/status', () => {
    return HttpResponse.json({
      data: {
        completed: true,
        steps: {
          send_first_message: true,
          join_or_create_hub: true,
          customize_profile: true,
          enable_e2ee_backup: true,
        },
      },
    });
  }),

  http.post('*/api/v1/onboarding/complete-step', async ({ request }) => {
    const body = await readJsonRecord(request);
    const completedStep = readString(body, 'step');
    return HttpResponse.json({
      data: {
        completed: false,
        steps: {
          send_first_message: completedStep === 'send_first_message',
          join_or_create_hub: completedStep === 'join_or_create_hub',
          customize_profile: completedStep === 'customize_profile',
          enable_e2ee_backup: completedStep === 'enable_e2ee_backup',
        },
      },
    });
  }),

  http.post('*/api/v1/onboarding/skip', () => {
    return HttpResponse.json({ data: { completed: true } });
  }),
];

// Notifications Handlers

const notificationHandlers = [
  // List notifications
  http.get(`${API_BASE}/api/v1/notifications`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'notif-1',
          type: 'friend_request',
          title: 'New friend request',
          read: false,
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 'notif-2',
          type: 'message',
          title: 'New message',
          read: true,
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      meta: { unreadCount: 1 },
    });
  }),

  // Mark notification as read
  http.patch(`${API_BASE}/api/v1/notifications/:id/read`, () => {
    return HttpResponse.json({ data: { read: true } });
  }),

  // Mark all as read
  http.post(`${API_BASE}/api/v1/notifications/read-all`, () => {
    return HttpResponse.json({ data: { updatedCount: 5 } });
  }),
];

// Forum Handlers

const forumHandlers = [
  // List forums
  http.get(`${API_BASE}/api/v1/forums`, () => {
    return HttpResponse.json({
      data: [
        { id: 'forum-1', name: 'General', description: 'General discussion', memberCount: 100 },
        { id: 'forum-2', name: 'Tech', description: 'Technology talk', memberCount: 50 },
      ],
    });
  }),

  // Get forum details
  http.get(`${API_BASE}/api/v1/forums/:id`, ({ params }) => {
    return HttpResponse.json({
      data: { id: params.id, name: 'General', description: 'General discussion', memberCount: 100 },
    });
  }),

  // List forum posts
  http.get(`${API_BASE}/api/v1/forums/:id/posts`, () => {
    return HttpResponse.json({
      data: [
        {
          id: 'post-1',
          title: 'First post',
          content: 'Hello world',
          authorId: 'user-1',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      meta: { page: 1, total: 1 },
    });
  }),

  // Create forum post
  http.post(`${API_BASE}/api/v1/forums/:id/posts`, async ({ request }) => {
    const body = await readJsonRecord(request);
    const title = readString(body, 'title') ?? '';
    const content = readString(body, 'content') ?? '';
    return HttpResponse.json(
      {
        data: {
          id: 'post-new',
          title,
          content,
          authorId: 'user-1',
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  }),
];

// Upload Handlers

const uploadHandlers = [
  // Upload file
  http.post(`${API_BASE}/api/v1/uploads`, async () => {
    await delay(500); // Simulate upload time
    return HttpResponse.json(
      {
        data: {
          url: 'https://cdn.example.com/uploads/file-123.png',
          filename: 'file-123.png',
          size: 1024,
          mimeType: 'image/png',
        },
      },
      { status: 201 }
    );
  }),
];

// Export All Handlers

export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...messageHandlers,
  ...friendHandlers,
  ...settingsHandlers,
  ...onboardingHandlers,
  ...notificationHandlers,
  ...forumHandlers,
  ...uploadHandlers,
];

// Re-export factories for use in tests
export { mockUser, mockMessage, mockConversation, mockFriend };
