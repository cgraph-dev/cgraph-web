import { test, expect, type Page, type Route } from '@playwright/test';

const CURRENT_USER_ID = 'e2e-user';
const FRIEND_ID = 'friend-user';
const CONVERSATION_ID = '88888888-8888-4888-8888-888888888888';
const GROUP_ID = 'group-uat';
const TEXT_CHANNEL_ID = 'text-uat';
const VOICE_CHANNEL_ID = 'voice-uat';

const friendUser = {
  id: FRIEND_ID,
  username: 'friend',
  displayName: 'Friend User',
  display_name: 'Friend User',
  avatarUrl: null,
  avatar_url: null,
  status: 'online',
};

const currentUser = {
  id: CURRENT_USER_ID,
  username: 'e2e-user',
  displayName: 'E2E User',
  display_name: 'E2E User',
  avatarUrl: null,
  avatar_url: null,
  status: 'online',
};

const conversation = {
  id: CONVERSATION_ID,
  type: 'direct',
  conversationType: 'cloud',
  name: 'Friend User',
  avatarUrl: null,
  participants: [
    {
      id: 'part-current',
      userId: CURRENT_USER_ID,
      user: currentUser,
      nickname: null,
      isMuted: false,
      mutedUntil: null,
      joinedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'part-friend',
      userId: FRIEND_ID,
      user: friendUser,
      nickname: null,
      isMuted: false,
      mutedUntil: null,
      joinedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  lastMessage: null,
  unreadCount: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const group = {
  id: GROUP_ID,
  name: 'UAT Hub',
  slug: 'uat-hub',
  description: 'Owner UAT group',
  icon_url: null,
  banner_url: null,
  owner_id: CURRENT_USER_ID,
  member_count: 2,
  online_count: 2,
  is_public: true,
  channels: [
    {
      id: TEXT_CHANNEL_ID,
      name: 'general',
      type: 'text',
      topic: 'Owner checklist proof',
      position: 0,
    },
    {
      id: VOICE_CHANNEL_ID,
      name: 'standup',
      type: 'voice',
      topic: 'Voice UAT room',
      position: 1,
    },
  ],
  categories: [],
  roles: [
    {
      id: 'role-admin',
      name: 'Admin',
      color: '#ffffff',
      position: 0,
      permissions: 65,
      is_default: false,
      is_mentionable: true,
    },
  ],
  myMember: {
    id: 'member-current',
    user_id: CURRENT_USER_ID,
    user: currentUser,
    roles: [
      {
        id: 'role-admin',
        name: 'Admin',
        color: '#ffffff',
        position: 0,
        permissions: 65,
        is_default: false,
        is_mentionable: true,
      },
    ],
    notifications: 'mentions',
    joined_at: '2026-01-01T00:00:00.000Z',
  },
  created_at: '2026-01-01T00:00:00.000Z',
};

const baseSettings = {
  notifications: {
    email_enabled: true,
    push_enabled: true,
    message_notifications: true,
    mention_notifications: true,
    friend_request_notifications: true,
    group_invite_notifications: true,
    forum_reply_notifications: true,
    economy_notifications: true,
    system_notifications: true,
    notification_sound: true,
    quiet_hours_enabled: false,
    quiet_hours_start: null,
    quiet_hours_end: null,
    dnd_until: null,
  },
  privacy: {
    profile_visibility: 'public',
    online_status_visible: true,
    read_receipts_enabled: true,
    typing_indicators_enabled: true,
    allow_friend_requests: true,
    allow_message_requests: true,
    show_in_search: true,
    allow_group_invites: 'anyone',
    show_bio: true,
    show_post_count: true,
    show_join_date: true,
    show_last_active: true,
    show_social_links: true,
    show_activity: true,
    show_in_member_list: true,
    show_phone: false,
    show_forwarded_from: true,
    allow_calls: true,
    auto_delete_default: null,
  },
  appearance: {
    theme: 'system',
    compact_mode: false,
    font_size: 'medium',
    message_density: 'comfortable',
    show_avatars: true,
    animate_emojis: true,
    reduce_motion: false,
    high_contrast: false,
    screen_reader_optimized: false,
  },
  locale: {
    language: 'en',
    timezone: 'UTC',
    date_format: 'mdy',
    time_format: 'twelve_hour',
  },
  keyboard: {
    keyboard_shortcuts_enabled: true,
    custom_shortcuts: {},
  },
  media: {
    auto_download_photos: 'always',
    auto_download_videos: 'wifi',
    auto_download_files: 'never',
    data_saver_mode: false,
  },
  stickers_emoji: {
    suggest_stickers: true,
    loop_animated_stickers: true,
    default_skin_tone: 'neutral',
    installed_sticker_pack_ids: [],
  },
  calls: {
    echo_cancellation: true,
    noise_suppression: true,
    auto_gain_control: true,
    default_video_resolution: 'auto',
  },
};

function message(overrides: Record<string, unknown> = {}) {
  return {
    id: 'msg-uat-1',
    conversationId: CONVERSATION_ID,
    senderId: FRIEND_ID,
    content: 'DM owner UAT proof',
    messageType: 'text',
    isEncrypted: false,
    isEdited: false,
    isPinned: false,
    replyToId: null,
    replyTo: null,
    deletedAt: null,
    metadata: {},
    reactions: [],
    sender: friendUser,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function channelMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'group-msg-uat-1',
    channel_id: TEXT_CHANNEL_ID,
    sender_id: FRIEND_ID,
    author: friendUser,
    content: 'Group owner UAT proof',
    message_type: 'text',
    is_pinned: false,
    is_edited: false,
    reply_to_id: null,
    metadata: {},
    reactions: [],
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installOwnerUatMocks(page: Page) {
  const sentDmMessages: Record<string, unknown>[] = [];
  const sentGroupMessages: Record<string, unknown>[] = [];

  await page.route('**/api/v1/**', async (route, request) => {
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === '/api/v1/auth/login' && method === 'POST') {
      await fulfillJson(route, {
        data: { user: currentUser, access_token: 'e2e-access-token', refresh_token: 'refresh' },
      });
      return;
    }

    if (path === '/api/v1/me' || path === '/api/v1/users/me') {
      await fulfillJson(route, { data: currentUser, user: currentUser });
      return;
    }

    if (path === `/api/v1/users/${FRIEND_ID}`) {
      await fulfillJson(route, { data: friendUser, ...friendUser });
      return;
    }

    if (path === '/api/v1/settings') {
      await fulfillJson(route, { data: baseSettings });
      return;
    }

    if (path.startsWith('/api/v1/settings/') || path === '/api/v1/me/theme') {
      await fulfillJson(route, { data: baseSettings });
      return;
    }

    if (path === '/api/v1/friends') {
      await fulfillJson(route, { data: [{ ...friendUser, id: FRIEND_ID }] });
      return;
    }

    if (path === '/api/v1/friends/requests') {
      await fulfillJson(route, { data: [] });
      return;
    }

    if (path === '/api/v1/notifications') {
      await fulfillJson(route, {
        data: [
          {
            id: 'notif-uat',
            type: 'message',
            title: 'Message proof',
            body: 'Open the DM route',
            is_read: false,
            created_at: '2026-01-01T00:00:00.000Z',
            sender: friendUser,
            source_id: CONVERSATION_ID,
            source_type: 'conversation',
          },
        ],
        meta: { unread_count: 1 },
      });
      return;
    }

    if (path.startsWith('/api/v1/search/')) {
      if (path === '/api/v1/search/groups') {
        await fulfillJson(route, [
          {
            id: GROUP_ID,
            name: 'UAT Hub',
            slug: 'uat-hub',
            description: 'Owner UAT group',
            default_channel_id: TEXT_CHANNEL_ID,
            member_count: 2,
            is_member: true,
          },
        ]);
        return;
      }

      await fulfillJson(route, []);
      return;
    }

    if (path === '/api/v1/conversations') {
      await fulfillJson(route, { data: [conversation], meta: { page: 1, total: 1 } });
      return;
    }

    if (path === `/api/v1/conversations/${CONVERSATION_ID}`) {
      await fulfillJson(route, { data: conversation });
      return;
    }

    if (path === `/api/v1/message-requests/${CONVERSATION_ID}`) {
      await fulfillJson(route, { data: { status: 'accepted', conversation_id: CONVERSATION_ID } });
      return;
    }

    if (path === `/api/v1/conversations/${CONVERSATION_ID}/messages`) {
      if (method === 'POST') {
        const body = request.postDataJSON() as Record<string, unknown>;
        sentDmMessages.push(body);
        await fulfillJson(
          route,
          { data: message({ id: 'msg-uat-sent', content: body.content }) },
          201
        );
        return;
      }

      await fulfillJson(route, {
        data: [message()],
        meta: { page: 1, total: 1, hasMore: false },
      });
      return;
    }

    if (path === `/api/v1/conversations/${CONVERSATION_ID}/read`) {
      await fulfillJson(route, { data: {} });
      return;
    }

    if (path === '/api/v1/groups') {
      await fulfillJson(route, { data: [group] });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}`) {
      await fulfillJson(route, { data: group });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members`) {
      await fulfillJson(route, {
        data: [group.myMember, { id: 'member-friend', user: friendUser }],
      });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}/messages`) {
      if (method === 'POST') {
        const body = request.postDataJSON() as Record<string, unknown>;
        sentGroupMessages.push(body);
        await fulfillJson(
          route,
          { data: channelMessage({ id: 'group-msg-uat-sent', content: body.content }) },
          201
        );
        return;
      }

      await fulfillJson(route, { data: [channelMessage()] });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}/thread-counts`) {
      await fulfillJson(route, { data: {} });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/subscription`) {
      await fulfillJson(route, { data: { notification_level: 'mentions' } });
      return;
    }

    if (path === '/api/v1/nodes/wallet') {
      await fulfillJson(route, {
        data: {
          available_balance: 1250,
          pending_balance: 0,
          lifetime_earned: 5000,
          lifetime_spent: 3750,
        },
      });
      return;
    }

    if (path === '/api/v1/nodes/transactions') {
      await fulfillJson(route, {
        data: [
          {
            id: 'tx-uat',
            type: 'tip_received',
            amount: 250,
            created_at: '2026-01-01T00:00:00.000Z',
            description: 'Owner UAT transaction',
          },
        ],
      });
      return;
    }

    if (path === '/api/v1/nodes/bundles') {
      await fulfillJson(route, { data: [] });
      return;
    }

    await fulfillJson(route, { data: {} });
  });

  return { sentDmMessages, sentGroupMessages };
}

test.describe('Web owner focused UAT', () => {
  test('verifies auth, DMs, groups, social, settings, Nodes, and calls routes', async ({
    page,
  }) => {
    const { sentDmMessages, sentGroupMessages } = await installOwnerUatMocks(page);

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back|sign in|log in/i })).toBeVisible();

    await page.goto(`/messages/${CONVERSATION_ID}`);
    await expect(page.getByRole('main')).toContainText('DM owner UAT proof');
    await page.getByPlaceholder(/type a message/i).fill('DM routed UAT send');
    await page.getByRole('button', { name: /send message/i }).click();
    await expect
      .poll(() => sentDmMessages, { message: 'DM route sent through the conversation endpoint' })
      .toContainEqual(expect.objectContaining({ content: 'DM routed UAT send' }));

    await page.goto(`/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}`);
    await expect(page.getByText('Owner checklist proof')).toBeVisible();
    const groupComposer = page.getByPlaceholder(/message #general/i);
    await groupComposer.fill('Group routed UAT send');
    await groupComposer.press('Enter');
    await expect
      .poll(() => sentGroupMessages, { message: 'Group route sent through the channel endpoint' })
      .toContainEqual(expect.objectContaining({ content: 'Group routed UAT send' }));

    await page.goto('/social/discover');
    await page.getByPlaceholder(/search cgraph/i).fill('uat');
    await expect(page.getByText('UAT Hub').first()).toBeVisible();

    await page.goto('/settings/privacy');
    await expect(page).toHaveURL(/\/(me\/)?settings\/privacy$/);
    await expect(page.getByRole('heading', { name: /privacy/i })).toBeVisible();

    await page.goto('/nodes');
    await expect(page).toHaveURL(/\/me\/wallet$/);
    await expect(page.getByText(/available balance/i)).toBeVisible();
    await expect(page.getByText(/1,250/)).toBeVisible();

    await page.goto(`/call/${FRIEND_ID}/audio`);
    await expect(page.getByRole('button', { name: /mute/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /end call/i })).toBeVisible();

    await page.goto(`/groups/${GROUP_ID}/voice/${VOICE_CHANNEL_ID}`);
    await expect(page.getByText('Voice Room')).toBeVisible();
    await expect(page.getByRole('button', { name: /join call/i })).toBeVisible();
  });
});
