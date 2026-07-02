import { expect, test, type Page, type Route } from '@playwright/test';

const CURRENT_USER_ID = 'e2e-user';
const FRIEND_USER_ID = 'web-acceptance-friend';
const INCOMING_USER_ID = 'web-acceptance-incoming';
const OUTGOING_FRIENDSHIP_ID = 'friendship-outgoing-web-acceptance';
const INCOMING_FRIENDSHIP_ID = 'friendship-incoming-web-acceptance';
const CONVERSATION_ID = 'conversation-cloud-web-acceptance';

const currentUser = {
  id: CURRENT_USER_ID,
  username: 'e2e-user',
  display_name: 'E2E User',
  avatar_url: null,
  status: 'online',
};

const friendUser = {
  id: FRIEND_USER_ID,
  username: 'bob_acceptance',
  display_name: 'Bob Acceptance',
  avatar_url: null,
  status: 'online',
};

const incomingUser = {
  id: INCOMING_USER_ID,
  username: 'alice_acceptance',
  display_name: 'Alice Acceptance',
  avatar_url: null,
  status: 'online',
};

function conversationFixture() {
  return {
    id: CONVERSATION_ID,
    type: 'direct',
    conversationType: 'cloud',
    name: null,
    avatarUrl: null,
    participants: [
      {
        id: 'participant-current',
        userId: CURRENT_USER_ID,
        nickname: null,
        isMuted: false,
        mutedUntil: null,
        joinedAt: '2026-07-03T00:00:00.000Z',
        user: {
          id: CURRENT_USER_ID,
          username: currentUser.username,
          displayName: currentUser.display_name,
          avatarUrl: null,
          status: 'online',
        },
      },
      {
        id: 'participant-friend',
        userId: FRIEND_USER_ID,
        nickname: null,
        isMuted: false,
        mutedUntil: null,
        joinedAt: '2026-07-03T00:00:00.000Z',
        user: {
          id: FRIEND_USER_ID,
          username: friendUser.username,
          displayName: friendUser.display_name,
          avatarUrl: null,
          status: 'online',
        },
      },
    ],
    lastMessage: null,
    lastMessageAt: null,
    unreadCount: 0,
    muted: false,
    pinned: false,
    isMuted: false,
    mutedUntil: null,
    isArchived: false,
    isPinned: false,
    isNoteToSelf: false,
    createdAt: '2026-07-03T00:00:00.000Z',
    updatedAt: '2026-07-03T00:00:00.000Z',
  };
}

function messageFixture(overrides: Record<string, unknown>) {
  return {
    id: 'message-existing-cloud',
    clientMessageId: null,
    sequence: 1,
    conversationId: CONVERSATION_ID,
    senderId: FRIEND_USER_ID,
    displayContent: 'Existing hello from Bob',
    content: null,
    contentType: 'text',
    messageType: 'text',
    encryptedContent: 'cloud-envelope',
    isEncrypted: true,
    requiresMobile: false,
    isEdited: false,
    isPinned: false,
    replyToId: null,
    replyTo: null,
    deletedAt: null,
    metadata: {},
    reactions: [],
    sender: {
      id: FRIEND_USER_ID,
      username: friendUser.username,
      displayName: friendUser.display_name,
      avatarUrl: null,
    },
    createdAt: '2026-07-03T00:00:00.000Z',
    updatedAt: '2026-07-03T00:00:00.000Z',
    ...overrides,
  };
}

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installPostRegistrationMocks(page: Page): Promise<{
  acceptedRequests: string[];
  conversationCreates: Record<string, unknown>[];
  friendRequestCreates: Record<string, unknown>[];
  sentMessages: Record<string, unknown>[];
}> {
  const acceptedRequests: string[] = [];
  const conversationCreates: Record<string, unknown>[] = [];
  const friendRequestCreates: Record<string, unknown>[] = [];
  const sentMessages: Record<string, unknown>[] = [];
  const messages = [messageFixture({})];
  let sentRequestCreated = false;
  let incomingAccepted = false;
  let conversationCreated = false;

  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.route('**/api/v1/**', async (route, request) => {
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if ((path === '/api/v1/me' || path === '/api/v1/users/me') && method === 'GET') {
      await fulfillJson(route, { data: currentUser, user: currentUser });
      return;
    }

    if (path === '/api/v1/conversations' && method === 'GET') {
      await fulfillJson(route, {
        data: conversationCreated ? [conversationFixture()] : [],
        page_info: {
          has_next_page: false,
          has_previous_page: false,
          start_cursor: null,
          end_cursor: null,
        },
      });
      return;
    }

    if (path === '/api/v1/conversations' && method === 'POST') {
      conversationCreates.push(request.postDataJSON() as Record<string, unknown>);
      conversationCreated = true;
      await fulfillJson(route, { data: conversationFixture() }, 201);
      return;
    }

    if (path === `/api/v1/conversations/${CONVERSATION_ID}/messages` && method === 'GET') {
      await fulfillJson(route, {
        data: messages,
        page_info: {
          has_next_page: false,
          has_previous_page: false,
          start_cursor: null,
          end_cursor: null,
        },
      });
      return;
    }

    if (path === `/api/v1/conversations/${CONVERSATION_ID}/messages` && method === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      sentMessages.push(body);
      const message = messageFixture({
        id: 'message-current-cloud',
        clientMessageId: body.client_message_id ?? null,
        sequence: 2,
        senderId: CURRENT_USER_ID,
        displayContent: body.content,
        encryptedContent: 'cloud-envelope-current',
        sender: {
          id: CURRENT_USER_ID,
          username: currentUser.username,
          displayName: currentUser.display_name,
          avatarUrl: null,
        },
        createdAt: '2026-07-03T00:00:01.000Z',
        updatedAt: '2026-07-03T00:00:01.000Z',
      });
      messages.push(message);
      await fulfillJson(route, { data: message }, 201);
      return;
    }

    if (path === `/api/v1/conversations/${CONVERSATION_ID}/read` && method === 'POST') {
      await fulfillJson(route, {
        status: 'ok',
        conversationId: CONVERSATION_ID,
        unreadCount: 0,
      });
      return;
    }

    if (path === `/api/v1/message-requests/${CONVERSATION_ID}` && method === 'GET') {
      await fulfillJson(route, { data: { status: 'accepted', conversation_id: CONVERSATION_ID } });
      return;
    }

    if (path === '/api/v1/friends' && method === 'GET') {
      await fulfillJson(route, {
        data: incomingAccepted
          ? [
              {
                id: INCOMING_FRIENDSHIP_ID,
                user: incomingUser,
                nickname: null,
                is_favorite: false,
                since: '2026-07-03T00:00:00.000Z',
              },
            ]
          : [],
      });
      return;
    }

    if (path === '/api/v1/friends' && method === 'POST') {
      friendRequestCreates.push(request.postDataJSON() as Record<string, unknown>);
      sentRequestCreated = true;
      await fulfillJson(route, {
        data: {
          id: OUTGOING_FRIENDSHIP_ID,
          user_id: CURRENT_USER_ID,
          friend_id: FRIEND_USER_ID,
          status: 'pending',
          created_at: '2026-07-03T00:00:00.000Z',
          accepted_at: null,
        },
      }, 201);
      return;
    }

    if (path === '/api/v1/friends/requests' && method === 'GET') {
      await fulfillJson(route, {
        data: incomingAccepted
          ? []
          : [
              {
                id: INCOMING_FRIENDSHIP_ID,
                from: incomingUser,
                mutual_friends_count: 0,
                sent_at: '2026-07-03T00:00:00.000Z',
              },
            ],
      });
      return;
    }

    if (path === '/api/v1/friends/sent' && method === 'GET') {
      await fulfillJson(route, {
        data: sentRequestCreated
          ? [
              {
                id: OUTGOING_FRIENDSHIP_ID,
                to: friendUser,
                sent_at: '2026-07-03T00:00:00.000Z',
              },
            ]
          : [],
      });
      return;
    }

    if (path === `/api/v1/friends/${INCOMING_FRIENDSHIP_ID}/accept` && method === 'POST') {
      acceptedRequests.push(INCOMING_FRIENDSHIP_ID);
      incomingAccepted = true;
      await fulfillJson(route, {
        data: {
          id: INCOMING_FRIENDSHIP_ID,
          user_id: INCOMING_USER_ID,
          friend_id: CURRENT_USER_ID,
          status: 'accepted',
          created_at: '2026-07-03T00:00:00.000Z',
          accepted_at: '2026-07-03T00:00:05.000Z',
        },
      });
      return;
    }

    if (path === '/api/v1/notifications' && method === 'GET') {
      await fulfillJson(route, {
        data: [
          {
            id: 'notification-friend-request',
            type: 'friend_request',
            title: 'New friend request',
            body: 'Alice Acceptance sent you a friend request',
            is_read: false,
            actor: incomingUser,
            data: {},
            created_at: '2026-07-03T00:00:00.000Z',
          },
        ],
      });
      return;
    }

    if (path === '/api/v1/spaces' && method === 'GET') {
      await fulfillJson(route, { data: [] });
      return;
    }

    if (path === '/api/v1/onboarding/status' && method === 'GET') {
      await fulfillJson(route, {
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
      return;
    }

    await fulfillJson(route, { data: {} });
  });

  return {
    acceptedRequests,
    conversationCreates,
    friendRequestCreates,
    sentMessages,
  };
}

test.describe('Post-registration Cloud DM web acceptance', () => {
  test('surfaces friend requests, opens Cloud DM, sends, and refetches ordered messages', async ({
    page,
  }) => {
    const calls = await installPostRegistrationMocks(page);

    await page.goto('/messages');
    await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Add friend' }).click();
    await page.getByPlaceholder(/@username/i).fill(friendUser.username);
    await page.getByRole('button', { name: 'Send Request' }).click();

    await expect.poll(() => calls.friendRequestCreates).toEqual([
      { username: friendUser.username },
    ]);
    await expect(page.getByText('Request sent', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Close add friend' }).click();
    await page.getByRole('button', { name: /friend requests/i }).click();

    await expect(page.getByRole('region', { name: 'Friend requests' })).toBeVisible();
    await expect(page.getByText('Bob Acceptance')).toBeVisible();
    await expect(page.getByText('Alice Acceptance')).toBeVisible();

    await page.getByRole('button', { name: 'Accept' }).click();
    await expect.poll(() => calls.acceptedRequests).toEqual([INCOMING_FRIENDSHIP_ID]);
    await expect(page.getByText('Friend request accepted.')).toBeVisible();

    await page.goto(`/messages?userId=${FRIEND_USER_ID}`);
    await expect(page).toHaveURL(new RegExp(`/messages/${CONVERSATION_ID}$`));
    await expect
      .poll(() => calls.conversationCreates)
      .toContainEqual({ participant_ids: [FRIEND_USER_ID], type: 'cloud' });

    await expect(page.getByPlaceholder(/type a message/i)).toBeVisible();
    await expect(page.getByLabel('Conversation messages')).toContainText('Existing hello from Bob');

    await page.getByPlaceholder(/type a message/i).fill('Browser Cloud proof');
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect.poll(() => calls.sentMessages.map((body) => body.content)).toEqual([
      'Browser Cloud proof',
    ]);
    await expect(page.getByLabel('Conversation messages')).toContainText('Browser Cloud proof');

    await page.reload();
    await expect(page).toHaveURL(new RegExp(`/messages/${CONVERSATION_ID}$`));
    await expect(page.getByPlaceholder(/type a message/i)).toBeVisible();

    const messages = page.getByLabel('Conversation messages');
    await expect(messages).toContainText('Existing hello from Bob');
    await expect(messages).toContainText('Browser Cloud proof');
  });
});
