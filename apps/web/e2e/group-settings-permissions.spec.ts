import { expect, test, type Page, type Route } from '@playwright/test';

const CURRENT_USER_ID = 'e2e-user';
const GROUP_ID = 'group-permission-edge';
const ONE_PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64'
);

const currentUser = {
  id: CURRENT_USER_ID,
  username: 'e2e-user',
  displayName: 'E2E User',
  display_name: 'E2E User',
  avatarUrl: null,
  avatar_url: null,
  status: 'online',
};

const friendUser = {
  id: 'permission-edge-friend',
  username: 'permission-friend',
  displayName: 'Permission Friend',
  display_name: 'Permission Friend',
  avatarUrl: null,
  avatar_url: null,
  status: 'online',
};

const permissionDeniedMessage = {
  id: 'permission-pin-denied',
  channel_id: 'permission-edge-general',
  sender_id: friendUser.id,
  author: friendUser,
  content: 'Permission denied pin route proof',
  message_type: 'text',
  is_pinned: false,
  is_edited: false,
  reply_to_id: null,
  metadata: {},
  reactions: [],
  created_at: '2026-01-01T00:00:00.000Z',
};

const ordinaryMemberGroup = {
  id: GROUP_ID,
  name: 'Permission Edge Hub',
  slug: 'permission-edge-hub',
  description: 'Permission edge proof',
  icon_url: null,
  banner_url: null,
  owner_id: 'another-owner',
  member_count: 2,
  online_count: 1,
  is_public: true,
  channels: [
    {
      id: 'permission-edge-general',
      name: 'general',
      type: 'text',
      topic: 'Permission edge proof',
      position: 0,
    },
  ],
  categories: [],
  roles: [
    {
      id: 'role-member',
      name: 'Member',
      color: '#94a3b8',
      position: 0,
      permissions: 0,
      is_default: true,
      is_hoisted: false,
      is_mentionable: false,
    },
  ],
  myMember: {
    id: 'member-current',
    user_id: CURRENT_USER_ID,
    user: currentUser,
    roles: [
      {
        id: 'role-member',
        name: 'Member',
        color: '#94a3b8',
        position: 0,
        permissions: 0,
        is_default: true,
        is_hoisted: false,
        is_mentionable: false,
      },
    ],
    notifications: 'mentions',
    joined_at: '2026-01-01T00:00:00.000Z',
  },
  created_at: '2026-01-01T00:00:00.000Z',
};

const ownerGroup = {
  ...ordinaryMemberGroup,
  owner_id: CURRENT_USER_ID,
  myMember: {
    ...ordinaryMemberGroup.myMember,
    roles: [
      {
        id: 'role-admin',
        name: 'Admin',
        color: '#ffffff',
        position: 0,
        permissions: 1,
        is_default: false,
        is_hoisted: true,
        is_mentionable: true,
      },
    ],
  },
};

const roleManagementRoles = [
  {
    id: 'role-admin',
    name: 'Admin',
    color: '#ffffff',
    position: 2,
    permissions: 0x80000000,
    is_default: false,
    is_hoisted: true,
    is_mentionable: true,
  },
  {
    id: 'role-mod',
    name: 'Moderator',
    color: '#22c55e',
    position: 1,
    permissions: 128,
    is_default: false,
    is_hoisted: true,
    is_mentionable: true,
  },
  {
    id: 'role-member',
    name: 'Member',
    color: '#94a3b8',
    position: 0,
    permissions: 3,
    is_default: true,
    is_hoisted: false,
    is_mentionable: false,
  },
];

const roleManagementGroup = {
  ...ordinaryMemberGroup,
  owner_id: CURRENT_USER_ID,
  roles: roleManagementRoles,
  myMember: {
    ...ordinaryMemberGroup.myMember,
    roles: [roleManagementRoles[0]],
  },
};

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installGroupPermissionMocks(
  page: Page,
  {
    groupFixture = ordinaryMemberGroup,
    allowGroupPatch = false,
    denyRoleCreate = false,
    denyRoleUpdate = false,
    denyRoleDelete = false,
    denyRoleReorder = false,
    roleReorderErrorMessage = 'Forbidden',
    roleUpdateErrorBody,
    roleUpdateErrorMessage = 'Forbidden',
    roleUpdateErrorStatus = 403,
    roleDeleteErrorMessage = 'Forbidden',
    denyInviteList = false,
    denyInviteCreate = false,
    denyInviteDelete = false,
    denyMemberKick = false,
    denyMemberBan = false,
    denyMemberMute = false,
    denyMemberRoleUpdate = false,
    denyAutomodList = false,
    denyAutomodCreate = false,
    denyAutomodUpdate = false,
    denyAutomodToggle = false,
    denyAutomodDelete = false,
    denyPinCreate = false,
    denyPinList = false,
    denyPinDelete = false,
    denyLeave = false,
    denyDelete = false,
    seedPinnedMessage = false,
  }: {
    readonly groupFixture?: typeof ordinaryMemberGroup;
    readonly allowGroupPatch?: boolean;
    readonly denyRoleCreate?: boolean;
    readonly denyRoleUpdate?: boolean;
    readonly denyRoleDelete?: boolean;
    readonly denyRoleReorder?: boolean;
    readonly roleReorderErrorMessage?: string;
    readonly roleUpdateErrorBody?: unknown;
    readonly roleUpdateErrorMessage?: string;
    readonly roleUpdateErrorStatus?: number;
    readonly roleDeleteErrorMessage?: string;
    readonly denyInviteList?: boolean;
    readonly denyInviteCreate?: boolean;
    readonly denyInviteDelete?: boolean;
    readonly denyMemberKick?: boolean;
    readonly denyMemberBan?: boolean;
    readonly denyMemberMute?: boolean;
    readonly denyMemberRoleUpdate?: boolean;
    readonly denyAutomodList?: boolean;
    readonly denyAutomodCreate?: boolean;
    readonly denyAutomodUpdate?: boolean;
    readonly denyAutomodToggle?: boolean;
    readonly denyAutomodDelete?: boolean;
    readonly denyPinCreate?: boolean;
    readonly denyPinList?: boolean;
    readonly denyPinDelete?: boolean;
    readonly denyLeave?: boolean;
    readonly denyDelete?: boolean;
    readonly seedPinnedMessage?: boolean;
  } = {}
) {
  let currentGroupFixture = groupFixture;
  let roleState = groupFixture.roles.map((role) => ({ ...role }));
  let friendMember: Record<string, unknown> | null = {
    id: 'member-friend',
    user_id: friendUser.id,
    user: friendUser,
    notifications: 'mentions',
    joined_at: '2026-01-01T00:00:00.000Z',
    is_muted: false,
    muted_until: null,
  };
  let automodRules = [
    {
      id: 'automod-invite-blocker',
      name: 'Invite Blocker',
      rule_type: 'link_filter',
      action: 'delete',
      enabled: true,
      pattern: 'discord.gg',
      config: null,
      inserted_at: '2026-01-01T00:00:00.000Z',
    },
  ];
  const requests = {
    groupPatches: [] as unknown[],
    pinCreates: [] as unknown[],
    pinDeletes: [] as string[],
    roleCreates: [] as unknown[],
    roleUpdates: [] as Array<{ roleId: string; body: unknown }>,
    roleDeletes: [] as string[],
    roleReorders: [] as unknown[],
    inviteLists: 0,
    inviteCreates: [] as unknown[],
    inviteDeletes: [] as string[],
    memberKicks: [] as string[],
    memberKickBodies: [] as unknown[],
    memberBans: [] as string[],
    memberBanBodies: [] as unknown[],
    memberMutes: [] as string[],
    memberMuteBodies: [] as unknown[],
    memberUnmutes: [] as string[],
    memberRoleUpdates: [] as Array<{ memberId: string; body: unknown }>,
    automodLists: 0,
    automodCreates: [] as unknown[],
    automodUpdates: [] as Array<{ ruleId: string; body: unknown }>,
    automodToggles: [] as string[],
    automodDeletes: [] as string[],
    leaves: [] as string[],
    deletes: [] as string[],
    iconUploads: 0,
    bannerUploads: 0,
  };

  const groupResponse = () => ({ ...currentGroupFixture, roles: roleState });

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

    if (path === '/api/v1/groups' && method === 'GET') {
      await fulfillJson(route, { data: [groupResponse()] });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}`) {
      if (method === 'PATCH') {
        const body = request.postDataJSON();
        requests.groupPatches.push(body);
        if (allowGroupPatch) {
          currentGroupFixture = { ...currentGroupFixture, ...body };
          await fulfillJson(route, { data: groupResponse() });
          return;
        }

        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }

      if (method === 'DELETE') {
        requests.deletes.push(GROUP_ID);
        if (denyDelete) {
          await fulfillJson(route, { message: 'Forbidden' }, 403);
          return;
        }

        await fulfillJson(route, { data: { ok: true } });
        return;
      }

      await fulfillJson(route, { data: groupResponse() });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/leave` && method === 'POST') {
      requests.leaves.push(GROUP_ID);
      if (denyLeave) {
        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }

      await fulfillJson(route, { data: { ok: true } });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/avatar` && method === 'POST') {
      requests.iconUploads += 1;
      await fulfillJson(route, { url: '/uploads/group-icon.png' });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/banner` && method === 'POST') {
      requests.bannerUploads += 1;
      await fulfillJson(route, { url: '/uploads/group-banner.png' });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/roles/reorder` && method === 'PUT') {
      const body = request.postDataJSON() as Record<string, unknown>;
      const roleIds = Array.isArray(body.role_ids)
        ? body.role_ids.filter((roleId): roleId is string => typeof roleId === 'string')
        : [];
      requests.roleReorders.push(body);
      if (denyRoleReorder) {
        await fulfillJson(route, { message: roleReorderErrorMessage }, 403);
        return;
      }
      const byId = new Map(roleState.map((role) => [role.id, role]));
      const orderedRoles = roleIds
        .map((roleId, index) => {
          const role = byId.get(roleId);
          if (!role) return null;
          return { ...role, position: roleIds.length - index - 1 };
        })
        .filter((role): role is (typeof roleState)[number] => role !== null);
      const untouchedRoles = roleState.filter((role) => !roleIds.includes(role.id));
      roleState = [...orderedRoles, ...untouchedRoles].sort((a, b) => b.position - a.position);
      await fulfillJson(route, { data: roleState });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/roles` && method === 'GET') {
      await fulfillJson(route, { data: roleState });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/roles` && method === 'POST') {
      const body = request.postDataJSON() as Record<string, unknown>;
      requests.roleCreates.push(body);
      if (denyRoleCreate) {
        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }
      const createdRole = {
        id: 'role-ops',
        name: typeof body.name === 'string' ? body.name : 'Ops Lead',
        color: typeof body.color === 'string' ? body.color : '#10b981',
        position: roleState.length,
        permissions: typeof body.permissions === 'number' ? body.permissions : 0,
        is_default: false,
        is_hoisted: body.is_hoisted === true,
        is_mentionable: body.is_mentionable === true,
      };
      roleState = [createdRole, ...roleState].sort((a, b) => b.position - a.position);
      await fulfillJson(route, { data: createdRole }, 201);
      return;
    }

    if (path.startsWith(`/api/v1/groups/${GROUP_ID}/roles/`) && method === 'PUT') {
      const roleId = path.split('/').pop() ?? '';
      const body = request.postDataJSON() as Record<string, unknown>;
      requests.roleUpdates.push({ roleId, body });
      if (denyRoleUpdate) {
        await fulfillJson(route, roleUpdateErrorBody ?? { message: roleUpdateErrorMessage }, roleUpdateErrorStatus);
        return;
      }
      const existingRole = roleState.find((role) => role.id === roleId);
      const updatedRole = {
        ...(existingRole ?? {
          id: roleId,
          name: 'Updated Role',
          color: '#10b981',
          position: 0,
          permissions: 0,
          is_default: false,
          is_hoisted: false,
          is_mentionable: false,
        }),
        name: typeof body.name === 'string' ? body.name : existingRole?.name,
        color: typeof body.color === 'string' ? body.color : existingRole?.color,
        permissions:
          typeof body.permissions === 'number' ? body.permissions : existingRole?.permissions,
        is_hoisted:
          typeof body.is_hoisted === 'boolean' ? body.is_hoisted : existingRole?.is_hoisted,
        is_mentionable:
          typeof body.is_mentionable === 'boolean'
            ? body.is_mentionable
            : existingRole?.is_mentionable,
      };
      roleState = roleState.map((role) => (role.id === roleId ? updatedRole : role));
      await fulfillJson(route, { data: updatedRole });
      return;
    }

    if (path.startsWith(`/api/v1/groups/${GROUP_ID}/roles/`) && method === 'DELETE') {
      const roleId = path.split('/').pop() ?? '';
      requests.roleDeletes.push(roleId);
      if (denyRoleDelete) {
        await fulfillJson(route, { message: roleDeleteErrorMessage }, 403);
        return;
      }
      roleState = roleState.filter((role) => role.id !== roleId);
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members` && method === 'GET') {
      await fulfillJson(route, {
        data: [
          groupResponse().myMember,
          ...(friendMember ? [{ ...friendMember, roles: roleState }] : []),
        ],
      });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members/member-friend` && method === 'DELETE') {
      requests.memberKicks.push('member-friend');
      requests.memberKickBodies.push(request.postDataJSON());
      if (denyMemberKick) {
        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }

      friendMember = null;
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members/member-friend/ban` && method === 'POST') {
      requests.memberBans.push('member-friend');
      requests.memberBanBodies.push(request.postDataJSON());
      if (denyMemberBan) {
        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }

      friendMember = null;
      await fulfillJson(route, {
        data: {
          id: 'ban-edge',
          group_id: GROUP_ID,
          user_id: friendUser.id,
          reason: 'moderation action',
        },
      });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members/member-friend/mute` && method === 'POST') {
      requests.memberMutes.push('member-friend');
      requests.memberMuteBodies.push(request.postDataJSON());
      if (denyMemberMute) {
        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }

      friendMember = friendMember
        ? {
            ...friendMember,
            is_muted: true,
            muted_until: '2026-12-31T00:00:00.000Z',
          }
        : friendMember;
      await fulfillJson(route, { data: friendMember });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members/member-friend/mute` && method === 'DELETE') {
      requests.memberUnmutes.push('member-friend');
      friendMember = friendMember
        ? {
            ...friendMember,
            is_muted: false,
            muted_until: null,
          }
        : friendMember;
      await fulfillJson(route, { data: friendMember });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members/member-friend/roles` && method === 'PUT') {
      const body = request.postDataJSON();
      requests.memberRoleUpdates.push({ memberId: 'member-friend', body });
      if (denyMemberRoleUpdate) {
        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }

      await fulfillJson(route, { data: { ok: true } });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/invites`) {
      if (method === 'GET') {
        requests.inviteLists += 1;
        if (denyInviteList) {
          await fulfillJson(route, { message: 'Forbidden' }, 403);
          return;
        }

        await fulfillJson(route, {
          data: [
            {
              id: 'invite-edge',
              code: 'EDGE403',
              max_uses: 10,
              uses: 1,
              expires_at: null,
              creator_id: CURRENT_USER_ID,
              creator_username: currentUser.username,
              created_at: '2026-01-01T00:00:00.000Z',
            },
          ],
        });
        return;
      }

      if (method === 'POST') {
        const body = request.postDataJSON() as Record<string, unknown>;
        const requestedMaxUses = typeof body.max_uses === 'number' ? body.max_uses : null;
        const requestedExpiresIn = typeof body.expires_in === 'number' ? body.expires_in : null;
        const expiresAt = requestedExpiresIn
          ? new Date(Date.now() + requestedExpiresIn * 1000).toISOString()
          : null;
        requests.inviteCreates.push(body);
        if (denyInviteCreate) {
          await fulfillJson(route, { message: 'Forbidden' }, 403);
          return;
        }

        await fulfillJson(route, {
          data: {
            id: 'invite-new',
            code: 'NEW403',
            max_uses: requestedMaxUses,
            uses: 0,
            expires_at: expiresAt,
            creator_id: CURRENT_USER_ID,
            creator_username: currentUser.username,
            created_at: '2026-01-01T00:00:00.000Z',
          },
        });
        return;
      }
    }

    if (path === `/api/v1/groups/${GROUP_ID}/invites/invite-edge` && method === 'DELETE') {
      requests.inviteDeletes.push('invite-edge');
      if (denyInviteDelete) {
        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }

      await route.fulfill({ status: 204, body: '' });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/automod/rules`) {
      if (method === 'GET') {
        requests.automodLists += 1;
        if (denyAutomodList) {
          await fulfillJson(route, { message: 'Forbidden' }, 403);
          return;
        }

        await fulfillJson(route, { data: automodRules });
        return;
      }

      if (method === 'POST') {
        const body = request.postDataJSON() as Record<string, unknown>;
        requests.automodCreates.push(body);
        if (denyAutomodCreate) {
          await fulfillJson(route, { message: 'Forbidden' }, 403);
          return;
        }

        const createdRule = {
          id: 'automod-no-spam',
          name: typeof body.name === 'string' ? body.name : 'No spam',
          rule_type: typeof body.rule_type === 'string' ? body.rule_type : 'word_filter',
          action: typeof body.action === 'string' ? body.action : 'delete',
          enabled: true,
          pattern: typeof body.pattern === 'string' ? body.pattern : null,
          config: null,
          inserted_at: '2026-01-01T00:00:00.000Z',
        };
        automodRules = [...automodRules, createdRule];
        await fulfillJson(route, { data: createdRule }, 201);
        return;
      }
    }

    if (
      path === `/api/v1/groups/${GROUP_ID}/automod/rules/automod-invite-blocker` &&
      method === 'PUT'
    ) {
      const body = request.postDataJSON() as Record<string, unknown>;
      requests.automodUpdates.push({ ruleId: 'automod-invite-blocker', body });
      if (denyAutomodUpdate) {
        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }

      automodRules = automodRules.map((rule) =>
        rule.id === 'automod-invite-blocker'
          ? {
              ...rule,
              name: typeof body.name === 'string' ? body.name : rule.name,
              rule_type: typeof body.rule_type === 'string' ? body.rule_type : rule.rule_type,
              action: typeof body.action === 'string' ? body.action : rule.action,
              pattern: typeof body.pattern === 'string' ? body.pattern : rule.pattern,
            }
          : rule
      );
      await fulfillJson(route, {
        data: automodRules.find((rule) => rule.id === 'automod-invite-blocker'),
      });
      return;
    }

    if (
      path === `/api/v1/groups/${GROUP_ID}/automod/rules/automod-invite-blocker/toggle` &&
      method === 'PATCH'
    ) {
      requests.automodToggles.push('automod-invite-blocker');
      if (denyAutomodToggle) {
        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }

      automodRules = automodRules.map((rule) =>
        rule.id === 'automod-invite-blocker' ? { ...rule, enabled: !rule.enabled } : rule
      );
      await fulfillJson(route, {
        data: automodRules.find((rule) => rule.id === 'automod-invite-blocker'),
      });
      return;
    }

    if (
      path === `/api/v1/groups/${GROUP_ID}/automod/rules/automod-invite-blocker` &&
      method === 'DELETE'
    ) {
      requests.automodDeletes.push('automod-invite-blocker');
      if (denyAutomodDelete) {
        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }

      automodRules = automodRules.filter((rule) => rule.id !== 'automod-invite-blocker');
      await route.fulfill({ status: 204, body: '' });
      return;
    }

    if (
      path === `/api/v1/groups/${GROUP_ID}/channels/permission-edge-general/messages` &&
      method === 'GET'
    ) {
      await fulfillJson(route, {
        data: [permissionDeniedMessage],
        meta: {
          has_next_page: false,
          has_previous_page: false,
          start_cursor: null,
          end_cursor: null,
          per_page: 50,
        },
      });
      return;
    }

    if (
      path === `/api/v1/groups/${GROUP_ID}/channels/permission-edge-general/thread-counts` &&
      method === 'POST'
    ) {
      await fulfillJson(route, { data: { [permissionDeniedMessage.id]: 0 } });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/channels/permission-edge-general/pins`) {
      if (method === 'POST') {
        const body = request.postDataJSON();
        requests.pinCreates.push(body);
        if (denyPinCreate) {
          await fulfillJson(route, { message: 'Forbidden' }, 403);
          return;
        }

        await fulfillJson(route, { data: { message_id: permissionDeniedMessage.id } }, 201);
        return;
      }

      if (denyPinList) {
        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }

      await fulfillJson(route, {
        data: seedPinnedMessage
          ? [
              {
                id: `pin-${permissionDeniedMessage.id}`,
                channel_id: 'permission-edge-general',
                message_id: permissionDeniedMessage.id,
                pinned_by_id: CURRENT_USER_ID,
                position: 0,
                pinned_at: '2026-01-01T00:00:00.000Z',
              },
            ]
          : [],
      });
      return;
    }

    if (
      path ===
      `/api/v1/groups/${GROUP_ID}/channels/permission-edge-general/pins/pin-${permissionDeniedMessage.id}`
    ) {
      requests.pinDeletes.push(`pin-${permissionDeniedMessage.id}`);
      if (denyPinDelete) {
        await fulfillJson(route, { message: 'Forbidden' }, 403);
        return;
      }

      await fulfillJson(route, { data: { ok: true } });
      return;
    }

    if (
      path === `/api/v1/notification-preferences/channel/permission-edge-general` &&
      method === 'GET'
    ) {
      await fulfillJson(route, {
        data: { preference: { id: 'pref-channel', mode: 'mentions_only' } },
      });
      return;
    }

    if (path === `/api/v1/groups/${GROUP_ID}/members/me/notifications`) {
      await fulfillJson(route, { data: { notifications: 'mentions' } });
      return;
    }

    if (path === '/api/v1/settings' || path.startsWith('/api/v1/settings/')) {
      await fulfillJson(route, { data: {} });
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

    if (path === '/api/v1/conversations') {
      await fulfillJson(route, { data: [], meta: { page: 1, total: 0 } });
      return;
    }

    if (
      path === '/api/v1/friends' ||
      path === '/api/v1/friends/requests' ||
      path === '/api/v1/friends/sent' ||
      path === '/api/v1/notifications'
    ) {
      await fulfillJson(route, { data: [] });
      return;
    }

    await fulfillJson(route, { data: {} });
  });

  return requests;
}

test.describe('Group settings permissions', () => {
  test('keeps owner management tabs available and saves overview changes', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
      allowGroupPatch: true,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);

    await expect(page.getByText('Group Settings').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Overview$/ })).toBeVisible();

    await expect(page.getByRole('button', { name: /^Overview$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Roles$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Members$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Invites$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Channels$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Audit Log$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^AutoMod$/ })).toBeVisible();

    await page
      .getByRole('textbox', { name: /^Group name/ })
      .fill('Permission Edge Hub Verified');
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect
      .poll(() => requests.groupPatches)
      .toContainEqual(expect.objectContaining({ name: 'Permission Edge Hub Verified' }));
  });

  test('uploads group icon and banner through backend-owned settings URLs', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
      allowGroupPatch: true,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await expect(page.getByRole('heading', { name: /^Overview$/ })).toBeVisible();

    await page.getByLabel('Upload group icon').setInputFiles({
      name: 'group-icon.png',
      mimeType: 'image/png',
      buffer: ONE_PIXEL_PNG,
    });

    await expect
      .poll(() => requests.iconUploads, { message: 'icon upload reached backend' })
      .toBe(1);
    await expect
      .poll(() => requests.groupPatches, { message: 'icon URL patch reached backend' })
      .toContainEqual(expect.objectContaining({ icon_url: '/uploads/group-icon.png' }));

    await page.getByLabel('Upload group banner').setInputFiles({
      name: 'group-banner.png',
      mimeType: 'image/png',
      buffer: ONE_PIXEL_PNG,
    });

    await expect
      .poll(() => requests.bannerUploads, { message: 'banner upload reached backend' })
      .toBe(1);
    await expect
      .poll(() => requests.groupPatches, { message: 'banner URL patch reached backend' })
      .toContainEqual(expect.objectContaining({ banner_url: '/uploads/group-banner.png' }));
  });

  test('verifies automod rule create, update, toggle, and delete contracts', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^AutoMod$/ }).click();

    await expect(page.getByText('Invite Blocker')).toBeVisible();
    await page.getByRole('button', { name: /^Add Rule$/ }).click();
    await page.getByLabel('Rule name').fill('No spam');
    await page.getByLabel('Pattern or config').fill('spam, scam');
    await page.getByRole('button', { name: /^Create Rule$/ }).click();

    await expect(page.getByText('No spam')).toBeVisible();
    expect(requests.automodCreates.at(-1)).toMatchObject({
      name: 'No spam',
      rule_type: 'word_filter',
      action: 'delete',
      pattern: 'spam, scam',
    });

    await page.getByRole('button', { name: /^Edit Invite Blocker$/ }).click();
    await page.getByLabel('Rule name').fill('Invite Blocker Updated');
    await page.getByLabel('Pattern or config').fill('discord.gg, t.me');
    await page.getByRole('button', { name: /^Save Changes$/ }).click();
    await expect(page.getByText('Invite Blocker Updated')).toBeVisible();
    expect(requests.automodUpdates.at(-1)).toMatchObject({
      ruleId: 'automod-invite-blocker',
      body: {
        name: 'Invite Blocker Updated',
        rule_type: 'link_filter',
        action: 'delete',
        pattern: 'discord.gg, t.me',
      },
    });

    await page.getByRole('button', { name: /^Disable Invite Blocker Updated$/ }).click();
    await expect(page.getByRole('button', { name: /^Enable Invite Blocker Updated$/ })).toBeVisible();
    expect(requests.automodToggles).toContain('automod-invite-blocker');

    await page.getByRole('button', { name: /^Delete Invite Blocker Updated$/ }).click();
    await expect(page.getByText('Invite Blocker Updated')).toHaveCount(0);
    expect(requests.automodDeletes).toContain('automod-invite-blocker');
  });

  test('shows endpoint 403 copy when automod actions are denied', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
      denyAutomodCreate: true,
      denyAutomodUpdate: true,
      denyAutomodToggle: true,
      denyAutomodDelete: true,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^AutoMod$/ }).click();

    await page.getByRole('button', { name: /^Disable Invite Blocker$/ }).click();
    await expect(
      page.getByText('You do not have permission to manage automod rules in this group.')
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /^Disable Invite Blocker$/ })).toBeVisible();

    await page.getByRole('button', { name: /^Edit Invite Blocker$/ }).click();
    await page.getByLabel('Rule name').fill('Denied rename');
    await page.getByRole('button', { name: /^Save Changes$/ }).click();
    await expect(page.getByLabel('Rule name')).toHaveValue('Denied rename');
    await expect(
      page.getByText('You do not have permission to manage automod rules in this group.')
    ).toBeVisible();
    await page.getByRole('button', { name: /^Cancel$/ }).click();
    await expect(page.getByText('Invite Blocker')).toBeVisible();

    await page.getByRole('button', { name: /^Delete Invite Blocker$/ }).click();
    await expect(page.getByText('Invite Blocker')).toBeVisible();
    await expect(
      page.getByText('You do not have permission to manage automod rules in this group.')
    ).toBeVisible();

    await page.getByRole('button', { name: /^Add Rule$/ }).click();
    await page.getByLabel('Rule name').fill('No spam');
    await page.getByLabel('Pattern or config').fill('spam');
    await page.getByRole('button', { name: /^Create Rule$/ }).click();
    await expect(page.getByText('No spam')).toHaveCount(0);
    await expect(
      page.getByText('You do not have permission to manage automod rules in this group.')
    ).toBeVisible();

    expect(requests.automodToggles).toContain('automod-invite-blocker');
    expect(requests.automodUpdates).toHaveLength(1);
    expect(requests.automodDeletes).toContain('automod-invite-blocker');
    expect(requests.automodCreates).toHaveLength(1);
  });

  test('limits settings tabs for non-admin members and avoids admin writes', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page);

    await page.goto(`/groups/${GROUP_ID}/settings`);

    await expect(page.getByText('Group Settings').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Notifications$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Notifications$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Danger Zone$/ })).toBeVisible();

    await expect(page.getByRole('button', { name: /^Overview$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Roles$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Members$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Invites$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Channels$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Audit Log$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^AutoMod$/ })).toHaveCount(0);

    await page.getByRole('button', { name: /^Danger Zone$/ }).click();
    await expect(page.getByRole('heading', { name: /^Danger Zone$/ })).toBeVisible();
    await expect(page.getByText('Leave Group')).toBeVisible();
    await expect(page.getByText('Delete Group')).toHaveCount(0);

    expect(requests.groupPatches).toEqual([]);
  });

  test('shows route-owned danger copy when leave is denied', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      denyLeave: true,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Danger Zone$/ }).click();
    await page.getByRole('button', { name: /^Leave$/ }).click();
    await expect(page.locator('h2').filter({ hasText: 'Leave Group' })).toBeVisible();
    await page.getByRole('button', { name: /^Leave$/ }).last().click();

    await expect
      .poll(() => requests.leaves, { message: 'leave endpoint reached backend' })
      .toContain(GROUP_ID);
    await expect(page.getByText('You do not have permission to leave this group.')).toBeVisible();
  });

  test('shows route-owned danger copy when delete is denied', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
      denyDelete: true,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Danger Zone$/ }).click();
    await page.getByRole('button', { name: /^Delete$/ }).click();
    await expect(page.locator('h2').filter({ hasText: 'Delete Group' })).toBeVisible();
    await page.getByRole('button', { name: /^Delete$/ }).last().click();

    await expect
      .poll(() => requests.deletes, { message: 'delete endpoint reached backend' })
      .toContain(GROUP_ID);
    await expect(page.getByText('You do not have permission to delete this group.')).toBeVisible();
  });

  test('keeps channel state unchanged and shows endpoint 403 copy when pinning is denied', async ({
    page,
  }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
      denyPinCreate: true,
    });

    await page.goto(`/groups/${GROUP_ID}/channels/permission-edge-general`);

    const message = page.locator(`#group-message-${permissionDeniedMessage.id}`);
    await expect(message).toContainText(permissionDeniedMessage.content);

    await message.hover();
    await message.getByTitle('More Actions').click();
    await page.getByRole('menuitem', { name: /^Pin$/ }).click();

    await expect
      .poll(() => requests.pinCreates, { message: 'pin create endpoint received message_id' })
      .toContainEqual(expect.objectContaining({ message_id: permissionDeniedMessage.id }));
    await expect(
      page.getByText('You do not have permission to pin messages in this channel.')
    ).toBeVisible();
    await expect(message).not.toContainText('Pinned');
    await expect(page.getByRole('complementary', { name: /pinned messages/i })).toHaveCount(0);
  });

  test('shows endpoint 403 copy when the pinned panel cannot list pins', async ({ page }) => {
    await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
      denyPinList: true,
    });

    await page.goto(`/groups/${GROUP_ID}/channels/permission-edge-general`);

    await page.getByTitle('Pinned Messages').click();
    const pinnedPanel = page.getByRole('complementary', { name: /pinned messages/i });
    await expect(pinnedPanel).toContainText(
      'You do not have permission to view pinned messages in this channel.'
    );
  });

  test('keeps pinned panel state unchanged and shows endpoint 403 copy when unpinning is denied', async ({
    page,
  }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
      seedPinnedMessage: true,
      denyPinDelete: true,
    });

    await page.goto(`/groups/${GROUP_ID}/channels/permission-edge-general`);

    await page.getByTitle('Pinned Messages').click();
    const pinnedPanel = page.getByRole('complementary', { name: /pinned messages/i });
    await expect(pinnedPanel).toContainText(permissionDeniedMessage.content);

    await pinnedPanel.getByText(permissionDeniedMessage.content).hover();
    await pinnedPanel
      .getByRole('button', { name: `Unpin ${permissionDeniedMessage.content}` })
      .click();

    await expect
      .poll(() => requests.pinDeletes, { message: 'unpin endpoint received the pin id' })
      .toContain(`pin-${permissionDeniedMessage.id}`);
    await expect(pinnedPanel).toContainText(
      'You do not have permission to unpin messages in this channel.'
    );
    await expect(pinnedPanel).toContainText(permissionDeniedMessage.content);
  });

  test('verifies routed role create, update, reorder, and delete contracts', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: roleManagementGroup,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Roles$/ }).click();
    await expect(page.getByRole('heading', { name: /^Roles$/ })).toBeVisible();

    await page.getByRole('button', { name: /create role/i }).click();
    await page.getByLabel('Role name').fill('Ops Lead');
    await page.getByRole('button', { name: /^Create role$/ }).last().click();

    await expect
      .poll(() => requests.roleCreates, { message: 'role create endpoint received payload' })
      .toContainEqual(
        expect.objectContaining({
          name: 'Ops Lead',
          is_hoisted: false,
          is_mentionable: false,
        })
      );
    await expect(page.getByText('Ops Lead').first()).toBeVisible();

    await page.getByLabel('Role name').fill('Ops Captain');
    await page.getByRole('switch', { name: /^Display separately/ }).click();
    await page.getByRole('button', { name: /^Save changes$/ }).click();
    await expect
      .poll(() => requests.roleUpdates, { message: 'role update endpoint received payload' })
      .toContainEqual(
        expect.objectContaining({
          roleId: 'role-ops',
          body: expect.objectContaining({
            name: 'Ops Captain',
            is_hoisted: true,
            is_mentionable: false,
          }),
        })
      );
    await expect(page.getByText('Ops Captain').first()).toBeVisible();

    await page.getByRole('button', { name: /move ops captain down/i }).click();
    await expect
      .poll(() => requests.roleReorders, { message: 'role reorder endpoint received role_ids' })
      .toContainEqual(
        expect.objectContaining({
          role_ids: ['role-admin', 'role-ops', 'role-mod', 'role-member'],
        })
      );

    await page.getByRole('button', { name: /^Delete$/ }).click();
    const deleteDialog = page.getByRole('dialog', { name: 'Delete role' });
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByRole('button', { name: /^Delete$/ }).click();
    await expect
      .poll(() => requests.roleDeletes, { message: 'role delete endpoint received role id' })
      .toContain('role-ops');
    await expect(page.getByText('Ops Captain')).toHaveCount(0);
  });

  test('keeps invalid role names local and does not call create endpoint', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: roleManagementGroup,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Roles$/ }).click();
    await expect(page.getByRole('heading', { name: /^Roles$/ })).toBeVisible();

    await page.getByRole('button', { name: /create role/i }).click();
    await page.getByLabel('Role name').fill('   ');
    await page.getByRole('button', { name: /^Create role$/ }).last().click();

    await expect(page.getByText('Role name is required.')).toBeVisible();
    await expect
      .poll(() => requests.roleCreates.length, {
        message: 'blank role name never reached create endpoint',
      })
      .toBe(0);
  });

  test('shows endpoint 403 copy when overview save is denied', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await expect(page.getByRole('heading', { name: /^Overview$/ })).toBeVisible();

    await page
      .getByRole('textbox', { name: /^Group name/ })
      .fill('Permission Edge Hub Blocked');
    await page.getByRole('button', { name: /save changes/i }).click();

    await expect
      .poll(() => requests.groupPatches, { message: 'overview patch reached backend' })
      .toContainEqual(expect.objectContaining({ name: 'Permission Edge Hub Blocked' }));
    await expect(
      page.getByText('You do not have permission to update group settings.')
    ).toBeVisible();
  });

  test('verifies node-gated access save contract', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
      allowGroupPatch: true,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await expect(page.getByRole('heading', { name: /^Overview$/ })).toBeVisible();
    await expect(page.getByText('Node-Gated Access')).toBeVisible();

    await page.getByLabel('Toggle node gating').click();
    await page.getByRole('button', { name: /^Save Gating Settings$/ }).click();

    await expect
      .poll(() => requests.groupPatches, { message: 'node-gating patch reached backend' })
      .toContainEqual(
        expect.objectContaining({
          is_node_gated: true,
          gate_type: 'monthly',
          gate_price_nodes: 10,
        })
      );
  });

  test('shows route-owned node-gated access copy when save is denied', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await expect(page.getByRole('heading', { name: /^Overview$/ })).toBeVisible();
    await page.getByLabel('Toggle node gating').click();
    await page.getByRole('button', { name: /^Save Gating Settings$/ }).click();

    await expect
      .poll(() => requests.groupPatches, { message: 'node-gating denied patch reached backend' })
      .toContainEqual(
        expect.objectContaining({
          is_node_gated: true,
          gate_type: 'monthly',
          gate_price_nodes: 10,
        })
      );
    await expect(
      page.getByText('You do not have permission to update node-gated access for this group.')
    ).toBeVisible();
  });

  test('shows endpoint 403 copy when role create and reorder are denied', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: roleManagementGroup,
      denyRoleCreate: true,
      denyRoleReorder: true,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Roles$/ }).click();
    await expect(page.getByRole('heading', { name: /^Roles$/ })).toBeVisible();

    await page.getByRole('button', { name: /move moderator up/i }).click();
    await expect
      .poll(() => requests.roleReorders, { message: 'role reorder reached backend' })
      .toContainEqual(
        expect.objectContaining({
          role_ids: ['role-mod', 'role-admin', 'role-member'],
        })
      );
    await expect(
      page.getByText('You do not have permission to reorder roles in this group.')
    ).toBeVisible();

    await page.getByRole('button', { name: /create role/i }).click();
    await page.getByLabel('Role name').fill('Blocked Role');
    await page.getByRole('button', { name: /^Create role$/ }).last().click();

    await expect
      .poll(() => requests.roleCreates, { message: 'role create reached backend' })
      .toContainEqual(expect.objectContaining({ name: 'Blocked Role' }));
    await expect(
      page.getByText('You do not have permission to create roles in this group.')
    ).toBeVisible();
    await expect(page.getByText('Blocked Role')).toHaveCount(0);
  });

  test('shows endpoint 403 copy when role update and delete are denied', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: roleManagementGroup,
      denyRoleUpdate: true,
      denyRoleDelete: true,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Roles$/ }).click();
    await expect(page.getByRole('heading', { name: /^Roles$/ })).toBeVisible();

    await page.getByText('Moderator').first().click();
    await page.getByLabel('Role name').fill('Blocked Moderator');
    await page.getByRole('button', { name: /^Save changes$/ }).click();

    await expect
      .poll(() => requests.roleUpdates, { message: 'role update reached backend' })
      .toContainEqual(
        expect.objectContaining({
          roleId: 'role-mod',
          body: expect.objectContaining({ name: 'Blocked Moderator' }),
        })
      );
    await expect(
      page.getByText('You do not have permission to update roles in this group.')
    ).toBeVisible();

    await page.getByRole('button', { name: /^Delete$/ }).click();
    const deleteDialog = page.getByRole('dialog', { name: 'Delete role' });
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByRole('button', { name: /^Delete$/ }).click();

    await expect
      .poll(() => requests.roleDeletes, { message: 'role delete reached backend' })
      .toContain('role-mod');
    await expect(
      page.getByText('You do not have permission to delete roles in this group.')
    ).toBeVisible();
    await expect(page.getByText('Blocked Moderator').first()).toBeVisible();
  });

  test('shows backend role hierarchy copy on routed role save', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: roleManagementGroup,
      denyRoleUpdate: true,
      roleUpdateErrorMessage: 'You can only manage roles below your highest role.',
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Roles$/ }).click();
    await expect(page.getByRole('heading', { name: /^Roles$/ })).toBeVisible();

    await page.getByText('Admin').first().click();
    await page.getByLabel('Role name').fill('Blocked Admin');
    await page.getByRole('button', { name: /^Save changes$/ }).click();

    await expect
      .poll(() => requests.roleUpdates, { message: 'admin role update reached backend' })
      .toContainEqual(
        expect.objectContaining({
          roleId: 'role-admin',
          body: expect.objectContaining({ name: 'Blocked Admin' }),
        })
      );
    await expect(
      page.getByText('You can only manage roles below your highest role.')
    ).toBeVisible();
  });

  test('shows backend role hierarchy copy on routed role reorder', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: roleManagementGroup,
      denyRoleReorder: true,
      roleReorderErrorMessage: 'You can only manage roles below your highest role.',
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Roles$/ }).click();
    await expect(page.getByRole('heading', { name: /^Roles$/ })).toBeVisible();

    await page.getByRole('button', { name: /move moderator up/i }).click();
    await expect
      .poll(() => requests.roleReorders, { message: 'role hierarchy reorder reached backend' })
      .toContainEqual(
        expect.objectContaining({
          role_ids: ['role-mod', 'role-admin', 'role-member'],
        })
      );
    await expect(
      page.getByText('You can only manage roles below your highest role.')
    ).toBeVisible();
  });

  test('keeps the backend-owned default role read-only', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: roleManagementGroup,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Roles$/ }).click();
    await expect(page.getByRole('heading', { name: /^Roles$/ })).toBeVisible();
    await page.getByRole('button', { name: /^Member\s*DEFAULT$/ }).click();
    await expect(page.getByLabel('Role name')).toBeDisabled();
    await expect(
      page.getByText(
        'The default role is managed by the group and cannot be edited, reordered, or deleted.'
      )
    ).toBeVisible();
    expect(requests.roleUpdates).toHaveLength(0);
    await expect(page.getByRole('button', { name: /^Save changes$/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Delete$/ })).toHaveCount(0);
  });

  test('shows backend role payload validation details on routed role save', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: roleManagementGroup,
      denyRoleUpdate: true,
      roleUpdateErrorStatus: 422,
      roleUpdateErrorBody: {
        error: {
          message: 'Validation failed',
          details: {
            color: ['must be a valid hex color'],
            permissions: ['contains unknown permission bits'],
          },
        },
      },
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Roles$/ }).click();
    await expect(page.getByRole('heading', { name: /^Roles$/ })).toBeVisible();

    await page.getByText('Moderator').first().click();
    await page.getByLabel('Role name').fill('Validation Edge');
    await page.getByRole('button', { name: /^Save changes$/ }).click();

    await expect
      .poll(() => requests.roleUpdates, { message: 'role validation update reached backend' })
      .toContainEqual(
        expect.objectContaining({
          roleId: 'role-mod',
          body: expect.objectContaining({ name: 'Validation Edge' }),
        })
      );
    await expect(page.getByText(/color must be a valid hex color/i)).toBeVisible();
    await expect(page.getByText(/permissions contains unknown permission bits/i)).toBeVisible();
  });

  test('shows endpoint 403 copy when invite creation is denied', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
      denyInviteCreate: true,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Invites$/ }).click();
    await expect(page.getByRole('heading', { name: /^Invites$/ })).toBeVisible();

    await page.getByRole('button', { name: /^Create Invite$/ }).click();
    await page.getByRole('button', { name: /generate new link/i }).click();

    await expect
      .poll(() => requests.inviteCreates, { message: 'invite create reached backend' })
      .toContainEqual(expect.objectContaining({ expires_in: 86400 }));
    await expect(
      page.getByText('You do not have permission to create invites for this group.')
    ).toBeVisible();
  });

  test('creates invites with selected expiry and max-use lifecycle fields', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Invites$/ }).click();
    await page.getByRole('button', { name: /^Create Invite$/ }).click();
    await expect(page.getByText('Invite People')).toBeVisible();

    await page.getByLabel(/expire after/i).selectOption({ label: '6 hours' });
    await page.getByLabel(/max number of uses/i).selectOption({ label: '5 uses' });
    await page.getByRole('button', { name: /generate new link/i }).click();

    await expect
      .poll(() => requests.inviteCreates, {
        message: 'invite create endpoint received selected lifecycle fields',
      })
      .toContainEqual(
        expect.objectContaining({
          expires_in: 21600,
          max_uses: 5,
        })
      );
    await expect(page.locator('input[readonly]')).toHaveValue(/\/invite\/NEW403$/);

    await page.getByRole('button', { name: /^Manage Invites$/ }).click();
    const generatedInvite = page.getByTestId('invite-row-NEW403');
    await expect(generatedInvite).toContainText('NEW403');
    await expect(generatedInvite).toContainText('0 / 5 uses');
    await expect(generatedInvite).toContainText(/[0-9]+ hours/);
  });

  test('omits invite lifecycle fields when no expiry and no usage limit are selected', async ({
    page,
  }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Invites$/ }).click();
    await page.getByRole('button', { name: /^Create Invite$/ }).click();
    await expect(page.getByText('Invite People')).toBeVisible();

    await page.getByLabel(/expire after/i).selectOption({ label: 'Never' });
    await page.getByLabel(/max number of uses/i).selectOption({ label: 'No limit' });
    await page.getByRole('button', { name: /generate new link/i }).click();

    await expect
      .poll(() => requests.inviteCreates.length, {
        message: 'invite create endpoint received the unlimited invite request',
      })
      .toBeGreaterThan(0);
    expect(requests.inviteCreates[0]).not.toHaveProperty('expires_in');
    expect(requests.inviteCreates[0]).not.toHaveProperty('max_uses');
    await expect(page.locator('input[readonly]')).toHaveValue(/\/invite\/NEW403$/);

    await page.getByRole('button', { name: /^Manage Invites$/ }).click();
    const generatedInvite = page.getByTestId('invite-row-NEW403');
    await expect(generatedInvite).toContainText('NEW403');
    await expect(generatedInvite).toContainText('0 uses');
    await expect(generatedInvite).toContainText('Never expires');
  });

  test('reconciles successful invite delete on the routed manage-invites tab', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Invites$/ }).click();
    await page.getByRole('button', { name: /^Create Invite$/ }).click();
    await page.getByRole('button', { name: /^Manage Invites$/ }).click();

    const inviteRow = page.getByTestId('invite-row-EDGE403');
    await expect(inviteRow).toContainText('EDGE403');
    await page.getByRole('button', { name: /delete invite edge403/i }).click();

    await expect
      .poll(() => requests.inviteDeletes, { message: 'invite delete reached backend' })
      .toContain('invite-edge');
    await expect(inviteRow).toHaveCount(0);
    await expect(page.getByText('No active invites')).toBeVisible();
  });

  test('shows endpoint 403 copy when invite list and delete are denied', async ({ page }) => {
    const listRequests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
      denyInviteList: true,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Invites$/ }).click();
    await expect(page.getByRole('heading', { name: /^Invites$/ })).toBeVisible();
    await page.getByRole('button', { name: /^Create Invite$/ }).click();

    await expect
      .poll(() => listRequests.inviteLists, { message: 'invite list reached backend' })
      .toBeGreaterThan(0);
    await expect(
      page.getByText('You do not have permission to view invites for this group.')
    ).toBeVisible();

    await page.unroute('**/api/v1/**');
    const deleteRequests = await installGroupPermissionMocks(page, {
      groupFixture: ownerGroup,
      denyInviteDelete: true,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Invites$/ }).click();
    await page.getByRole('button', { name: /^Create Invite$/ }).click();
    await page.getByRole('button', { name: /^Manage Invites$/ }).click();
    await expect(page.getByText('EDGE403')).toBeVisible();
    await page.getByRole('button', { name: /delete invite edge403/i }).click();

    await expect
      .poll(() => deleteRequests.inviteDeletes, { message: 'invite delete reached backend' })
      .toContain('invite-edge');
    await expect(
      page.getByText('You do not have permission to delete invites for this group.')
    ).toBeVisible();
    await expect(page.getByText('EDGE403')).toBeVisible();
  });

  test('shows endpoint 403 copy when member role assignment is denied', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: roleManagementGroup,
      denyMemberRoleUpdate: true,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Members$/ }).click();
    await expect(page.getByRole('heading', { name: /^Members$/ })).toBeVisible();

    await page.getByRole('button', { name: /member actions for permission friend/i }).click();
    await page.getByRole('menuitem', { name: /^Change roles$/ }).click();
    await expect(page.getByRole('heading', { name: /^Assign roles$/ })).toBeVisible();
    await page.getByRole('button', { name: /^Save roles$/ }).click();

    await expect
      .poll(() => requests.memberRoleUpdates, {
        message: 'member role assignment reached backend',
      })
      .toContainEqual(
        expect.objectContaining({
          memberId: 'member-friend',
          body: expect.objectContaining({ role_ids: expect.any(Array) }),
        })
      );
    await expect(
      page.getByText('You do not have permission to update member roles in this group.')
    ).toBeVisible();
  });

  test('reconciles successful member mute and unmute on the routed members tab', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: roleManagementGroup,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Members$/ }).click();
    await expect(page.getByRole('heading', { name: /^Members$/ })).toBeVisible();

    await page.getByRole('button', { name: /member actions for permission friend/i }).click();
    await page.getByRole('menuitem', { name: /^Mute$/ }).click();
    await page.getByLabel('Reason').fill('Temporary cooldown');
    await page
      .getByRole('dialog', { name: 'Mute member' })
      .getByRole('button', { name: 'Mute' })
      .click();

    await expect
      .poll(() => requests.memberMutes, { message: 'member mute reached backend' })
      .toContain('member-friend');
    expect(requests.memberMuteBodies.at(-1)).toEqual({
      duration: 600,
      reason: 'Temporary cooldown',
    });
    await expect(page.getByText('Muted', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /member actions for permission friend/i }).click();
    await page.getByRole('menuitem', { name: /^Unmute$/ }).click();

    await expect
      .poll(() => requests.memberUnmutes, { message: 'member unmute reached backend' })
      .toContain('member-friend');
    await expect(page.getByText('Muted', { exact: true })).toHaveCount(0);
  });

  test('reconciles successful member kick on the routed members tab', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: roleManagementGroup,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Members$/ }).click();
    await expect(page.getByRole('heading', { name: /^Members$/ })).toBeVisible();

    await page.getByRole('button', { name: /member actions for permission friend/i }).click();
    await page.getByRole('menuitem', { name: /^Kick$/ }).click();
    await page.getByLabel('Reason').fill('Repeated disruption');
    await page
      .getByRole('dialog', { name: 'Kick member' })
      .getByRole('button', { name: 'Kick' })
      .click();

    await expect
      .poll(() => requests.memberKicks, { message: 'member kick reached backend' })
      .toContain('member-friend');
    expect(requests.memberKickBodies.at(-1)).toEqual({ reason: 'Repeated disruption' });
    await expect(page.getByText('Permission Friend')).toHaveCount(0);
  });

  test('reconciles successful member ban on the routed members tab', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: roleManagementGroup,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Members$/ }).click();
    await expect(page.getByRole('heading', { name: /^Members$/ })).toBeVisible();

    await page.getByRole('button', { name: /member actions for permission friend/i }).click();
    await page.getByRole('menuitem', { name: /^Ban$/ }).click();
    await page.getByLabel('Ban duration').selectOption('24');
    await page.getByLabel('Reason').fill('Repeated abuse');
    await page
      .getByRole('dialog', { name: 'Ban member' })
      .getByRole('button', { name: 'Ban' })
      .click();

    await expect
      .poll(() => requests.memberBans, { message: 'member ban reached backend' })
      .toContain('member-friend');
    expect(requests.memberBanBodies.at(-1)).toEqual({
      duration_hours: 24,
      reason: 'Repeated abuse',
    });
    await expect(page.getByText('Permission Friend')).toHaveCount(0);
  });

  test('shows endpoint 403 copy when member moderation actions are denied', async ({ page }) => {
    const requests = await installGroupPermissionMocks(page, {
      groupFixture: roleManagementGroup,
      denyMemberKick: true,
      denyMemberBan: true,
      denyMemberMute: true,
    });

    await page.goto(`/groups/${GROUP_ID}/settings`);
    await page.getByRole('button', { name: /^Members$/ }).click();
    await expect(page.getByRole('heading', { name: /^Members$/ })).toBeVisible();

    await page.getByRole('button', { name: /member actions for permission friend/i }).click();
    await page.getByRole('menuitem', { name: /^Kick$/ }).click();
    const kickDialog = page.getByRole('dialog', { name: 'Kick member' });
    await kickDialog.getByRole('button', { name: 'Kick' }).click();
    await expect
      .poll(() => requests.memberKicks, { message: 'member kick reached backend' })
      .toContain('member-friend');
    await expect(
      page.getByText('You do not have permission to kick members from this group.')
    ).toBeVisible();
    await expect(page.getByText('Permission Friend')).toBeVisible();
    await kickDialog.getByRole('button', { name: 'Cancel' }).click();

    await page.getByRole('button', { name: /member actions for permission friend/i }).click();
    await page.getByRole('menuitem', { name: /^Ban$/ }).click();
    const banDialog = page.getByRole('dialog', { name: 'Ban member' });
    await banDialog.getByRole('button', { name: 'Ban' }).click();
    await expect
      .poll(() => requests.memberBans, { message: 'member ban reached backend' })
      .toContain('member-friend');
    await expect(
      page.getByText('You do not have permission to ban members from this group.')
    ).toBeVisible();
    await expect(page.getByText('Permission Friend')).toBeVisible();
    await banDialog.getByRole('button', { name: 'Cancel' }).click();

    await page.getByRole('button', { name: /member actions for permission friend/i }).click();
    await page.getByRole('menuitem', { name: /^Mute$/ }).click();
    await page
      .getByRole('dialog', { name: 'Mute member' })
      .getByRole('button', { name: 'Mute' })
      .click();
    await expect
      .poll(() => requests.memberMutes, { message: 'member mute reached backend' })
      .toContain('member-friend');
    await expect(
      page.getByText('You do not have permission to mute members in this group.')
    ).toBeVisible();
    await expect(page.getByText('Permission Friend')).toBeVisible();
    await expect(page.getByText('Muted')).toHaveCount(0);
  });
});
