import { test, expect, type Page } from '@playwright/test';

const CONVERSATION_ID = '11111111-1111-4111-8111-111111111111';
const FORWARD_CONVERSATION_ID = '11111111-1111-4111-8111-222222222222';
const CURRENT_USER_ID = 'e2e-user';
const FRIEND_USER_ID = '33333333-3333-4333-8333-333333333333';

const conversation = {
  id: CONVERSATION_ID,
  type: 'direct',
  conversationType: 'cloud',
  name: 'Browser Proof Chat',
  avatarUrl: null,
  participants: [
    {
      id: 'part-1',
      userId: CURRENT_USER_ID,
      nickname: null,
      isMuted: false,
      mutedUntil: null,
      joinedAt: '2026-01-01T00:00:00.000Z',
      user: {
        id: 'e2e-user',
        username: 'e2e-user',
        displayName: 'E2E User',
        avatarUrl: null,
        status: 'online',
      },
    },
    {
      id: 'part-2',
      userId: FRIEND_USER_ID,
      nickname: null,
      isMuted: false,
      mutedUntil: null,
      joinedAt: '2026-01-01T00:00:00.000Z',
      user: {
        id: FRIEND_USER_ID,
        username: 'friend',
        displayName: 'Friend',
        avatarUrl: null,
        status: 'online',
      },
    },
  ],
  lastMessage: null,
  unreadCount: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const forwardConversation = {
  ...conversation,
  id: FORWARD_CONVERSATION_ID,
  name: 'Archive Chat',
  unreadCount: 0,
};

function messageFixture(overrides: Record<string, unknown>) {
  return {
    id: 'msg-1',
    conversationId: CONVERSATION_ID,
    senderId: FRIEND_USER_ID,
    content: 'hello from fixture',
    messageType: 'text',
    isEncrypted: false,
    isEdited: false,
    isPinned: false,
    replyToId: null,
    replyTo: null,
    deletedAt: null,
    metadata: {},
    reactions: [],
    sender: conversation.participants[1].user,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

async function installMediaRecorderMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    class MockAudioContext {
      createMediaStreamSource() {
        return { connect() {} };
      }

      createAnalyser() {
        return {
          fftSize: 256,
          frequencyBinCount: 1,
          getByteFrequencyData(values: Uint8Array) {
            values[0] = 64;
          },
        };
      }
    }

    class MockMediaRecorder {
      static isTypeSupported() {
        return true;
      }

      state: RecordingState = 'inactive';
      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onstop: (() => void) | null = null;

      start() {
        this.state = 'recording';
      }

      stop() {
        this.state = 'inactive';
        const blob = new Blob(['browser-voice'], { type: 'audio/webm' });
        this.ondataavailable?.({ data: blob } as BlobEvent);
        this.onstop?.();
      }
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop() {} }],
        }),
      },
    });

    window.AudioContext = MockAudioContext as unknown as typeof AudioContext;
    window.MediaRecorder = MockMediaRecorder as unknown as typeof MediaRecorder;
  });
}

async function installMessagingApiMocks(
  page: Page,
  options: { messageRequestStatus?: 'accepted' | 'pending' } = {}
): Promise<{
  attachmentUploads: string[];
  deletedMessages: string[];
  editedMessages: Record<string, unknown>[];
  forwardedMessages: Record<string, unknown>[];
  pinnedMessages: string[];
  requestActions: string[];
  sentMessages: Record<string, unknown>[];
  voiceUploads: string[];
}> {
  const attachmentUploads: string[] = [];
  const deletedMessages: string[] = [];
  const editedMessages: Record<string, unknown>[] = [];
  const forwardedMessages: Record<string, unknown>[] = [];
  const pinnedMessages: string[] = [];
  const requestActions: string[] = [];
  const sentMessages: Record<string, unknown>[] = [];
  const voiceUploads: string[] = [];
  const messageRequestStatus = options.messageRequestStatus ?? 'accepted';

  await page.route('**/api/v1/conversations**', async (route, request) => {
    const url = new URL(request.url());
    if (request.method() !== 'GET' || url.pathname !== '/api/v1/conversations') {
      await route.fallback();
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: [conversation, forwardConversation],
        meta: { page: 1, total: 2 },
      }),
    });
  });

  await page.route(`**/api/v1/message-requests/${CONVERSATION_ID}`, async (route) => {
    if (messageRequestStatus === 'pending') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: '44444444-4444-4444-8444-444444444444',
            conversation_id: CONVERSATION_ID,
            requester: {
              id: FRIEND_USER_ID,
              username: 'friend',
              display_name: 'Friend',
              avatar_url: null,
              is_verified: false,
            },
            status: 'pending',
            shared_group_count: 2,
            auto_accepted: false,
            reported_as_spam: false,
            inserted_at: '2026-01-01T00:00:00.000Z',
          },
        }),
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: { status: 'accepted', conversation_id: CONVERSATION_ID } }),
    });
  });

  await page.route(`**/api/v1/message-requests/${CONVERSATION_ID}/**`, async (route, request) => {
    const action = new URL(request.url()).pathname.split('/').at(-1) ?? '';
    requestActions.push(action);
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          conversation_id: CONVERSATION_ID,
          status: action === 'reject' ? 'rejected' : action === 'accept' ? 'accepted' : 'blocked',
          reported: action === 'block-and-report',
        },
      }),
    });
  });

  await page.route(
    `**/api/v1/conversations/${CONVERSATION_ID}/messages**`,
    async (route, request) => {
      const url = new URL(request.url());

      if (url.pathname === `/api/v1/conversations/${CONVERSATION_ID}/messages/msg-own/pin`) {
        pinnedMessages.push(request.method());
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: {} }),
        });
        return;
      }

      if (url.pathname === `/api/v1/conversations/${CONVERSATION_ID}/messages/msg-own`) {
        if (request.method() === 'PATCH') {
          const body = request.postDataJSON() as Record<string, unknown>;
          editedMessages.push(body);
          await route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({
              data: messageFixture({
                id: 'msg-own',
                senderId: CURRENT_USER_ID,
                sender: conversation.participants[0].user,
                content: String(body.content ?? ''),
                isEdited: true,
              }),
            }),
          });
          return;
        }

        if (request.method() === 'DELETE') {
          deletedMessages.push(request.method());
          await route.fulfill({ status: 204, body: '' });
          return;
        }
      }

      if (request.method() !== 'GET') {
        try {
          sentMessages.push(request.postDataJSON() as Record<string, unknown>);
        } catch {
          sentMessages.push({});
        }

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'msg-text',
              conversationId: CONVERSATION_ID,
              senderId: CURRENT_USER_ID,
              content: 'sent',
              messageType: 'text',
              isEncrypted: false,
              isEdited: false,
              isPinned: false,
              replyToId: null,
              replyTo: null,
              deletedAt: null,
              metadata: {},
              reactions: [],
              sender: conversation.participants[0].user,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        });
        return;
      }

      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            messageFixture({}),
            messageFixture({
              id: 'msg-own',
              senderId: CURRENT_USER_ID,
              sender: conversation.participants[0].user,
              content: 'editable proof',
              metadata: {
                readBy: [
                  {
                    userId: FRIEND_USER_ID,
                    readAt: '2026-01-01T00:02:00.000Z',
                    username: 'Friend',
                    displayName: 'Friend',
                    avatarUrl: null,
                  },
                ],
              },
              createdAt: '2026-01-01T00:01:00.000Z',
              updatedAt: '2026-01-01T00:01:00.000Z',
            }),
          ],
          meta: { page: 1, total: 1, hasMore: false },
        }),
      });
    }
  );

  await page.route('**/api/v1/uploads', async (route) => {
    attachmentUploads.push(route.request().method());

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          url: '/uploads/messages/proof.png',
          original_filename: 'proof.png',
          content_type: 'image/png',
          size: 12,
          thumbnail_url: '/uploads/messages/proof-thumb.png',
        },
      }),
    });
  });

  await page.route(`**/api/v1/conversations/${CONVERSATION_ID}/read`, async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: {} }) });
  });

  await page.route('**/api/v1/voice-messages', async (route) => {
    const request = route.request();
    voiceUploads.push(request.method());

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 'voice-1',
          url: '/uploads/voice/voice-1.ogg',
          duration: 4,
          waveform: [0.2, 0.8],
          content_type: 'audio/ogg',
          size: 2048,
          message_id: 'msg-voice-1',
        },
      }),
    });
  });

  await page.route('**/api/v1/messages/msg-own/forward', async (route, request) => {
    forwardedMessages.push(request.postDataJSON() as Record<string, unknown>);
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: {} }) });
  });

  return {
    attachmentUploads,
    deletedMessages,
    editedMessages,
    forwardedMessages,
    pinnedMessages,
    requestActions,
    sentMessages,
    voiceUploads,
  };
}

test.describe('DM media composer', () => {
  test('attaches and sends a routed cloud-DM file in the browser', async ({ page }) => {
    const { attachmentUploads, sentMessages } = await installMessagingApiMocks(page);

    await page.goto(`/messages/${CONVERSATION_ID}`);

    await expect(page.getByPlaceholder(/type a message/i)).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'proof.png',
      mimeType: 'image/png',
      buffer: Buffer.from('browser-proof'),
    });
    await expect(page.getByText('proof.png')).toBeVisible();
    await page.getByRole('button', { name: /send message/i }).click();

    await expect
      .poll(() => attachmentUploads, { message: 'attachment upload endpoint was called' })
      .toContain('POST');
    await expect
      .poll(() => sentMessages, { message: 'conversation message endpoint received metadata' })
      .toContainEqual(
        expect.objectContaining({
          content: 'proof.png',
          content_type: 'image',
          file_url: '/uploads/messages/proof.png',
          file_name: 'proof.png',
          file_size: 12,
          file_mime_type: 'image/png',
          metadata: expect.objectContaining({
            fileUrl: '/uploads/messages/proof.png',
            fileName: 'proof.png',
            fileSize: 12,
            fileMimeType: 'image/png',
            thumbnailUrl: '/uploads/messages/proof-thumb.png',
          }),
        })
      );
  });

  test('records and sends a routed cloud-DM voice message in the browser', async ({ page }) => {
    await installMediaRecorderMock(page);
    const { voiceUploads } = await installMessagingApiMocks(page);

    await page.goto(`/messages/${CONVERSATION_ID}`);

    await expect(page.getByPlaceholder(/type a message/i)).toBeVisible();
    await page.getByRole('button', { name: /record voice message/i }).click();
    await page.getByRole('button', { name: /record voice message/i }).click();
    await expect(page.getByText(/recording:/i)).toBeVisible();
    await page.getByRole('button', { name: /stop recording/i }).click();
    await page.getByRole('button', { name: /send voice message/i }).click();

    await expect
      .poll(() => voiceUploads, { message: 'voice upload endpoint was called' })
      .toContain('POST');
  });

  test('runs routed cloud-DM reply, search jump, edit, pin, forward, and delete actions', async ({
    page,
  }) => {
    const { deletedMessages, editedMessages, forwardedMessages, pinnedMessages, sentMessages } =
      await installMessagingApiMocks(page);

    await page.goto(`/messages/${CONVERSATION_ID}?scrollTo=msg-own`);

    await expect(page.locator('#message-msg-own')).toBeVisible();
    await expect(page.locator('#message-msg-own')).toBeInViewport();
    await expect(page.locator('#message-msg-own').getByText(/seen/i)).toBeVisible();

    const friendMessage = page.locator('#message-msg-1');
    await friendMessage.hover();
    await friendMessage.getByRole('button', { name: /reply to message/i }).click();
    await expect(page.getByText(/replying to friend/i)).toBeVisible();
    await page.getByPlaceholder(/type a message/i).fill('reply proof');
    await page.getByRole('button', { name: /send message/i }).click();
    await expect
      .poll(() => sentMessages, { message: 'reply message carried reply_to_id' })
      .toContainEqual(expect.objectContaining({ content: 'reply proof', reply_to_id: 'msg-1' }));

    const ownMessage = page.locator('#message-msg-own');
    await ownMessage.hover();
    await ownMessage.getByRole('button', { name: /more message actions/i }).click();
    await page.getByRole('menuitem', { name: /edit/i }).click();
    const editBox = ownMessage.getByRole('textbox');
    await expect(editBox).toHaveValue('editable proof');
    await editBox.fill('edited proof');
    await ownMessage.getByRole('button', { name: /^save$/i }).click();
    await expect
      .poll(() => editedMessages, { message: 'edit endpoint received updated content' })
      .toContainEqual(expect.objectContaining({ content: 'edited proof' }));

    await ownMessage.hover();
    await ownMessage.getByRole('button', { name: /more message actions/i }).click();
    await page.getByRole('menuitem', { name: /pin/i }).click();
    await expect
      .poll(() => pinnedMessages, { message: 'pin endpoint was called' })
      .toContain('POST');
    await expect(ownMessage.getByText(/pinned/i)).toBeVisible();
    await page.getByRole('button', { name: /open pinned messages/i }).click();
    const pinnedPanel = page.getByRole('region', { name: /pinned messages/i });
    await expect(pinnedPanel).toBeVisible();
    await expect(pinnedPanel.getByText('edited proof')).toBeVisible();
    await pinnedPanel.getByRole('button', { name: /jump to pinned message/i }).click();
    await expect(pinnedPanel).toBeHidden();
    await expect(ownMessage).toBeInViewport();

    await ownMessage.hover();
    await ownMessage.getByRole('button', { name: /more message actions/i }).click();
    await page.getByRole('menuitem', { name: /forward/i }).click();
    await page
      .getByRole('dialog', { name: /forward message/i })
      .getByRole('button', { name: /archive chat direct message/i })
      .click();
    await page
      .getByRole('dialog', { name: /forward message/i })
      .getByRole('button', { name: /forward \(1\)/i })
      .click();
    await expect
      .poll(() => forwardedMessages, { message: 'forward endpoint received target conversation' })
      .toContainEqual(expect.objectContaining({ conversation_ids: [FORWARD_CONVERSATION_ID] }));

    await ownMessage.hover();
    await ownMessage.getByRole('button', { name: /more message actions/i }).click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    await expect
      .poll(() => deletedMessages, { message: 'delete endpoint was called' })
      .toContain('DELETE');
    await expect(ownMessage).toContainText(/message deleted/i);
  });

  test('accepts and blocks routed cloud-DM message requests in the browser', async ({ page }) => {
    const { requestActions } = await installMessagingApiMocks(page, {
      messageRequestStatus: 'pending',
    });

    await page.goto(`/messages/${CONVERSATION_ID}`);

    await expect(page.getByText(/friend wants to message you/i)).toBeVisible();
    await expect(page.getByText(/2 shared groups/i)).toBeVisible();
    await page.getByRole('button', { name: /^accept$/i }).click();
    await expect
      .poll(() => requestActions, { message: 'accept endpoint was called' })
      .toContain('accept');

    await page.reload();
    await expect(page.getByText(/friend wants to message you/i)).toBeVisible();
    await page.getByRole('button', { name: /^delete$/i }).click();
    await expect
      .poll(() => requestActions, { message: 'reject endpoint was called' })
      .toContain('reject');

    await page.reload();
    await expect(page.getByText(/friend wants to message you/i)).toBeVisible();
    await page.getByRole('button', { name: /^block$/i }).click();
    await page.getByRole('button', { name: /block & report spam/i }).click();
    await expect
      .poll(() => requestActions, { message: 'block-and-report endpoint was called' })
      .toContain('block-and-report');
  });
});
