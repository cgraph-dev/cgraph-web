import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  recoverCloudChatEventsAfterResume: vi.fn(),
  chatState: {
    activeConversationId: 'conversation-1',
    fetchConversations: vi.fn().mockResolvedValue(undefined),
    fetchMessages: vi.fn().mockResolvedValue(undefined),
    addConversation: vi.fn(),
    updateConversation: vi.fn(),
    addMessage: vi.fn(),
  },
  notificationState: {
    fetchNotifications: vi.fn().mockResolvedValue(undefined),
    addNotification: vi.fn(),
    removeNotifications: vi.fn(),
  },
  friendState: {
    fetchFriends: vi.fn().mockResolvedValue(undefined),
    fetchPendingRequests: vi.fn().mockResolvedValue(undefined),
    fetchSentRequests: vi.fn().mockResolvedValue(undefined),
    upsertIncomingRequest: vi.fn(),
  },
}));

vi.mock('@/modules/chat/store', () => ({
  useChatStore: {
    getState: () => mocks.chatState,
  },
}));

vi.mock('@/modules/chat/store/chatStore.normalizers', () => ({
  toTypedMessage: vi.fn((message) => message),
}));

vi.mock('@/modules/calls/store', () => ({
  useIncomingCallStore: {
    getState: () => ({ setIncomingCall: vi.fn() }),
  },
}));

vi.mock('@/modules/social/store', () => ({
  toNotificationStoreType: (type: string) => type,
  useNotificationStore: {
    getState: () => mocks.notificationState,
  },
  useFriendStore: {
    getState: () => mocks.friendState,
  },
}));

vi.mock('@/modules/social/store/friend-normalizers', () => ({
  normalizeIncomingRequestEvent: vi.fn(),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: {
    getState: () => ({ updateUser: vi.fn(), logout: vi.fn() }),
  },
}));

vi.mock('@/modules/settings/store/customization/customizationStore', () => ({
  useCustomizationStore: {
    getState: () => ({ fetchCustomizations: vi.fn() }),
  },
}));

vi.mock('@/lib/api-utils', () => ({
  normalizeConversation: vi.fn((value) => value),
  normalizeMessage: vi.fn((value) => value),
}));

vi.mock('@/lib/identity', () => ({
  applyOwnItemEquipped: vi.fn(),
  applyOwnItemUnequipped: vi.fn(),
  applyOwnProfileUpdate: vi.fn(),
}));

vi.mock('@/lib/device/browser-device', () => ({
  getBrowserDeviceId: () => 'browser-device-1',
}));

vi.mock('@/lib/preferences/preference-sync-bus', () => ({
  applyCustomizationPreferenceSync: vi.fn(),
  applySettingsPreferenceSync: vi.fn(),
  applyThemePreferenceSync: vi.fn(),
}));

vi.mock('../cloudChatRecovery', () => ({
  recoverCloudChatEventsAfterResume: mocks.recoverCloudChatEventsAfterResume,
}));

vi.mock('../deviceRevocation', () => ({
  shouldLogoutForDeviceRevocation: vi.fn(),
}));

vi.mock('../incomingCallDedup', () => ({
  shouldDropIncomingCall: vi.fn(),
}));

import { joinUserChannel } from '../userChannel';

type Handler = (payload: unknown) => void;

function createChannel() {
  const handlers = new Map<string, Handler>();
  const joinRef = {
    receive: vi.fn((status: string, callback: (payload: unknown) => void) => {
      if (status === 'ok') callback({ session_id: 'session-2' });
      return joinRef;
    }),
  };

  return {
    handlers,
    channel: {
      on: vi.fn((event: string, handler: Handler) => handlers.set(event, handler)),
      onMessage: (_event: string, payload: unknown) => payload,
      join: vi.fn(() => joinRef),
      leave: vi.fn(),
    },
  };
}

describe('user channel Cloud Chat recovery wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.recoverCloudChatEventsAfterResume.mockResolvedValue(undefined);
  });

  it('starts the account-scoped recovery owner after resume completion', async () => {
    const { channel, handlers } = createChannel();
    const socket = { channel: vi.fn(() => channel) };

    joinUserChannel(
      socket as never,
      'account-1',
      new Map(),
      new Map(),
      vi.fn(),
      { sessionId: null, lastSequence: 0 }
    );

    handlers.get('resume_complete')?.({
      new_session_id: 'session-3',
      full_sync_required: false,
    });

    await vi.waitFor(() =>
      expect(mocks.recoverCloudChatEventsAfterResume).toHaveBeenCalledWith(
        'account-1',
        mocks.chatState,
        expect.any(Function)
      )
    );
  });

  it('retains the broader full-sync owners alongside the cursor recovery owner', async () => {
    const { channel, handlers } = createChannel();
    const socket = { channel: vi.fn(() => channel) };

    joinUserChannel(
      socket as never,
      'account-1',
      new Map(),
      new Map(),
      vi.fn(),
      { sessionId: null, lastSequence: 0 }
    );

    handlers.get('resume_complete')?.({ full_sync_required: true });
    await vi.waitFor(() => expect(mocks.recoverCloudChatEventsAfterResume).toHaveBeenCalledTimes(1));

    expect(mocks.chatState.fetchConversations).toHaveBeenCalledWith({ force: true });
    expect(mocks.notificationState.fetchNotifications).toHaveBeenCalledWith(null, { force: true });
    expect(mocks.friendState.fetchPendingRequests).toHaveBeenCalledTimes(1);
  });
});
