import { create } from 'zustand';
import { apiClient, http } from '@/lib/api-client';
import { mapBoardFromApi } from './forumHosting-mappers';
import {
  createThreadActions,
  createPostActions,
  createMemberActions,
} from './forumHosting-actions';

// Types
export type {
  Board,
  Thread,
  ThreadPost,
  ThreadAuthor,
  Forum,
  ForumMember,
  PaginationMeta,
  CreateBoardData,
  CreateThreadData,
  CreatePostData,
  UpdatePostData,
  ThreadListOptions,
  PostListOptions,
  MemberListOptions,
  ForumHostingState,
} from './forumHostingStore.types';

import type { CreateBoardData, ForumHostingState } from './forumHostingStore.types';
// Store Implementation
export const useForumHostingStore = create<ForumHostingState>((set) => ({
  boards: [],
  currentBoard: null,
  isLoadingBoards: false,

  threads: [],
  currentThread: null,
  threadsMeta: null,
  isLoadingThreads: false,

  posts: [],
  postsMeta: null,
  isLoadingPosts: false,

  members: [],
  membersMeta: null,
  isLoadingMembers: false,
  // Boards
  fetchBoards: async (forumId: string) => {
    set({ isLoadingBoards: true });
    try {
      const result = await apiClient.forums.listBoards(forumId);
      if (!result.ok) throw new Error(result.error.message);
      const boards = Array.from(result.data).map(mapBoardFromApi);
      set({ boards, isLoadingBoards: false });
    } catch (error) {
      set({ isLoadingBoards: false });
      throw error;
    }
  },

  fetchBoard: async (boardId: string) => {
    const response = await http.get(`/api/v1/boards/${boardId}`);
    const board = mapBoardFromApi(response.data.data);
    set({ currentBoard: board });
    return board;
  },

  createBoard: async (forumId: string, data: CreateBoardData) => {
    const result = await apiClient.forums.createBoard(forumId, {
      board: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        position: data.position,
        parent_board_id: data.parentBoardId,
      },
    });
    if (!result.ok) throw new Error(result.error.message);
    const board = mapBoardFromApi(result.data);
    const MAX_BOARDS = 200;
    set((state) => ({ boards: [...state.boards, board].slice(-MAX_BOARDS) }));
    return board;
  },

  updateBoard: async (forumId: string, boardId: string, data: Partial<CreateBoardData>) => {
    const result = await apiClient.forums.updateBoard(forumId, boardId, {
      board: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        position: data.position,
        parent_board_id: data.parentBoardId,
      },
    });
    if (!result.ok) throw new Error(result.error.message);
    const board = mapBoardFromApi(result.data);
    set((state) => ({
      boards: state.boards.map((b) => (b.id === boardId ? board : b)),
    }));
    return board;
  },

  deleteBoard: async (forumId: string, boardId: string) => {
    const result = await apiClient.forums.deleteBoard(forumId, boardId);
    if (!result.ok) throw new Error(result.error.message);
    set((state) => ({
      boards: state.boards.filter((b) => b.id !== boardId),
    }));
  },
  // Threads, Posts, Members (delegated to action slices)
  ...createThreadActions(set),
  ...createPostActions(set),
  ...createMemberActions(set),

  reset: () =>
    set({
      boards: [],
      currentBoard: null,
      isLoadingBoards: false,
      threads: [],
      currentThread: null,
      threadsMeta: null,
      isLoadingThreads: false,
      posts: [],
      postsMeta: null,
      isLoadingPosts: false,
      members: [],
      membersMeta: null,
      isLoadingMembers: false,
    }),
}));
