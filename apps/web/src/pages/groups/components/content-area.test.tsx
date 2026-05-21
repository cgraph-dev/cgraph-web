import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ContentArea } from './content-area';
import type { Group } from '@/modules/groups/store';

const group = {
  id: 'group-1',
  name: 'Builders',
  slug: 'builders',
  description: null,
  iconUrl: null,
  bannerUrl: null,
  isPublic: true,
  memberCount: 1,
  onlineMemberCount: 1,
  ownerId: 'user-1',
  categories: [],
  channels: [],
  roles: [],
  myMember: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  is_node_gated: false,
  gate_type: null,
  gate_price_nodes: null,
} satisfies Group;

describe('ContentArea', () => {
  it('uses the full groups selection empty state when no server is selected', () => {
    render(
      <MemoryRouter>
        <ContentArea activeGroup={undefined} />
      </MemoryRouter>
    );

    expect(screen.getByRole('status', { name: 'Your Groups' })).toBeInTheDocument();
    expect(screen.getByText('Your Groups')).toBeInTheDocument();
    expect(
      screen.getByText('Select a server from the sidebar or create a new one to get started.')
    ).toBeInTheDocument();
    expect(screen.getByText('Group chat ready')).toBeInTheDocument();
  });

  it('keeps the same full empty-state treatment when a server has no channel selected', () => {
    render(
      <MemoryRouter>
        <ContentArea activeGroup={group} groupId="group-1" />
      </MemoryRouter>
    );

    expect(screen.getByRole('status', { name: 'Welcome to Builders' })).toBeInTheDocument();
    expect(screen.getByText('Select a channel to start chatting with this community.')).toBeInTheDocument();
    expect(screen.getByText('Community channels')).toBeInTheDocument();
  });
});
