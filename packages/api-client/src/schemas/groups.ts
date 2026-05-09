/**
 * Group schemas.
 *
 * Zod schemas for all group-related response types consumed by the endpoint
 * layer. Types are derived via `z.infer` so callers never need to maintain
 * parallel interface definitions.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Primitives / enums
// ---------------------------------------------------------------------------

export const GroupRoleSchema = z.enum(['owner', 'admin', 'moderator', 'member', 'guest']);
export type GroupRole = z.infer<typeof GroupRoleSchema>;

export const GateTypeSchema = z.enum(['weekly', 'monthly', 'forever']);
export type GateType = z.infer<typeof GateTypeSchema>;

// ---------------------------------------------------------------------------
// Group
// ---------------------------------------------------------------------------

export const GroupFeaturesSchema = z.object({
  forums: z.boolean().optional().default(true),
  events: z.boolean().optional().default(true),
  polls: z.boolean().optional().default(true),
  voice: z.boolean().optional().default(false),
  stage: z.boolean().optional().default(false),
  announcements: z.boolean().optional().default(true),
});

export type GroupFeatures = z.infer<typeof GroupFeaturesSchema>;

export const GroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  // Backend sends icon_url for groups (NOT avatar_url — that's for users).
  // Normalization to camelCase (iconUrl) happens in the consumer's transform layer.
  icon_url: z.string().nullable().optional(),
  banner_url: z.string().nullable().optional(),
  owner_id: z.string().optional(),
  ownerId: z.string().optional(),
  owner_username: z.string().optional(),
  ownerUsername: z.string().optional(),
  member_count: z.number().optional(),
  memberCount: z.number().optional(),
  online_count: z.number().optional(),
  onlineCount: z.number().optional(),
  channel_count: z.number().optional(),
  channelCount: z.number().optional(),
  is_public: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  is_verified: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  is_node_gated: z.boolean().optional(),
  isNodeGated: z.boolean().optional(),
  gate_type: GateTypeSchema.nullable().optional(),
  gateType: GateTypeSchema.nullable().optional(),
  gate_price_nodes: z.number().nullable().optional(),
  gatePriceNodes: z.number().nullable().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  features: GroupFeaturesSchema.optional(),
  created_at: z.string().optional(),
  createdAt: z.string().optional(),
  joined_at: z.string().nullable().optional(),
  joinedAt: z.string().nullable().optional(),
  role: GroupRoleSchema.nullable().optional(),
  // Web-only nested fields
  slug: z.string().optional(),
  categories: z.array(z.unknown()).optional(),
  channels: z.array(z.unknown()).optional(),
  roles: z.array(z.unknown()).optional(),
  myMember: z.unknown().nullable().optional(),
});

export type Group = z.infer<typeof GroupSchema>;

// ---------------------------------------------------------------------------
// Group member
// ---------------------------------------------------------------------------

export const GroupMemberSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  userId: z.string().optional(),
  username: z.string().optional(),
  display_name: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  role: GroupRoleSchema.optional(),
  status: z.enum(['online', 'offline', 'idle', 'dnd']).optional(),
  custom_status: z.string().nullable().optional(),
  customStatus: z.string().nullable().optional(),
  joined_at: z.string().optional(),
  joinedAt: z.string().optional(),
  nickname: z.string().nullable().optional(),
  level: z.number().optional(),
  xp_in_group: z.number().optional(),
  xpInGroup: z.number().optional(),
  // Web shape: nested user + roles array
  user: z.unknown().optional(),
  roles: z.array(z.unknown()).optional(),
  notifications: z.enum(['all', 'mentions', 'none']).optional(),
  suppress_everyone: z.boolean().optional(),
  suppressEveryone: z.boolean().optional(),
});

export type GroupMember = z.infer<typeof GroupMemberSchema>;

// ---------------------------------------------------------------------------
// Group invite
// ---------------------------------------------------------------------------

export const GroupInviteSchema = z.object({
  id: z.string().optional(),
  code: z.string(),
  group_id: z.string().optional(),
  groupId: z.string().optional(),
  group_name: z.string().optional(),
  groupName: z.string().optional(),
  group_avatar: z.string().nullable().optional(),
  groupAvatar: z.string().nullable().optional(),
  creator_id: z.string().optional(),
  creatorId: z.string().optional(),
  creator_username: z.string().optional(),
  creatorUsername: z.string().optional(),
  uses: z.number().optional(),
  max_uses: z.number().nullable().optional(),
  maxUses: z.number().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  created_at: z.string().optional(),
  createdAt: z.string().optional(),
  // Nested objects from the API
  group: z.unknown().optional(),
  creator: z.unknown().optional(),
});

export type GroupInvite = z.infer<typeof GroupInviteSchema>;

// ---------------------------------------------------------------------------
// Group channel / category
// ---------------------------------------------------------------------------

export const GroupChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['text', 'voice', 'announcement', 'forum', 'stage']).optional(),
  description: z.string().nullable().optional(),
  category_id: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  category_name: z.string().nullable().optional(),
  categoryName: z.string().nullable().optional(),
  position: z.number().optional(),
  is_private: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  unread_count: z.number().optional(),
  unreadCount: z.number().optional(),
  last_message_at: z.string().nullable().optional(),
  lastMessageAt: z.string().nullable().optional(),
  // Web-only fields
  topic: z.string().nullable().optional(),
  is_nsfw: z.boolean().optional(),
  isNsfw: z.boolean().optional(),
  slow_mode_seconds: z.number().optional(),
  slowModeSeconds: z.number().optional(),
});

export type GroupChannel = z.infer<typeof GroupChannelSchema>;

export const GroupCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number().optional(),
  channels: z.array(GroupChannelSchema).optional(),
  collapsed: z.boolean().optional(),
});

export type GroupCategory = z.infer<typeof GroupCategorySchema>;

// ---------------------------------------------------------------------------
// Group ban
// ---------------------------------------------------------------------------

export const GroupBanSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  userId: z.string().optional(),
  username: z.string().optional(),
  display_name: z.string().nullable().optional(),
  displayName: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  banned_by: z.string().optional(),
  bannedBy: z.string().optional(),
  banned_by_username: z.string().optional(),
  bannedByUsername: z.string().optional(),
  banned_at: z.string().optional(),
  bannedAt: z.string().optional(),
  expires_at: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  // Nested objects
  user: z.unknown().optional(),
  banner: z.unknown().optional(),
});

export type GroupBan = z.infer<typeof GroupBanSchema>;

// ---------------------------------------------------------------------------
// Group settings
// ---------------------------------------------------------------------------

export const GroupSettingsSchema = z.object({
  default_role: GroupRoleSchema.optional(),
  defaultRole: GroupRoleSchema.optional(),
  allow_invites: z.boolean().optional(),
  allowInvites: z.boolean().optional(),
  join_approval: z.boolean().optional(),
  joinApproval: z.boolean().optional(),
  member_list_visibility: z.enum(['public', 'members', 'admins']).optional(),
  memberListVisibility: z.enum(['public', 'members', 'admins']).optional(),
  message_history: z.enum(['all', 'none', 'limited']).optional(),
  messageHistory: z.enum(['all', 'none', 'limited']).optional(),
  slow_mode: z.number().nullable().optional(),
  slowMode: z.number().nullable().optional(),
  explicit_content_filter: z.enum(['off', 'members', 'all']).optional(),
  explicitContentFilter: z.enum(['off', 'members', 'all']).optional(),
});

export type GroupSettings = z.infer<typeof GroupSettingsSchema>;

// ---------------------------------------------------------------------------
// Group stats
// ---------------------------------------------------------------------------

export const GroupStatsSchema = z.object({
  member_count: z.number().optional(),
  memberCount: z.number().optional(),
  online_count: z.number().optional(),
  onlineCount: z.number().optional(),
  message_count: z.number().optional(),
  messageCount: z.number().optional(),
  active_today: z.number().optional(),
  activeToday: z.number().optional(),
  active_this_week: z.number().optional(),
  activeThisWeek: z.number().optional(),
  growth: z
    .object({
      day: z.number().optional(),
      week: z.number().optional(),
      month: z.number().optional(),
    })
    .optional(),
});

export type GroupStats = z.infer<typeof GroupStatsSchema>;

// ---------------------------------------------------------------------------
// Void / acknowledgement response
// ---------------------------------------------------------------------------

/** Schema for endpoints that return an empty 2xx or an arbitrary ack payload. */
export const AckSchema = z.unknown();
export type Ack = z.infer<typeof AckSchema>;
