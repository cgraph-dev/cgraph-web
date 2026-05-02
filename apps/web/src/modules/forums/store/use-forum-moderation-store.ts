/**
 * Forum *moderation* slice — mod queue, reports, bans, warnings,
 * thread lock/move/merge, automod config.
 *
 * Thin selector hook over the canonical `useForumStore` (plan #19,
 * Option A). Once every moderation consumer routes through this hook
 * the underlying impl can be lifted into its own store.
 */
import { useForumStore } from './forumStore';
import type {
  Ban,
  CreateBanData,
  CreateReportData,
  ModerationQueueItem,
  Report,
  UserWarning,
} from './forumStore.types';

export interface ForumModerationSliceState {
  readonly moderationQueue: readonly ModerationQueueItem[];
  readonly reports: readonly Report[];

  pinPost: (forumId: string, postId: string) => Promise<void>;
  unpinPost: (forumId: string, postId: string) => Promise<void>;
  lockPost: (forumId: string, postId: string) => Promise<void>;
  unlockPost: (forumId: string, postId: string) => Promise<void>;
  deletePost: (forumId: string, postId: string) => Promise<void>;
  moveThread: (threadId: string, targetForumId: string) => Promise<void>;
  splitThread: (threadId: string, postIds: string[], newTitle: string) => Promise<void>;
  mergeThreads: (sourceThreadId: string, targetThreadId: string) => Promise<void>;
  closeThread: (threadId: string) => Promise<void>;
  reopenThread: (threadId: string) => Promise<void>;
  warnUser: (userId: string, warningTypeId: string, reason: string) => Promise<UserWarning>;
  fetchUserWarnings: (userId: string) => Promise<readonly UserWarning[]>;
  banUser: (data: CreateBanData) => Promise<Ban>;
  unbanUser: (banId: string) => Promise<void>;
  fetchBans: () => Promise<readonly Ban[]>;
  fetchModerationQueue: () => Promise<void>;
  approveQueueItem: (itemId: string) => Promise<void>;
  rejectQueueItem: (itemId: string, reason?: string) => Promise<void>;
  reportItem: (data: CreateReportData) => Promise<Report>;
  fetchReports: (status?: Report['status']) => Promise<readonly Report[]>;
  assignReport: (reportId: string, moderatorId: string) => Promise<void>;
  resolveReport: (reportId: string, resolution: string) => Promise<void>;
  fetchForumModQueue: (forumId: string, status?: string) => Promise<readonly ModerationQueueItem[]>;
  takeForumModAction: (
    forumId: string,
    postId: string,
    action: 'approve' | 'remove' | 'hide'
  ) => Promise<void>;
  fetchForumAutomod: (forumId: string) => Promise<Record<string, unknown>>;
  updateForumAutomod: (
    forumId: string,
    config: Record<string, unknown>
  ) => Promise<Record<string, unknown>>;
  fetchForumModStats: (forumId: string) => Promise<Record<string, unknown>>;
}

const selectModSlice = (
  s: ReturnType<typeof useForumStore.getState>
): ForumModerationSliceState => ({
  moderationQueue: s.moderationQueue,
  reports: s.reports,
  pinPost: s.pinPost,
  unpinPost: s.unpinPost,
  lockPost: s.lockPost,
  unlockPost: s.unlockPost,
  deletePost: s.deletePost,
  moveThread: s.moveThread,
  splitThread: s.splitThread,
  mergeThreads: s.mergeThreads,
  closeThread: s.closeThread,
  reopenThread: s.reopenThread,
  warnUser: s.warnUser,
  fetchUserWarnings: s.fetchUserWarnings,
  banUser: s.banUser,
  unbanUser: s.unbanUser,
  fetchBans: s.fetchBans,
  fetchModerationQueue: s.fetchModerationQueue,
  approveQueueItem: s.approveQueueItem,
  rejectQueueItem: s.rejectQueueItem,
  reportItem: s.reportItem,
  fetchReports: s.fetchReports,
  assignReport: s.assignReport,
  resolveReport: s.resolveReport,
  fetchForumModQueue: s.fetchForumModQueue,
  takeForumModAction: s.takeForumModAction,
  fetchForumAutomod: s.fetchForumAutomod,
  updateForumAutomod: s.updateForumAutomod,
  fetchForumModStats: s.fetchForumModStats,
});

/**
 * Selector hook returning the moderation-only slice of the forum store.
 */
export function useForumModerationStore(): ForumModerationSliceState {
  return useForumStore(selectModSlice);
}
