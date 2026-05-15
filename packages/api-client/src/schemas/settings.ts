/**
 * Settings schemas.
 */
import { z } from 'zod';
import { SELECTIVE_PRIVACY_MODES } from '@cgraph/shared-types';

export const SelectivePrivacyModeSchema = z.enum(SELECTIVE_PRIVACY_MODES);

export const SelectivePrivacyRuleSchema = z.object({
  mode: SelectivePrivacyModeSchema,
  always_allow_user_ids: z.array(z.string()).default([]),
  never_allow_user_ids: z.array(z.string()).default([]),
});

export const SelectivePrivacySettingsSchema = z.object({
  message_requests: SelectivePrivacyRuleSchema,
  phone_number: SelectivePrivacyRuleSchema,
  calls: SelectivePrivacyRuleSchema,
});

export const PrivacySettingsSchema = z
  .object({
    selective_privacy: SelectivePrivacySettingsSchema.optional(),
  })
  .passthrough();

export const SettingsCategorySchema = z.object({}).passthrough();

export type SettingsCategory = z.infer<typeof SettingsCategorySchema>;

export const AllSettingsSchema = z
  .object({
    notifications: z.record(z.unknown()).optional(),
    privacy: PrivacySettingsSchema.optional(),
    appearance: z.record(z.unknown()).optional(),
    locale: z.record(z.unknown()).optional(),
    keyboard: z.record(z.unknown()).optional(),
  })
  .passthrough();

export type AllSettings = z.infer<typeof AllSettingsSchema>;
export type PrivacySettings = z.infer<typeof PrivacySettingsSchema>;
export type SelectivePrivacyRule = z.infer<typeof SelectivePrivacyRuleSchema>;
export type SelectivePrivacySettings = z.infer<typeof SelectivePrivacySettingsSchema>;

export const UpdateSettingsResponseSchema = z.object({}).passthrough();

export type UpdateSettingsResponse = z.infer<typeof UpdateSettingsResponseSchema>;
