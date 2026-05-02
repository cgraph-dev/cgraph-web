import { z } from 'zod';

export const CursorMetaSchema = z.object({
  cursor: z.string().nullable(),
  has_more: z.boolean(),
});

export type CursorMeta = z.infer<typeof CursorMetaSchema>;

/**
 * Build a Zod schema for paginated responses with a `data` + `meta` envelope.
 */
export function paginatedResponse<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: CursorMetaSchema,
  });
}

/**
 * Build a Zod schema for single-item responses with a `data` envelope.
 */
export function dataResponse<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
  });
}

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export const UserBasicSchema = z.object({
  id: z.string(),
  username: z.string(),
  display_name: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
});

export type UserBasic = z.infer<typeof UserBasicSchema>;
