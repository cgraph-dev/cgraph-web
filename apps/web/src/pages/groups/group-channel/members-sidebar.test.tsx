import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { Member, Role } from '@/modules/groups/store';
import { MembersSidebar } from './members-sidebar';

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({
    alt,
    avatarBorderId,
    fallbackText,
  }: {
    alt: string;
    avatarBorderId?: string | null;
    fallbackText?: string;
  }) => (
    <span
      data-testid={`avatar-${alt}`}
      data-avatar-border-id={avatarBorderId}
      data-fallback-text={fallbackText}
    />
  ),
}));

function makeRole(overrides: Partial<Role>): Role {
  return {
    id: 'role',
    name: 'Member',
    color: '#687486',
    position: 0,
    permissions: 0,
    isDefault: false,
    isHoisted: false,
    isMentionable: false,
    ...overrides,
  };
}

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 'member-1',
    userId: 'user-1',
    nickname: null,
    user: {
      id: 'user-1',
      username: 'cipher',
      displayName: 'Cipher One',
      avatarUrl: '/avatars/cipher.jpg',
      status: 'online',
      avatarBorderId: 'aurora-ring',
    },
    roles: [],
    joinedAt: '2026-07-29T00:00:00.000Z',
    ...overrides,
  };
}

function renderSidebar(
  props: Partial<React.ComponentProps<typeof MembersSidebar>> = {}
) {
  const onClose = vi.fn();
  render(
    <MemoryRouter>
      <MembersSidebar
        onlineMembers={[makeMember()]}
        offlineMembers={[]}
        onClose={onClose}
        {...props}
      />
    </MemoryRouter>
  );
  return { onClose };
}

describe('MembersSidebar', () => {
  it('links members to canonical profiles and preserves avatar cosmetics', () => {
    renderSidebar();

    expect(screen.getByRole('link', { name: /Cipher One/i })).toHaveAttribute(
      'href',
      '/cipher'
    );
    expect(screen.getByTestId('avatar-Cipher One')).toHaveAttribute(
      'data-avatar-border-id',
      'aurora-ring'
    );
    expect(screen.getByTestId('avatar-Cipher One')).toHaveAttribute(
      'data-fallback-text',
      'Cipher One'
    );
    expect(screen.getByRole('status', { name: 'Online' })).toBeInTheDocument();
  });

  it('uses the highest non-default role without reordering member roles', () => {
    const roles = [
      makeRole({ id: 'member', color: '#687486', position: 1 }),
      makeRole({ id: 'owner', color: '#25c48a', position: 20 }),
      makeRole({ id: 'default', color: '#ffffff', position: 100, isDefault: true }),
    ];
    renderSidebar({ onlineMembers: [makeMember({ nickname: 'Cipher', roles })] });

    expect(screen.getByText('Cipher')).toHaveStyle({ color: '#25c48a' });
    expect(roles.map((role) => role.id)).toEqual(['member', 'owner', 'default']);
  });

  it('labels offline presence and invokes the compact close control', async () => {
    const user = userEvent.setup();
    const offlineMember = makeMember({
      id: 'member-2',
      userId: 'user-2',
      user: {
        ...makeMember().user,
        id: 'user-2',
        username: 'quiet-user',
        displayName: 'Quiet User',
        status: 'offline',
      },
    });
    const { onClose } = renderSidebar({
      onlineMembers: [],
      offlineMembers: [offlineMember],
    });

    expect(screen.getByText('Offline - 1')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Offline' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close members' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders a compact empty state when no members are available', () => {
    renderSidebar({ onlineMembers: [], offlineMembers: [] });
    expect(screen.getByText('No members to show')).toBeInTheDocument();
  });
});
