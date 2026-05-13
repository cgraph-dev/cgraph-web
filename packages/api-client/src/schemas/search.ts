/**
 * Search schemas.
 */
import { z } from 'zod';

export const SearchResultTypeSchema = z.enum([
  'user',
  'group',
  'channel',
  'message',
  'forum',
  'post',
]);

export type SearchResultType = z.infer<typeof SearchResultTypeSchema>;

export const SearchResultSchema = z.object({
  type: z.string(),
  id: z.string(),
  title: z.string().optional(),
  name: z.string().optional(),
  username: z.string().optional(),
  subtitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  url: z.string().optional(),
  match_context: z.string().nullable().optional(),
  timestamp: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

export const GlobalSearchResponseSchema = z.object({
  results: z.array(SearchResultSchema),
  totals: z
    .object({
      users: z.number().optional(),
      groups: z.number().optional(),
      channels: z.number().optional(),
      messages: z.number().optional(),
      forums: z.number().optional(),
      posts: z.number().optional(),
      total: z.number().optional(),
    })
    .optional(),
  has_more: z.boolean().optional(),
  search_id: z.string().optional(),
});

export type GlobalSearchResponse = z.infer<typeof GlobalSearchResponseSchema>;

export const SearchSuggestionSchema = z.object({
  type: z.string().optional(),
  query: z.string(),
  icon: z.string().optional(),
  count: z.number().optional(),
});

export type SearchSuggestion = z.infer<typeof SearchSuggestionSchema>;

// ── Per-type search result schemas ───────────────────────────────────────────

export const SearchUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  avatar_border_id: z.string().nullable().optional(),
  status: z.string().optional(),
  level: z.number().optional(),
  verified: z.boolean().optional(),
  is_online: z.boolean().optional(),
});

export type SearchUser = z.infer<typeof SearchUserSchema>;

export const SearchGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  icon_url: z.string().nullable().optional(),
  member_count: z.number().optional(),
  is_public: z.boolean().optional(),
  is_member: z.boolean().optional(),
  default_channel_id: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type SearchGroup = z.infer<typeof SearchGroupSchema>;

export const SearchMessageSchema = z.object({
  id: z.string(),
  content: z.string().optional(),
  sender_id: z.string().optional(),
  conversation_id: z.string().optional(),
  channel_id: z.string().nullable().optional(),
  group_id: z.string().nullable().optional(),
  created_at: z.string().optional(),
  match_context: z.string().nullable().optional(),
  sender: z
    .object({
      id: z.string(),
      username: z.string(),
      avatar_url: z.string().nullable().optional(),
    })
    .optional(),
});

export type SearchMessage = z.infer<typeof SearchMessageSchema>;

export const SearchForumSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  icon_url: z.string().nullable().optional(),
  post_count: z.number().optional(),
  member_count: z.number().optional(),
  is_public: z.boolean().optional(),
  category: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export type SearchForum = z.infer<typeof SearchForumSchema>;

export const SearchPostSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  author_id: z.string().optional(),
  forum_id: z.string().optional(),
  forum_slug: z.string().optional(),
  score: z.number().optional(),
  reply_count: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  author: z
    .object({
      id: z.string(),
      username: z.string(),
      avatar_url: z.string().nullable().optional(),
    })
    .optional(),
});

export type SearchPost = z.infer<typeof SearchPostSchema>;

export const RecentSearchSchema = z.object({
  id: z.string().optional(),
  query: z.string(),
  searched_at: z.string().optional(),
  result_count: z.number().optional(),
});

export type RecentSearch = z.infer<typeof RecentSearchSchema>;
