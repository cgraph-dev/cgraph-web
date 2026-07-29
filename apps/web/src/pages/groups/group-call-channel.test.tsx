import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Group } from '@/modules/groups/store';
import { useGroupStore } from '@/modules/groups/store';
import GroupCallChannel from './group-call-channel';

vi.mock('@/modules/groups/store', () => ({
  useGroupStore: vi.fn(),
}));

vi.mock('@/modules/calls/components/group-call-view', () => ({
  GroupCallView: ({
    roomName,
    audioEnabled,
    videoEnabled,
    onCallEnd,
  }: {
    roomName: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
    onCallEnd: () => void;
  }) => (
    <div>
      <span>{roomName}</span>
      <span>{audioEnabled ? 'audio enabled' : 'audio disabled'}</span>
      <span>{videoEnabled ? 'video enabled' : 'video disabled'}</span>
      <button type="button" onClick={onCallEnd}>
        End test call
      </button>
    </div>
  ),
}));

const group = {
  id: 'group-1',
  name: 'Builders',
  slug: 'builders',
  description: null,
  iconUrl: null,
  bannerUrl: null,
  isPublic: true,
  memberCount: 2,
  onlineMemberCount: 1,
  ownerId: 'owner-1',
  categories: [],
  channels: [
    {
      id: 'general',
      name: 'general',
      type: 'text',
      topic: null,
      categoryId: null,
      position: 0,
      isNsfw: false,
      slowModeSeconds: 0,
      unreadCount: 0,
      lastMessageAt: null,
    },
    {
      id: 'lounge',
      name: 'Lounge',
      type: 'voice',
      topic: 'Daily conversation',
      categoryId: null,
      position: 1,
      isNsfw: false,
      slowModeSeconds: 0,
      unreadCount: 0,
      lastMessageAt: null,
    },
  ],
  roles: [],
  myMember: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  is_node_gated: false,
  gate_type: null,
  gate_price_nodes: null,
} satisfies Group;

describe('GroupCallChannel', () => {
  beforeEach(() => {
    vi.mocked(useGroupStore).mockImplementation((selector) =>
      selector({ groups: [group] } as ReturnType<typeof useGroupStore.getState>)
    );
  });

  it('renders the voice room through the shared pane contract and preserves its room identity', () => {
    renderRoute('/groups/group-1/voice/lounge');

    expect(screen.getByText('Lounge')).toBeInTheDocument();
    expect(screen.getByText('Voice Room')).toHaveClass('cgraph-label-badge');
    expect(screen.getByText('Daily conversation')).toBeInTheDocument();
    expect(screen.getByText('group_group-1_channel_lounge')).toBeInTheDocument();
    expect(screen.getByText('audio enabled')).toBeInTheDocument();
    expect(screen.getByText('video disabled')).toBeInTheDocument();
  });

  it('returns to the first non-call channel when the call ends', () => {
    renderRoute('/groups/group-1/voice/lounge');

    fireEvent.click(screen.getByRole('button', { name: 'End test call' }));

    expect(screen.getByText('text destination')).toBeInTheDocument();
  });
});

function renderRoute(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/groups/:groupId/voice/:channelId" element={<GroupCallChannel />} />
        <Route
          path="/groups/:groupId/channels/:channelId"
          element={<div>text destination</div>}
        />
      </Routes>
    </MemoryRouter>
  );
}
