import { create } from 'zustand';
import type { RegisteredContact, ContactSyncStatus } from '@cgraph/shared-types';

interface ContactState {
  readonly contacts: readonly RegisteredContact[];
  readonly syncStatus: ContactSyncStatus | null;
  readonly isSyncing: boolean;
  readonly syncError: string | null;
  readonly lastSyncToken: string | null;
}

interface ContactActions {
  setContacts(contacts: readonly RegisteredContact[]): void;
  setSyncStatus(status: ContactSyncStatus): void;
  setSyncing(syncing: boolean): void;
  setSyncError(error: string | null): void;
  setSyncToken(token: string): void;
  addNewContacts(contacts: readonly RegisteredContact[]): void;
  reset(): void;
}

const INITIAL_STATE: ContactState = {
  contacts: [],
  syncStatus: null,
  isSyncing: false,
  syncError: null,
  lastSyncToken: null,
} as const;

export const useContactStore = create<ContactState & ContactActions>()((set) => ({
  ...INITIAL_STATE,

  setContacts(contacts) {
    set({ contacts });
  },

  setSyncStatus(status) {
    set({ syncStatus: status });
  },

  setSyncing(syncing) {
    set({ isSyncing: syncing });
  },

  setSyncError(error) {
    set({ syncError: error });
  },

  setSyncToken(token) {
    set({ lastSyncToken: token });
  },

  addNewContacts(newContacts) {
    set((state) => ({
      contacts: [...newContacts, ...state.contacts],
    }));
  },

  reset() {
    set(INITIAL_STATE);
  },
}));
