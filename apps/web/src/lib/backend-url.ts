const LEGACY_BACKEND_API_URL = 'https://cgraph-backend.fly.dev';
const LEGACY_BACKEND_WS_URL = 'wss://cgraph-backend.fly.dev/socket';
const PROD_BACKEND_API_URL = 'https://cgraph-backend-prod-v3.fly.dev';

function shouldUseSameOriginApiProxy(): boolean {
  return !import.meta.env.PROD;
}

function isTestRuntime(): boolean {
  return import.meta.env.MODE === 'test';
}

function isLegacyApiUrl(url: string | undefined): boolean {
  return url === LEGACY_BACKEND_API_URL || url === '/api';
}

function isLegacySocketUrl(url: string | undefined): boolean {
  return url === LEGACY_BACKEND_WS_URL;
}

function normalizeBackendBaseUrl(url: string | undefined): string | null {
  const trimmedUrl = url?.trim();

  if (!trimmedUrl || isLegacyApiUrl(trimmedUrl)) {
    return null;
  }

  return trimmedUrl.endsWith('/') ? trimmedUrl.slice(0, -1) : trimmedUrl;
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
  const envUrl = import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_WS_URL;

  if (envUrl !== undefined && envUrl !== '' && !isLegacySocketUrl(envUrl)) {
    return envUrl;
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/socket`;
  }

  return 'ws://localhost:4000/socket';
}
