import { test, expect, type Page, type Route } from '@playwright/test';

const CURRENT_USER_ID = 'e2e-user';
const FRIEND_ID = 'friend-user';
const CONVERSATION_ID = '88888888-8888-4888-8888-888888888888';
const GROUP_ID = 'group-uat';
const TEXT_CHANNEL_ID = 'text-uat';
const VOICE_CHANNEL_ID = 'voice-uat';
const LIVE_AVATAR_BORDER_ID = 'border_cyberpunk_epic_01';
const LIVE_TITLE_ID = 'founding_member';
const LIVE_BADGE_ID = 'badge-founder';
const LIVE_NAMEPLATE_ID = 'plate_gilded_sapphire_loop_01';
const GIF_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

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
  const groupAttachmentUploads: string[] = [];
  const groupVoiceUploads: string[] = [];
  const groupChannelCreateRequests: Record<string, unknown>[] = [];
  const groupInviteCreateRequests: Record<string, unknown>[] = [];
  const groupMemberRoleRequests: Record<string, unknown>[] = [];
  const groupPinRequests: Record<string, unknown>[] = [];
  const groupReactionRequests: Record<string, unknown>[] = [];
  const groupSettingsPatches: Record<string, unknown>[] = [];
  const threadReplyRequests: Record<string, unknown>[] = [];
  const groupUnpinRequests: string[] = [];
  const notificationPatches: Record<string, unknown>[] = [];
  const channelNotificationPatches: Record<string, unknown>[] = [];
  const reportRequests: Record<string, unknown>[] = [];
  const pinnedMessageIds = new Set<string>();
  const threadRepliesByParent = new Map<string, Record<string, unknown>[]>();
  const adminRole = group.roles[0];
  if (!adminRole) {
    throw new Error('Owner UAT group fixture is missing the admin role');
  }
  const groupRoles = [
    adminRole,
    {
      id: 'role-mod',
      name: 'Moderator',
      color: '#22c55e',
      position: 1,
      permissions: 65,
      is_default: false,
      is_mentionable: true,
    },
  ];
  let currentGroupName = group.name;
  let currentGroupDescription = group.description;
  let currentGroupIsPublic = group.is_public;
  let currentNotificationLevel: 'mentions' | 'none' = 'mentions';
  let currentChannelNotificationMode: 'mentions_only' | 'none' = 'mentions_only';
  let friendRoleIds: string[] = [];
  let settingsChannels = [
    {
      id: TEXT_CHANNEL_ID,
      name: 'general',
      type: 'text',
      topic: 'Owner checklist proof',
      position: 0,
      category_id: null,
      is_nsfw: false,
      slow_mode_seconds: 0,
    },
    {
      id: VOICE_CHANNEL_ID,
      name: 'standup',
      type: 'voice',
      topic: 'Voice UAT room',
      position: 1,
      category_id: null,
      is_nsfw: false,
      slow_mode_seconds: 0,
    },
  ];

  await page.addInitScript(() => {
    const target = window as Window & {
      __cgraphCopiedText?: string;
      __cgraphGroupActionEvents?: unknown[];
    };
    target.__cgraphGroupActionEvents = [];
    window.addEventListener('cgraph:e2e-group-channel-action', (event) => {
      target.__cgraphGroupActionEvents?.push((event as CustomEvent).detail);
    });
    window.confirm = () => true;
    window.prompt = () => 'group report proof';
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

      state: 'inactive' | 'recording' = 'inactive';
      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onstop: (() => void) | null = null;

      start() {
        this.state = 'recording';
      }

      stop() {
        this.state = 'inactive';
        const blob = new Blob(['browser-group-voice'], { type: 'audio/webm' });
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
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText(value: string) {
          target.__cgraphCopiedText = value;
          return Promise.resolve();
        },
      },
    });
  });

  function groupWithCurrentNotifications() {
    return {
      ...group,
      name: currentGroupName,
      description: currentGroupDescription,
      is_public: currentGroupIsPublic,
      channels: settingsChannels,
      roles: groupRoles,
      myMember: {
        ...group.myMember,
        roles: [groupRoles[0]],
        notifications: currentNotificationLevel,
      },
    };
  }

  function groupMembersResponse() {
    return [
      {
        ...group.myMember,
        role: 'admin',
        roles: [groupRoles[0]],
        username: currentUser.username,
        display_name: currentUser.display_name,
        avatar_url: currentUser.avatar_url,
      },
      {
        id: 'member-friend',
        user_id: FRIEND_ID,
        user: friendUser,
        username: friendUser.username,
        display_name: friendUser.display_name,
        avatar_url: friendUser.avatar_url,
        role: 'member',
        roles: groupRoles.filter((role) => friendRoleIds.includes(role.id)),
        joined_at: '2026-01-01T00:00:00.000Z',
      },
    ];
  }

  await page.route('**/uploads/groups/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/axjXcQAAAAASUVORK5CYII=',
        'base64'
      ),
    });
  });

  await page.route('**/uploads/voice/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'audio/ogg',
      body: Buffer.from('browser-group-voice'),
    });
  });

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

    if (path === '/api/v1/uploads' && method === 'POST') {
      groupAttachmentUploads.push(method);
      await fulfillJson(
        route,
        {
          data: {
            url: '/uploads/groups/proof.png',
            original_filename: 'group-proof.png',
            content_type: 'image/png',
            size: 12,
            thumbnail_url: '/uploads/groups/proof-thumb.png',
          },
        },
        201
      );
      return;
    }

    if (path === '/api/v1/groups') {
      await fulfillJson(route, { data: [groupWithCurrentNotifications()] });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}`) {
      if (method === 'PATCH') {
        const body = request.postDataJSON() as Record<string, unknown>;
        groupSettingsPatches.push(body);
        if (typeof body.name === 'string') currentGroupName = body.name;
        if (typeof body.description === 'string' || body.description === null) {
          currentGroupDescription = body.description as string | null;
        }
        if (body.visibility === 'public') currentGroupIsPublic = true;
        if (body.visibility === 'private') currentGroupIsPublic = false;
        await fulfillJson(route, { data: groupWithCurrentNotifications() });
        return;
      }
      await fulfillJson(route, { data: groupWithCurrentNotifications() });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members/me/notifications`) {
      const body = request.postDataJSON() as Record<string, unknown>;
      notificationPatches.push(body);
      if (body.notifications === 'none' || body.notifications === 'mentions') {
        currentNotificationLevel = body.notifications;
      }
      await fulfillJson(route, {
        data: { notifications: currentNotificationLevel },
      });
      return;
    }

    if (path === `/api/v1/notification-preferences/channel/${TEXT_CHANNEL_ID}`) {
      if (method === 'PUT') {
        const body = request.postDataJSON() as Record<string, unknown>;
        channelNotificationPatches.push(body);
        if (body.mode === 'none' || body.mode === 'mentions_only') {
          currentChannelNotificationMode = body.mode;
        }
      }

      await fulfillJson(route, {
        data: {
          preference: {
            id: 'channel-pref-uat',
            target_type: 'channel',
            target_id: TEXT_CHANNEL_ID,
            mode: currentChannelNotificationMode,
            muted_until: null,
          },
        },
      });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members`) {
      await fulfillJson(route, { data: groupMembersResponse() });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/roles` && method === 'GET') {
      await fulfillJson(route, { data: groupRoles });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members/member-friend/roles` && method === 'PUT') {
      const body = request.postDataJSON() as Record<string, unknown>;
      const roleIds = Array.isArray(body.role_ids)
        ? body.role_ids.filter((roleId): roleId is string => typeof roleId === 'string')
        : [];
      friendRoleIds = roleIds;
      groupMemberRoleRequests.push({ memberId: 'member-friend', ...body });
      await fulfillJson(route, { data: { ok: true } });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/invites`) {
      if (method === 'POST') {
        const body = request.postDataJSON() as Record<string, unknown>;
        groupInviteCreateRequests.push(body);
        await fulfillJson(
          route,
          {
            data: {
              id: 'invite-new',
              code: 'INVITEUAT',
              group_id: GROUP_ID,
              creator_id: CURRENT_USER_ID,
              creator_username: currentUser.username,
              uses: 0,
              max_uses: body.max_uses ?? null,
              expires_at: '2026-01-02T00:00:00.000Z',
              created_at: '2026-01-01T00:00:00.000Z',
            },
          },
          201
        );
        return;
      }

      await fulfillJson(route, {
        data: [
          {
            id: 'invite-old',
            code: 'UATOLD',
            group_id: GROUP_ID,
            creator_id: CURRENT_USER_ID,
            creator_username: currentUser.username,
            uses: 1,
            max_uses: 5,
            expires_at: null,
            created_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      });
      return;
    }

    if (path.startsWith(`/api/v1/groups/${GROUP_ID}/invites/`) && method === 'DELETE') {
      await fulfillJson(route, { data: { ok: true } });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/channels`) {
      if (method === 'POST') {
        const body = request.postDataJSON() as Record<string, unknown>;
        groupChannelCreateRequests.push(body);
        const channel = {
          id: 'settings-channel-uat',
          name: String(body.name ?? 'ops-room'),
          type: typeof body.type === 'string' ? body.type : 'text',
          topic: typeof body.description === 'string' ? body.description : null,
          position: settingsChannels.length,
          category_id: null,
          is_nsfw: false,
          slow_mode_seconds: 0,
        };
        settingsChannels = [...settingsChannels, channel];
        await fulfillJson(route, { data: channel }, 201);
        return;
      }

      await fulfillJson(route, {
        data: [
          {
            id: 'cat-main',
            name: 'Text Channels',
            position: 0,
            channels: settingsChannels,
          },
        ],
      });
      return;
    }

    if (path === '/api/v1/gifs/search') {
      await fulfillJson(route, {
        gifs: [
          {
            id: 'group-gif-launch-proof',
            title: 'Group Launch Proof',
            url: GIF_DATA_URL,
            previewUrl: GIF_DATA_URL,
            width: 320,
            height: 180,
            source: 'klipy',
          },
        ],
      });
      return;
    }

    if (path === '/api/v1/voice-messages' && method === 'POST') {
      groupVoiceUploads.push(request.method());
      await fulfillJson(
        route,
        {
          data: {
            id: 'group-voice-uat',
            url: '/uploads/voice/group-voice-uat.ogg',
            duration: 2,
            waveform: [0.2, 0.6, 0.4],
            content_type: 'audio/ogg',
            size: 42,
            message_id: 'group-msg-uat-voice',
          },
        },
        201
      );
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}/messages`) {
      if (method === 'POST') {
        const body = request.postDataJSON() as Record<string, unknown>;
        sentGroupMessages.push(body);
        const sentIndex = sentGroupMessages.length;
        const replyToId = typeof body.reply_to_id === 'string' ? body.reply_to_id : null;
        const replyToMessage =
          replyToId === 'group-msg-uat-1'
            ? channelMessage({
                reactions: [{ emoji: '👍', count: 1, hasReacted: false }],
              })
            : null;
        const sentMessage = channelMessage({
          id: `group-msg-uat-sent-${sentIndex}`,
          sender_id: CURRENT_USER_ID,
          author: currentUser,
          content: body.content,
          message_type: body.content_type,
          reply_to_id: replyToId,
          reply_to: replyToMessage,
          metadata:
            typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : {},
          file_url: body.file_url,
          file_name: body.file_name,
          file_size: body.file_size,
          file_mime_type: body.file_mime_type,
          thumbnail_url: body.thumbnail_url,
        });
        if (replyToId && body.content === 'Group thread reply proof') {
          threadReplyRequests.push(body);
          threadRepliesByParent.set(replyToId, [
            ...(threadRepliesByParent.get(replyToId) ?? []),
            sentMessage,
          ]);
        }
        await fulfillJson(route, { data: sentMessage }, 201);
        return;
      }

      const channelSearch = url.searchParams.get('search') ?? url.searchParams.get('q') ?? '';
      if (channelSearch.toLowerCase().includes('ancient')) {
        await fulfillJson(route, {
          data: [
            channelMessage({
              id: 'group-msg-uat-ancient',
              content: 'Ancient launch transcript proof',
              created_at: '2025-12-01T00:00:00.000Z',
            }),
          ],
          page_info: {
            has_next_page: false,
            has_previous_page: false,
            start_cursor: null,
            end_cursor: null,
            per_page: 25,
          },
        });
        return;
      }

      if (channelSearch) {
        await fulfillJson(route, {
          data: [],
          page_info: {
            has_next_page: false,
            has_previous_page: false,
            start_cursor: null,
            end_cursor: null,
            per_page: 25,
          },
        });
        return;
      }

      await fulfillJson(route, {
        data: [
          channelMessage({
            reactions: [{ emoji: '👍', count: 1, hasReacted: false }],
          }),
        ],
      });
      return;
    }

    if (
      path ===
      `/api/v1/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}/messages/group-msg-uat-1/replies`
    ) {
      await fulfillJson(route, { data: threadRepliesByParent.get('group-msg-uat-1') ?? [] });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}/pins`) {
      if (method === 'POST') {
        const body = request.postDataJSON() as Record<string, unknown>;
        groupPinRequests.push(body);
        if (typeof body.message_id === 'string') {
          pinnedMessageIds.add(body.message_id);
        }
        await fulfillJson(route, { data: { message_id: body.message_id } }, 201);
        return;
      }

      await fulfillJson(route, {
        data: Array.from(pinnedMessageIds).map((messageId, index) => ({
          id: `pin-${messageId}`,
          channel_id: TEXT_CHANNEL_ID,
          message_id: messageId,
          pinned_by_id: CURRENT_USER_ID,
          position: index,
          pinned_at: '2026-01-01T00:00:00.000Z',
        })),
      });
      return;
    }

    if (
      path.startsWith(`/api/v1/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}/pins/`) &&
      method === 'DELETE'
    ) {
      const pinId = decodeURIComponent(path.split('/').pop() ?? '');
      groupUnpinRequests.push(pinId);
      const messageId = pinId.replace(/^pin-/u, '');
      pinnedMessageIds.delete(messageId);
      await fulfillJson(route, { data: { id: pinId } });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}/thread-counts`) {
      await fulfillJson(route, { data: {} });
      return;
    }

    if (path === '/api/v1/messages/group-msg-uat-1/reactions' && method === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      groupReactionRequests.push({ messageId: 'group-msg-uat-1', ...body });
      await fulfillJson(route, { data: { message_id: 'group-msg-uat-1', ...body } }, 201);
      return;
    }

    if (path === '/api/v1/reports') {
      const body = request.postDataJSON() as Record<string, unknown>;
      reportRequests.push(body);
      await fulfillJson(route, { data: { id: 'report-uat' } }, 201);
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

    if (path === '/api/v1/calls') {
      await fulfillJson(route, {
        data: [
          {
            id: 'call-uat',
            type: 'video',
            state: 'ended',
            creator_id: FRIEND_ID,
            participant_ids: [CURRENT_USER_ID, FRIEND_ID],
            duration_seconds: 84,
            started_at: '2026-01-01T00:00:00.000Z',
            ended_at: '2026-01-01T00:01:24.000Z',
            inserted_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      });
      return;
    }

    await fulfillJson(route, { data: {} });
  });

  return {
    groupChannelCreateRequests,
    groupAttachmentUploads,
    groupVoiceUploads,
    groupInviteCreateRequests,
    groupMemberRoleRequests,
    groupPinRequests,
    groupReactionRequests,
    groupSettingsPatches,
    groupUnpinRequests,
    channelNotificationPatches,
    notificationPatches,
    reportRequests,
    sentDmMessages,
    sentGroupMessages,
    threadReplyRequests,
  };
}

test.describe('Web owner focused UAT', () => {
  test.setTimeout(60_000);

  test('verifies auth, DMs, groups, social, settings, Nodes, and calls routes', async ({
    page,
  }) => {
    const {
      groupAttachmentUploads,
      groupChannelCreateRequests,
      groupVoiceUploads,
      groupInviteCreateRequests,
      groupMemberRoleRequests,
      groupPinRequests,
      groupReactionRequests,
      groupSettingsPatches,
      groupUnpinRequests,
      channelNotificationPatches,
      notificationPatches,
      reportRequests,
      sentDmMessages,
      sentGroupMessages,
      threadReplyRequests,
    } = await installOwnerUatMocks(page);

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back|sign in|log in/i })).toBeVisible();

    await page.goto(`/messages/${CONVERSATION_ID}`);
    await expect(page.getByRole('main')).toContainText('DM owner UAT proof');
    await page.getByPlaceholder(/type a message/i).fill('DM routed UAT send');
    await page.getByRole('button', { name: /send message/i }).click();
    await expect
      .poll(() => sentDmMessages, { message: 'DM route sent through the conversation endpoint' })
      .toContainEqual(expect.objectContaining({ content: 'DM routed UAT send' }));

    await page.evaluate(
      ({ userId, avatarBorderId, titleId, badgeId, nameplateId }) => {
        window.dispatchEvent(
          new CustomEvent('cgraph:e2e-identity-patch', {
            detail: {
              userId,
              customization: {
                avatar_border_id: avatarBorderId,
                title_id: titleId,
                equipped_badges: [badgeId],
                equipped_nameplate: nameplateId,
              },
            },
          })
        );
      },
      {
        userId: FRIEND_ID,
        avatarBorderId: LIVE_AVATAR_BORDER_ID,
        titleId: LIVE_TITLE_ID,
        badgeId: LIVE_BADGE_ID,
        nameplateId: LIVE_NAMEPLATE_ID,
      }
    );
    await expect(
      page.locator(`[data-avatar-border-id="${LIVE_AVATAR_BORDER_ID}"]`).first()
    ).toBeVisible();
    await expect(page.getByText('Founder').first()).toBeVisible();

    await page.locator(`[data-avatar-border-id="${LIVE_AVATAR_BORDER_ID}"]`).first().click();
    await expect(page.locator(`[data-nameplate-id="${LIVE_NAMEPLATE_ID}"]`).first()).toBeVisible();
    await expect(page.locator(`[data-badge-id="${LIVE_BADGE_ID}"]`).first()).toBeVisible();
    await page.getByLabel('Close').click();

    await page.evaluate((callerId) => {
      window.dispatchEvent(
        new CustomEvent('cgraph:e2e-incoming-call', {
          detail: {
            roomId: 'incoming-room-uat',
            callerId,
            callerName: 'Friend User',
            callerAvatar: null,
            type: 'video',
            timestamp: Date.now(),
          },
        })
      );
    }, FRIEND_ID);
    await expect(page.getByText(/incoming video call/i)).toBeVisible();
    await page.getByRole('button', { name: /accept/i }).click();
    await expect(page).toHaveURL(
      new RegExp(`/call/${FRIEND_ID}/video\\?incoming=true&roomId=incoming-room-uat$`)
    );
    await expect(page.getByRole('button', { name: /hide video|show video/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /end call/i })).toBeVisible();
    await page.getByRole('button', { name: /end call/i }).click();
    await expect(page).toHaveURL(new RegExp(`/messages/${CONVERSATION_ID}$`));

    await page.goto(`/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}`);
    await expect(page.getByText('Owner checklist proof')).toBeVisible();
    const friendGroupMessage = page.locator('#group-message-group-msg-uat-1');
    await expect(friendGroupMessage).toBeVisible();

    const groupComposer = page.getByPlaceholder(/message #general/i);
    await groupComposer.fill('Group routed UAT send');
    await groupComposer.press('Enter');
    await expect
      .poll(() => sentGroupMessages, { message: 'Group route sent through the channel endpoint' })
      .toContainEqual(expect.objectContaining({ content: 'Group routed UAT send' }));

    await friendGroupMessage.getByRole('button', { name: /👍\s*1/ }).click();
    await expect
      .poll(() => groupReactionRequests, { message: 'group reaction endpoint received emoji' })
      .toContainEqual(expect.objectContaining({ messageId: 'group-msg-uat-1', emoji: '👍' }));
    await expect(friendGroupMessage.getByRole('button', { name: /👍\s*2/ })).toBeVisible();

    await friendGroupMessage.hover();
    await friendGroupMessage.getByTitle(/^Reply$/).click();
    await expect(page.getByText(/replying to friend user/i)).toBeVisible();
    await groupComposer.fill('Group reply payload proof');
    await groupComposer.press('Enter');
    await expect
      .poll(() => sentGroupMessages, {
        message: 'group reply endpoint received reply_to_id',
      })
      .toContainEqual(
        expect.objectContaining({
          content: 'Group reply payload proof',
          reply_to_id: 'group-msg-uat-1',
        })
      );
    const groupReplyMessage = page.locator('#group-message-group-msg-uat-sent-2');
    await expect(groupReplyMessage).toContainText('Friend User');
    await expect(groupReplyMessage).toContainText('Group owner UAT proof');

    await friendGroupMessage.hover();
    await friendGroupMessage.getByTitle('Reply in Thread').click();
    const threadPanel = page.getByRole('complementary', { name: /message thread/i });
    await expect(threadPanel).toContainText('Group owner UAT proof');
    const threadInput = threadPanel.getByPlaceholder(/reply to thread/i);
    await threadInput.fill('Group thread reply proof');
    await threadInput.press('Enter');
    await expect
      .poll(() => threadReplyRequests, {
        message: 'group thread reply endpoint received reply_to_id',
      })
      .toContainEqual(
        expect.objectContaining({
          content: 'Group thread reply proof',
          reply_to_id: 'group-msg-uat-1',
        })
      );
    await expect(threadPanel).toContainText('Group thread reply proof');
    await expect(threadPanel).toContainText('1 reply');
    await threadPanel.getByRole('button', { name: /close thread/i }).click();
    await expect(threadPanel).not.toBeVisible();

    await page.locator('input[type="file"]').setInputFiles({
      name: 'group-proof.png',
      mimeType: 'image/png',
      buffer: Buffer.from('browser-proof'),
    });
    await expect(page.getByText('group-proof.png')).toBeVisible();
    await groupComposer.focus();
    await groupComposer.press('Enter');
    await expect
      .poll(() => groupAttachmentUploads, {
        message: 'group attachment upload endpoint was called',
      })
      .toContain('POST');
    await expect
      .poll(() => sentGroupMessages, { message: 'group message endpoint received media metadata' })
      .toContainEqual(
        expect.objectContaining({
          content: 'group-proof.png',
          content_type: 'image',
          file_url: '/uploads/groups/proof.png',
          file_name: 'group-proof.png',
          file_size: 12,
          file_mime_type: 'image/png',
          thumbnail_url: '/uploads/groups/proof-thumb.png',
          metadata: expect.objectContaining({
            fileUrl: '/uploads/groups/proof.png',
            fileName: 'group-proof.png',
            fileSize: 12,
            fileMimeType: 'image/png',
            thumbnailUrl: '/uploads/groups/proof-thumb.png',
          }),
        })
      );
    await expect(
      page.locator('a[href$="/uploads/groups/proof.png"] img[alt="group-proof.png"]')
    ).toBeVisible();

    await page.getByRole('button', { name: /open gif picker/i }).click();
    await page.getByRole('button', { name: /select gif group launch proof/i }).click();
    await expect
      .poll(() => sentGroupMessages, { message: 'group message endpoint received GIF metadata' })
      .toContainEqual(
        expect.objectContaining({
          content: GIF_DATA_URL,
          content_type: 'gif',
          metadata: expect.objectContaining({
            gifId: 'group-gif-launch-proof',
            gifTitle: 'Group Launch Proof',
            gifUrl: GIF_DATA_URL,
            gifPreviewUrl: GIF_DATA_URL,
            gifSource: 'klipy',
          }),
          link_preview: expect.objectContaining({
            gifId: 'group-gif-launch-proof',
            gifTitle: 'Group Launch Proof',
          }),
        })
      );
    await expect(page.locator('img[alt="Group Launch Proof"]').first()).toBeVisible();

    await page.getByRole('button', { name: /open sticker picker/i }).click();
    await page.getByRole('menuitem', { name: /send sticker wave/i }).click();
    await expect
      .poll(() => sentGroupMessages, {
        message: 'group message endpoint received sticker metadata',
      })
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

    await page.getByRole('button', { name: /record voice message/i }).click();
    await page.getByRole('button', { name: /record voice message/i }).click();
    await page.getByRole('button', { name: /stop recording/i }).click();
    await page.getByRole('button', { name: /send voice message/i }).click();
    await expect
      .poll(() => groupVoiceUploads, {
        message: 'group voice upload endpoint was called',
      })
      .toContain('POST');
    await expect(page.locator('audio[src="/uploads/voice/group-voice-uat.ogg"]')).toBeAttached();

    await page.getByRole('button', { name: /search messages/i }).click();
    const groupSearch = page.getByPlaceholder(/search #general/i);
    await expect(groupSearch).toBeVisible();
    await groupSearch.fill('Group routed');
    await expect(page.getByText('1/1')).toBeVisible();
    await page.getByRole('button', { name: /next result/i }).click();
    await groupSearch.fill('ancient');
    await expect(page.getByText('1/1')).toBeVisible();
    await expect(page.locator('#group-message-group-msg-uat-ancient')).toContainText(
      'Ancient launch transcript proof'
    );
    await page.getByRole('button', { name: /close search/i }).click();
    await expect(groupSearch).not.toBeVisible();

    await page.getByRole('button', { name: /mute channel/i }).click();
    await expect
      .poll(() => channelNotificationPatches, {
        message: 'channel mute endpoint received the patch',
      })
      .toContainEqual(
        expect.objectContaining({
          mode: 'none',
          muted_until: null,
        })
      );
    await expect(page.getByRole('button', { name: /unmute channel/i })).toBeVisible();
    await page.getByRole('button', { name: /unmute channel/i }).click();
    await expect
      .poll(() => channelNotificationPatches, {
        message: 'channel unmute endpoint received the patch',
      })
      .toContainEqual(expect.objectContaining({ mode: 'mentions_only' }));
    await expect(page.getByRole('button', { name: /mute channel/i })).toBeVisible();

    const ownGroupMessage = page.locator('#group-message-group-msg-uat-sent-1');
    await ownGroupMessage.hover();
    await ownGroupMessage.getByTitle('More Actions').click();
    await page.getByRole('menuitem', { name: /edit/i }).click();
    await ownGroupMessage.locator('textarea').fill('Group routed UAT edited');
    await ownGroupMessage.getByRole('button', { name: /save/i }).click();
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const target = window as Window & { __cgraphGroupActionEvents?: unknown[] };
            return target.__cgraphGroupActionEvents ?? [];
          }),
        { message: 'group edit socket action was emitted' }
      )
      .toContainEqual(
        expect.objectContaining({
          event: 'edit_message',
          topic: `group:${TEXT_CHANNEL_ID}`,
          payload: expect.objectContaining({
            message_id: 'group-msg-uat-sent-1',
            content: 'Group routed UAT edited',
          }),
        })
      );
    await expect(ownGroupMessage).toContainText('Group routed UAT edited');
    await expect(ownGroupMessage).toContainText('(edited)');

    await ownGroupMessage.hover();
    await ownGroupMessage.getByTitle('More Actions').click();
    await page.getByRole('menuitem', { name: /pin/i }).click();
    await expect
      .poll(() => groupPinRequests, { message: 'group pin endpoint received the message id' })
      .toContainEqual(expect.objectContaining({ message_id: 'group-msg-uat-sent-1' }));
    await expect(ownGroupMessage).toContainText('Pinned');
    const pinnedPanel = page.getByRole('complementary', { name: /pinned messages/i });
    await expect(pinnedPanel).toContainText('Group routed UAT edited');
    await pinnedPanel.getByText('Group routed UAT edited').hover();
    await pinnedPanel.getByRole('button', { name: /unpin group routed uat edited/i }).click();
    await expect
      .poll(() => groupUnpinRequests, { message: 'group unpin endpoint received the pin id' })
      .toContain('pin-group-msg-uat-sent-1');
    await expect(pinnedPanel).toContainText('No pinned messages');
    await expect(ownGroupMessage).not.toContainText('Pinned');

    await ownGroupMessage.hover();
    await ownGroupMessage.getByTitle('More Actions').click();
    await page.getByRole('menuitem', { name: /copy link/i }).click();
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const target = window as Window & { __cgraphCopiedText?: string };
            return target.__cgraphCopiedText ?? '';
          }),
        { message: 'message link was copied' }
      )
      .toContain(`/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}?scrollTo=group-msg-uat-sent-1`);

    await friendGroupMessage.hover();
    await friendGroupMessage.getByTitle('More Actions').click();
    await page.getByRole('menuitem', { name: /report/i }).click();
    await expect
      .poll(() => reportRequests, { message: 'group report endpoint received the report' })
      .toContainEqual(
        expect.objectContaining({
          report: expect.objectContaining({
            target_type: 'message',
            target_id: 'group-msg-uat-1',
            category: 'other',
            description: 'group report proof',
          }),
        })
      );

    await ownGroupMessage.hover();
    await ownGroupMessage.getByTitle('More Actions').click();
    await page.getByRole('menuitem', { name: /delete/i }).click();
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const target = window as Window & { __cgraphGroupActionEvents?: unknown[] };
            return target.__cgraphGroupActionEvents ?? [];
          }),
        { message: 'group delete socket action was emitted' }
      )
      .toContainEqual(
        expect.objectContaining({
          event: 'delete_message',
          topic: `group:${TEXT_CHANNEL_ID}`,
          payload: expect.objectContaining({ message_id: 'group-msg-uat-sent-1' }),
        })
      );
    await expect(ownGroupMessage).not.toBeVisible();

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await expect(page.getByText('Group Settings').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Overview$/ })).toBeVisible();
    await page.locator('input[type="text"]').first().fill('UAT Hub Verified');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect
      .poll(() => groupSettingsPatches, { message: 'group overview save patched the group' })
      .toContainEqual(expect.objectContaining({ name: 'UAT Hub Verified' }));

    await page.getByRole('button', { name: /^Invites$/ }).click();
    await expect(page.getByRole('heading', { name: /^Invites$/ })).toBeVisible();
    await page.getByRole('button', { name: /^Create Invite$/ }).click();
    await expect(page.getByText('Invite People')).toBeVisible();
    await page.getByRole('button', { name: /generate new link/i }).click();
    await expect
      .poll(() => groupInviteCreateRequests, {
        message: 'group invite modal posted the default expiration',
      })
      .toContainEqual(expect.objectContaining({ expires_in: 86400 }));
    await expect(page.locator('input[readonly]')).toHaveValue(/\/invite\/INVITEUAT$/);
    await page.getByRole('button', { name: /^Close$/ }).click();
    await expect(page.getByText('Invite People')).not.toBeVisible();

    await page.getByRole('button', { name: /^Members$/ }).click();
    await expect(page.getByRole('heading', { name: /^Members$/ })).toBeVisible();
    await page.getByPlaceholder(/search members/i).fill('friend');
    await expect(page.getByText('Friend User')).toBeVisible();
    await page.getByRole('button', { name: /member actions for friend user/i }).click();
    await page.getByRole('button', { name: /change role/i }).click();
    await expect(page.getByRole('heading', { name: /assign roles/i })).toBeVisible();
    await page.getByLabel('Moderator').check();
    await page.getByRole('button', { name: /save roles/i }).click();
    await expect
      .poll(() => groupMemberRoleRequests, {
        message: 'member role modal persisted role_ids',
      })
      .toContainEqual(
        expect.objectContaining({
          memberId: 'member-friend',
          role_ids: ['role-mod'],
        })
      );

    await page.getByRole('button', { name: /^Channels$/ }).click();
    await expect(page.getByRole('heading', { name: /^Channels$/ })).toBeVisible();
    await page.getByRole('button', { name: /^Create Channel$/ }).click();
    await page.getByPlaceholder('channel-name').fill('ops room');
    await page.getByPlaceholder(/channel topic/i).fill('Settings create proof');
    await page.getByRole('button', { name: /^Create$/ }).click();
    await expect
      .poll(() => groupChannelCreateRequests, {
        message: 'channels tab created a normalized text channel',
      })
      .toContainEqual(
        expect.objectContaining({
          name: 'ops-room',
          type: 'text',
          description: 'Settings create proof',
        })
      );
    await expect(page.getByText('ops-room')).toBeVisible();

    await page.getByRole('button', { name: /^Roles$/ }).click();
    await expect(page.getByText('Admin')).toBeVisible();
    await page.getByText('Admin').click();
    await expect(page.getByRole('heading', { name: /edit role/i })).toBeVisible();

    await page.getByRole('button', { name: /close group settings/i }).click();
    await expect(page).toHaveURL(new RegExp(`/groups/${GROUP_ID}/channels/${TEXT_CHANNEL_ID}$`));

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

    await page.goto('/calls/history');
    await expect(page.getByRole('heading', { name: /call history/i })).toBeVisible();
    await expect(page.getByText(/call participant/i)).toBeVisible();
    await page.getByRole('button', { name: /call call participant/i }).click();
    await expect(page).toHaveURL(new RegExp(`/call/${FRIEND_ID}/video$`));
    await expect(page.getByRole('button', { name: /hide video|show video/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /end call/i })).toBeVisible();

    await page.goto(`/groups/${GROUP_ID}/voice/${VOICE_CHANNEL_ID}`);
    await expect(page.getByText('Voice Room')).toBeVisible();
    await expect(page.getByRole('button', { name: /join call/i })).toBeVisible();
  });
});
