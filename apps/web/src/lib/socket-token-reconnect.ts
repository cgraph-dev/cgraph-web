type SocketTokenReconnectHandler = () => Promise<void> | void;

let reconnectHandler: SocketTokenReconnectHandler | null = null;

export function registerSocketTokenReconnectHandler(handler: SocketTokenReconnectHandler): void {
  reconnectHandler = handler;
}

export async function reconnectSocketWithFreshToken(): Promise<void> {
  await reconnectHandler?.();
}
