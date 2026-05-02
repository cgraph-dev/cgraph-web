/**
 * E2EE schemas.
 *
 * Covers key registration, prekey bundles, device management,
 * key sync, cross-signing, and bootstrap status responses.
 *
 * Transport-only — NO crypto operations or key storage.
 * All keys are base64-encoded strings at the transport layer.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Bootstrap / key status
// ---------------------------------------------------------------------------

export const BootstrapStatusSchema = z
  .object({
    status: z.enum(['ready', 'needs_prekeys', 'no_identity_key']),
    prekey_count: z.number(),
  })
  .passthrough();

export type BootstrapStatus = z.infer<typeof BootstrapStatusSchema>;

// ---------------------------------------------------------------------------
// Key registration
// ---------------------------------------------------------------------------

export const KeyRegistrationResponseSchema = z
  .object({
    identity_key_id: z.string(),
    signed_prekey_id: z.number().optional(),
    one_time_prekeys_uploaded: z.number().optional(),
  })
  .passthrough();

export type KeyRegistrationResponse = z.infer<typeof KeyRegistrationResponseSchema>;

// ---------------------------------------------------------------------------
// Prekey bundle  (used for X3DH session setup)
// ---------------------------------------------------------------------------

export const PrekeyBundleSchema = z
  .object({
    identity_key: z.string(),
    identity_key_id: z.string(),
    device_id: z.string(),
    signed_prekey: z.string(),
    signed_prekey_id: z.number(),
    signed_prekey_signature: z.string(),
    one_time_prekey: z.string().optional(),
    one_time_prekey_id: z.number().optional(),
  })
  .passthrough();

export type PrekeyBundle = z.infer<typeof PrekeyBundleSchema>;

// ---------------------------------------------------------------------------
// Prekey count / replenish
// ---------------------------------------------------------------------------

export const PrekeyCountSchema = z
  .object({
    count: z.number(),
    should_upload: z.boolean(),
  })
  .passthrough();

export type PrekeyCount = z.infer<typeof PrekeyCountSchema>;

export const ReplenishKeysResponseSchema = z
  .object({
    uploaded: z.number(),
    total: z.number(),
  })
  .passthrough();

export type ReplenishKeysResponse = z.infer<typeof ReplenishKeysResponseSchema>;

// ---------------------------------------------------------------------------
// Device info
// ---------------------------------------------------------------------------

export const DeviceInfoSchema = z
  .object({
    device_id: z.string(),
    identity_key_id: z.string(),
    created_at: z.string().optional(),
  })
  .passthrough();

export type DeviceInfo = z.infer<typeof DeviceInfoSchema>;

export const DeviceListSchema = z.array(DeviceInfoSchema);

export type DeviceList = z.infer<typeof DeviceListSchema>;

export const RemoveDeviceResponseSchema = z
  .object({
    removed: z.boolean(),
    device_id: z.string(),
  })
  .passthrough();

export type RemoveDeviceResponse = z.infer<typeof RemoveDeviceResponseSchema>;

// ---------------------------------------------------------------------------
// Safety number
// ---------------------------------------------------------------------------

export const SafetyNumberSchema = z
  .object({
    safety_number: z.string(),
  })
  .passthrough();

export type SafetyNumber = z.infer<typeof SafetyNumberSchema>;

// ---------------------------------------------------------------------------
// Key verification / revocation
// ---------------------------------------------------------------------------

export const KeyVerifyResponseSchema = z
  .object({
    key_id: z.string(),
    verified: z.boolean(),
    verified_at: z.string().optional(),
  })
  .passthrough();

export type KeyVerifyResponse = z.infer<typeof KeyVerifyResponseSchema>;

export const KeyRevokeResponseSchema = z
  .object({
    key_id: z.string(),
    revoked: z.boolean(),
    revoked_at: z.string().optional(),
  })
  .passthrough();

export type KeyRevokeResponse = z.infer<typeof KeyRevokeResponseSchema>;

// ---------------------------------------------------------------------------
// Key backup (cross-device sync)
// ---------------------------------------------------------------------------

export const KeyBackupStoreResponseSchema = z
  .object({
    id: z.string(),
    device_id: z.string(),
    stored: z.boolean(),
  })
  .passthrough();

export type KeyBackupStoreResponse = z.infer<typeof KeyBackupStoreResponseSchema>;

export const KeyBackupGetResponseSchema = z
  .object({
    device_id: z.string(),
    encrypted_backup: z.string(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export type KeyBackupGetResponse = z.infer<typeof KeyBackupGetResponseSchema>;

// ---------------------------------------------------------------------------
// Cross-signing
// ---------------------------------------------------------------------------

const CrossSignatureSchema = z
  .object({
    id: z.string(),
    signer_device_id: z.string(),
    signed_device_id: z.string(),
    algorithm: z.string(),
    status: z.string(),
    created_at: z.string().optional(),
  })
  .passthrough();

export const CrossSignResponseSchema = z
  .object({
    status: z.string(),
    trust_chain: z.array(CrossSignatureSchema),
  })
  .passthrough();

export type CrossSignResponse = z.infer<typeof CrossSignResponseSchema>;

const DeviceTrustInfoSchema = z
  .object({
    device_id: z.string(),
    identity_key_id: z.string(),
    cross_signatures: z.array(CrossSignatureSchema),
    is_trusted: z.boolean(),
  })
  .passthrough();

export const DeviceTrustChainSchema = z
  .object({
    devices: z.array(DeviceTrustInfoSchema),
  })
  .passthrough();

export type DeviceTrustChain = z.infer<typeof DeviceTrustChainSchema>;

// ---------------------------------------------------------------------------
// Key sync packages
// ---------------------------------------------------------------------------

export const SyncPackageResponseSchema = z
  .object({
    package_id: z.string(),
    status: z.string(),
  })
  .passthrough();

export type SyncPackageResponse = z.infer<typeof SyncPackageResponseSchema>;

const SyncPackageItemSchema = z
  .object({
    id: z.string(),
    from_device_id: z.string(),
    encrypted_key_material: z.string(),
    created_at: z.string().optional(),
  })
  .passthrough();

export const SyncPackagesListSchema = z
  .object({
    packages: z.array(SyncPackageItemSchema),
  })
  .passthrough();

export type SyncPackagesList = z.infer<typeof SyncPackagesListSchema>;
