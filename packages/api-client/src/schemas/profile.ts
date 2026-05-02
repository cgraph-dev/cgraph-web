/**
 * Profile schemas.
 *
 * Zod schemas for the /api/v1/me, /api/v1/users/:id,
 * /api/v1/profile, and /api/v1/profiles/:username endpoints.
 *
 * `.passthrough()` is applied on the top-level shapes — user objects
 * carry many optional and evolving fields; unknown keys are preserved
 * rather than stripped, which avoids silent data loss as the backend grows.
 */
import { z } from 'zod';
import { UserStatusSchema } from './user';

// ---------------------------------------------------------------------------
// Shared sub-schemas
// ---------------------------------------------------------------------------

export const SocialLinksSchema = z
  .object({
    twitter: z.string().nullable().optional(),
    github: z.string().nullable().optional(),
    discord: z.string().nullable().optional(),
    youtube: z.string().nullable().optional(),
    twitch: z.string().nullable().optional(),
    instagram: z.string().nullable().optional(),
    linkedin: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
  })
  .passthrough();

export type SocialLinks = z.infer<typeof SocialLinksSchema>;

export const BadgeSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    icon_url: z.string().nullable().optional(),
    rarity: z.string().nullable().optional(),
    awarded_at: z.string().optional(),
  })
  .passthrough();

export type Badge = z.infer<typeof BadgeSchema>;

// ---------------------------------------------------------------------------
// FullUserProfile — shape returned by GET /api/v1/me and GET /api/v1/users/:id
// ---------------------------------------------------------------------------

export const FullUserProfileSchema = z
  .object({
    id: z.string(),
    username: z.string().nullable(),
    display_name: z.string().nullable().optional(),
    email: z.string().optional(),
    avatar_url: z.string().nullable().optional(),
    banner_url: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    signature: z.unknown().nullable().optional(),
    title: z.string().nullable().optional(),
    title_rarity: z.string().nullable().optional(),
    pronouns: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    occupation: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
    timezone: z.string().nullable().optional(),
    birthday: z.string().nullable().optional(),

    // Status / presence
    status: UserStatusSchema.optional(),
    status_message: z.string().nullable().optional(),
    custom_status: z.string().nullable().optional(),
    last_seen_at: z.string().nullable().optional(),

    // Reputation & gamification
    karma: z.number().optional(),
    xp: z.number().optional(),
    level: z.number().optional(),
    reputation_score: z.number().optional(),

    // Badges / cosmetics
    badges: BadgeSchema.array().optional(),
    equipped_badge_ids: z.string().array().optional(),
    avatar_border_id: z.string().nullable().optional(),
    equipped_title_id: z.string().nullable().optional(),

    // Social links
    social_links: SocialLinksSchema.nullable().optional(),

    // Account flags
    is_verified: z.boolean().optional(),
    is_premium: z.boolean().optional(),
    subscription_tier: z.string().nullable().optional(),
    is_profile_private: z.boolean().optional(),
    two_factor_enabled: z.boolean().optional(),
    onboarding_completed_at: z.string().nullable().optional(),

    // Username management
    username_changed_at: z.string().nullable().optional(),
    can_change_username: z.boolean().optional(),
    username_next_change_at: z.string().nullable().optional(),

    // Friendship context (present when viewing another user)
    friendship_status: z.string().nullable().optional(),
    is_friend: z.boolean().optional(),
    friend_request_sent: z.boolean().optional(),
    friend_request_received: z.boolean().optional(),
    blocked: z.boolean().optional(),

    // Timestamps
    inserted_at: z.string().optional(),
    updated_at: z.string().optional(),
    created_at: z.string().optional(),
  })
  .passthrough();

export type FullUserProfile = z.infer<typeof FullUserProfileSchema>;

// ---------------------------------------------------------------------------
// PublicProfile — reduced shape for viewing another user's profile
// (also returned by GET /api/v1/profiles/:username)
// ---------------------------------------------------------------------------

export const PublicProfileSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    display_name: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
    banner_url: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    title_rarity: z.string().nullable().optional(),
    pronouns: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
    social_links: SocialLinksSchema.nullable().optional(),
    status: UserStatusSchema.optional(),
    status_message: z.string().nullable().optional(),
    karma: z.number().optional(),
    xp: z.number().optional(),
    level: z.number().optional(),
    reputation_score: z.number().optional(),
    badges: BadgeSchema.array().optional(),
    avatar_border_id: z.string().nullable().optional(),
    is_verified: z.boolean().optional(),
    is_premium: z.boolean().optional(),
    is_profile_private: z.boolean().optional(),
    friendship_status: z.string().nullable().optional(),
    is_friend: z.boolean().optional(),
    friend_request_sent: z.boolean().optional(),
    friend_request_received: z.boolean().optional(),
    blocked: z.boolean().optional(),
    inserted_at: z.string().optional(),
    created_at: z.string().optional(),
  })
  .passthrough();

export type PublicProfile = z.infer<typeof PublicProfileSchema>;

// ---------------------------------------------------------------------------
// UpdateProfileParams — payload for PATCH/PUT /api/v1/me or /api/v1/profile
// ---------------------------------------------------------------------------

export const UpdateProfileParamsSchema = z.object({
  display_name: z.string().optional(),
  bio: z.string().nullable().optional(),
  signature: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  birthday: z.string().nullable().optional(),
  pronouns: z.string().nullable().optional(),
  social_links: SocialLinksSchema.optional(),
  custom_fields: z
    .array(
      z.object({
        field_id: z.string(),
        value: z.string(),
      })
    )
    .optional(),
  notification_settings: z.record(z.unknown()).optional(),
  privacy_settings: z.record(z.unknown()).optional(),
});

export type UpdateProfileParams = z.infer<typeof UpdateProfileParamsSchema>;

// ---------------------------------------------------------------------------
// ReputationEntry — shape for GET /api/v1/profiles/:username/reputation
// ---------------------------------------------------------------------------

export const ReputationEntrySchema = z
  .object({
    id: z.string(),
    from_user_id: z.string().optional(),
    to_user_id: z.string().optional(),
    post_id: z.string().nullable().optional(),
    forum_id: z.string().nullable().optional(),
    comment: z.string().nullable().optional(),
    value: z.number(),
    inserted_at: z.string().optional(),
    created_at: z.string().optional(),
    from_user: z
      .object({
        id: z.string(),
        username: z.string(),
        display_name: z.string().nullable().optional(),
        avatar_url: z.string().nullable().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type ReputationEntry = z.infer<typeof ReputationEntrySchema>;

export const ReputationSummarySchema = z
  .object({
    total: z.number().optional(),
    positive: z.number().optional(),
    negative: z.number().optional(),
    score: z.number().optional(),
  })
  .passthrough();

export type ReputationSummary = z.infer<typeof ReputationSummarySchema>;
