import { z } from 'zod';

export const UserStatusSchema = z.enum(['online', 'idle', 'dnd', 'offline', 'invisible']);

export type UserStatus = z.infer<typeof UserStatusSchema>;

export const ConnectedAccountSchema = z
  .object({
    id: z.string(),
    provider: z.string(),
    provider_name: z.string().optional(),
    email: z.string().nullable().optional(),
    linked_at: z.string().nullable().optional(),
  })
  .passthrough();

export type ConnectedAccount = z.infer<typeof ConnectedAccountSchema>;

export const UserSchema = z
  .object({
    id: z.string(),
    uid: z.string().optional(),
    user_id: z.union([z.number(), z.string()]).optional(),
    user_id_display: z.string().optional(),
    email: z.string(),
    email_notifications_enabled: z.boolean().optional(),
    email_digest_enabled: z.boolean().optional(),
    email_digest_frequency: z.string().nullable().optional(),
    email_on_new_message: z.boolean().optional(),
    email_on_friend_request: z.boolean().optional(),
    email_on_mention: z.boolean().optional(),
    email_on_reply: z.boolean().optional(),
    email_on_achievement: z.boolean().optional(),
    connected_accounts: ConnectedAccountSchema.array().optional(),
    username: z.string().nullable(),
    display_name: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
    banner_url: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    status: UserStatusSchema.optional(),
    status_message: z.string().nullable().optional(),
    avatar_border_id: z.string().nullable().optional(),
    equipped_badge_ids: z.array(z.string()).optional(),
    equipped_badges: z.array(z.string()).optional(),
    equipped_nameplate_id: z.string().nullable().optional(),
    equipped_nameplate: z.string().nullable().optional(),
    profile_theme: z.string().nullable().optional(),
    chat_theme: z.string().nullable().optional(),
    display_name_font: z.string().nullable().optional(),
    display_name_effect: z.string().nullable().optional(),
    display_name_color: z.string().nullable().optional(),
    display_name_secondary_color: z.string().nullable().optional(),
    wallet_address: z.string().nullable().optional(),
    email_verified_at: z.string().nullable().optional(),
    two_factor_enabled: z.boolean().optional(),
    karma: z.number().optional(),
    is_verified: z.boolean().optional(),
    is_premium: z.boolean().optional(),
    is_profile_private: z.boolean().optional(),
    can_change_username: z.boolean().optional(),
    username_next_change_at: z.string().nullable().optional(),
    subscription_tier: z.string().optional(),
    equipped_title_id: z.string().nullable().optional(),
    onboarding_completed: z.boolean().optional(),
    created_at: z.string().optional(),
    following_count: z.number().optional(),
    followers_count: z.number().optional(),
    is_followed_by_me: z.boolean().optional(),
  })
  .passthrough();

export type User = z.infer<typeof UserSchema>;
