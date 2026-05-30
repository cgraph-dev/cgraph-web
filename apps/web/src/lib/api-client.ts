/**
 * Shared API client wired to the web platform's HTTP instance.
 *
 * All new code should import from here instead of using per-module
 * service files. The old service files are deprecated and will be
 * removed in a future migration.
 *
 * @example
 * ```ts
 * import { apiClient } from '@/lib/api-client';
 * const wallet = await apiClient.nodes.getWallet();
 * ```
 *
 * For callers that need the raw Axios instance (e.g. endpoints not yet
 * covered by the structured client), import `http` from this module:
 *
 * ```ts
 * import { http } from '@/lib/api-client';
 * const res = await http.get('/api/v1/some-endpoint');
 * ```
 */
import { createApiClient, type ApiClient } from '@cgraph-dev/api-client';
import { api } from './api'; // existing axios instance with auth + circuit breaker

export const apiClient: ApiClient = createApiClient({ http: api });
export type { ApiClient } from '@cgraph-dev/api-client';

/**
 * Raw Axios instance — use only when the structured `apiClient` does not yet
 * cover the endpoint you need. Prefer `apiClient.<namespace>.<method>()` where
 * possible; `http` is the escape hatch for endpoints pending migration.
 */
export { api, api as http } from './api';
