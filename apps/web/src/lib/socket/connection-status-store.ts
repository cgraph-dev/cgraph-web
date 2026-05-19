/**
 * Connection status store for the global Phoenix socket.
 *
 * Mirrors the underlying socket lifecycle into a React-readable Zustand
 * external store so UI surfaces (banners, toasts, reconnect prompts) can react
 * without polling. The `paused` state is reached when the circuit
 * breaker trips after the configured cap of consecutive failures —
 * users can manually resume via the ReconnectBanner or the connection
 * is auto-resumed on `online` / `visibilitychange`.
 */
import { useSyncExternalStore } from 'react';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'paused';

interface ConnectionStatusState {
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
}

type ConnectionStatusSelector<T> = (state: ConnectionStatusState) => T;
type ConnectionStatusStoreHook = {
  <T>(selector: ConnectionStatusSelector<T>): T;
  getState: () => ConnectionStatusState;
};

const listeners = new Set<() => void>();

let state: ConnectionStatusState = {
  status: 'disconnected',
  setStatus,
};

function setStatus(status: ConnectionStatus): void {
  if (state.status === status) {
    return;
  }

  state = { ...state, status };
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ConnectionStatusState {
  return state;
}

export const useConnectionStatusStore: ConnectionStatusStoreHook = Object.assign(
  function useConnectionStatusStore<T>(selector: ConnectionStatusSelector<T>): T {
    return useSyncExternalStore(
      subscribe,
      () => selector(getSnapshot()),
      () => selector(getSnapshot())
    );
  },
  { getState: getSnapshot }
);

/** Imperative setter for use from non-React code (socket lifecycle). */
export function setConnectionStatus(status: ConnectionStatus): void {
  setStatus(status);
}
