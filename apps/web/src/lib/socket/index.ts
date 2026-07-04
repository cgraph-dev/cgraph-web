/**
 * Socket Module — Public API
 *
 * Barrel re-export for backward-compatible imports.
 * All consumers can continue using:
 *   import { socketManager, useSocket } from '@/lib/socket'
 *
 */

export { SocketManager } from './socket-manager';
export { setupForumHandlers, setupThreadHandlers } from './channelHandlers';
export type { ChannelMaps } from './channelHandlers';

export type {
  ForumThreadPayload,
  ForumUserPayload,
  ForumStatsPayload,
  ForumPresenceMeta,
  ForumPresenceMember,
  ForumChannelCallbacks,
  ThreadCommentPayload,
  ThreadVotePayload,
  CommentVotePayload,
  ThreadTypingPayload,
  ThreadPresenceMeta,
  ThreadViewerPayload,
  ThreadChannelCallbacks,
} from './types';

import { SocketManager } from './socket-manager';
import { registerSocketTokenReconnectHandler } from '../socket-token-reconnect';

let _instance: SocketManager | null = null;

/** Lazy singleton — avoids constructing until first access */
function getSocketManager(): SocketManager {
  if (!_instance) {
    _instance = new SocketManager();
  }
  return _instance;
}

function createSocketManagerProxyTarget(): SocketManager {
  return Object.create(SocketManager.prototype);
}

/**
 * Shared socket manager instance. Lazily created on first property access
 * via Proxy to avoid unnecessary construction at import time.
 */
export const socketManager: SocketManager = new Proxy(createSocketManagerProxyTarget(), {
  get(_target, prop, receiver) {
    return Reflect.get(getSocketManager(), prop, receiver);
  },
  set(_target, prop, value, receiver) {
    return Reflect.set(getSocketManager(), prop, value, receiver);
  },
});

registerSocketTokenReconnectHandler(async () => {
  const manager = getSocketManager();
  await manager.reconnectWithNewToken();
});

/**
 * Hook for managing socket.
 */
export function useSocket() {
  return getSocketManager();
}
