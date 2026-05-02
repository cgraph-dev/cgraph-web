/**
 * Thread Channel Module
 *
 * Handles joining/leaving thread channels and thread-specific actions
 * such as voting, commenting, typing indicators, and viewer tracking.
 * Extracted from SocketManager for maintainability.
 *
 */

import type { Socket, Channel, Presence } from 'phoenix';
import { socketLogger as logger } from '../logger';
import { setupThreadHandlers } from './channelHandlers';
import type {
  ThreadChannelCallbacks,
  ThreadVotePayload,
  CommentVotePayload,
  ThreadViewerPayload,
} from './types';

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function isThreadVotePayload(val: unknown): val is ThreadVotePayload {
  return (
    isRecord(val) &&
    typeof val['thread_id'] === 'string' &&
    typeof val['upvotes'] === 'number' &&
    typeof val['score'] === 'number'
  );
}

function isCommentVotePayload(val: unknown): val is CommentVotePayload {
  return (
    isRecord(val) &&
    typeof val['comment_id'] === 'string' &&
    typeof val['upvotes'] === 'number' &&
    typeof val['score'] === 'number'
  );
}

function isCommentIdPayload(val: unknown): val is { comment_id: string } {
  return isRecord(val) && typeof val['comment_id'] === 'string';
}

function isViewersResponse(val: unknown): val is { viewers: ThreadViewerPayload[] } {
  return isRecord(val) && Array.isArray(val['viewers']);
}

interface ThreadChannelState {
  channels: Map<string, Channel>;
  presences: Map<string, Presence>;
  channelHandlersSetUp: Set<string>;
}

/**
 * Join a thread channel and set up handlers.
 */
export function joinThread(
  socket: Socket | null,
  threadId: string,
  state: ThreadChannelState,
  threadCallbacks: Map<string, ThreadChannelCallbacks>,
  callbacks?: ThreadChannelCallbacks
): Channel | null {
  const topic = `thread:${threadId}`;

  if (callbacks) {
    threadCallbacks.set(threadId, callbacks);
  }

  const existingChannel = state.channels.get(topic);
  if (existingChannel) {
    const channelState = existingChannel.state;
    if (channelState === 'joined' || channelState === 'joining') return existingChannel;
    state.channels.delete(topic);
    state.channelHandlersSetUp.delete(topic);
    state.presences.delete(topic);
  }

  if (!socket?.isConnected()) {
    logger.warn('Cannot join thread: socket not connected');
    return null;
  }

  const channel = socket.channel(topic, {});
  state.channels.set(topic, channel);

  setupThreadHandlers(
    channel,
    topic,
    threadId,
    {
      channels: state.channels,
      presences: state.presences,
      channelHandlersSetUp: state.channelHandlersSetUp,
    },
    () => threadCallbacks
  );

  channel
    .join()
    .receive('ok', () => logger.log(`Joined thread channel: ${threadId}`))
    .receive('error', (resp: unknown) => {
      logger.error(`Failed to join thread channel ${threadId}:`, resp);
      state.channels.delete(topic);
      state.channelHandlersSetUp.delete(topic);
      threadCallbacks.delete(threadId);
    });

  return channel;
}

/**
 * Leave a thread channel and clean up state.
 */
export function leaveThread(
  threadId: string,
  state: ThreadChannelState,
  threadCallbacks: Map<string, ThreadChannelCallbacks>
) {
  const topic = `thread:${threadId}`;
  const channel = state.channels.get(topic);
  if (channel) {
    logger.log(`Leaving thread: ${threadId}`);
    channel.leave();
    state.channels.delete(topic);
    state.channelHandlersSetUp.delete(topic);
    state.presences.delete(topic);
    threadCallbacks.delete(threadId);
  }
}

/**
 * Vote on a thread (upvote, downvote, or remove vote).
 */
export function voteOnThread(
  threadId: string,
  value: 1 | -1 | 0,
  channels: Map<string, Channel>
): Promise<ThreadVotePayload> {
  const topic = `thread:${threadId}`;
  const channel = channels.get(topic);
  if (!channel || channel.state !== 'joined') {
    return Promise.reject(new Error('Not connected to thread channel'));
  }
  return new Promise((resolve, reject) => {
    channel
      .push('vote', { value })
      .receive('ok', (resp: unknown) => {
        if (isThreadVotePayload(resp)) {
          resolve(resp);
        } else {
          reject(new Error('Unexpected vote response shape'));
        }
      })
      .receive('error', (resp: unknown) => reject(resp));
  });
}

/**
 * Vote on a comment within a thread.
 */
export function voteOnComment(
  threadId: string,
  commentId: string,
  value: 1 | -1 | 0,
  channels: Map<string, Channel>
): Promise<CommentVotePayload> {
  const topic = `thread:${threadId}`;
  const channel = channels.get(topic);
  if (!channel || channel.state !== 'joined') {
    return Promise.reject(new Error('Not connected to thread channel'));
  }
  return new Promise((resolve, reject) => {
    channel
      .push('vote_comment', { comment_id: commentId, value })
      .receive('ok', (resp: unknown) => {
        if (isCommentVotePayload(resp)) {
          resolve(resp);
        } else {
          reject(new Error('Unexpected comment vote response shape'));
        }
      })
      .receive('error', (resp: unknown) => reject(resp));
  });
}

/**
 * Send a comment in a thread, optionally as a reply to another comment.
 */
export function sendComment(
  threadId: string,
  content: string,
  channels: Map<string, Channel>,
  parentId?: string
): Promise<{ comment_id: string }> {
  const topic = `thread:${threadId}`;
  const channel = channels.get(topic);
  if (!channel || channel.state !== 'joined') {
    return Promise.reject(new Error('Not connected to thread channel'));
  }
  return new Promise((resolve, reject) => {
    channel
      .push('new_comment', { content, parent_id: parentId })
      .receive('ok', (resp: unknown) => {
        if (isCommentIdPayload(resp)) {
          resolve(resp);
        } else {
          reject(new Error('Unexpected comment response shape'));
        }
      })
      .receive('error', (resp: unknown) => reject(resp));
  });
}

/**
 * Send typing indicator for a thread.
 */
export function sendThreadTyping(
  threadId: string,
  isTyping: boolean,
  channels: Map<string, Channel>
) {
  const topic = `thread:${threadId}`;
  const channel = channels.get(topic);
  if (channel?.state === 'joined') {
    channel.push('typing', { typing: isTyping, is_typing: isTyping });
  }
}

/**
 * Get the list of users currently viewing a thread.
 */
export function getThreadViewers(
  threadId: string,
  channels: Map<string, Channel>
): Promise<{ viewers: ThreadViewerPayload[] }> {
  const topic = `thread:${threadId}`;
  const channel = channels.get(topic);
  if (!channel || channel.state !== 'joined') {
    return Promise.reject(new Error('Not connected to thread channel'));
  }
  return new Promise((resolve, reject) => {
    channel
      .push('get_viewers', {})
      .receive('ok', (resp: unknown) => {
        if (isViewersResponse(resp)) {
          resolve(resp);
        } else {
          reject(new Error('Unexpected viewers response shape'));
        }
      })
      .receive('error', (resp: unknown) => reject(resp));
  });
}
