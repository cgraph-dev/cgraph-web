import { create } from 'zustand';
import type { MessageRequestStatus } from '@cgraph/shared-types';

interface MessageRequestState {
  /** Map of conversation_id to request status. */
  readonly requestStates: Readonly<Record<string, MessageRequestStatus>>;
  /** Currently processing action for a conversation. */
  readonly processingAction: string | null;
  /** Error from last action. */
  readonly actionError: string | null;
}

interface MessageRequestActions {
  /** Set the message request status for a conversation. */
  setRequestState(conversationId: string, status: MessageRequestStatus): void;
  /** Remove the request state entry for a conversation. */
  removeRequestState(conversationId: string): void;
  /** Mark a conversation as currently processing an action. */
  setProcessingAction(conversationId: string | null): void;
  /** Set an error message from the last action. */
  setActionError(error: string | null): void;
  /** Reset all state. */
  reset(): void;
}

const INITIAL_STATE: MessageRequestState = {
  requestStates: {},
  processingAction: null,
  actionError: null,
} as const;

export const useMessageRequestStore = create<
  MessageRequestState & MessageRequestActions
>()((set) => ({
  ...INITIAL_STATE,

  setRequestState(conversationId, status) {
    set((state) => ({
      requestStates: { ...state.requestStates, [conversationId]: status },
    }));
  },

  removeRequestState(conversationId) {
    set((state) => {
      const next = { ...state.requestStates };
      delete next[conversationId];
      return { requestStates: next };
    });
  },

  setProcessingAction(conversationId) {
    set({ processingAction: conversationId });
  },

  setActionError(error) {
    set({ actionError: error });
  },

  reset() {
    set(INITIAL_STATE);
  },
}));
