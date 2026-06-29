import { describe, expect, it, vi } from 'vitest';

const socketMocks = vi.hoisted(() => ({
  reconnectHandler: null as null | (() => Promise<void> | void),
  reconnectWithNewToken: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../socket-manager', () => ({
  SocketManager: class {
    reconnectWithNewToken = socketMocks.reconnectWithNewToken;
  },
}));

vi.mock('../../socket-token-reconnect', () => ({
  registerSocketTokenReconnectHandler: vi.fn((handler: () => Promise<void> | void) => {
    socketMocks.reconnectHandler = handler;
  }),
}));

import '../index';

describe('socket token reconnect registration', () => {
  it('reconnects a disconnected socket after the access token refreshes', async () => {
    expect(socketMocks.reconnectHandler).not.toBeNull();

    await socketMocks.reconnectHandler?.();

    expect(socketMocks.reconnectWithNewToken).toHaveBeenCalledTimes(1);
  });
});
