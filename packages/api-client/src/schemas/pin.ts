import { z } from 'zod';
import { AuthenticatedRegistrationNextStepSchema, PhoneAuthUserSchema, TokensSchema } from './auth';

export const pinStatusSchema = z.object({
  has_pin: z.boolean(),
  registration_lock_enabled: z.boolean(),
  keyboard_type: z.enum(['numeric', 'alphanumeric']),
  pin_set_at: z.string().nullable(),
  needs_reminder: z.boolean(),
});

export type PinStatus = z.infer<typeof pinStatusSchema>;

export const pinSetRequestSchema = z.object({
  pin: z.string().min(4).max(20),
  keyboard_type: z.enum(['numeric', 'alphanumeric']).optional(),
  current_pin: z.string().optional(),
});

export type PinSetRequest = z.infer<typeof pinSetRequestSchema>;

export const pinRemoveRequestSchema = z.object({
  current_pin: z.string(),
});

export type PinRemoveRequest = z.infer<typeof pinRemoveRequestSchema>;

export const pinVerifyRequestSchema = z.object({
  pin: z.string(),
});

export type PinVerifyRequest = z.infer<typeof pinVerifyRequestSchema>;

export const registrationLockVerifySchema = z.object({
  session_id: z.string(),
  pin: z.string(),
});

export type RegistrationLockVerifyRequest = z.infer<typeof registrationLockVerifySchema>;

export const registrationLockSuccessSchema = z.object({
  user: PhoneAuthUserSchema,
  tokens: TokensSchema.nullable().optional(),
  is_new_user: z.boolean(),
  session_id: z.string().optional(),
  next_step: AuthenticatedRegistrationNextStepSchema.optional(),
});

export type RegistrationLockSuccess = z.infer<typeof registrationLockSuccessSchema>;

export const registrationLockErrorSchema = z.object({
  code: z.enum(['WRONG_PIN', 'REGISTRATION_LOCKED']),
  message: z.string(),
  attempts_remaining: z.number().optional(),
  time_remaining: z.number().optional(),
});

export type RegistrationLockError = z.infer<typeof registrationLockErrorSchema>;

export const messageResponseSchema = z.object({
  message: z.string(),
});
