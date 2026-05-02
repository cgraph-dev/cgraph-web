/**
 * Socket Manager — Forum & Thread channel delegations.
 *
 * Extracted from socket-manager.ts to keep file sizes manageable.
 * Each function accepts the shared SocketManagerState and delegates
 * to the corresponding channel implementation.
 */

import type { Channel } from 'phoenix';
import type { SocketManagerState } from './connectionLifecycle';
import {
  joinForum as joinForumImpl,
  leaveForum as leaveForumImpl,
  subscribeToForum as subscribeToForumImpl,
  unsubscribeFromForum as unsubscribeFromForumImpl,
} from './forumChannel';
import {
  joinThread as joinThreadImpl,
  leaveThread as leaveThreadImpl,
  voteOnThread as voteOnThreadImpl,
  voteOnComment as voteOnCommentImpl,
  sendComment as sendCommentImpl,
  sendThreadTyping as sendThreadTypingImpl,
  getThreadViewers as getThreadViewersImpl,
} from './threadChannel';
import type {
  ForumChannelCallbacks,
  ThreadChannelCallbacks,
  ThreadVotePayload,
  CommentVotePayload,
  ThreadViewerPayload,
} from './types';

export type {
  ForumChannelCallbacks,
  ThreadChannelCallbacks,
  ThreadVotePayload,
  CommentVotePayload,
  ThreadViewerPayload,
};

/** Join Forum. */
export function joinForum(
  state: SocketManagerState,
  forumId: string,
  callbacks?: ForumChannelCallbacks
): Channel | null {
  return joinForumImpl(
    state.socket,
    forumId,
    {
      channels: state.channels,
      presences: state.presences,
      channelHandlersSetUp: state.channelHandlersSetUp,
    },
    state.forumCallbacks,
    callbacks
  );
}

/** Leave Forum. */
export function leaveForum(state: SocketManagerState, forumId: string): void {
  leaveForumImpl(
    forumId,
    {
      channels: state.channels,
      presences: state.presences,
      channelHandlersSetUp: state.channelHandlersSetUp,
    },
    state.forumCallbacks
  );
}

/** Subscribe To Forum. */
export function subscribeToForum(
  state: SocketManagerState,
  forumId: string
): Promise<{ subscribed: boolean }> {
  return subscribeToForumImpl(forumId, state.channels);
}

/** Unsubscribe From Forum. */
export function unsubscribeFromForum(
  state: SocketManagerState,
  forumId: string
): Promise<{ subscribed: boolean }> {
  return unsubscribeFromForumImpl(forumId, state.channels);
}

/** Join Thread. */
export function joinThread(
  state: SocketManagerState,
  threadId: string,
  callbacks?: ThreadChannelCallbacks
): Channel | null {
  return joinThreadImpl(
    state.socket,
    threadId,
    {
      channels: state.channels,
      presences: state.presences,
      channelHandlersSetUp: state.channelHandlersSetUp,
    },
    state.threadCallbacks,
    callbacks
  );
}

/** Leave Thread. */
export function leaveThread(state: SocketManagerState, threadId: string): void {
  leaveThreadImpl(
    threadId,
    {
      channels: state.channels,
      presences: state.presences,
      channelHandlersSetUp: state.channelHandlersSetUp,
    },
    state.threadCallbacks
  );
}

/** Vote On Thread. */
export function voteOnThread(
  state: SocketManagerState,
  threadId: string,
  value: 1 | -1 | 0
): Promise<ThreadVotePayload> {
  return voteOnThreadImpl(threadId, value, state.channels);
}

/** Vote On Comment. */
export function voteOnComment(
  state: SocketManagerState,
  threadId: string,
  commentId: string,
  value: 1 | -1 | 0
): Promise<CommentVotePayload> {
  return voteOnCommentImpl(threadId, commentId, value, state.channels);
}

/** Send Comment. */
export function sendComment(
  state: SocketManagerState,
  threadId: string,
  content: string,
  parentId?: string
): Promise<{ comment_id: string }> {
  return sendCommentImpl(threadId, content, state.channels, parentId);
}

/** Send Thread Typing. */
export function sendThreadTyping(
  state: SocketManagerState,
  threadId: string,
  isTyping: boolean
): void {
  sendThreadTypingImpl(threadId, isTyping, state.channels);
}

/** Get Thread Viewers. */
export function getThreadViewers(
  state: SocketManagerState,
  threadId: string
): Promise<{ viewers: ThreadViewerPayload[] }> {
  return getThreadViewersImpl(threadId, state.channels);
}
