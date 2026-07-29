import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Group } from '@/modules/groups/store';
import { MembersTab } from '../members-tab';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    get: mocks.get,
    post: mocks.post,
    put: mocks.put,
    delete: mocks.delete,
  },
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <div role="img" aria-label={alt} />,
}));

const adminRole = {
  id: 'role-admin',
  name: 'Admin',
  color: '#ef4444',
  position: 2,
  permissions: 0x80000000,
  isDefault: false,
  isHoisted: true,
  isMentionable: true,
};
const moderatorRole = {
  id: 'role-moderator',
  name: 'Moderator',
  color: '#3b82f6',
  position: 1,
  permissions: 1 << 11,
  isDefault: false,
  isHoisted: true,
  isMentionable: true,
};
const defaultRole = {
  id: 'role-member',
  name: 'Member',
  color: '#94a3b8',
  position: 0,
  permissions: 0,
  isDefault: true,
  isHoisted: false,
  isMentionable: false,
};

const group = {
  id: 'group-1',
  name: 'Group',
  ownerId: 'current-user',
  roles: [adminRole, moderatorRole, defaultRole],
  myMember: {
    id: 'member-current',
    userId: 'current-user',
    nickname: null,
    user: {
      id: 'current-user',
      username: 'current',
      displayName: 'Current User',
      avatarUrl: null,
      status: 'online',
    },
    roles: [adminRole],
    joinedAt: '2026-01-01T00:00:00Z',
  },
} as Group;

const permissions = {
  canManageRoles: true,
  canKickMembers: true,
  canBanMembers: true,
  canMuteMembers: true,
};

const members = [
  {
    id: 'member-target',
    user_id: 'target-user',
    user: {
      id: 'target-user',
      username: 'target',
      display_name: 'Target User',
      avatar_url: null,
    },
    roles: [
      {
        id: defaultRole.id,
        name: defaultRole.name,
        color: defaultRole.color,
        position: defaultRole.position,
      },
    ],
    joined_at: '2026-01-02T00:00:00Z',
    is_muted: false,
  },
  {
    id: 'member-current',
    user_id: 'current-user',
    user: {
      id: 'current-user',
      username: 'current',
      display_name: 'Current User',
      avatar_url: null,
    },
    roles: [
      {
        id: adminRole.id,
        name: adminRole.name,
        color: adminRole.color,
        position: adminRole.position,
      },
    ],
    joined_at: '2026-01-01T00:00:00Z',
    is_muted: false,
  },
];

function memberResponse(data = members, pageInfo: Record<string, unknown> = {}) {
  return { data: { data, page_info: pageInfo } };
}

describe('MembersTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue(memberResponse());
    mocks.post.mockResolvedValue({ data: {} });
    mocks.put.mockResolvedValue({ data: {} });
    mocks.delete.mockResolvedValue({ data: {} });
  });

  it('orders the current user first and hides self-moderation controls', async () => {
    render(<MembersTab group={group} permissions={permissions} />);

    const list = await screen.findByRole('list', { name: 'Group members' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Current User');
    expect(rows[0]).toHaveTextContent('You');
    expect(
      within(rows[0]!).queryByRole('button', { name: /Member actions/i })
    ).not.toBeInTheDocument();
    expect(rows[1]).toHaveTextContent('Target User');
  });

  it('sends the exact ban duration and audit reason contract', async () => {
    render(<MembersTab group={group} permissions={permissions} />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Member actions for Target User' })
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Ban' }));
    const dialog = screen.getByRole('dialog', { name: 'Ban member' });
    await userEvent.selectOptions(within(dialog).getByLabelText('Ban duration'), '24');
    await userEvent.type(within(dialog).getByLabelText('Reason'), 'Repeated abuse');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Ban' }));

    await waitFor(() =>
      expect(mocks.post).toHaveBeenCalledWith('/api/v1/groups/group-1/members/member-target/ban', {
        duration_hours: 24,
        reason: 'Repeated abuse',
      })
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Ban member' })).not.toBeInTheDocument()
    );
  });

  it('uses the exact kick contract and removes the member after confirmation', async () => {
    render(<MembersTab group={group} permissions={permissions} />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Member actions for Target User' })
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Kick' }));
    const dialog = screen.getByRole('dialog', { name: 'Kick member' });
    await userEvent.type(within(dialog).getByLabelText('Reason'), 'Inactive account');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Kick' }));

    await waitFor(() =>
      expect(mocks.delete).toHaveBeenCalledWith('/api/v1/groups/group-1/members/member-target', {
        data: { reason: 'Inactive account' },
      })
    );
    await waitFor(() => expect(screen.queryByText('Target User')).not.toBeInTheDocument());
  });

  it('keeps a failed moderation draft open for retry', async () => {
    mocks.post.mockRejectedValueOnce(new Error('Network unavailable'));
    render(<MembersTab group={group} permissions={permissions} />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Member actions for Target User' })
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Mute' }));
    const dialog = screen.getByRole('dialog', { name: 'Mute member' });
    await userEvent.type(within(dialog).getByLabelText('Reason'), 'Cool down');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Mute' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    expect(screen.getByRole('dialog', { name: 'Mute member' })).toBeVisible();
    expect(within(dialog).getByLabelText('Reason')).toHaveValue('Cool down');
    expect(mocks.post).toHaveBeenCalledWith(
      '/api/v1/groups/group-1/members/member-target/mute',
      { duration: 600, reason: 'Cool down' }
    );
  });

  it('keeps moderation failures visible inside the active dialog', async () => {
    mocks.post.mockRejectedValueOnce(new Error('Moderation service unavailable'));
    render(<MembersTab group={group} permissions={permissions} />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Member actions for Target User' })
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Ban' }));
    const dialog = screen.getByRole('dialog', { name: 'Ban member' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Ban' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Moderation service unavailable'
    );
    expect(dialog).toBeVisible();
  });

  it('uses server-confirmed mute state and can unmute the member', async () => {
    mocks.post.mockResolvedValueOnce({
      data: {
        data: {
          ...members[0],
          is_muted: true,
          muted_until: '2026-01-02T00:10:00Z',
        },
      },
    });
    mocks.delete.mockResolvedValueOnce({
      data: {
        data: {
          ...members[0],
          is_muted: false,
          muted_until: null,
        },
      },
    });
    render(<MembersTab group={group} permissions={permissions} />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Member actions for Target User' })
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Mute' }));
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Mute member' })).getByRole('button', {
        name: 'Mute',
      })
    );

    expect(await screen.findByText('Muted')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Member actions for Target User' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Unmute' }));

    await waitFor(() =>
      expect(mocks.delete).toHaveBeenCalledWith(
        '/api/v1/groups/group-1/members/member-target/mute'
      )
    );
    await waitFor(() => expect(screen.queryByText('Muted')).not.toBeInTheDocument());
  });

  it('replaces roles with the exact selected group role IDs and uses the server response', async () => {
    mocks.put.mockResolvedValueOnce({
      data: {
        data: {
          ...members[0],
          roles: [members[0]!.roles[0], moderatorRole],
        },
      },
    });
    render(<MembersTab group={group} permissions={permissions} />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Member actions for Target User' })
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Change roles' }));
    const dialog = screen.getByRole('dialog', { name: 'Assign roles' });
    const save = within(dialog).getByRole('button', { name: 'Save roles' });
    expect(save).toBeDisabled();
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Moderator' }));
    expect(save).toBeEnabled();
    await userEvent.click(save);

    await waitFor(() =>
      expect(mocks.put).toHaveBeenCalledWith(
        '/api/v1/groups/group-1/members/member-target/roles',
        { role_ids: ['role-moderator', 'role-member'] }
      )
    );
    const targetRow = screen.getByText('Target User').closest('li');
    expect(targetRow).not.toBeNull();
    expect(within(targetRow!).getByText('Moderator')).toBeVisible();
  });

  it('retains selected roles and shows a failed save inside the role dialog', async () => {
    mocks.put.mockRejectedValueOnce(new Error('Role update failed'));
    render(<MembersTab group={group} permissions={permissions} />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Member actions for Target User' })
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Change roles' }));
    const dialog = screen.getByRole('dialog', { name: 'Assign roles' });
    const moderator = within(dialog).getByRole('checkbox', { name: 'Moderator' });
    await userEvent.click(moderator);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save roles' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Role update failed');
    expect(moderator).toBeChecked();
    expect(dialog).toBeVisible();
  });

  it('hides moderation actions for a member at the actor hierarchy level', async () => {
    const peerAdmin = {
      ...members[0],
      roles: [adminRole],
    };
    const nonOwnerGroup = {
      ...group,
      ownerId: 'group-owner',
    } as Group;
    mocks.get.mockResolvedValueOnce(memberResponse([members[1], peerAdmin]));

    render(<MembersTab group={nonOwnerGroup} permissions={permissions} />);

    const list = await screen.findByRole('list', { name: 'Group members' });
    const targetRow = within(list).getByText('Target User').closest('li');
    expect(targetRow).not.toBeNull();
    expect(
      within(targetRow!).queryByRole('button', { name: 'Member actions for Target User' })
    ).not.toBeInTheDocument();
  });

  it('dismisses the member action menu with Escape', async () => {
    render(<MembersTab group={group} permissions={permissions} />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Member actions for Target User' })
    );
    expect(screen.getByRole('menu', { name: 'Actions for Target User' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu', { name: 'Actions for Target User' })).not.toBeInTheDocument();
  });

  it('shows a recoverable load failure and retries the same member query', async () => {
    mocks.get.mockRejectedValueOnce(new Error('Members unavailable'));
    render(<MembersTab group={group} permissions={permissions} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Members unavailable');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('list', { name: 'Group members' })).toBeVisible();
    expect(mocks.get).toHaveBeenCalledTimes(2);
    expect(mocks.get).toHaveBeenLastCalledWith('/api/v1/groups/group-1/members', {
      params: { limit: 100 },
    });
  });

  it('loads the next cursor page without replacing the first page', async () => {
    mocks.get
      .mockResolvedValueOnce(
        memberResponse([members[0]], {
          has_next_page: true,
          end_cursor: 'next-page',
        })
      )
      .mockResolvedValueOnce(
        memberResponse([
          members[0],
          {
            ...members[0],
            id: 'member-second',
            user_id: 'second-user',
            user: {
              id: 'second-user',
              username: 'second',
              display_name: 'Second User',
              avatar_url: null,
            },
          },
        ])
      );
    render(<MembersTab group={group} permissions={permissions} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Load more members' }));
    await waitFor(() =>
      expect(mocks.get).toHaveBeenLastCalledWith('/api/v1/groups/group-1/members', {
        params: { cursor: 'next-page', limit: 100 },
      })
    );
    const list = screen.getByRole('list', { name: 'Group members' });
    expect(list).toHaveTextContent('Target User');
    expect(list).toHaveTextContent('Second User');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  });
});
