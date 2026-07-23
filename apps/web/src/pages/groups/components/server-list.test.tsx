import { fireEvent, render, screen, within } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ServerList } from './server-list';
import type { Group } from '@/modules/groups/store';

function withoutMotionProps(props: Record<string, unknown>) {
  const nextProps = { ...props };
  delete nextProps.animate;
  delete nextProps.initial;
  delete nextProps.layoutId;
  delete nextProps.transition;
  delete nextProps.whileHover;
  delete nextProps.whileTap;
  return nextProps;
}

vi.mock('motion/react', () => ({
  motion: {
    button: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
      <button {...withoutMotionProps(props)}>{children}</button>
    ),
    div: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) => (
      <div {...withoutMotionProps(props)}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: PropsWithChildren) => <>{children}</>,
}));

vi.mock('@/lib/animations/animation-engine', () => ({
  HapticFeedback: {
    medium: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/modules/groups/store', () => ({
  useGroupStore: () => ({
    joinGroup: vi.fn(),
  }),
}));

vi.mock('@/modules/groups/components/group-list/create-group-modal', () => ({
  CreateGroupModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="create-group-modal">Create group modal</div> : null,
}));

describe('ServerList', () => {
  it('opens the real create modal from the routed create query', () => {
    render(
      <MemoryRouter initialEntries={['/groups?create=true']}>
        <Routes>
          <Route path="/groups" element={<ServerList groups={[]} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('create-group-modal')).toBeInTheDocument();
  });

  it('renders and filters the narrow group directory without a second data owner', () => {
    const groups = [
      {
        id: 'group-alpha',
        name: 'Alpha Team',
        slug: 'alpha-team',
        description: 'Product community',
        iconUrl: null,
        bannerUrl: null,
        isPublic: true,
        memberCount: 12,
        onlineMemberCount: 3,
        ownerId: 'owner-1',
        categories: [],
        channels: [],
        roles: [],
        myMember: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        is_node_gated: false,
        gate_type: null,
        gate_price_nodes: null,
      },
      {
        id: 'group-beta',
        name: 'Beta Guild',
        slug: 'beta-guild',
        description: 'Design community',
        iconUrl: null,
        bannerUrl: null,
        isPublic: false,
        memberCount: 8,
        onlineMemberCount: 0,
        ownerId: 'owner-1',
        categories: [],
        channels: [],
        roles: [],
        myMember: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        is_node_gated: false,
        gate_type: null,
        gate_price_nodes: null,
      },
    ] satisfies Group[];

    render(
      <MemoryRouter initialEntries={['/groups']}>
        <ServerList groups={groups} showMobileDirectory />
      </MemoryRouter>
    );

    const directory = within(screen.getByTestId('mobile-group-directory'));

    expect(directory.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(directory.getByRole('button', { name: 'Join' })).toBeInTheDocument();
    expect(directory.getByRole('link', { name: 'Explore public groups' })).toHaveAttribute(
      'href',
      '/groups/explore'
    );
    expect(directory.getByRole('link', { name: /Alpha Team/ })).toBeInTheDocument();
    expect(directory.getByRole('link', { name: /Beta Guild/ })).toBeInTheDocument();

    fireEvent.change(directory.getByRole('searchbox', { name: 'Search your groups' }), {
      target: { value: 'design' },
    });

    expect(directory.queryByRole('link', { name: /Alpha Team/ })).not.toBeInTheDocument();
    expect(directory.getByRole('link', { name: /Beta Guild/ })).toBeInTheDocument();
  });
});
