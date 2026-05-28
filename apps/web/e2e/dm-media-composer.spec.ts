import { test, expect, type Page } from '@playwright/test';

const CONVERSATION_ID = '11111111-1111-4111-8111-111111111111';
const FORWARD_CONVERSATION_ID = '11111111-1111-4111-8111-222222222222';
const CURRENT_USER_ID = 'e2e-user';
const FRIEND_USER_ID = '33333333-3333-4333-8333-333333333333';
const GIF_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

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

type MessageFixture = ReturnType<typeof messageFixture>;
type TypingProofEvent = { topic: string; isTyping: boolean };

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
  options: {
    initialMessages?: MessageFixture[];
    messageRequestStatus?: 'accepted' | 'pending';
    paidFileUnlockMode?: 'ok' | 'insufficient' | 'already' | 'rate' | 'fail-then-success';
    uploadMode?: 'ok' | 'scanner-unavailable';
  } = {}
): Promise<{
  attachmentUploads: string[];
  conversationActions: string[];
  deletedMessages: string[];
  editedMessages: Record<string, unknown>[];
  forwardedMessages: Record<string, unknown>[];
  paidFileUnlocks: string[];
  pinnedMessages: string[];
  requestActions: string[];
  sentMessages: Record<string, unknown>[];
  spacePatches: Record<string, unknown>[];
  voiceUploads: string[];
}> {
  const attachmentUploads: string[] = [];
  const conversationActions: string[] = [];
  const deletedMessages: string[] = [];
  const editedMessages: Record<string, unknown>[] = [];
  const forwardedMessages: Record<string, unknown>[] = [];
  const paidFileUnlocks: string[] = [];
  const pinnedMessages: string[] = [];
  const requestActions: string[] = [];
  const sentMessages: Record<string, unknown>[] = [];
  const spacePatches: Record<string, unknown>[] = [];
  const voiceUploads: string[] = [];
  const spaceProofId = 'space-proof';
  const initialMessages = options.initialMessages ?? [
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
  ];
  const messageRequestStatus = options.messageRequestStatus ?? 'accepted';
  const paidFileUnlockMode = options.paidFileUnlockMode ?? 'ok';
  const friendUser = conversation.participants[1].user;
  const archivedConversation = { ...conversation, isArchived: true };
  let spaceState = {
    id: spaceProofId,
    name: 'Proof Space',
    emoji: 'P',
    position: 0,
    include_all_individual: false,
    include_all_groups: false,
    show_only_unread: false,
    show_muted: true,
    included_conversation_ids: [] as string[],
    excluded_conversation_ids: [] as string[],
  };

  await page.route(`**/api/v1/users/${FRIEND_USER_ID}`, async (route, request) => {
    if (request.method() !== 'GET') {
      await route.fallback();
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ data: friendUser, ...friendUser }),
    });
  });

  await page.route('**/api/v1/conversations**', async (route, request) => {
    const url = new URL(request.url());
    if (request.method() === 'GET' && url.pathname === '/api/v1/conversations/archived') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          data: [archivedConversation],
          meta: { page: 1, total: 1 },
        }),
      });
      return;
    }

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

  await page.route('**/api/v1/spaces**', async (route, request) => {
    const url = new URL(request.url());

    if (request.method() === 'GET' && url.pathname === '/api/v1/spaces') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: [spaceState] }),
      });
      return;
    }

    if (request.method() === 'PATCH' && url.pathname === `/api/v1/spaces/${spaceProofId}`) {
      const body = request.postDataJSON() as Record<string, unknown>;
      spacePatches.push(body);
      spaceState = {
        ...spaceState,
        included_conversation_ids: Array.isArray(body.included_conversation_ids)
          ? body.included_conversation_ids.filter(
              (value): value is string => typeof value === 'string'
            )
          : [],
        excluded_conversation_ids: Array.isArray(body.excluded_conversation_ids)
          ? body.excluded_conversation_ids.filter(
              (value): value is string => typeof value === 'string'
            )
          : [],
      };
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ data: spaceState }),
      });
      return;
    }

    await route.fallback();
  });

  await page.route('**/api/v1/gifs/search**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        gifs: [
          {
            id: 'gif-launch-proof',
            title: 'Launch Proof',
            url: GIF_DATA_URL,
            previewUrl: GIF_DATA_URL,
            width: 320,
            height: 180,
            source: 'klipy',
          },
        ],
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
        let messageBody: Record<string, unknown> = {};
        try {
          messageBody = request.postDataJSON() as Record<string, unknown>;
          sentMessages.push(messageBody);
        } catch {
          sentMessages.push({});
        }
        const submittedContent =
          typeof messageBody.content === 'string' ? messageBody.content : 'sent';
        const submittedContentType =
          typeof messageBody.content_type === 'string' ? messageBody.content_type : 'text';
        const submittedMetadata =
          messageBody.metadata && typeof messageBody.metadata === 'object'
            ? messageBody.metadata
            : {};

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: `msg-${submittedContentType}`,
              conversationId: CONVERSATION_ID,
              senderId: CURRENT_USER_ID,
              content: submittedContent,
              messageType: submittedContentType,
              isEncrypted: false,
              isEdited: false,
              isPinned: false,
              replyToId:
                typeof messageBody.reply_to_id === 'string' ? messageBody.reply_to_id : null,
              replyTo: null,
              deletedAt: null,
              metadata: submittedMetadata,
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
          data: initialMessages,
          meta: { page: 1, total: initialMessages.length, hasMore: false },
        }),
      });
    }
  );

  await page.route('**/api/v1/uploads', async (route) => {
    attachmentUploads.push(route.request().method());

    if (options.uploadMode === 'scanner-unavailable') {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'SCANNER_UNAVAILABLE',
            message: 'Upload temporarily disabled because antivirus scanner is unreachable',
          },
        }),
      });
      return;
    }

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

  for (const action of ['read', 'unread', 'archive', 'unarchive', 'pin', 'mute']) {
    await page.route(`**/api/v1/conversations/${CONVERSATION_ID}/${action}`, async (route) => {
      conversationActions.push(`${route.request().method()} ${action}`);
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data: {} }) });
    });
  }

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

  await page.route('**/api/v1/paid-dm/*/unlock', async (route, request) => {
    paidFileUnlocks.push(request.method());

    if (paidFileUnlockMode === 'insufficient') {
      await route.fulfill({
        status: 402,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'insufficient_balance', message: 'Not enough Nodes' },
        }),
      });
      return;
    }

    if (paidFileUnlockMode === 'already') {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'already_unlocked', message: 'Already unlocked' },
        }),
      });
      return;
    }

    if (paidFileUnlockMode === 'rate') {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'rate_limited', message: 'Too many attempts' },
        }),
      });
      return;
    }

    if (paidFileUnlockMode === 'fail-then-success' && paidFileUnlocks.length === 1) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'unlock_failed', message: 'Unlock failed' },
        }),
      });
      return;
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 'paid-file-1',
          sender_id: FRIEND_USER_ID,
          receiver_id: CURRENT_USER_ID,
          file_url: 'https://cdn.cgraph.test/locked-proof.pdf',
          file_type: 'application/pdf',
          nodes_required: 75,
          status: 'paid',
          expires_at: null,
          inserted_at: '2026-01-01T00:00:00.000Z',
        },
      }),
    });
  });

  return {
    attachmentUploads,
    conversationActions,
    deletedMessages,
    editedMessages,
    forwardedMessages,
    paidFileUnlocks,
    pinnedMessages,
    requestActions,
    sentMessages,
    spacePatches,
    voiceUploads,
  };
}

test.describe('DM media composer', () => {
  function lockedPaidFileMessage() {
    return messageFixture({
      id: 'msg-paid-file',
      senderId: FRIEND_USER_ID,
      content: 'locked-proof.pdf',
      messageType: 'file',
      metadata: {
        url: 'https://cdn.cgraph.test/locked-proof.pdf',
        filename: 'locked-proof.pdf',
        paid_dm_file_id: 'paid-file-1',
        nodes_price: 75,
        is_file_locked: true,
      },
    });
  }

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

  test('surfaces scanner-unavailable upload failures without sending a fake attachment', async ({
    page,
  }) => {
    const { attachmentUploads, sentMessages } = await installMessagingApiMocks(page, {
      uploadMode: 'scanner-unavailable',
    });

    await page.goto(`/messages/${CONVERSATION_ID}`);

    await expect(page.getByPlaceholder(/type a message/i)).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'proof.png',
      mimeType: 'image/png',
      buffer: Buffer.from('browser-proof'),
    });
    await page.getByRole('button', { name: /send message/i }).click();

    await expect
      .poll(() => attachmentUploads, { message: 'attachment upload endpoint was called' })
      .toContain('POST');
    await expect(page.getByText('Message not sent')).toBeVisible();
    await expect(page.getByText(/antivirus scanner is unreachable/i)).toBeVisible();
    expect(sentMessages).toEqual([]);
  });

  test('shows paid-file insufficient-balance recovery without false unlock success', async ({
    page,
  }) => {
    const { paidFileUnlocks } = await installMessagingApiMocks(page, {
      initialMessages: [lockedPaidFileMessage()],
      paidFileUnlockMode: 'insufficient',
    });

    await page.goto(`/messages/${CONVERSATION_ID}`);

    await expect(page.getByRole('button', { name: 'Unlock for 75 Nodes' })).toBeVisible();
    await page.getByRole('button', { name: 'Unlock for 75 Nodes' }).click();

    await expect
      .poll(() => paidFileUnlocks, { message: 'paid file unlock endpoint was called' })
      .toContain('PUT');
    await expect(
      page.getByLabel('Conversation messages').getByText('Add Nodes to continue.')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Nodes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unlock for 75 Nodes' })).toBeVisible();
  });

  test('treats already-unlocked paid files as accessible after server reconciliation', async ({
    page,
  }) => {
    const { paidFileUnlocks } = await installMessagingApiMocks(page, {
      initialMessages: [lockedPaidFileMessage()],
      paidFileUnlockMode: 'already',
    });

    await page.goto(`/messages/${CONVERSATION_ID}`);

    await page.getByRole('button', { name: 'Unlock for 75 Nodes' }).click();

    await expect
      .poll(() => paidFileUnlocks, { message: 'paid file unlock endpoint was called' })
      .toContain('PUT');
    await expect(page.getByRole('button', { name: 'Unlock for 75 Nodes' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /locked-proof\.pdf/i })).toHaveAttribute(
      'href',
      'https://cdn.cgraph.test/locked-proof.pdf'
    );
  });

  test('keeps paid files locked with clear rate-limit copy', async ({ page }) => {
    const { paidFileUnlocks } = await installMessagingApiMocks(page, {
      initialMessages: [lockedPaidFileMessage()],
      paidFileUnlockMode: 'rate',
    });

    await page.goto(`/messages/${CONVERSATION_ID}`);

    await page.getByRole('button', { name: 'Unlock for 75 Nodes' }).click();

    await expect
      .poll(() => paidFileUnlocks, { message: 'paid file unlock endpoint was called' })
      .toContain('PUT');
    await expect(
      page.getByLabel('Conversation messages').getByText('Please wait a moment and try again.')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unlock for 75 Nodes' })).toBeVisible();
  });

  test('keeps paid files locked until a second explicit unlock succeeds', async ({ page }) => {
    const { paidFileUnlocks } = await installMessagingApiMocks(page, {
      initialMessages: [lockedPaidFileMessage()],
      paidFileUnlockMode: 'fail-then-success',
    });

    await page.goto(`/messages/${CONVERSATION_ID}`);

    await page.getByRole('button', { name: 'Unlock for 75 Nodes' }).click();

    await expect
      .poll(() => paidFileUnlocks.length, { message: 'paid file unlock endpoint was called once' })
      .toBe(1);
    await expect(
      page
        .getByLabel('Conversation messages')
        .getByText('Failed to unlock file. Check your Node balance.')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unlock for 75 Nodes' })).toBeVisible();

    await page.getByRole('button', { name: 'Unlock for 75 Nodes' }).click();

    await expect
      .poll(() => paidFileUnlocks.length, { message: 'paid file unlock endpoint was called twice' })
      .toBe(2);
    await expect(page.getByRole('button', { name: 'Unlock for 75 Nodes' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /locked-proof\.pdf/i })).toHaveAttribute(
      'href',
      'https://cdn.cgraph.test/locked-proof.pdf'
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

  test('emits routed cloud-DM typing start and stop from the live input', async ({ page }) => {
    await page.addInitScript(() => {
      const target = window as Window & { __cgraphTypingEvents?: TypingProofEvent[] };
      target.__cgraphTypingEvents = [];
      window.addEventListener('cgraph:e2e-typing', (event) => {
        const detail = (event as CustomEvent<TypingProofEvent>).detail;
        target.__cgraphTypingEvents?.push(detail);
      });
    });

    const { sentMessages } = await installMessagingApiMocks(page);

    await page.goto(`/messages/${CONVERSATION_ID}`);

    await page.getByPlaceholder(/type a message/i).fill('typing proof');
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const target = window as Window & { __cgraphTypingEvents?: TypingProofEvent[] };
            return target.__cgraphTypingEvents ?? [];
          }),
        { message: 'typing start was emitted from the routed input' }
      )
      .toContainEqual({ topic: `conversation:${CONVERSATION_ID}`, isTyping: true });

    await page.getByRole('button', { name: /send message/i }).click();
    await expect
      .poll(() => sentMessages, { message: 'typing proof message was sent' })
      .toContainEqual(expect.objectContaining({ content: 'typing proof' }));
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const target = window as Window & { __cgraphTypingEvents?: TypingProofEvent[] };
            return target.__cgraphTypingEvents ?? [];
          }),
        { message: 'typing stop was emitted after send' }
      )
      .toContainEqual({ topic: `conversation:${CONVERSATION_ID}`, isTyping: false });
  });

  test('launches routed cloud-DM voice and video calls from the header', async ({ page }) => {
    await installMessagingApiMocks(page);

    await page.goto(`/messages/${CONVERSATION_ID}`);

    await page.getByRole('button', { name: /start voice call/i }).click();
    await expect(page).toHaveURL(new RegExp(`/call/${FRIEND_USER_ID}/audio$`));
    await expect(page.getByRole('button', { name: /mute/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /end call/i })).toBeVisible();

    await page.goto(`/messages/${CONVERSATION_ID}`);

    await page.getByRole('button', { name: /start video call/i }).click();
    await expect(page).toHaveURL(new RegExp(`/call/${FRIEND_USER_ID}/video$`));
    await expect(page.getByRole('button', { name: /hide video|show video/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /end call/i })).toBeVisible();
  });

  test('runs routed conversation-list actions and Space membership controls', async ({ page }) => {
    const { conversationActions, spacePatches } = await installMessagingApiMocks(page);
    const openConversationActions = async () => {
      await page.getByText('Browser Proof Chat').first().hover();
      await page.getByLabel('Open actions for Browser Proof Chat').click();
    };

    await page.goto(`/messages/${CONVERSATION_ID}`);
    await expect(page.getByText('Browser Proof Chat').first()).toBeVisible();

    await openConversationActions();
    await page.getByRole('button', { name: /^mark as unread$/i }).click();
    await expect
      .poll(() => conversationActions, { message: 'mark-unread endpoint was called' })
      .toContain('POST unread');

    await openConversationActions();
    await page.getByRole('button', { name: /^mark as read$/i }).click();
    await expect
      .poll(() => conversationActions, { message: 'mark-read endpoint was called' })
      .toContain('POST read');

    await openConversationActions();
    await page.getByRole('button', { name: /^pin$/i }).click();
    await expect
      .poll(() => conversationActions, { message: 'pin endpoint was called' })
      .toContain('POST pin');

    await openConversationActions();
    await page.getByRole('button', { name: /^unpin$/i }).click();
    await expect
      .poll(() => conversationActions, { message: 'unpin endpoint was called' })
      .toContain('DELETE pin');

    await openConversationActions();
    await page.getByRole('button', { name: /^mute$/i }).click();
    await expect
      .poll(() => conversationActions, { message: 'mute endpoint was called' })
      .toContain('POST mute');

    await openConversationActions();
    await page.getByRole('button', { name: /^unmute$/i }).click();
    await expect
      .poll(() => conversationActions, { message: 'unmute endpoint was called' })
      .toContain('DELETE mute');

    await openConversationActions();
    await page.getByRole('button', { name: /proof space/i }).click();
    await expect
      .poll(() => spacePatches, { message: 'Space include patch was sent' })
      .toContainEqual(
        expect.objectContaining({
          included_conversation_ids: [CONVERSATION_ID],
          excluded_conversation_ids: [],
        })
      );
    await page.getByRole('button', { name: /proof space/i }).click();
    await expect
      .poll(() => spacePatches, { message: 'Space exclude patch was sent' })
      .toContainEqual(
        expect.objectContaining({
          included_conversation_ids: [],
          excluded_conversation_ids: [CONVERSATION_ID],
        })
      );

    await page.getByRole('button', { name: /^archive$/i }).click();
    await expect
      .poll(() => conversationActions, { message: 'archive endpoint was called' })
      .toContain('POST archive');
    await expect(page).toHaveURL(/\/messages$/);

    await page.getByRole('button', { name: /^archived$/i }).click();
    await expect(page.getByText('Browser Proof Chat').first()).toBeVisible();
    await openConversationActions();
    await page.getByRole('button', { name: /^unarchive$/i }).click();
    await expect
      .poll(() => conversationActions, { message: 'unarchive endpoint was called' })
      .toContain('POST unarchive');
  });

  test('sends routed cloud-DM GIF and sticker messages in the browser', async ({ page }) => {
    const { sentMessages } = await installMessagingApiMocks(page);

    await page.goto(`/messages/${CONVERSATION_ID}`);

    await page.getByRole('button', { name: /open gif picker/i }).click();
    await page.getByRole('button', { name: /select gif launch proof/i }).click();
    await expect
      .poll(() => sentMessages, { message: 'GIF payload was sent through routed composer' })
      .toContainEqual(
        expect.objectContaining({
          content: GIF_DATA_URL,
          content_type: 'gif',
          metadata: expect.objectContaining({
            gifId: 'gif-launch-proof',
            gifTitle: 'Launch Proof',
            gifUrl: GIF_DATA_URL,
            gifPreviewUrl: GIF_DATA_URL,
            gifWidth: 320,
            gifHeight: 180,
            gifSource: 'klipy',
          }),
        })
      );
    await expect(page.getByAltText('Launch Proof').first()).toBeVisible();

    await page.getByRole('button', { name: /open sticker picker/i }).click();
    await page.getByRole('menuitem', { name: /send sticker wave/i }).click();
    await expect
      .poll(() => sentMessages, { message: 'Sticker payload was sent through routed composer' })
      .toContainEqual(
        expect.objectContaining({
          content: '👋',
          content_type: 'sticker',
          metadata: expect.objectContaining({
            stickerId: 'wave',
            stickerPackId: 'cgraph-default',
            stickerLabel: 'Wave',
            stickerEmoji: '👋',
          }),
        })
      );
    await expect(page.getByLabel(/sticker wave/i).first()).toBeVisible();
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

  test('keeps routed search-jump anchors stable until the user jumps to latest', async ({
    page,
  }) => {
    const messages = Array.from({ length: 36 }, (_, index) => {
      const messageNumber = index + 1;
      const isOwn = messageNumber % 7 === 0;

      return messageFixture({
        id: `msg-${messageNumber}`,
        senderId: isOwn ? CURRENT_USER_ID : FRIEND_USER_ID,
        sender: isOwn ? conversation.participants[0].user : conversation.participants[1].user,
        content: `scroll proof message ${messageNumber}`,
        createdAt: `2026-01-01T00:${String(messageNumber).padStart(2, '0')}:00.000Z`,
        updatedAt: `2026-01-01T00:${String(messageNumber).padStart(2, '0')}:00.000Z`,
      });
    });

    await installMessagingApiMocks(page, { initialMessages: messages });

    await page.goto(`/messages/${CONVERSATION_ID}?scrollTo=msg-6`);

    const targetMessage = page.locator('#message-msg-6');
    await expect(targetMessage).toBeVisible();
    await expect(targetMessage).toBeInViewport();
    await expect(page.locator('#message-msg-36')).not.toBeInViewport();

    const jumpToLatest = page.getByRole('button', { name: /scroll to latest messages/i });
    await expect(jumpToLatest).toBeVisible();
    await jumpToLatest.click();
    await expect(page.locator('#message-msg-36')).toBeInViewport();
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
