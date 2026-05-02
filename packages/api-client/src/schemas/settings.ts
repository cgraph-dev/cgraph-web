/**
 * Settings schemas.
 */
import { z } from 'zod';

export const SettingsCategorySchema = z.object({}).passthrough();

export type SettingsCategory = z.infer<typeof SettingsCategorySchema>;

export const AllSettingsSchema = z
  .object({
    notifications: z.record(z.unknown()).optional(),
    privacy: z.record(z.unknown()).optional(),
    appearance: z.record(z.unknown()).optional(),
    locale: z.record(z.unknown()).optional(),
    keyboard: z.record(z.unknown()).optional(),
  })
  .passthrough();

export type AllSettings = z.infer<typeof AllSettingsSchema>;

export const UpdateSettingsResponseSchema = z.object({}).passthrough();

export type UpdateSettingsResponse = z.infer<typeof UpdateSettingsResponseSchema>;
