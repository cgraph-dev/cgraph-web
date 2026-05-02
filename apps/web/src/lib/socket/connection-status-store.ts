/**
 * Connection status store for the global Phoenix socket.
 *
 * Mirrors the underlying socket lifecycle into a React-readable Zustand
 * store so UI surfaces (banners, toasts, reconnect prompts) can react
 * without polling. The `paused` state is reached when the circuit
 * breaker trips after the configured cap of consecutive failures —
 * users can manually resume via the ReconnectBanner or the connection
 * is auto-resumed on `online` / `visibilitychange`.
 */
import { create } from 'zustand';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'paused';

interface ConnectionStatusState {
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
}

export const useConnectionStatusStore = create<ConnectionStatusState>((set) => ({
  status: 'disconnected',
  setStatus: (status) => set({ status }),
}));

/** Imperative setter for use from non-React code (socket lifecycle). */
export function setConnectionStatus(status: ConnectionStatus): void {
  useConnectionStatusStore.getState().setStatus(status);
}
