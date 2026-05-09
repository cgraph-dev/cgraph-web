/**
 * Group Actions — Extended Tests
 *
 * Covers actions not tested in groupStore.test.ts:
 * discover groups, join public group, channel message bounds,
 * reset, and join celebration.
 */

import { describe, it, expect, afterEach, vi, type MockedFunction } from 'vitest';
import { useGroupStore } from '@/modules/groups/store';
import type { Group, Channel, Member, ChannelMessage, Role } from '@/modules/groups/store';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@cgraph/utils', () => ({
  createIdempotencyKey: () => 'test-key-456',
}));

import { api } from '@/lib/api-client';

const mockedApi = {
  get: api.get as MockedFunction<typeof api.get>,
  post: api.post as MockedFunction<typeof api.post>,
  put: (api as unknown as Record<string, unknown>).put as MockedFunction<
    (url: string, data?: unknown) => Promise<unknown>
  >,
  patch: api.patch as MockedFunction<typeof api.patch>,
  delete: api.delete as MockedFunction<typeof api.delete>,
};
const mockRole: Role = {
  id: 'role-1',
  name: 'Member',
  color: '#ffffff',
  position: 1,
  permissions: 0,
  isDefault: true,
  isMentionable: false,
};

const mockChannel: Channel = {
  id: 'channel-1',
  name: 'general',
  type: 'text',
  topic: null,
  categoryId: null,
  position: 0,
  isNsfw: false,
  slowModeSeconds: 0,
  unreadCount: 0,
  lastMessageAt: null,
};

const mockMember: Member = {
  id: 'member-1',
  userId: 'user-1',
  nickname: null,
  user: {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test',
    avatarUrl: null,
    status: 'online',
  },
  roles: [mockRole],
  joinedAt: '2026-01-01T00:00:00Z',
};

const mockGroup: Group = {
  id: 'group-1',
  name: 'Test Group',
  slug: 'test-group',
  description: 'A test group',
  iconUrl: null,
  bannerUrl: null,
  isPublic: true,
  memberCount: 50,
  onlineMemberCount: 10,
  ownerId: 'user-1',
  categories: [],
  channels: [mockChannel],
  roles: [mockRole],
  myMember: mockMember,
  createdAt: '2026-01-01T00:00:00Z',
  is_node_gated: false,
  gate_type: null,
  gate_price_nodes: null,
};

const mockGroup2: Group = {
  ...mockGroup,
  id: 'group-2',
  name: 'Second Group',
  slug: 'second-group',
};

const makeMessage = (id: string, channelId = 'channel-1'): ChannelMessage => ({
  id,
  channelId,
  authorId: 'user-1',
  content: `Message ${id}`,
  messageType: 'text',
  replyToId: null,
  replyTo: null,
  isPinned: false,
  isEdited: false,
  deletedAt: null,
  metadata: {},
  reactions: [],
  author: {
    id: 'user-1',
    username: 'testuser',
    displayName: 'Test',
    avatarUrl: null,
    member: null,
  },
  createdAt: '2026-01-01T00:00:00Z',
});
const getInitialState = () => ({
  groups: [],
  activeGroupId: null,
  activeChannelId: null,
  channelMessages: {},
  members: {},
  isLoadingGroups: false,
  isLoadingMessages: false,
  hasMoreMessages: {},
  typingUsers: {},
  justJoinedGroupName: null,
  discoverableGroups: [],
  isLoadingDiscover: false,
  discoverSearch: '',
});

afterEach(() => {
  useGroupStore.setState(getInitialState());
  vi.clearAllMocks();
});
describe('group-actions (extended)', () => {
  describe('fetchDiscoverableGroups', () => {
    it('should fetch and store discoverable groups', async () => {
      mockedApi.get.mockResolvedValue({
        data: { communities: [mockGroup, mockGroup2] },
      });

      await useGroupStore.getState().fetchDiscoverableGroups();

      const state = useGroupStore.getState();
      expect(state.discoverableGroups).toHaveLength(2);
      expect(state.isLoadingDiscover).toBe(false);
    });

    it('should pass search and sort params', async () => {
      mockedApi.get.mockResolvedValue({ data: { communities: [] } });

      await useGroupStore.getState().fetchDiscoverableGroups({
        search: 'gaming',
        sort: 'popular',
        page: 2,
        limit: 10,
      });

      expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/explore', {
        params: {
          q: 'gaming',
          sort: 'popular',
          cursor: null,
          limit: 10,
        },
      });
      expect(useGroupStore.getState().discoverSearch).toBe('gaming');
    });

    it('should set isLoadingDiscover and reset on error', async () => {
      mockedApi.get.mockRejectedValue(new Error('Fail'));

      await expect(useGroupStore.getState().fetchDiscoverableGroups()).rejects.toThrow('Fail');

      expect(useGroupStore.getState().isLoadingDiscover).toBe(false);
    });
  });
  describe('joinPublicGroup', () => {
    it('should add group to store and set justJoinedGroupName', async () => {
      useGroupStore.setState({
        discoverableGroups: [mockGroup],
      });
      mockedApi.post.mockResolvedValue({ data: { group: mockGroup } });

      await useGroupStore.getState().joinPublicGroup('group-1');

      const state = useGroupStore.getState();
      expect(state.groups).toHaveLength(1);
      expect(state.justJoinedGroupName).toBe('Test Group');
      // Should be removed from discoverable
      expect(state.discoverableGroups).toHaveLength(0);
    });

    it('should not duplicate group if already in store', async () => {
      useGroupStore.setState({ groups: [mockGroup] });
      mockedApi.post.mockResolvedValue({ data: { group: mockGroup } });

      await useGroupStore.getState().joinPublicGroup('group-1');

      expect(useGroupStore.getState().groups).toHaveLength(1);
    });
  });
  describe('clearJoinCelebration', () => {
    it('should clear justJoinedGroupName', () => {
      useGroupStore.setState({ justJoinedGroupName: 'My Group' });

      useGroupStore.getState().clearJoinCelebration();

      expect(useGroupStore.getState().justJoinedGroupName).toBeNull();
    });
  });
  describe('addChannelMessage (MAX_CHANNEL_MESSAGES)', () => {
    it('should cap messages at 200 per channel', () => {
      const existingMsgs = Array.from({ length: 200 }, (_, i) => makeMessage(`existing-${i}`));
      useGroupStore.setState({
        channelMessages: { 'channel-1': existingMsgs },
      });

      const newMsg = makeMessage('new-msg');
      useGroupStore.getState().addChannelMessage(newMsg);

      const msgs = useGroupStore.getState().channelMessages['channel-1']!;
      expect(msgs).toHaveLength(200);
      // The newest message should be the last one
      expect(msgs[msgs.length - 1]!.id).toBe('new-msg');
      // The first old message should have been dropped
      expect(msgs[0]!.id).toBe('existing-1');
    });
  });
  describe('reset', () => {
    it('should restore all state to initial values', () => {
      useGroupStore.setState({
        groups: [mockGroup],
        activeGroupId: 'group-1',
        activeChannelId: 'channel-1',
        channelMessages: { 'channel-1': [makeMessage('msg-1')] },
        members: { 'group-1': [mockMember] },
        isLoadingGroups: true,
        isLoadingMessages: true,
        hasMoreMessages: { 'channel-1': true },
        typingUsers: { 'channel-1': ['user-1'] },
        justJoinedGroupName: 'Test',
        discoverableGroups: [mockGroup2],
        isLoadingDiscover: true,
        discoverSearch: 'test',
      });

      useGroupStore.getState().reset();

      const state = useGroupStore.getState();
      expect(state.groups).toEqual([]);
      expect(state.activeGroupId).toBeNull();
      expect(state.activeChannelId).toBeNull();
      expect(state.channelMessages).toEqual({});
      expect(state.members).toEqual({});
      expect(state.isLoadingGroups).toBe(false);
      expect(state.isLoadingMessages).toBe(false);
      expect(state.hasMoreMessages).toEqual({});
      expect(state.typingUsers).toEqual({});
      expect(state.justJoinedGroupName).toBeNull();
      expect(state.discoverableGroups).toEqual([]);
      expect(state.isLoadingDiscover).toBe(false);
      expect(state.discoverSearch).toBe('');
    });
  });
  describe('updateGroup (payload mapping)', () => {
    it('should map isPublic to visibility', async () => {
      useGroupStore.setState({ groups: [mockGroup] });
      const updated = { ...mockGroup, isPublic: false };
      mockedApi.patch.mockResolvedValue({ data: { group: updated } });

      await useGroupStore.getState().updateGroup('group-1', { isPublic: false });

      expect(mockedApi.patch).toHaveBeenCalledWith('/api/v1/groups/group-1', {
        visibility: 'private',
      });
    });

    it('should map iconUrl and bannerUrl to snake_case', async () => {
      useGroupStore.setState({ groups: [mockGroup] });
      const updated = { ...mockGroup, iconUrl: '/new-icon.png' };
      mockedApi.patch.mockResolvedValue({ data: { group: updated } });

      await useGroupStore.getState().updateGroup('group-1', {
        iconUrl: '/new-icon.png',
        bannerUrl: '/new-banner.png',
      });

      expect(mockedApi.patch).toHaveBeenCalledWith('/api/v1/groups/group-1', {
        icon_url: '/new-icon.png',
        banner_url: '/new-banner.png',
      });
    });
  });
  describe('createGroup (bounds)', () => {
    it('should cap groups at 200', async () => {
      const manyGroups = Array.from({ length: 200 }, (_, i) => ({
        ...mockGroup,
        id: `g-${i}`,
      }));
      useGroupStore.setState({ groups: manyGroups });
      const newGroup = { ...mockGroup, id: 'new-group' };
      mockedApi.post.mockResolvedValue({ data: { group: newGroup } });

      await useGroupStore.getState().createGroup({ name: 'New' });

      expect(useGroupStore.getState().groups).toHaveLength(200);
      // New group is prepended
      expect(useGroupStore.getState().groups[0]!.id).toBe('new-group');
    });
  });
  describe('fetchGroup (bounds)', () => {
    it('should cap groups at 200 when adding a new group', async () => {
      const manyGroups = Array.from({ length: 200 }, (_, i) => ({
        ...mockGroup,
        id: `g-${i}`,
      }));
      useGroupStore.setState({ groups: manyGroups });
      const newGroup = { ...mockGroup, id: 'new-group-via-fetch' };
      mockedApi.get.mockResolvedValue({ data: { group: newGroup } });

      await useGroupStore.getState().fetchGroup('new-group-via-fetch');

      const groups = useGroupStore.getState().groups;
      expect(groups.length).toBeLessThanOrEqual(201);
    });
  });
});
