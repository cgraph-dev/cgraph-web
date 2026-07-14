const LEGACY_BACKEND_API_URL = 'https://cgraph-backend.fly.dev';
const LEGACY_BACKEND_WS_URL = 'wss://cgraph-backend.fly.dev/socket';
const RETIRED_BACKEND_API_URL = 'https://cgraph-backend-prod-v2.fly.dev';
const RETIRED_BACKEND_WS_URL = 'wss://cgraph-backend-prod-v2.fly.dev';
const RETIRED_BACKEND_SOCKET_URL = `${RETIRED_BACKEND_WS_URL}/socket`;
const PROD_BACKEND_API_URL = 'https://cgraph-backend-prod-v3.fly.dev';
const PROD_BACKEND_SOCKET_URL = 'wss://cgraph-backend-prod-v3.fly.dev/socket';

function shouldUseSameOriginApiProxy(): boolean {
  return !import.meta.env.PROD;
}

function isTestRuntime(): boolean {
  return import.meta.env.MODE === 'test';
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function isRetiredApiUrl(url: string): boolean {
  return url === LEGACY_BACKEND_API_URL || url === RETIRED_BACKEND_API_URL || url === '/api';
}

function isRetiredSocketUrl(url: string): boolean {
  return (
    url === LEGACY_BACKEND_WS_URL ||
    url === RETIRED_BACKEND_WS_URL ||
    url === RETIRED_BACKEND_SOCKET_URL
  );
}

function normalizeBackendBaseUrl(url: string | undefined): string | null {
  const trimmedUrl = url?.trim();

  if (!trimmedUrl) {
    return null;
  }

  const normalizedUrl = stripTrailingSlash(trimmedUrl);

  if (isRetiredApiUrl(normalizedUrl)) {
    return null;
  }

  return normalizedUrl;
}

function normalizeSocketUrl(url: string | undefined): string | null {
  const trimmedUrl = url?.trim();

  if (!trimmedUrl) {
    return null;
  }

  const normalizedUrl = stripTrailingSlash(trimmedUrl);

  if (isRetiredSocketUrl(normalizedUrl)) {
    return null;
  }

  return normalizedUrl;
}

/** Resolve the API base URL for the current runtime. */
export function getApiBaseUrl(): string {
  const envUrl = normalizeBackendBaseUrl(import.meta.env.VITE_API_URL);

  if (envUrl) {
    return envUrl;
  }

  return shouldUseSameOriginApiProxy() ? '' : '';
}

/** Resolve the media base URL for the current runtime. */
export function getMediaBaseUrl(): string {
  const envUrl = normalizeBackendBaseUrl(import.meta.env.VITE_API_URL);

  if (envUrl) {
    return envUrl;
  }

  if (shouldUseSameOriginApiProxy()) {
    if (isTestRuntime()) {
      return '';
    }

    return normalizeBackendBaseUrl(import.meta.env.VITE_DEV_API_TARGET) ?? '';
  }

  return PROD_BACKEND_API_URL;
}

/** Resolve the Phoenix socket URL for the current runtime. */
export function getSocketUrl(): string {
  const envUrl =
    normalizeSocketUrl(import.meta.env.VITE_SOCKET_URL) ??
    normalizeSocketUrl(import.meta.env.VITE_WS_URL);

  if (envUrl) {
    return envUrl;
  }

  if (import.meta.env.PROD) {
    return PROD_BACKEND_SOCKET_URL;
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/socket`;
  }

  return 'ws://localhost:4000/socket';
}
