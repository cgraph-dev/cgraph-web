const LEGACY_BACKEND_API_URL = 'https://cgraph-backend.fly.dev';
const LEGACY_BACKEND_WS_URL = 'wss://cgraph-backend.fly.dev/socket';
const PROD_BACKEND_API_URL = 'https://cgraph-backend-prod-v2.fly.dev';

function shouldUseSameOriginApiProxy(): boolean {
  return !import.meta.env.PROD;
}

function isLegacyApiUrl(url: string | undefined): boolean {
  return url === LEGACY_BACKEND_API_URL || url === '/api';
}

function isLegacySocketUrl(url: string | undefined): boolean {
  return url === LEGACY_BACKEND_WS_URL;
}

/** Resolve the API base URL for the current runtime. */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;

  if (envUrl !== undefined && envUrl !== '' && !isLegacyApiUrl(envUrl)) {
    return envUrl;
  }

  return shouldUseSameOriginApiProxy() ? '' : '';
}

/** Resolve the media base URL for the current runtime. */
export function getMediaBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;

  if (envUrl !== undefined && envUrl !== '' && !isLegacyApiUrl(envUrl)) {
    return envUrl;
  }

  return shouldUseSameOriginApiProxy() ? '' : PROD_BACKEND_API_URL;
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
