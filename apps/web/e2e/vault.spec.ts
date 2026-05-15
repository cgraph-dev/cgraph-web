import { test, expect, type Page } from '@playwright/test';

const VAULT_CONVERSATION_ID = '55555555-5555-4555-8555-555555555555';
const CURRENT_USER_ID = 'e2e-user';

const vaultConversation = {
  id: VAULT_CONVERSATION_ID,
  type: 'direct',
  conversationType: 'cloud',
  name: 'Vault',
  avatarUrl: null,
  participants: [
    {
      id: 'vault-part-1',
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
  ],
  lastMessage: null,
  unreadCount: 0,
  isNoteToSelf: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function vaultMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'vault-msg-1',
    conversationId: VAULT_CONVERSATION_ID,
    senderId: CURRENT_USER_ID,
    content: 'saved launch note',
    messageType: 'text',
    isEncrypted: false,
    isEdited: false,
    isPinned: false,
    replyToId: null,
    replyTo: null,
    deletedAt: null,
    metadata: {},
    reactions: [],
    sender: vaultConversation.participants[0].user,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

async function installVaultMocks(page: Page): Promise<{
  ensureCalls: string[];
  sentMessages: Record<string, unknown>[];
}> {
  const ensureCalls: string[] = [];
  const sentMessages: Record<string, unknown>[] = [];

  await page.route('**/api/v1/conversations/note-to-self', async (route, request) => {
    ensureCalls.push(request.method());
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: vaultConversation }),
    });
  });

  await page.route('**/api/v1/conversations', async (route, request) => {
    if (request.method() !== 'GET') {
      await route.fallback();
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: [vaultConversation], meta: { page: 1, total: 1 } }),
    });
  });

  await page.route(`**/api/v1/message-requests/${VAULT_CONVERSATION_ID}`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: { status: 'accepted', conversation_id: VAULT_CONVERSATION_ID },
      }),
    });
  });

  await page.route(
    `**/api/v1/conversations/${VAULT_CONVERSATION_ID}/messages**`,
    async (route, request) => {
      if (request.method() === 'POST') {
        const body = request.postDataJSON() as Record<string, unknown>;
        sentMessages.push(body);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            data: vaultMessage({
              id: 'vault-msg-2',
              content: String(body.content ?? ''),
            }),
          }),
        });
        return;
      }

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: [vaultMessage()],
          meta: { page: 1, total: 1, hasMore: false },
        }),
      });
    }
  );

  await page.route(`**/api/v1/conversations/${VAULT_CONVERSATION_ID}/read`, async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: {} }) });
  });

  return { ensureCalls, sentMessages };
}

test.describe('Vault route', () => {
  test('opens the Note-to-Self conversation and sends a saved message', async ({ page }) => {
    const { ensureCalls, sentMessages } = await installVaultMocks(page);

    await page.goto('/vault');

    await expect
      .poll(() => ensureCalls, { message: 'Vault endpoint was called' })
      .toContain('POST');
    await expect(page).toHaveURL(new RegExp(`/vault/${VAULT_CONVERSATION_ID}$`));
    await expect(page.getByRole('heading', { name: 'Vault' })).toBeVisible();
    await expect(page.getByRole('main', { name: /vault messages/i })).toContainText(
      'saved launch note'
    );

    await page.getByPlaceholder(/type a message/i).fill('save this to vault');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect
      .poll(() => sentMessages, { message: 'Vault message endpoint received content' })
      .toContainEqual(expect.objectContaining({ content: 'save this to vault' }));
  });
});
