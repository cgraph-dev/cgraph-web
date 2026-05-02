/**
 * Forum Channel Handler
 *
 * Manages Phoenix channel connections for forum-level real-time events
 * including new threads, member changes, stats, and presence.
 *
 */

import { Channel, Presence } from 'phoenix';
import type {
  ForumChannelCallbacks,
  ForumPresenceMember,
  ForumPresenceMeta,
  ForumStatsPayload,
  ForumThreadPayload,
  ForumUserPayload,
  ThreadVotePayload,
  CommentVotePayload,
  ThreadCommentPayload,
  ThreadTypingPayload,
  ThreadPresenceMeta,
  ThreadViewerPayload,
  ThreadChannelCallbacks,
} from './types';

// Re-export for convenience
export type { ForumChannelCallbacks, ThreadChannelCallbacks };

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

/** Validate Phoenix Presence shape: { metas: T[] } */
function hasPresenceMetas<T>(
  pres: unknown,
  validateMeta: (m: unknown) => m is T
): pres is { metas: T[] } {
  if (!isRecord(pres) || !Array.isArray(pres['metas'])) return false;
  return pres['metas'].length === 0 || validateMeta(pres['metas'][0]);
}

function isForumPresenceMeta(val: unknown): val is ForumPresenceMeta {
  return isRecord(val) && typeof val['username'] === 'string' && typeof val['online_at'] === 'string';
}

function isThreadPresenceMeta(val: unknown): val is ThreadPresenceMeta {
  return isRecord(val) && typeof val['username'] === 'string' && typeof val['typing'] === 'boolean';
}

function isForumThreadPayload(val: unknown): val is ForumThreadPayload {
  return (
    isRecord(val) &&
    typeof val['id'] === 'string' &&
    typeof val['title'] === 'string' &&
    typeof val['author_id'] === 'string'
  );
}

function isForumUserPayload(val: unknown): val is ForumUserPayload {
  return isRecord(val) && typeof val['id'] === 'string' && typeof val['username'] === 'string';
}

function isForumStatsPayload(val: unknown): val is ForumStatsPayload {
  return (
    isRecord(val) &&
    typeof val['member_count'] === 'number' &&
    typeof val['post_count'] === 'number' &&
    typeof val['thread_count'] === 'number'
  );
}

function isThreadCommentPayload(val: unknown): val is ThreadCommentPayload {
  return (
    isRecord(val) &&
    typeof val['id'] === 'string' &&
    typeof val['content'] === 'string' &&
    typeof val['author_id'] === 'string'
  );
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

function isThreadTypingPayload(val: unknown): val is ThreadTypingPayload {
  return (
    isRecord(val) &&
    typeof val['user_id'] === 'string' &&
    typeof val['is_typing'] === 'boolean'
  );
}

interface PostEditedPayload {
  id: string;
  content: string;
  content_html: string;
  is_edited: boolean;
  edit_count: number;
  edited_at: string;
}

function isPostEditedPayload(val: unknown): val is PostEditedPayload {
  return (
    isRecord(val) &&
    typeof val['id'] === 'string' &&
    typeof val['content'] === 'string' &&
    typeof val['content_html'] === 'string'
  );
}

interface ThreadStatusPayload {
  thread_id: string;
  is_locked: boolean;
  is_pinned: boolean;
}

function isThreadStatusPayload(val: unknown): val is ThreadStatusPayload {
  return (
    isRecord(val) &&
    typeof val['thread_id'] === 'string' &&
    typeof val['is_locked'] === 'boolean' &&
    typeof val['is_pinned'] === 'boolean'
  );
}

/** Shared channel state maps from the parent SocketManager */
export interface ChannelMaps {
  channels: Map<string, Channel>;
  presences: Map<string, Presence>;
  channelHandlersSetUp: Set<string>;
}

/**
 * Set up event handlers for a forum channel.
 *
 * @param channel  - The Phoenix channel instance
 * @param topic    - Channel topic string (e.g. "forum:abc123")
 * @param forumId  - Forum ID
 * @param maps     - Shared channel state maps
 * @param getCallbacks - Getter for the forum callbacks map
 */
export function setupForumHandlers(
  channel: Channel,
  topic: string,
  forumId: string,
  maps: ChannelMaps,
  getCallbacks: () => Map<string, ForumChannelCallbacks>
): void {
  if (maps.channelHandlersSetUp.has(topic)) return;
  maps.channelHandlersSetUp.add(topic);

  // Presence tracking
  const presence = new Presence(channel);
  maps.presences.set(topic, presence);

  presence.onSync(() => {
    const members: ForumPresenceMember[] = [];
    presence.list((userId: string, pres: unknown) => {
      if (!hasPresenceMetas(pres, isForumPresenceMeta)) return userId;
      const meta = pres.metas[0];
      if (meta) {
        members.push({
          user_id: userId,
          username: meta.username,
          display_name: meta.display_name,
          avatar_url: meta.avatar_url,
          online_at: meta.online_at,
          is_member: meta.is_member,
        });
      }
      return userId;
    });

    getCallbacks().get(forumId)?.onPresenceSync?.(members);
  });

  // Forum event handlers
  channel.on('new_thread', (payload) => {
    if (!isRecord(payload)) return;
    const thread = payload['thread'];
    if (isForumThreadPayload(thread)) {
      getCallbacks().get(forumId)?.onNewThread?.(thread);
    }
  });

  channel.on('thread_pinned', (payload) => {
    if (!isRecord(payload) || typeof payload['thread_id'] !== 'string' || typeof payload['is_pinned'] !== 'boolean') return;
    getCallbacks().get(forumId)?.onThreadPinned?.({ thread_id: payload['thread_id'], is_pinned: payload['is_pinned'] });
  });

  channel.on('thread_locked', (payload) => {
    if (!isRecord(payload) || typeof payload['thread_id'] !== 'string' || typeof payload['is_locked'] !== 'boolean') return;
    getCallbacks().get(forumId)?.onThreadLocked?.({ thread_id: payload['thread_id'], is_locked: payload['is_locked'] });
  });

  channel.on('thread_deleted', (payload) => {
    if (!isRecord(payload) || typeof payload['thread_id'] !== 'string') return;
    getCallbacks().get(forumId)?.onThreadDeleted?.({ thread_id: payload['thread_id'] });
  });

  channel.on('member_joined', (payload) => {
    if (!isRecord(payload)) return;
    const user = payload['user'];
    if (isForumUserPayload(user)) {
      getCallbacks().get(forumId)?.onMemberJoined?.(user);
    }
  });

  channel.on('member_left', (payload) => {
    if (!isRecord(payload) || typeof payload['user_id'] !== 'string') return;
    getCallbacks().get(forumId)?.onMemberLeft?.({ user_id: payload['user_id'] });
  });

  channel.on('stats_update', (payload) => {
    if (!isForumStatsPayload(payload)) return;
    getCallbacks().get(forumId)?.onStatsUpdate?.(payload);
  });

  channel.on('forum_stats', (payload) => {
    if (!isForumStatsPayload(payload)) return;
    getCallbacks().get(forumId)?.onStatsUpdate?.(payload);
  });
}

/**
 * Set up event handlers for a thread channel.
 *
 * @param channel  - The Phoenix channel instance
 * @param topic    - Channel topic string (e.g. "thread:abc123")
 * @param threadId - Thread ID
 * @param maps     - Shared channel state maps
 * @param getCallbacks - Getter for the thread callbacks map
 */
export function setupThreadHandlers(
  channel: Channel,
  topic: string,
  threadId: string,
  maps: ChannelMaps,
  getCallbacks: () => Map<string, ThreadChannelCallbacks>
): void {
  if (maps.channelHandlersSetUp.has(topic)) return;
  maps.channelHandlersSetUp.add(topic);

  // Presence tracking
  const presence = new Presence(channel);
  maps.presences.set(topic, presence);

  presence.onSync(() => {
    const viewers: ThreadViewerPayload[] = [];
    presence.list((userId: string, pres: unknown) => {
      if (!hasPresenceMetas(pres, isThreadPresenceMeta)) return userId;
      const meta = pres.metas[0];
      if (meta) {
        viewers.push({
          user_id: userId,
          username: meta.username,
          display_name: meta.display_name,
          avatar_url: meta.avatar_url,
          typing: meta.typing,
        });
      }
      return userId;
    });

    getCallbacks().get(threadId)?.onPresenceSync?.(viewers);
  });

  // Thread event handlers
  channel.on('new_comment', (payload) => {
    if (!isRecord(payload)) return;
    const comment = payload['comment'];
    if (isThreadCommentPayload(comment)) {
      getCallbacks().get(threadId)?.onNewComment?.(comment);
    }
  });

  channel.on('comment_edited', (payload) => {
    if (!isRecord(payload)) return;
    const comment = payload['comment'];
    if (isThreadCommentPayload(comment)) {
      getCallbacks().get(threadId)?.onCommentEdited?.(comment);
    }
  });

  channel.on('comment_deleted', (payload) => {
    if (!isRecord(payload) || typeof payload['comment_id'] !== 'string') return;
    getCallbacks().get(threadId)?.onCommentDeleted?.({ comment_id: payload['comment_id'] });
  });

  channel.on('vote_changed', (payload) => {
    if (!isThreadVotePayload(payload)) return;
    getCallbacks().get(threadId)?.onVoteChanged?.(payload);
  });

  channel.on('comment_vote_changed', (payload) => {
    if (!isCommentVotePayload(payload)) return;
    getCallbacks().get(threadId)?.onCommentVoteChanged?.(payload);
  });

  channel.on('typing', (payload) => {
    if (!isThreadTypingPayload(payload)) return;
    getCallbacks().get(threadId)?.onTyping?.(payload);
  });

  channel.on('post_edited', (payload) => {
    if (!isRecord(payload)) return;
    const post = payload['post'];
    if (isPostEditedPayload(post)) {
      getCallbacks().get(threadId)?.onPostEdited?.(post);
    }
  });

  channel.on('thread_status_changed', (payload) => {
    if (!isThreadStatusPayload(payload)) return;
    getCallbacks().get(threadId)?.onThreadStatusChanged?.(payload);
  });

  channel.on('thread_stats', (payload) => {
    if (!isThreadVotePayload(payload)) return;
    getCallbacks().get(threadId)?.onVoteChanged?.(payload);
  });
}
