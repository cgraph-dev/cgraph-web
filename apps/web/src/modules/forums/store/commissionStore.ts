/**
 * Commission Store — Zustand store for commission board state.
 *
 * Manages commission listing, selected commission, and action states.
 * Uses cursor-based pagination matching the backend API.
 *
 */

import { create } from 'zustand';
import {
  commissionService,
  type Commission,
  type CommissionStatus,
  type CommissionListMeta,
} from '../services/commission-service';

interface CommissionState {
  readonly commissions: readonly Commission[];
  readonly selectedCommission: Commission | null;
  readonly meta: CommissionListMeta;
  readonly statusFilter: CommissionStatus | null;
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly isActing: boolean;
  readonly error: string | null;
}

interface CommissionActions {
  fetchCommissions(
    forumId: string,
    boardId: string,
    status?: CommissionStatus | null
  ): Promise<void>;
  fetchMore(forumId: string, boardId: string): Promise<void>;
  fetchCommission(forumId: string, boardId: string, commissionId: string): Promise<void>;
  createCommission(
    forumId: string,
    boardId: string,
    data: { title: string; description?: string; bounty_nodes: number }
  ): Promise<Commission | null>;
  claimCommission(forumId: string, boardId: string, commissionId: string): Promise<boolean>;
  startWork(forumId: string, boardId: string, commissionId: string): Promise<boolean>;
  deliverCommission(forumId: string, boardId: string, commissionId: string): Promise<boolean>;
  acceptCommission(forumId: string, boardId: string, commissionId: string): Promise<boolean>;
  disputeCommission(
    forumId: string,
    boardId: string,
    commissionId: string,
    reason: string
  ): Promise<boolean>;
  cancelCommission(forumId: string, boardId: string, commissionId: string): Promise<boolean>;
  setStatusFilter(status: CommissionStatus | null): void;
  clearSelected(): void;
  reset(): void;
}

type CommissionStore = CommissionState & CommissionActions;

const INITIAL_STATE: CommissionState = {
  commissions: [],
  selectedCommission: null,
  meta: { has_more: false, cursor: null },
  statusFilter: null,
  isLoading: false,
  isLoadingMore: false,
  isActing: false,
  error: null,
};

function replaceInList(list: readonly Commission[], updated: Commission): readonly Commission[] {
  return list.map((c) => (c.id === updated.id ? updated : c));
}

export const useCommissionStore = create<CommissionStore>((set, get) => ({
  ...INITIAL_STATE,

  async fetchCommissions(forumId, boardId, status) {
    set({ isLoading: true, error: null, statusFilter: status ?? null });
    try {
      const { data } = await commissionService.list(forumId, boardId, {
        status: status ?? undefined,
      });
      set({
        commissions: data.data,
        meta: data.meta,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false, error: 'Failed to load commissions' });
    }
  },

  async fetchMore(forumId, boardId) {
    const { meta, statusFilter } = get();
    if (!meta.cursor || !meta.has_more) return;

    set({ isLoadingMore: true });
    try {
      const { data } = await commissionService.list(forumId, boardId, {
        status: statusFilter ?? undefined,
        cursor: meta.cursor ?? undefined,
      });
      set((s) => ({
        commissions: [...s.commissions, ...data.data],
        meta: data.meta,
        isLoadingMore: false,
      }));
    } catch {
      set({ isLoadingMore: false });
    }
  },

  async fetchCommission(forumId, boardId, commissionId) {
    set({ isLoading: true, error: null });
    try {
      const { data } = await commissionService.get(forumId, boardId, commissionId);
      set({ selectedCommission: data.data, isLoading: false });
    } catch {
      set({ isLoading: false, error: 'Commission not found' });
    }
  },

  async createCommission(forumId, boardId, data) {
    set({ isActing: true, error: null });
    try {
      const { data: res } = await commissionService.create(forumId, boardId, data);
      const created = res.data;
      set((s) => ({
        commissions: [created, ...s.commissions],
        isActing: false,
      }));
      return created;
    } catch {
      set({ isActing: false, error: 'Failed to create commission' });
      return null;
    }
  },

  async claimCommission(forumId, boardId, commissionId) {
    return performAction(set, get, () => commissionService.claim(forumId, boardId, commissionId));
  },

  async startWork(forumId, boardId, commissionId) {
    return performAction(set, get, () =>
      commissionService.startWork(forumId, boardId, commissionId)
    );
  },

  async deliverCommission(forumId, boardId, commissionId) {
    return performAction(set, get, () => commissionService.deliver(forumId, boardId, commissionId));
  },

  async acceptCommission(forumId, boardId, commissionId) {
    return performAction(set, get, () => commissionService.accept(forumId, boardId, commissionId));
  },

  async disputeCommission(forumId, boardId, commissionId, reason) {
    return performAction(set, get, () =>
      commissionService.dispute(forumId, boardId, commissionId, reason)
    );
  },

  async cancelCommission(forumId, boardId, commissionId) {
    return performAction(set, get, () => commissionService.cancel(forumId, boardId, commissionId));
  },

  setStatusFilter(status) {
    set({ statusFilter: status });
  },

  clearSelected() {
    set({ selectedCommission: null });
  },

  reset() {
    set(INITIAL_STATE);
  },
}));

/** Shared action handler — calls API, updates list + selected. */
async function performAction(
  set: (partial: Partial<CommissionStore>) => void,
  getState: () => CommissionStore,
  action: () => Promise<{ data: { data: Commission } }>
): Promise<boolean> {
  set({ isActing: true, error: null });
  try {
    const { data: res } = await action();
    const updated = res.data;
    const current = getState();
    set({
      commissions: replaceInList(current.commissions, updated),
      selectedCommission:
        current.selectedCommission?.id === updated.id ? updated : current.selectedCommission,
      isActing: false,
    });
    return true;
  } catch {
    set({ isActing: false, error: 'Action failed' });
    return false;
  }
}
