/**
 * Connection Lifecycle Module
 *
 * Handles Phoenix Socket connection, disconnection, and reconnection.
 * Extracted from SocketManager for maintainability.
 *
 */

import { Socket, Channel, Presence } from 'phoenix';
import { exponentialBackoffWithJitter } from '@cgraph/utils';
import { useAuthStore } from '@/modules/auth/store';
import { socketLogger as logger } from '../logger';
import { getSocketUrl } from '../backend-url';
import { setConnectionStatus } from './connection-status-store';
import type { ForumChannelCallbacks, ThreadChannelCallbacks } from './types';

const SOCKET_URL = getSocketUrl();

logger.debug('Configured URL:', SOCKET_URL);
logger.debug('VITE_WS_URL:', import.meta.env.VITE_WS_URL);
logger.debug('VITE_API_URL:', import.meta.env.VITE_API_URL);

/**
 * Maximum reconnect attempts before circuit breaker trips and the socket
 * enters the `paused` state. Matches Signal-Desktop's ceiling — high
 * enough to ride out long mobile-tunnel outages, low enough to avoid
 * burning battery indefinitely. Resume happens via the ReconnectBanner
 * UI, on `window.online`, or on tab visibility regain.
 */
const MAX_RECONNECT_ATTEMPTS_WEB = 64;

export interface SocketManagerState {
  socket: Socket | null;
  channels: Map<string, Channel>;
  presences: Map<string, Presence>;
  onlineUsers: Map<string, Set<string>>;
  reconnectTimer: number | null;
  connectionPromise: Promise<void> | null;
  channelHandlersSetUp: Set<string>;
  lastJoinAttempts: Map<string, number>;
  forumCallbacks: Map<string, ForumChannelCallbacks>;
  threadCallbacks: Map<string, ThreadChannelCallbacks>;
  // Session resumption state
  sessionId: string | null;
  lastSequence: number;
  // Circuit breaker state
  reconnectAttempts: number;
}

/**
 * Establish a Phoenix Socket connection using the current auth token.
 */
export function connectSocket(state: SocketManagerState): Promise<void> {
  if (state.connectionPromise) {
    return state.connectionPromise;
  }

  const token = useAuthStore.getState().token;
  logger.debug('connect() called, token exists:', !!token);
  if (!token) {
    logger.warn('Cannot connect to socket: no auth token');
    return Promise.resolve();
  }

  if (state.socket?.isConnected()) {
    logger.debug('Already connected');
    return Promise.resolve();
  }

  logger.debug('Connecting to:', SOCKET_URL);
  setConnectionStatus('connecting');
  state.connectionPromise = new Promise<void>((resolve, reject) => {
    const connectionTimeout = setTimeout(() => {
      logger.error('Socket connection timeout after 15s');
      state.connectionPromise = null;
      reject(new Error('Socket connection timeout'));
    }, 15000);

    state.socket = new Socket(SOCKET_URL, {
      params: { token },
      // Exponential backoff with equal jitter — prevents thundering herd at scale
      reconnectAfterMs: exponentialBackoffWithJitter(),
      heartbeatIntervalMs: 5000,
    });

    state.socket.onOpen(() => {
      clearTimeout(connectionTimeout);
      logger.log('Socket connected to:', SOCKET_URL);
      // Reset circuit breaker on successful connection
      state.reconnectAttempts = 0;
      if (state.reconnectTimer) {
        clearTimeout(state.reconnectTimer);
        state.reconnectTimer = null;
      }
      state.connectionPromise = null;
      setConnectionStatus('connected');
      resolve();
    });

    state.socket.onClose(() => {
      logger.log('Socket disconnected');
      // Circuit breaker: track reconnect attempts
      state.reconnectAttempts++;
      if (state.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS_WEB) {
        logger.warn(
          `Circuit breaker: max reconnect attempts (${MAX_RECONNECT_ATTEMPTS_WEB}) reached, pausing`
        );
        state.socket?.disconnect();
        state.socket = null;
        setConnectionStatus('paused');
      } else {
        setConnectionStatus('disconnected');
      }
      // Preserve session info for resumption on reconnect
      if (state.sessionId) {
        try {
          sessionStorage.setItem('ws_session_id', state.sessionId);
          sessionStorage.setItem('ws_last_sequence', String(state.lastSequence));
        } catch (error) {
          logger.error('Failed to persist session info to sessionStorage', error);
        }
      }
      state.connectionPromise = null;
    });

    state.socket.onError((error: unknown) => {
      clearTimeout(connectionTimeout);
      logger.error('Socket error:', error);
      // Circuit breaker: track reconnect attempts on error too
      state.reconnectAttempts++;
      if (state.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS_WEB) {
        logger.warn(
          `Circuit breaker: max reconnect attempts (${MAX_RECONNECT_ATTEMPTS_WEB}) reached, pausing`
        );
        state.socket?.disconnect();
        state.socket = null;
        setConnectionStatus('paused');
      } else {
        setConnectionStatus('disconnected');
      }
      state.connectionPromise = null;
      reject(error);
    });

    state.socket.connect();
  }).catch((err) => {
    logger.warn('Socket connection failed, app will work in offline mode:', err);
  });

  return state.connectionPromise ?? Promise.resolve();
}

/**
 * Disconnect and clean up all channels and state.
 */
export function disconnectSocket(state: SocketManagerState) {
  state.channels.forEach((channel) => channel.leave());
  state.channels.clear();
  state.presences.clear();
  state.onlineUsers.clear();
  state.channelHandlersSetUp.clear();
  state.lastJoinAttempts.clear();
  state.forumCallbacks.clear();
  state.threadCallbacks.clear();
  state.socket?.disconnect();
  state.socket = null;
  state.connectionPromise = null;
  setConnectionStatus('disconnected');
}
