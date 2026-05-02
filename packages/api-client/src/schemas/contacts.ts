import { z } from 'zod';

export const DiscoveredContactUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().nullable(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  is_verified: z.boolean(),
});

export const DiscoveredContactSchema = z.object({
  phone_hash: z.string().length(64),
  user: DiscoveredContactUserSchema,
});

export const DiscoveryResultSchema = z.object({
  matches: z.array(DiscoveredContactSchema),
  sync_token: z.string(),
  batch_size: z.number().int().nonnegative(),
  matches_found: z.number().int().nonnegative(),
});

export const SyncResultSchema = DiscoveryResultSchema.extend({
  new_contact_ids: z.array(z.string().uuid()),
  is_incremental: z.boolean(),
});

export const ContactSyncStatusSchema = z.object({
  synced_hash_count: z.number().int().nonnegative(),
  registered_contact_count: z.number().int().nonnegative(),
  last_sync_at: z.string().nullable(),
  last_full_sync_at: z.string().nullable(),
  has_sync_token: z.boolean(),
});

export const RegisteredContactSchema = z.object({
  user_id: z.string().uuid(),
  username: z.string().nullable(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  is_verified: z.boolean(),
  discovered_at: z.string(),
});

export const DiscoverableResponseSchema = z.object({
  discoverable: z.boolean(),
});

export type DiscoveredContact = z.infer<typeof DiscoveredContactSchema>;
export type DiscoveryResult = z.infer<typeof DiscoveryResultSchema>;
export type SyncResult = z.infer<typeof SyncResultSchema>;
export type ContactSyncStatus = z.infer<typeof ContactSyncStatusSchema>;
export type RegisteredContact = z.infer<typeof RegisteredContactSchema>;
