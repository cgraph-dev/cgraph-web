/**
 * API client configuration and base utilities.
 */
import { createHttpClient, extractApiError } from '@cgraph-dev/utils';
import {
  getAccessToken,
  getRefreshToken,
  setTokens as setTokensInStore,
  triggerLogout,
} from './tokenService';
import { getApiBaseUrl } from './backend-url';
import { APP_VERSION } from './app-version';
import { reconnectSocketWithFreshToken } from './socket-token-reconnect';
import { createLogger } from '@/lib/logger';

const logger = createLogger('API');
const isE2EAuthBypass = import.meta.env.VITE_E2E_AUTH_BYPASS === 'true';

/**
 * API URL Configuration
 *
 * PRODUCTION (Vercel): Uses relative paths with rewrites
 * - VITE_API_URL is empty or '/api' - rewrites handle routing
 *
 * DEVELOPMENT: Uses full backend URL
 * - Vite proxy handles /api -> localhost:4000
 *
 * The API endpoints should NOT include /api prefix as it's part of the base URL
 */
// Empty string means "use relative paths" for Vercel rewrites.
const API_URL = getApiBaseUrl();

// Socket reconnects are registered by the socket module when it is loaded.
// This keeps the HTTP client free of a socket import cycle.
async function reconnectSocket(): Promise<void> {
  try {
    await reconnectSocketWithFreshToken();
  } catch (err) {
    logger.warn('Socket reconnect failed:', err);
  }
}

/**
 * HTTP Client Instance
 *
 * CIRCULAR DEPENDENCY FIX:
 * - Previously imported useAuthStore directly, causing initialization race condition
 * - Now uses tokenService.ts which provides lazy-bound token accessors
 * - authStore registers its handlers with tokenService on initialization
 * - This breaks the circular dependency: api.ts -> tokenService.ts (no store import)
 *
 * PRODUCTION BUILD:
 * - The "Cannot access 'Ct' before initialization" error was caused by the circular import
 * - 'Ct' is the minified name of useAuthStore in the production bundle
 * - This refactor ensures api.ts can initialize before authStore without errors
 */
export const api = createHttpClient({
  baseURL: API_URL,
  timeoutMs: 30000,
  defaultHeaders: {
    'X-Client-Version': APP_VERSION,
    'X-Client-Platform': 'web',
  },
  withCredentials: true,
  getAccessToken: () => getAccessToken(),
  getRefreshToken: () => getRefreshToken(),
  setTokens: async ({ accessToken, refreshToken }) => {
    setTokensInStore({ accessToken, refreshToken: refreshToken ?? null });
    reconnectSocket();
  },
  onLogout: async () => {
    await triggerLogout();
    if (isE2EAuthBypass) {
      return;
    }
    window.location.href = '/login';
  },
  refresh: {
    endpoint: '/api/v1/auth/refresh',
    // Web sessions are cookie-owned. Do not send the JS-stored refresh token
    // in the body: if that copy is stale after rotation, the backend must use
    // the current httpOnly cookie instead of treating the old token as reuse.
    buildBody: () => ({}),
    withCredentials: true,
    parseTokens: (data: unknown) => {
      // Type-safe parsing of refresh token response — resolve nested or flat shapes
      const obj = data !== null && typeof data === 'object' ? data : {};
      const nested =
        'data' in obj &&
        obj.data !== null &&
        typeof obj.data === 'object' &&
        'tokens' in obj.data &&
        obj.data.tokens !== null &&
        typeof obj.data.tokens === 'object'
          ? obj.data.tokens
          : null;
      const fromTokensField =
        !nested && 'tokens' in obj && obj.tokens !== null && typeof obj.tokens === 'object'
          ? obj.tokens
          : null;
      const payload = nested ?? fromTokensField ?? obj;
      const accessToken =
        ('access_token' in payload && typeof payload.access_token === 'string'
          ? payload.access_token
          : null) ??
        ('token' in payload && typeof payload.token === 'string' ? payload.token : null) ??
        '';
      const refreshToken =
        'refresh_token' in payload && typeof payload.refresh_token === 'string'
          ? payload.refresh_token
          : undefined;
      return { accessToken, refreshToken };
    },
  },
  retry: {
    attempts: 3,
    backoffMs: 400,
    maxBackoffMs: 5000,
  },
  idempotency: {
    enabled: true,
  },
});

/**
 */
/**
 * Retrieves error message.
 *
 * @param error - The error instance.
 * @returns The error message.
 */
export function getErrorMessage(error: unknown): string {
  const info = extractApiError(error);
  return info.message;
}
