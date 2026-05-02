/**
 * Thread & Post Moderation Action Hooks
 *
 * Hooks for individual thread and post moderation actions.
 *
 */

import { useModerationStore } from '../store';

/**
 * Hook for thread moderation actions
 */
export function useThreadModeration() {
  const {
    closeThread,
    reopenThread,
    softDeleteThread,
    restoreThread,
    moveThread,
    splitThread,
    mergeThreads,
    copyThread,
    approveThread,
    unapproveThread,
  } = useModerationStore();

  async function lock(threadId: string, reason?: string) {
    await closeThread(threadId, reason);
  }

  async function unlock(threadId: string) {
    await reopenThread(threadId);
  }

  async function move(threadId: string, targetForumId: string, leaveRedirect?: boolean) {
    return await moveThread(threadId, targetForumId, leaveRedirect);
  }

  async function remove(threadId: string, reason?: string) {
    await softDeleteThread(threadId, reason);
  }

  async function restore(threadId: string) {
    await restoreThread(threadId);
  }

  async function split(
    threadId: string,
    postIds: string[],
    newTitle: string,
    targetForumId?: string
  ) {
    return await splitThread(threadId, postIds, newTitle, targetForumId);
  }

  async function merge(
    sourceThreadId: string,
    targetThreadId: string,
    mergePolls?: boolean
  ) {
    return await mergeThreads(sourceThreadId, targetThreadId, mergePolls);
  }

  async function copy(threadId: string, targetForumId: string) {
    return await copyThread(threadId, targetForumId);
  }

  async function approve(threadId: string) {
    await approveThread(threadId);
  }

  async function unapprove(threadId: string) {
    await unapproveThread(threadId);
  }

  return {
    lock,
    unlock,
    move,
    delete: remove,
    restore,
    split,
    merge,
    copy,
    approve,
    unapprove,
  };
}

/**
 * Hook for post moderation actions
 */
export function usePostModeration() {
  const { approvePost, unapprovePost, softDeletePost, restorePost, movePost } =
    useModerationStore();

  async function approve(postId: string) {
    await approvePost(postId);
  }

  async function unapprove(postId: string) {
    await unapprovePost(postId);
  }

  async function remove(postId: string, reason?: string) {
    await softDeletePost(postId, reason);
  }

  async function restore(postId: string) {
    await restorePost(postId);
  }

  async function move(postId: string, targetThreadId: string) {
    await movePost(postId, targetThreadId);
  }

  return {
    approve,
    unapprove,
    delete: remove,
    restore,
    move,
  };
}
