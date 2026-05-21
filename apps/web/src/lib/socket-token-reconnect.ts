type SocketTokenReconnectHandler = () => Promise<void> | void;

let reconnectHandler: SocketTokenReconnectHandler | null = null;

/** Registers the socket layer callback used after auth token refreshes. */
export function registerSocketTokenReconnectHandler(handler: SocketTokenReconnectHandler): void {
  reconnectHandler = handler;
}

/** Reconnects realtime sockets once the API client has refreshed credentials. */
export async function reconnectSocketWithFreshToken(): Promise<void> {
  await reconnectHandler?.();
}
