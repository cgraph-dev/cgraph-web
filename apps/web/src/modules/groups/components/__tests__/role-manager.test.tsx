import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoleManager } from '../role-manager/role-manager';
import { ROLE_COLORS } from '../role-manager/constants';
import type { Role } from '@/modules/groups/store';

const mocks = vi.hoisted(() => ({
  createRole: vi.fn(),
  updateRole: vi.fn(),
  reorderRoles: vi.fn(),
  deleteRole: vi.fn(),
}));

const roles: Role[] = [
  {
    id: 'role-admin',
    name: 'Admin',
    color: '#ef4444',
    position: 2,
    permissions: 0x80000000,
    isDefault: false,
    isHoisted: true,
    isMentionable: true,
  },
  {
    id: 'role-mod',
    name: 'Moderator',
    color: '#3b82f6',
    position: 1,
    permissions: 1 << 7,
    isDefault: false,
    isHoisted: false,
    isMentionable: true,
  },
  {
    id: 'role-default',
    name: 'Member',
    color: '#22c55e',
    position: 0,
    permissions: 0,
    isDefault: true,
    isHoisted: false,
    isMentionable: false,
  },
];

vi.mock('@/modules/groups/store', () => ({
  useGroupStore: () => ({
    groups: [{ id: 'grp-1', name: 'My Group', roles }],
    ...mocks,
  }),
}));

describe('RoleManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createRole.mockImplementation(async (_groupId: string, payload: Record<string, unknown>) => ({
      ...roles[1],
      ...payload,
      id: 'role-new',
      name: String(payload.name),
      isHoisted: payload.is_hoisted === true,
      isMentionable: payload.is_mentionable === true,
    }));
    mocks.updateRole.mockImplementation(
      async (_groupId: string, roleId: string, payload: Record<string, unknown>) => ({
        ...roles.find((role) => role.id === roleId),
        ...payload,
        id: roleId,
        name: String(payload.name),
        isHoisted: payload.is_hoisted === true,
        isMentionable: payload.is_mentionable === true,
      })
    );
    mocks.reorderRoles.mockResolvedValue(undefined);
    mocks.deleteRole.mockResolvedValue(undefined);
  });

  it('renders roles in hierarchy order and keeps the default role read-only', async () => {
    render(<RoleManager groupId="grp-1" />);

    expect(within(screen.getByRole('list', { name: 'Roles' })).getAllByRole('listitem')).toHaveLength(
      3
    );
    await userEvent.click(screen.getByRole('button', { name: /Member DEFAULT/i }));

    expect(screen.getByRole('textbox', { name: 'Role name' })).toBeDisabled();
    expect(
      screen.getByText('The default role is managed by the group and cannot be edited, reordered, or deleted.')
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move Member up' })).toBeDisabled();
  });

  it('maps display separation to is_hoisted and saves one role draft', async () => {
    render(<RoleManager groupId="grp-1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Moderator' }));

    expect(document.querySelectorAll('[data-cgraph-surface="card"]')).toHaveLength(2);
    const colorSwatches = screen.getAllByRole('button', { name: /Set role color/i });
    expect(colorSwatches).toHaveLength(ROLE_COLORS.length + 1);
    expect(colorSwatches.every((swatch) => swatch.dataset.cgraphSurface === 'control')).toBe(true);
    expect(screen.getByRole('button', { name: 'Set role color #3b82f6' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await userEvent.click(screen.getByRole('switch', { name: /Display separately/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(mocks.updateRole).toHaveBeenCalledWith(
        'grp-1',
        'role-mod',
        expect.objectContaining({
          name: 'Moderator',
          is_hoisted: true,
          is_mentionable: true,
          permissions: 1 << 7,
        })
      )
    );
    expect(mocks.updateRole).toHaveBeenCalledTimes(1);
  });

  it('serializes explicit hierarchy moves through the group store', async () => {
    render(<RoleManager groupId="grp-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Move Moderator up' }));

    await waitFor(() =>
      expect(mocks.reorderRoles).toHaveBeenCalledWith('grp-1', [
        'role-mod',
        'role-admin',
        'role-default',
      ])
    );
    expect(mocks.reorderRoles).toHaveBeenCalledTimes(1);
  });

  it('restores hierarchy order and reports an unsuccessful move', async () => {
    mocks.reorderRoles.mockRejectedValueOnce(new Error('Role order could not be saved'));
    render(<RoleManager groupId="grp-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Move Moderator up' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Role order could not be saved');
    expect(
      within(screen.getByRole('list', { name: 'Roles' }))
        .getAllByRole('listitem')
        .map((item) => within(item).getAllByRole('button')[0]?.textContent)
    ).toEqual(['Admin', 'Moderator', 'MemberDEFAULT']);
  });

  it('requires a non-empty name before updating a role', async () => {
    render(<RoleManager groupId="grp-1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Moderator' }));
    await userEvent.clear(screen.getByRole('textbox', { name: 'Role name' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByText('Role name is required.')).toBeVisible();
    expect(mocks.updateRole).not.toHaveBeenCalled();
  });

  it('requires confirmation before deleting a persisted role', async () => {
    render(<RoleManager groupId="grp-1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Moderator' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    const dialog = screen.getByRole('dialog', { name: 'Delete role' });
    expect(mocks.deleteRole).not.toHaveBeenCalled();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(mocks.deleteRole).toHaveBeenCalledWith('grp-1', 'role-mod'));
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Delete role' })).not.toBeInTheDocument()
    );
  });

  it('creates a deterministic draft and sends the complete role contract', async () => {
    render(<RoleManager groupId="grp-1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Create role' }));
    await userEvent.clear(screen.getByRole('textbox', { name: 'Role name' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Role name' }), 'Ops');
    const createButtons = screen.getAllByRole('button', { name: 'Create role' });
    await userEvent.click(createButtons.at(-1)!);

    await waitFor(() =>
      expect(mocks.createRole).toHaveBeenCalledWith(
        'grp-1',
        expect.objectContaining({
          name: 'Ops',
          color: '#f59e0b',
          is_hoisted: false,
          is_mentionable: false,
        })
      )
    );
  });
});
