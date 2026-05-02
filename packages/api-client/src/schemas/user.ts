import { z } from 'zod';

export const UserStatusSchema = z.enum(['online', 'idle', 'dnd', 'offline', 'invisible']);

export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string().nullable(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  pronouns: z.string().nullable().optional(),
  status: UserStatusSchema.optional(),
  status_message: z.string().nullable().optional(),
  wallet_address: z.string().nullable().optional(),
  karma: z.number().optional(),
  is_verified: z.boolean().optional(),
  is_premium: z.boolean().optional(),
  is_profile_private: z.boolean().optional(),
  two_factor_enabled: z.boolean().optional(),
  email_verified_at: z.string().nullable().optional(),
  username_changed_at: z.string().nullable().optional(),
  can_change_username: z.boolean().optional(),
  username_next_change_at: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  title_rarity: z.string().nullable().optional(),

  // Mobile-specific fields (optional on web)
  uid: z.string().optional(),
  user_id: z.number().optional(),
  user_id_display: z.string().optional(),

  inserted_at: z.string().optional(),
  updated_at: z.string().optional(),
  created_at: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
