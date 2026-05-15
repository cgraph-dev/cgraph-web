import { test, expect, type Page } from '@playwright/test';

const UNREAD_SPACE_ID = 'space-unread';
const CREATED_SPACE_ID = 'space-created';
const CURRENT_USER_ID = 'e2e-user';
const ACTIVE_CONVERSATION_ID = '66666666-6666-4666-8666-666666666666';
const QUIET_CONVERSATION_ID = '77777777-7777-4777-8777-777777777777';

const activeConversation = {
  id: ACTIVE_CONVERSATION_ID,
  type: 'direct',
  conversationType: 'cloud',
  name: 'Priority Chat',
  avatarUrl: null,
  participants: [
    {
      id: 'part-current',
      userId: CURRENT_USER_ID,
      nickname: null,
      isMuted: false,
      mutedUntil: null,
      joinedAt: '2026-01-01T00:00:00.000Z',
      user: {
        id: CURRENT_USER_ID,
        username: 'e2e-user',
        displayName: 'E2E User',
        avatarUrl: null,
        status: 'online',
      },
    },
    {
      id: 'part-friend',
      userId: 'friend-user',
      nickname: null,
      isMuted: false,
      mutedUntil: null,
      joinedAt: '2026-01-01T00:00:00.000Z',
      user: {
        id: 'friend-user',
        username: 'friend',
        displayName: 'Friend',
        avatarUrl: null,
        status: 'online',
      },
    },
  ],
  lastMessage: {
    id: 'msg-active',
    conversationId: ACTIVE_CONVERSATION_ID,
    senderId: 'friend-user',
    content: 'Unread proof',
    messageType: 'text',
    isEncrypted: false,
    isEdited: false,
    isPinned: false,
    replyToId: null,
    replyTo: null,
    deletedAt: null,
    metadata: {},
    reactions: [],
    sender: {
      id: 'friend-user',
      username: 'friend',
      displayName: 'Friend',
      avatarUrl: null,
      status: 'online',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  unreadCount: 3,
  isMuted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const quietConversation = {
  ...activeConversation,
  id: QUIET_CONVERSATION_ID,
  name: 'Quiet Chat',
  lastMessage: { ...activeConversation.lastMessage, content: 'Already read' },
  unreadCount: 0,
};

const unreadSpace = {
  id: UNREAD_SPACE_ID,
  name: 'Unread',
  emoji: '!',
  position: 0,
  includeAllIndividual: true,
  includeAllGroups: true,
  showOnlyUnread: true,
  showMuted: true,
  includedConversationIds: [],
  excludedConversationIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

async function installSpacesMocks(page: Page): Promise<{
  createdSpaces: Record<string, unknown>[];
}> {
  const createdSpaces: Record<string, unknown>[] = [];
  const persistedSpaces: Record<string, unknown>[] = [];

  await page.route('**/api/v1/spaces**', async (route, request) => {
    const url = new URL(request.url());

    if (url.pathname === '/api/v1/spaces' && request.method() === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: [unreadSpace, ...persistedSpaces] }),
      });
      return;
    }

    if (url.pathname === '/api/v1/spaces' && request.method() === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      createdSpaces.push(body);
      const createdSpace = {
        ...unreadSpace,
        id: CREATED_SPACE_ID,
        name: String(body.name ?? ''),
        emoji: String(body.emoji ?? ''),
        showOnlyUnread: Boolean(body.show_only_unread),
        showMuted: body.show_muted !== false,
      };
      persistedSpaces.push(createdSpace);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: createdSpace,
        }),
      });
      return;
    }

    await route.fallback();
  });

  await page.route('**/api/v1/conversations', async (route, request) => {
    if (request.method() !== 'GET') {
      await route.fallback();
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: [activeConversation, quietConversation],
        meta: { page: 1, total: 2 },
      }),
    });
  });

  return { createdSpaces };
}

test.describe('Spaces routes', () => {
  test('filters conversations and creates a routed Space', async ({ page }) => {
    const { createdSpaces } = await installSpacesMocks(page);

    await page.goto(`/spaces/${UNREAD_SPACE_ID}`);

    await expect(page.getByRole('heading', { name: 'Spaces' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Unread', exact: true })).toBeVisible();
    await expect(page.getByText('Priority Chat')).toBeVisible();
    await expect(page.getByText('Quiet Chat')).toHaveCount(0);

    await page.getByLabel('Space icon').fill('*');
    await page.getByLabel('Space name').fill('Team');
    await page.getByRole('button', { name: /create space/i }).click();

    await expect
      .poll(() => createdSpaces, { message: 'Spaces create endpoint received payload' })
      .toContainEqual(
        expect.objectContaining({
          name: 'Team',
          emoji: '*',
          include_all_individual: true,
          include_all_groups: true,
          show_only_unread: false,
          show_muted: true,
        })
      );
    await expect(page).toHaveURL(new RegExp(`/spaces/${CREATED_SPACE_ID}$`));
    await expect(page.getByRole('heading', { name: 'Team', exact: true })).toBeVisible();
  });
});
