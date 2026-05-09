/**
 * MemberItem Component Tests
 *
 * Tests for member display, status indicators, role badges,
 * nickname handling, context menu, and role sections.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { Member, Role } from '@/modules/groups/store';

// --- Mocks ---

vi.mock('motion/react', () => ({
  motion: {
    div: ({
      children,
      whileHover: _wh,
      whileTap: _wt,
      ...rest
    }: Record<string, unknown> & { children?: React.ReactNode }) => <div {...rest}>{children}</div>,
    button: ({
      children,
      whileHover: _wh,
      ...rest
    }: Record<string, unknown> & { children?: React.ReactNode }) => (
      <button {...rest}>{children}</button>
    ),
  },
}));

vi.mock('@/components/theme/themed-avatar', () => ({
  ThemedAvatar: ({ alt }: { alt: string }) => <div aria-label={alt} data-testid="avatar" />,
}));

vi.mock('@/shared/components/ui', () => ({
  GlassCard: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/utils', () => ({
  getAvatarBorderId: () => 'border-1',
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

vi.mock('@/lib/logger', () => ({
  chatLogger: { log: vi.fn(), error: vi.fn() },
}));

vi.mock('../constants', () => ({
  statusColors: {
    online: 'bg-green-500',
    idle: 'bg-yellow-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-500',
  },
  statusLabels: {
    online: 'Online',
    idle: 'Idle',
    dnd: 'Do Not Disturb',
    offline: 'Offline',
  },
}));

vi.mock('@/lib/animations/transitions', () => ({
  SCALE_IN: { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 } },
  FADE_IN: { initial: { opacity: 0 }, animate: { opacity: 1 } },
}));

vi.mock(
  '@heroicons/react/24/outline',
  () => ({
    ChatBubbleLeftIcon: (props: Record<string, unknown>) => (
      <svg data-testid="ChatBubbleLeftIcon" {...props} />
    ),
    NoSymbolIcon: (props: Record<string, unknown>) => (
      <svg data-testid="NoSymbolIcon" {...props} />
    ),
    ShieldCheckIcon: (props: Record<string, unknown>) => (
      <svg data-testid="ShieldCheckIcon" {...props} />
    ),
    UserMinusIcon: (props: Record<string, unknown>) => (
      <svg data-testid="UserMinusIcon" {...props} />
    ),
    UserPlusIcon: (props: Record<string, unknown>) => (
      <svg data-testid="UserPlusIcon" {...props} />
    ),
  })
);

vi.mock('@heroicons/react/24/solid', () => ({
  StarIcon: (p: Record<string, unknown>) => <svg data-testid="crown-icon" {...p} />,
}));

import { MemberItem, RoleSection, MemberContextMenu } from '../member-item';

// --- Factories ---

function makeRole(overrides: Partial<Role> = {}): Role {
  return {
    id: 'r-1',
    name: 'Admin',
    color: '#ff0000',
    position: 0,
    permissions: 0,
    isDefault: false,
    isMentionable: true,
    ...overrides,
  };
}

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: 'm-1',
    userId: 'u-1',
    nickname: null,
    user: {
      id: 'u-1',
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: null,
      status: 'online',
    },
    roles: [],
    joinedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

// --- Tests ---

describe('MemberItem', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders display name from user', () => {
    render(<MemberItem member={makeMember()} onClick={vi.fn()} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('renders nickname when provided', () => {
    render(<MemberItem member={makeMember({ nickname: 'Cool Nick' })} onClick={vi.fn()} />);
    expect(screen.getByText('Cool Nick')).toBeInTheDocument();
  });

  it('shows username when nickname differs from username', () => {
    render(<MemberItem member={makeMember({ nickname: 'Nick' })} onClick={vi.fn()} />);
    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('does not show username when nickname matches username', () => {
    render(<MemberItem member={makeMember({ nickname: 'testuser' })} onClick={vi.fn()} />);
    expect(screen.queryByText('@testuser')).not.toBeInTheDocument();
  });

  it('falls back to username when no displayName or nickname', () => {
    const member = makeMember({
      nickname: null,
      user: {
        id: 'u-1',
        username: 'fallback',
        displayName: null,
        avatarUrl: null,
        status: 'online',
      },
    });
    render(<MemberItem member={member} onClick={vi.fn()} />);
    expect(screen.getByText('fallback')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<MemberItem member={makeMember()} onClick={onClick} />);
    fireEvent.click(screen.getByText('Test User'));
    expect(onClick).toHaveBeenCalled();
  });

  it('applies role color to display name', () => {
    render(<MemberItem member={makeMember()} roleColor="#ff0000" onClick={vi.fn()} />);
    const name = screen.getByText('Test User');
    expect(name.style.color).toBe('rgb(255, 0, 0)');
  });

  it('renders status indicator with correct class', () => {
    const { container } = render(<MemberItem member={makeMember()} onClick={vi.fn()} />);
    const statusDot = container.querySelector('.bg-green-500');
    expect(statusDot).toBeTruthy();
  });

  it('treats unrecognized status as offline', () => {
    const member = makeMember({
      user: { id: 'u-1', username: 'x', displayName: 'X', avatarUrl: null, status: 'invisible' },
    });
    const { container } = render(<MemberItem member={member} onClick={vi.fn()} />);
    const offlineDot = container.querySelector('.bg-gray-500');
    expect(offlineDot).toBeTruthy();
  });

  it('renders up to 2 role badges', () => {
    const roles = [
      makeRole({ id: 'r-1', name: 'Admin', color: '#f00' }),
      makeRole({ id: 'r-2', name: 'Mod', color: '#0f0' }),
      makeRole({ id: 'r-3', name: 'Extra', color: '#00f' }),
    ];
    const { container } = render(<MemberItem member={makeMember({ roles })} onClick={vi.fn()} />);
    // Only 2 role badges should render (hidden by default, visible on hover)
    const roleBadges = container.querySelectorAll('[title]');
    const roleTitles = Array.from(roleBadges).filter(
      (el) => el.getAttribute('title') === 'Admin' || el.getAttribute('title') === 'Mod'
    );
    expect(roleTitles).toHaveLength(2);
  });
});

describe('RoleSection', () => {
  it('renders role name and member count', () => {
    const role = makeRole({ name: 'Moderators', color: '#0f0' });
    const members = [makeMember({ id: 'm-1' }), makeMember({ id: 'm-2' })];
    render(<RoleSection role={role} members={members} onMemberClick={vi.fn()} />);
    expect(screen.getByText('Moderators')).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('renders a MemberItem for each member', () => {
    const role = makeRole();
    const members = [
      makeMember({
        id: 'm-1',
        user: { id: 'u-1', username: 'a', displayName: 'Alice', avatarUrl: null, status: 'online' },
      }),
      makeMember({
        id: 'm-2',
        user: { id: 'u-2', username: 'b', displayName: 'Bob', avatarUrl: null, status: 'offline' },
      }),
    ];
    render(<RoleSection role={role} members={members} onMemberClick={vi.fn()} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});

describe('MemberContextMenu', () => {
  it('renders member display name in menu header', () => {
    render(
      <MemberContextMenu
        member={makeMember()}
        position={{ x: 100, y: 100 }}
        isOwner={false}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('shows crown icon for owner', () => {
    render(
      <MemberContextMenu
        member={makeMember()}
        position={{ x: 100, y: 100 }}
        isOwner={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByTestId('crown-icon')).toBeInTheDocument();
  });

  it('renders Message and View Profile actions', () => {
    render(
      <MemberContextMenu
        member={makeMember()}
        position={{ x: 100, y: 100 }}
        isOwner={false}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByText('View Profile')).toBeInTheDocument();
  });
});
