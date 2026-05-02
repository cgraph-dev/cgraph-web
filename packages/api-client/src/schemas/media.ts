/**
 * Media schemas.
 *
 * Shapes for the conversation media gallery and avatar upload endpoints.
 */
import { z } from 'zod';

import { UserBasicSchema } from './common';

// ---------------------------------------------------------------------------
// MediaItem  (a message that contains a media attachment)
// ---------------------------------------------------------------------------

export const MediaTypeSchema = z.enum(['images', 'videos', 'files', 'voice', 'all']);
export type MediaType = z.infer<typeof MediaTypeSchema>;

export const MediaItemSchema = z.object({
  id: z.string(),
  content: z.string().nullable().optional(),
  content_type: z.string().nullable().optional(),
  sender_id: z.string(),
  sender: UserBasicSchema.nullable().optional(),
  conversation_id: z.string(),
  file_url: z.string().nullable().optional(),
  file_name: z.string().nullable().optional(),
  file_size: z.number().nullable().optional(),
  file_mime_type: z.string().nullable().optional(),
  thumbnail_url: z.string().nullable().optional(),
  link_preview: z.record(z.unknown()).nullable().optional(),
  inserted_at: z.string(),
});
export type MediaItem = z.infer<typeof MediaItemSchema>;

// ---------------------------------------------------------------------------
// GalleryResponse  (paginated list of media items)
// ---------------------------------------------------------------------------

export const GalleryMetaSchema = z.object({
  cursor: z.string().nullable(),
  has_more: z.boolean(),
});
export type GalleryMeta = z.infer<typeof GalleryMetaSchema>;

export const GalleryResponseSchema = z.object({
  media: z.array(MediaItemSchema),
  meta: GalleryMetaSchema,
});
export type GalleryResponse = z.infer<typeof GalleryResponseSchema>;

// ---------------------------------------------------------------------------
// AvatarUploadResult  (URL of the newly stored avatar)
// ---------------------------------------------------------------------------

export const AvatarUploadResultSchema = z.object({
  id: z.string().optional(),
  username: z.string().optional(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});
export type AvatarUploadResult = z.infer<typeof AvatarUploadResultSchema>;
