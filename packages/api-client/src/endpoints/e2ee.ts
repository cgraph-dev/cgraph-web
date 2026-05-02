/**
 * E2EE endpoints.
 *
 * Transport-only — makes HTTP requests for key management and returns typed
 * results. Does NOT perform crypto operations, store keys, or manage ratchet
 * state. That responsibility belongs to platform code (packages/crypto,
 * web lib/crypto, mobile lib/crypto).
 *
 * Endpoints under /api/v1/e2ee.
 */
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import {
  BootstrapStatusSchema,
  KeyRegistrationResponseSchema,
  PrekeyBundleSchema,
  PrekeyCountSchema,
  ReplenishKeysResponseSchema,
  DeviceListSchema,
  RemoveDeviceResponseSchema,
  SafetyNumberSchema,
  KeyVerifyResponseSchema,
  KeyRevokeResponseSchema,
  KeyBackupStoreResponseSchema,
  KeyBackupGetResponseSchema,
  CrossSignResponseSchema,
  DeviceTrustChainSchema,
  SyncPackageResponseSchema,
  SyncPackagesListSchema,
} from '../schemas/e2ee';
import type {
  BootstrapStatus,
  KeyRegistrationResponse,
  PrekeyBundle,
  PrekeyCount,
  ReplenishKeysResponse,
  DeviceList,
  RemoveDeviceResponse,
  SafetyNumber,
  KeyVerifyResponse,
  KeyRevokeResponse,
  KeyBackupStoreResponse,
  KeyBackupGetResponse,
  CrossSignResponse,
  DeviceTrustChain,
  SyncPackageResponse,
  SyncPackagesList,
} from '../schemas/e2ee';

export type {
  BootstrapStatus,
  KeyRegistrationResponse,
  PrekeyBundle,
  PrekeyCount,
  ReplenishKeysResponse,
  DeviceList,
  RemoveDeviceResponse,
  SafetyNumber,
  KeyVerifyResponse,
  KeyRevokeResponse,
  KeyBackupStoreResponse,
  KeyBackupGetResponse,
  CrossSignResponse,
  DeviceTrustChain,
  SyncPackageResponse,
  SyncPackagesList,
};

/** One-time prekey entry: [keyId, base64PublicKey] */
export type OneTimePrekey = readonly [number, string];

export interface RegisterKeysParams {
  /** Base64-encoded Ed25519 identity public key (32 bytes). */
  readonly identity_key: string;
  /** Unique identifier for this device. */
  readonly device_id: string;
  /** Base64-encoded X25519 signed prekey (32 bytes). */
  readonly signed_prekey: string;
  /** Base64-encoded signature over the signed prekey (64 bytes). */
  readonly prekey_signature: string;
  /** Numeric ID for the signed prekey. */
  readonly prekey_id: number;
  /** Initial batch of one-time prekeys — each entry is [keyId, base64Key]. */
  readonly one_time_prekeys?: ReadonlyArray<OneTimePrekey>;
}

export interface StoreKeyBackupParams {
  /** Device ID for which the backup is being stored. */
  readonly device_id: string;
  /** Base64-encoded client-encrypted backup blob. */
  readonly encrypted_backup: string;
}

export interface CrossSignParams {
  /** Device ID of the signing (trusted) device. */
  readonly signer_device_id: string;
  /** Base64-encoded cross-signature bytes. */
  readonly signature: string;
  /** Signature algorithm — defaults to "ed25519". */
  readonly algorithm?: string;
}

export interface SyncKeysParams {
  /** Device ID of the source device sending key material. */
  readonly device_id: string;
  /** Base64-encoded encrypted key material (opaque blob to the server). */
  readonly encrypted_key_material: string;
  /** Device ID of the device that should receive the package. */
  readonly target_device_id: string;
}

/**
 * Creates E2EE endpoints.
 *
 * @param http - Axios instance configured with base URL and auth headers
 * @returns Object containing all E2EE key-management endpoint methods
 */
export function createE2EEEndpoints(http: AxiosInstance) {
  return {
    // -------------------------------------------------------------------------
    // Bootstrap
    // -------------------------------------------------------------------------

    /**
     * Check E2EE bootstrap status for the authenticated user.
     *
     * Returns `ready`, `needs_prekeys`, or `no_identity_key` so the client
     * can determine what setup steps are required.
     */
    async checkBootstrap(): Promise<ApiResult<BootstrapStatus>> {
      return apiCall(() => http.get('/api/v1/e2ee/bootstrap'), BootstrapStatusSchema);
    },

    // -------------------------------------------------------------------------
    // Key registration
    // -------------------------------------------------------------------------

    /**
     * Register or update E2EE keys.
     *
     * Called on first install, when adding a new device, when rotating the
     * signed prekey, or when uploading new one-time prekeys.
     */
    async registerKeys(params: RegisterKeysParams): Promise<ApiResult<KeyRegistrationResponse>> {
      return apiCall(() => http.post('/api/v1/e2ee/keys', params), KeyRegistrationResponseSchema);
    },

    // -------------------------------------------------------------------------
    // Prekey bundle  (X3DH session initiation)
    // -------------------------------------------------------------------------

    /**
     * Fetch the prekey bundle for a user.
     *
     * Called when establishing an E2EE session for the first time.
     * The server consumes a one-time prekey if one is available.
     */
    async fetchPrekeyBundle(userId: string): Promise<ApiResult<PrekeyBundle>> {
      return apiCall(() => http.get(`/api/v1/e2ee/keys/${userId}`), PrekeyBundleSchema);
    },

    // -------------------------------------------------------------------------
    // One-time prekey management
    // -------------------------------------------------------------------------

    /**
     * Check how many one-time prekeys remain on the server.
     *
     * The response includes `should_upload: true` when the count falls below
     * the server-defined threshold (currently 25).
     */
    async checkKeyStatus(): Promise<ApiResult<PrekeyCount>> {
      return apiCall(() => http.get('/api/v1/e2ee/keys/count'), PrekeyCountSchema);
    },

    /**
     * Upload additional one-time prekeys.
     *
     * Call this when `checkKeyStatus()` returns `should_upload: true`.
     * Each entry is a tuple of [keyId, base64PublicKey].
     */
    async replenishOneTimeKeys(
      keys: ReadonlyArray<OneTimePrekey>
    ): Promise<ApiResult<ReplenishKeysResponse>> {
      return apiCall(
        () => http.post('/api/v1/e2ee/keys/prekeys', { prekeys: keys }),
        ReplenishKeysResponseSchema
      );
    },

    // -------------------------------------------------------------------------
    // Device management
    // -------------------------------------------------------------------------

    /**
     * List all registered devices for the authenticated user.
     */
    async getDevices(): Promise<ApiResult<DeviceList>> {
      return apiCall(() => http.get('/api/v1/e2ee/devices'), DeviceListSchema);
    },

    /**
     * Remove a device and revoke its associated keys.
     *
     * Call this on explicit logout from a device, or to revoke a lost device.
     */
    async removeDevice(deviceId: string): Promise<ApiResult<RemoveDeviceResponse>> {
      return apiCall(
        () => http.delete(`/api/v1/e2ee/devices/${deviceId}`),
        RemoveDeviceResponseSchema
      );
    },

    // -------------------------------------------------------------------------
    // Safety numbers
    // -------------------------------------------------------------------------

    /**
     * Get the safety number shared between the authenticated user and another.
     *
     * Safety numbers are derived from both users' identity keys and are
     * compared out-of-band to verify identity (e.g. phone call, in person).
     */
    async getSafetyNumber(userId: string): Promise<ApiResult<SafetyNumber>> {
      return apiCall(() => http.get(`/api/v1/e2ee/safety-number/${userId}`), SafetyNumberSchema);
    },

    // -------------------------------------------------------------------------
    // Key verification / revocation
    // -------------------------------------------------------------------------

    /**
     * Mark an identity key as verified after comparing safety numbers.
     */
    async verifyKey(keyId: string): Promise<ApiResult<KeyVerifyResponse>> {
      return apiCall(
        () => http.post(`/api/v1/e2ee/keys/${keyId}/verify`, {}),
        KeyVerifyResponseSchema
      );
    },

    /**
     * Revoke a compromised identity key.
     *
     * The server notifies all contacts so they stop encrypting messages for
     * the revoked key and request fresh bundles.
     */
    async revokeKey(keyId: string): Promise<ApiResult<KeyRevokeResponse>> {
      return apiCall(
        () => http.post(`/api/v1/e2ee/keys/${keyId}/revoke`, {}),
        KeyRevokeResponseSchema
      );
    },

    // -------------------------------------------------------------------------
    // Key backup  (cross-device restore)
    // -------------------------------------------------------------------------

    /**
     * Store an encrypted key backup for a device.
     *
     * The backup is encrypted client-side before upload; the server treats it
     * as an opaque blob. Maximum 5 backups per user.
     */
    async storeKeyBackup(params: StoreKeyBackupParams): Promise<ApiResult<KeyBackupStoreResponse>> {
      return apiCall(
        () => http.post('/api/v1/e2ee/keys/backup', params),
        KeyBackupStoreResponseSchema
      );
    },

    /**
     * Retrieve the encrypted key backup for a device.
     *
     * The caller is responsible for decrypting the blob with the
     * password-derived key.
     */
    async getKeyBackup(deviceId: string): Promise<ApiResult<KeyBackupGetResponse>> {
      return apiCall(
        () => http.get(`/api/v1/e2ee/keys/backup/${deviceId}`),
        KeyBackupGetResponseSchema
      );
    },

    // -------------------------------------------------------------------------
    // Cross-signing  (multi-device trust)
    // -------------------------------------------------------------------------

    /**
     * Cross-sign another device's identity key to establish trust.
     *
     * Creates a cross-signature from the caller's signing device to the target
     * device, building the multi-device trust chain.
     */
    async crossSignDevice(
      deviceId: string,
      params: CrossSignParams
    ): Promise<ApiResult<CrossSignResponse>> {
      return apiCall(
        () => http.post(`/api/v1/e2ee/devices/${deviceId}/cross-sign`, params),
        CrossSignResponseSchema
      );
    },

    /**
     * Get the full device trust chain for the authenticated user.
     *
     * Returns each device along with all cross-signatures and whether it is
     * currently trusted.
     */
    async getDeviceTrustChain(): Promise<ApiResult<DeviceTrustChain>> {
      return apiCall(() => http.get('/api/v1/e2ee/devices/trust-chain'), DeviceTrustChainSchema);
    },

    // -------------------------------------------------------------------------
    // Key sync packages  (blind relay)
    // -------------------------------------------------------------------------

    /**
     * Send encrypted key material to another device.
     *
     * The server stores the package without inspecting or decrypting it.
     * The target device retrieves it via `getSyncPackages`.
     */
    async syncKeys(params: SyncKeysParams): Promise<ApiResult<SyncPackageResponse>> {
      return apiCall(
        () =>
          http.post(`/api/v1/e2ee/devices/${params.device_id}/sync`, {
            encrypted_key_material: params.encrypted_key_material,
            target_device_id: params.target_device_id,
          }),
        SyncPackageResponseSchema
      );
    },

    /**
     * Get pending key-sync packages for a device.
     *
     * After retrieving, the client decrypts locally. Pass the device's identity
     * key UUID as `deviceId`.
     */
    async getSyncPackages(deviceId: string): Promise<ApiResult<SyncPackagesList>> {
      return apiCall(
        () => http.get('/api/v1/e2ee/devices/sync-packages', { params: { device_id: deviceId } }),
        SyncPackagesListSchema
      );
    },
  };
}
