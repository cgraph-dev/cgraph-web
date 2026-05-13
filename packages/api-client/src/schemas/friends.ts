/**
 * Friends schemas.
 *
 * Zod schemas for friend list, friend requests, user profiles,
 * suggestions, and blocked users.
 */
import { z } from 'zod';
import { UserBasicSchema } from './common';

// ---------------------------------------------------------------------------
// Status enums
// ---------------------------------------------------------------------------

export const FriendStatusSchema = z.enum(['online', 'idle', 'dnd', 'offline', 'invisible']);

export type FriendStatus = z.infer<typeof FriendStatusSchema>;

// ---------------------------------------------------------------------------
// Friend (a friendship record that embeds the other user)
// ---------------------------------------------------------------------------

export const FriendUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  avatar_border_id: z.string().nullable().optional(),
  equipped_title_id: z.string().nullable().optional(),
  status: FriendStatusSchema.optional(),
  status_message: z.string().nullable().optional(),
  custom_status: z.string().nullable().optional(),
  last_seen_at: z.string().nullable().optional(),
});

export type FriendUser = z.infer<typeof FriendUserSchema>;

export const FriendRawSchema = z.object({
  id: z.string(),
  friend_id: z.string().optional(),
  user_id: z.string().optional(),
  user: FriendUserSchema.optional(),
  friend: FriendUserSchema.optional(),
  username: z.string().optional(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  status: FriendStatusSchema.optional(),
  is_favorite: z.boolean().optional(),
  nickname: z.string().nullable().optional(),
  since: z.string().optional(),
  created_at: z.string().optional(),
  inserted_at: z.string().optional(),
});

export type FriendRaw = z.infer<typeof FriendRawSchema>;

// ---------------------------------------------------------------------------
// Friend request
// ---------------------------------------------------------------------------

export const FriendRequestUserSchema = UserBasicSchema.extend({
  avatar_border_id: z.string().nullable().optional(),
});

export type FriendRequestUser = z.infer<typeof FriendRequestUserSchema>;

export const FriendRequestRawSchema = z.object({
  id: z.string(),
  sender_id: z.string().optional(),
  receiver_id: z.string().optional(),
  status: z.enum(['pending', 'accepted', 'declined']).optional(),
  message: z.string().nullable().optional(),
  // Incoming: "from" user; outgoing: "to" user
  from: FriendRequestUserSchema.optional(),
  to: FriendRequestUserSchema.optional(),
  // Some backends return sender/receiver
  sender: FriendRequestUserSchema.optional(),
  receiver: FriendRequestUserSchema.optional(),
  sent_at: z.string().optional(),
  created_at: z.string().optional(),
  inserted_at: z.string().optional(),
});

export type FriendRequestRaw = z.infer<typeof FriendRequestRawSchema>;

// ---------------------------------------------------------------------------
// Online count
// ---------------------------------------------------------------------------

export const OnlineCountSchema = z.object({
  count: z.number(),
});

export type OnlineCount = z.infer<typeof OnlineCountSchema>;

// ---------------------------------------------------------------------------
// Toggle favorite result
// ---------------------------------------------------------------------------

export const ToggleFavoriteSchema = z.object({
  is_favorite: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
});

export type ToggleFavorite = z.infer<typeof ToggleFavoriteSchema>;

// ---------------------------------------------------------------------------
// Suggestion
// ---------------------------------------------------------------------------

export const FriendSuggestionSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  mutual_friends_count: z.number().optional(),
  mutual_groups_count: z.number().optional(),
  reason: z.string().optional(),
});

export type FriendSuggestion = z.infer<typeof FriendSuggestionSchema>;

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------

export const UserProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  avatar_border_id: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  status: FriendStatusSchema.optional(),
  status_message: z.string().nullable().optional(),
  karma: z.number().optional(),
  is_verified: z.boolean().optional(),
  is_premium: z.boolean().optional(),
  is_profile_private: z.boolean().optional(),
  title: z.string().nullable().optional(),
  title_rarity: z.string().nullable().optional(),
  friendship_status: z.string().nullable().optional(),
  inserted_at: z.string().optional(),
  created_at: z.string().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// ---------------------------------------------------------------------------
// Mutual friend / group (small summary shape)
// ---------------------------------------------------------------------------

export const MutualFriendSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});

export type MutualFriend = z.infer<typeof MutualFriendSchema>;

export const MutualGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon_url: z.string().nullable().optional(),
  member_count: z.number().optional(),
});

export type MutualGroup = z.infer<typeof MutualGroupSchema>;

// ---------------------------------------------------------------------------
// Blocked user
// ---------------------------------------------------------------------------

export const BlockedUserSchema = z.object({
  id: z.string(),
  blocked_user_id: z.string().optional(),
  user: FriendUserSchema.optional(),
  username: z.string().optional(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  blocked_at: z.string().optional(),
  created_at: z.string().optional(),
});

export type BlockedUser = z.infer<typeof BlockedUserSchema>;

// ---------------------------------------------------------------------------
// Send-request / accept-request response
// ---------------------------------------------------------------------------

export const SendRequestResponseSchema = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
  message: z.string().nullable().optional(),
  from: FriendRequestUserSchema.optional(),
  to: FriendRequestUserSchema.optional(),
  created_at: z.string().optional(),
  inserted_at: z.string().optional(),
});

export type SendRequestResponse = z.infer<typeof SendRequestResponseSchema>;

// ---------------------------------------------------------------------------
// User search result
// ---------------------------------------------------------------------------

export const UserSearchResultSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  is_verified: z.boolean().optional(),
  is_premium: z.boolean().optional(),
  friendship_status: z.string().nullable().optional(),
});

export type UserSearchResult = z.infer<typeof UserSearchResultSchema>;
