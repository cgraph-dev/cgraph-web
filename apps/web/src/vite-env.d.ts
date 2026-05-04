/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_SOCKET_URL: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_ENABLE_QUERY_CACHE_PERSISTENCE?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ENABLE_SENTRY?: string;
  readonly VITE_ENABLE_LOGGING?: string;
  readonly VITE_LIVEKIT_URL?: string;
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string;
  readonly VITE_OTEL_TRACE_ENDPOINT?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_TURNSTILE_SITE_KEY?: string;
  readonly VITE_TURN_CREDENTIAL?: string;
  readonly VITE_TURN_URL?: string;
  readonly VITE_TURN_USERNAME?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  readonly VITE_WC_PROJECT_ID?: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(eventName: string, callback: (...args: unknown[]) => void): void;
  removeListener?(eventName: string, callback: (...args: unknown[]) => void): void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

declare module 'phoenix' {
  export class Socket {
    constructor(
      endPoint: string,
      opts?: {
        params?: Record<string, unknown> | (() => Record<string, unknown>);
        transport?: unknown;
        timeout?: number;
        heartbeatIntervalMs?: number;
        longpollerTimeout?: number;
        binaryType?: string;
        logger?: (kind: string, msg: string, data: unknown) => void;
        reconnectAfterMs?: (tries: number) => number;
        rejoinAfterMs?: (tries: number) => number;
        vsn?: string;
      }
    );
    connect(): void;
    disconnect(callback?: () => void, code?: number, reason?: string): void;
    isConnected(): boolean;
    connectionState(): string;
    channel(topic: string, chanParams?: Record<string, unknown>): Channel;
    onOpen(callback: () => void): number;
    onClose(callback: () => void): number;
    onError(callback: (error: unknown) => void): number;
    onMessage(callback: (msg: Record<string, unknown>) => void): number;
    remove(channel: Channel): void;
    push(data: unknown): void;
    protocol(): string;
    endPointURL(): string;
  }

  export class Channel {
    constructor(topic: string, params?: Record<string, unknown>, socket?: Socket);
    join(timeout?: number): Push;
    leave(timeout?: number): Push;
    push(event: string, payload?: Record<string, unknown>, timeout?: number): Push;
    on(
      event: string,
      callback: (payload?: unknown, ref?: string, joinRef?: string) => void
    ): number;
    onMessage(event: string, payload: unknown, ref?: string): unknown;
    off(event: string, ref?: number): void;
    onClose(callback: (payload?: unknown, ref?: string, joinRef?: string) => void): void;
    onError(callback: (reason?: string) => void): void;
    rejoin(timeout?: number): void;
    isMember(topic: string, event: string, payload?: unknown, joinRef?: string): boolean;
    topic: string;
    state: string;
  }

  export class Push {
    constructor(
      channel: Channel,
      event: string,
      payload?: Record<string, unknown>,
      timeout?: number
    );
    resend(timeout: number): void;
    send(): void;
    receive(status: string, callback: (response?: unknown) => void): Push;
  }

  export class Presence {
    constructor(
      channel: Channel,
      opts?: {
        events?: {
          state: string;
          diff: string;
        };
      }
    );
    onJoin(callback: (key: string, current: unknown, newPres: unknown) => void): void;
    onLeave(callback: (key: string, current: unknown, leftPres: unknown) => void): void;
    onSync(callback: () => void): void;
    list<T>(chooser?: (key: string, pres: unknown) => T): T[];
    inPendingSyncState(): boolean;
    static syncState<T>(
      currentState: Record<string, T>,
      newState: Record<string, unknown>,
      onJoin?: (key: string, current: T | undefined, newPres: unknown) => void,
      onLeave?: (key: string, current: T | undefined, leftPres: unknown) => void
    ): Record<string, T>;
    static syncDiff<T>(
      currentState: Record<string, T>,
      diff: { joins?: Record<string, unknown>; leaves?: Record<string, unknown> },
      onJoin?: (key: string, current: T | undefined, newPres: unknown) => void,
      onLeave?: (key: string, current: T | undefined, leftPres: unknown) => void
    ): Record<string, T>;
    static list<T>(
      presences: Record<string, unknown>,
      chooser?: (key: string, pres: unknown) => T
    ): T[];
  }

  export const Serializer: {
    encode(msg: unknown, callback: (encoded: string) => void): void;
    decode(rawPayload: string, callback: (decoded: unknown) => void): void;
  };

  export class LongPoll {
    constructor(endPoint: string);
    normalizeEndpoint(endPoint: string): string;
    endpointURL(): string;
    closeAndRetry(): void;
    ontimeout(): void;
    poll(): void;
    send(body: string): void;
    close(code?: number, reason?: string): void;
  }

  export const Ajax: {
    request(
      method: string,
      endPoint: string,
      accept: string,
      body: string,
      timeout: number,
      ontimeout: () => void,
      callback: (response: unknown) => void
    ): void;
    xdomainRequest(
      req: unknown,
      method: string,
      endPoint: string,
      body: string,
      timeout: number,
      ontimeout: () => void,
      callback: (response: unknown) => void
    ): void;
    xhrRequest(
      req: unknown,
      method: string,
      endPoint: string,
      accept: string,
      body: string,
      timeout: number,
      ontimeout: () => void,
      callback: (response: unknown) => void
    ): void;
    parseJSON(resp: string): unknown;
    serialize(obj: Record<string, unknown>, parentKey?: string): string;
    appendParams(url: string, params: Record<string, unknown>): string;
  };
}
