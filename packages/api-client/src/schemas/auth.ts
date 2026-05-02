/**
 * Auth schemas.
 *
 * Covers login, register, refresh, 2FA, OAuth, wallet auth,
 * and password management responses.
 */
import { z } from 'zod';
import { UserSchema } from './user';

// ---------------------------------------------------------------------------
// Reusable token pair
// ---------------------------------------------------------------------------

export const TokensSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().optional(),
  expires_in: z.number().optional(),
});

export type Tokens = z.infer<typeof TokensSchema>;

// ---------------------------------------------------------------------------
// Auth user — the full user object returned inside auth responses.
// Uses .passthrough() because the API frequently includes extra fields
// (gamification, cosmetics, feature flags) that vary by platform and
// rollout state. Platform code is responsible for mapping to typed shapes.
// ---------------------------------------------------------------------------

export const AuthUserSchema = UserSchema.passthrough();

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const PhoneAuthUserSchema = AuthUserSchema.extend({
  email: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

/**
 * Successful login that returns user + tokens.
 */
export const LoginResponseSchema = z.object({
  user: AuthUserSchema,
  tokens: TokensSchema,
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/**
 * Login response when the account has 2FA enabled — the caller must
 * complete the second step via `verifyLoginTwoFactor`.
 */
export const TwoFactorRequiredSchema = z.object({
  status: z.literal('2fa_required'),
  two_factor_token: z.string(),
});

export type TwoFactorRequired = z.infer<typeof TwoFactorRequiredSchema>;

/**
 * Union of all possible login outcomes.
 */
export const LoginResultSchema = z.union([LoginResponseSchema, TwoFactorRequiredSchema]);

export type LoginResult = z.infer<typeof LoginResultSchema>;

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export const RegisterResponseSchema = z.object({
  user: AuthUserSchema,
  tokens: TokensSchema,
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

// ---------------------------------------------------------------------------
// Refresh
// ---------------------------------------------------------------------------

export const RefreshResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().optional(),
  expires_in: z.number().optional(),
});

export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;

// ---------------------------------------------------------------------------
// Two-factor authentication
// ---------------------------------------------------------------------------

/**
 * Response after a successful 2FA verification step (login or standalone verify).
 */
export const TwoFactorResponseSchema = z.object({
  user: AuthUserSchema,
  tokens: TokensSchema,
});

export type TwoFactorResponse = z.infer<typeof TwoFactorResponseSchema>;

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

export const OAuthProviderSchema = z.enum(['google', 'github', 'discord', 'apple']);

export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;

/**
 * OAuth providers listing.
 */
export const OAuthProvidersResponseSchema = z.object({
  providers: z.array(
    z.object({
      name: z.string(),
      display_name: z.string().optional(),
      enabled: z.boolean().optional(),
    })
  ),
});

export type OAuthProvidersResponse = z.infer<typeof OAuthProvidersResponseSchema>;

/**
 * OAuth callback / mobile verify response — same shape as a normal login.
 */
export const OAuthResponseSchema = z.object({
  user: AuthUserSchema,
  tokens: TokensSchema,
  is_new_user: z.boolean().optional(),
});

export type OAuthResponse = z.infer<typeof OAuthResponseSchema>;

// ---------------------------------------------------------------------------
// Password management
// ---------------------------------------------------------------------------

export const ForgotPasswordResponseSchema = z.object({
  message: z.string().optional(),
  sent: z.boolean().optional(),
});

export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponseSchema>;

export const ResetPasswordResponseSchema = z.object({
  message: z.string().optional(),
  success: z.boolean().optional(),
});

export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

export const VerifyEmailResponseSchema = z.object({
  message: z.string().optional(),
  email_verified: z.boolean().optional(),
  user: AuthUserSchema.optional(),
});

export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponseSchema>;

// ---------------------------------------------------------------------------
// Wallet auth
// ---------------------------------------------------------------------------

export const WalletChallengeResponseSchema = z.object({
  challenge: z.string(),
  nonce: z.string().optional(),
  expires_at: z.string().optional(),
});

export type WalletChallengeResponse = z.infer<typeof WalletChallengeResponseSchema>;

export const WalletAuthResponseSchema = z.object({
  user: AuthUserSchema,
  tokens: TokensSchema,
  is_new_user: z.boolean().optional(),
});

export type WalletAuthResponse = z.infer<typeof WalletAuthResponseSchema>;

// ---------------------------------------------------------------------------
// QR login
// ---------------------------------------------------------------------------

export const QrSessionResponseSchema = z
  .object({
    session_id: z.string(),
    qr_payload: z.string().optional(),
    qr_code: z.string().optional(),
    expires_in: z.number().optional(),
    expires_at: z.string().optional(),
  })
  .transform((session) => ({
    ...session,
    qr_payload: session.qr_payload ?? session.qr_code ?? '',
    expires_in: session.expires_in ?? 300,
  }));

export type QrSessionResponse = z.infer<typeof QrSessionResponseSchema>;

// ---------------------------------------------------------------------------
// 2FA management (authenticated)
// ---------------------------------------------------------------------------

export const TwoFactorStatusSchema = z.object({
  enabled: z.boolean(),
  backup_codes_remaining: z.number().optional(),
});

export type TwoFactorStatus = z.infer<typeof TwoFactorStatusSchema>;

export const TwoFactorSetupSchema = z.object({
  secret: z.string(),
  qr_code_url: z.string().optional(),
  backup_codes: z.array(z.string()).optional(),
});

export type TwoFactorSetup = z.infer<typeof TwoFactorSetupSchema>;

export const BackupCodesSchema = z.object({
  backup_codes: z.array(z.string()),
});

export type BackupCodes = z.infer<typeof BackupCodesSchema>;

// ---------------------------------------------------------------------------
// Phone registration (Signal-style OTP flow)
// ---------------------------------------------------------------------------

function normalizeCountryCallingCode(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length > 0 ? `+${digits}` : value;
}

export const CountrySchema = z
  .object({
    code: z.string(),
    name: z.string(),
    calling_code: z.string(),
    flag: z.string().optional(),
  })
  .transform((country) => ({
    ...country,
    calling_code: normalizeCountryCallingCode(country.calling_code),
  }));

export type Country = z.infer<typeof CountrySchema>;

const CountriesPayloadSchema = z.object({
  countries: z.array(CountrySchema),
});

function unwrapCountriesPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return { countries: payload };
  }

  if (typeof payload !== 'object' || payload === null) {
    return payload;
  }

  if ('countries' in payload) {
    return payload;
  }

  if ('data' in payload) {
    return unwrapCountriesPayload(payload.data);
  }

  return payload;
}

export const CountriesResponseSchema = z.preprocess(unwrapCountriesPayload, CountriesPayloadSchema);

export type CountriesResponse = z.infer<typeof CountriesResponseSchema>;

/**
 * Signal-style RegistrationSessionMetadata fields shared by SMS request and
 * call-fallback responses. Mirrors `RegistrationSessionMetadataJson` in
 * Signal-Android: nextSms / nextCall / nextVerificationAttempt /
 * allowedToRequestCode / requestedInformation / verified.
 */
const PhoneRegistrationSessionFields = {
  session_id: z.string().optional(),
  phone_number: z.string().optional(),
  expires_in: z.number().optional(),
  transport: z.enum(['sms', 'voice']).optional(),
  retry_after: z.number().optional(),
  call_fallback_available_after: z.number().nullable().optional(),
  next_sms_after: z.number().optional(),
  next_call_after: z.number().nullable().optional(),
  voice_available: z.boolean().optional(),
  next_verification_attempt: z.number().optional(),
  allowed_to_request_code: z.boolean().optional(),
  verified: z.boolean().optional(),
  challenges: z.array(z.string()).optional(),
  debug_verification_code: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
} as const;

export const PhoneRequestResponseSchema = z.object({
  ...PhoneRegistrationSessionFields,
  expires_in: z.number(),
});

export type PhoneRequestResponse = z.infer<typeof PhoneRequestResponseSchema>;

const PhoneVerifyBaseSchema = z.object({
  user: PhoneAuthUserSchema,
  is_new_user: z.boolean(),
  session_id: z.string().optional(),
});

const CompletedRegistrationStepSchema = z
  .enum(['complete', 'completed'])
  .transform(() => 'completed' as const);

export const AuthenticatedRegistrationNextStepSchema = z.union([
  z.enum(['profile', 'permissions', 'device_attestation']),
  CompletedRegistrationStepSchema,
]);

export type AuthenticatedRegistrationNextStep = z.infer<
  typeof AuthenticatedRegistrationNextStepSchema
>;

const PostDeviceAttestationNextStepSchema = z.union([
  z.enum(['profile', 'permissions']),
  CompletedRegistrationStepSchema,
]);

export const PhoneVerifyResponseSchema = z.union([
  PhoneVerifyBaseSchema.extend({
    tokens: z.null().optional(),
    next_step: z.enum(['registration_lock', 'device_attestation']),
  }),
  PhoneVerifyBaseSchema.extend({
    tokens: TokensSchema,
    next_step: PostDeviceAttestationNextStepSchema.optional(),
  }),
]);

export type PhoneVerifyResponse = z.infer<typeof PhoneVerifyResponseSchema>;

export const PhoneCallFallbackResponseSchema = z.object(PhoneRegistrationSessionFields);

export type PhoneCallFallbackResponse = z.infer<typeof PhoneCallFallbackResponseSchema>;

export const DeviceAttestationChallengeResponseSchema = z.object({
  challenge: z.string(),
  session_id: z.string().optional(),
});

export type DeviceAttestationChallengeResponse = z.infer<
  typeof DeviceAttestationChallengeResponseSchema
>;

export const DeviceAttestationVerifyResponseSchema = z.union([
  PhoneVerifyBaseSchema.extend({
    tokens: z.null().optional(),
    next_step: z.literal('device_attestation'),
  }),
  PhoneVerifyBaseSchema.extend({
    tokens: TokensSchema,
    next_step: PostDeviceAttestationNextStepSchema.optional(),
  }),
]);

export type DeviceAttestationVerifyResponse = z.infer<typeof DeviceAttestationVerifyResponseSchema>;
