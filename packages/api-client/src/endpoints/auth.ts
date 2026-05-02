/**
 * Auth endpoints.
 *
 * Transport-only — makes HTTP requests and returns typed results.
 * Does NOT store tokens, manage refresh orchestration, or handle
 * OAuth redirects. That responsibility belongs to platform code
 * (web auth store / mobile authStore).
 *
 * Endpoints under /api/v1/auth.
 */
import { z } from 'zod';
import type { AxiosInstance } from 'axios';

import { apiCall } from '../schemas/api-result';
import type { ApiResult } from '../schemas/api-result';
import {
  DeviceAttestationChallengeResponseSchema,
  DeviceAttestationVerifyResponseSchema,
  LoginResultSchema,
  RegisterResponseSchema,
  RefreshResponseSchema,
  TwoFactorResponseSchema,
  OAuthProvidersResponseSchema,
  OAuthResponseSchema,
  ForgotPasswordResponseSchema,
  ResetPasswordResponseSchema,
  VerifyEmailResponseSchema,
  WalletChallengeResponseSchema,
  WalletAuthResponseSchema,
  QrSessionResponseSchema,
  TwoFactorStatusSchema,
  TwoFactorSetupSchema,
  BackupCodesSchema,
  PhoneRequestResponseSchema,
  PhoneVerifyResponseSchema,
  PhoneCallFallbackResponseSchema,
  CountriesResponseSchema,
} from '../schemas/auth';
import type {
  DeviceAttestationChallengeResponse,
  DeviceAttestationVerifyResponse,
  LoginResult,
  RegisterResponse,
  RefreshResponse,
  TwoFactorResponse,
  OAuthProvidersResponse,
  OAuthResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  VerifyEmailResponse,
  WalletChallengeResponse,
  WalletAuthResponse,
  QrSessionResponse,
  TwoFactorStatus,
  TwoFactorSetup,
  BackupCodes,
  PhoneRequestResponse,
  PhoneVerifyResponse,
  PhoneCallFallbackResponse,
  CountriesResponse,
  Country,
} from '../schemas/auth';

export type {
  DeviceAttestationChallengeResponse,
  DeviceAttestationVerifyResponse,
  LoginResult,
  RegisterResponse,
  RefreshResponse,
  TwoFactorResponse,
  OAuthProvidersResponse,
  OAuthResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  VerifyEmailResponse,
  WalletChallengeResponse,
  WalletAuthResponse,
  QrSessionResponse,
  TwoFactorStatus,
  TwoFactorSetup,
  BackupCodes,
  PhoneRequestResponse,
  PhoneVerifyResponse,
  PhoneCallFallbackResponse,
  CountriesResponse,
  Country,
};

const EmptySchema = z.object({}).passthrough();

export interface RegisterParams {
  readonly email: string;
  readonly password: string;
  readonly password_confirmation: string;
  readonly username?: string;
}

export interface WalletVerifyParams {
  readonly wallet_address: string;
  readonly signature: string;
  readonly challenge: string;
}

function withTurnstileToken<T extends Record<string, unknown>>(
  payload: T,
  turnstileToken?: string | null
): T & { readonly turnstile_token?: string } {
  return turnstileToken ? { ...payload, turnstile_token: turnstileToken } : payload;
}

/**
 * Creates auth endpoints.
 *
 * @param http - Axios instance configured with the base URL and auth headers
 * @returns Object containing all auth-related endpoint methods
 */
export function createAuthEndpoints(http: AxiosInstance) {
  return {
    // -------------------------------------------------------------------------
    // Core session management
    // -------------------------------------------------------------------------

    /**
     * Log in with email/username and password.
     * Returns either a full auth response or a 2FA challenge.
     */
    async login(
      identifier: string,
      password: string,
      turnstileToken?: string | null
    ): Promise<ApiResult<LoginResult>> {
      return apiCall(
        () =>
          http.post(
            '/api/v1/auth/login',
            withTurnstileToken({ identifier, password }, turnstileToken)
          ),
        LoginResultSchema
      );
    },

    /**
     * Register a new account.
     * Password confirmation must match password.
     */
    async register(
      params: RegisterParams,
      turnstileToken?: string | null
    ): Promise<ApiResult<RegisterResponse>> {
      return apiCall(
        () =>
          http.post('/api/v1/auth/register', withTurnstileToken({ user: params }, turnstileToken)),
        RegisterResponseSchema
      );
    },

    /**
     * Refresh an access token using a refresh token.
     * Returns a new token pair.
     */
    async refresh(refreshToken: string): Promise<ApiResult<RefreshResponse>> {
      return apiCall(
        () => http.post('/api/v1/auth/refresh', { refresh_token: refreshToken }),
        RefreshResponseSchema
      );
    },

    /**
     * Log out the current session.
     * Requires the caller to hold a valid access token (authenticated route).
     */
    async logout(): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.post('/api/v1/auth/logout'), EmptySchema);
    },

    // -------------------------------------------------------------------------
    // Password management
    // -------------------------------------------------------------------------

    /**
     * Request a password-reset email.
     */
    async forgotPassword(
      email: string,
      turnstileToken?: string | null
    ): Promise<ApiResult<ForgotPasswordResponse>> {
      return apiCall(
        () =>
          http.post('/api/v1/auth/forgot-password', withTurnstileToken({ email }, turnstileToken)),
        ForgotPasswordResponseSchema
      );
    },

    /**
     * Reset password using the token from the reset email.
     */
    async resetPassword(
      token: string,
      password: string,
      passwordConfirmation: string,
      turnstileToken?: string | null
    ): Promise<ApiResult<ResetPasswordResponse>> {
      return apiCall(
        () =>
          http.post(
            '/api/v1/auth/reset-password',
            withTurnstileToken(
              {
                token,
                password,
                password_confirmation: passwordConfirmation,
              },
              turnstileToken
            )
          ),
        ResetPasswordResponseSchema
      );
    },

    // -------------------------------------------------------------------------
    // Email verification
    // -------------------------------------------------------------------------

    /**
     * Verify an email address using the token from the verification email.
     */
    async verifyEmail(token: string): Promise<ApiResult<VerifyEmailResponse>> {
      return apiCall(
        () => http.post('/api/v1/auth/verify-email', { token }),
        VerifyEmailResponseSchema
      );
    },

    /**
     * Resend the email verification link.
     * Requires authentication.
     */
    async resendVerification(): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.post('/api/v1/auth/resend-verification'), EmptySchema);
    },

    // -------------------------------------------------------------------------
    // Two-factor authentication (login step)
    // -------------------------------------------------------------------------

    /**
     * Complete login when 2FA is required.
     * Supply the temporary two_factor_token from the login response and the
     * TOTP code from the authenticator app.
     */
    async verifyLoginTwoFactor(
      twoFactorToken: string,
      code: string
    ): Promise<ApiResult<TwoFactorResponse>> {
      return apiCall(
        () =>
          http.post('/api/v1/auth/login/2fa', {
            two_factor_token: twoFactorToken,
            code,
          }),
        TwoFactorResponseSchema
      );
    },

    // -------------------------------------------------------------------------
    // Two-factor authentication management (authenticated)
    // -------------------------------------------------------------------------

    /** Get current 2FA status. */
    async getTwoFactorStatus(): Promise<ApiResult<TwoFactorStatus>> {
      return apiCall(() => http.get('/api/v1/auth/2fa/status'), TwoFactorStatusSchema);
    },

    /** Begin 2FA setup — returns the TOTP secret and QR code URL. */
    async setupTwoFactor(): Promise<ApiResult<TwoFactorSetup>> {
      return apiCall(() => http.post('/api/v1/auth/2fa/setup'), TwoFactorSetupSchema);
    },

    /** Enable 2FA after confirming the TOTP code from setup. */
    async enableTwoFactor(code: string): Promise<ApiResult<BackupCodes>> {
      return apiCall(() => http.post('/api/v1/auth/2fa/enable', { code }), BackupCodesSchema);
    },

    /** Verify a TOTP code (standalone, not during login). */
    async verifyTwoFactor(code: string): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.post('/api/v1/auth/2fa/verify', { code }), EmptySchema);
    },

    /** Disable 2FA. Requires current password or a valid TOTP code. */
    async disableTwoFactor(
      params: { readonly code?: string; readonly password?: string } = {}
    ): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.post('/api/v1/auth/2fa/disable', params), EmptySchema);
    },

    /** Regenerate 2FA backup codes. */
    async regenerateBackupCodes(): Promise<ApiResult<BackupCodes>> {
      return apiCall(() => http.post('/api/v1/auth/2fa/backup-codes'), BackupCodesSchema);
    },

    /** Use a backup code in place of a TOTP code. */
    async useBackupCode(code: string): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.post('/api/v1/auth/2fa/backup-codes/use', { code }), EmptySchema);
    },

    // -------------------------------------------------------------------------
    // OAuth
    // -------------------------------------------------------------------------

    /** List available OAuth providers. */
    async listOAuthProviders(): Promise<ApiResult<OAuthProvidersResponse>> {
      return apiCall(() => http.get('/api/v1/auth/oauth/providers'), OAuthProvidersResponseSchema);
    },

    /**
     * Verify a token obtained from a native mobile OAuth SDK.
     * Used when the OAuth flow completes inside the mobile app rather than
     * via a browser redirect.
     */
    async mobileOAuth(
      provider: string,
      params: { readonly token: string; readonly [key: string]: unknown }
    ): Promise<ApiResult<OAuthResponse>> {
      return apiCall(
        () => http.post(`/api/v1/auth/oauth/${provider}/mobile`, params),
        OAuthResponseSchema
      );
    },

    /** Link an OAuth provider to the currently authenticated account. */
    async linkOAuth(
      provider: string,
      params: { readonly code: string; readonly [key: string]: unknown }
    ): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.post(`/api/v1/auth/oauth/${provider}/link`, params), EmptySchema);
    },

    /** Unlink an OAuth provider from the currently authenticated account. */
    async unlinkOAuth(provider: string): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(() => http.delete(`/api/v1/auth/oauth/${provider}/link`), EmptySchema);
    },

    // -------------------------------------------------------------------------
    // Wallet authentication
    // -------------------------------------------------------------------------

    /**
     * Request a sign challenge for wallet-based authentication.
     * The client must sign the returned challenge string with their private key.
     */
    async walletChallenge(walletAddress: string): Promise<ApiResult<WalletChallengeResponse>> {
      return apiCall(
        () => http.post('/api/v1/auth/wallet/challenge', { wallet_address: walletAddress }),
        WalletChallengeResponseSchema
      );
    },

    /**
     * Verify a signed wallet challenge to authenticate or register.
     */
    async walletVerify(params: WalletVerifyParams): Promise<ApiResult<WalletAuthResponse>> {
      return apiCall(
        () => http.post('/api/v1/auth/wallet/verify', params),
        WalletAuthResponseSchema
      );
    },

    /** Log in with an anonymous wallet (PIN-protected). */
    async walletLogin(params: {
      readonly wallet_address: string;
      readonly pin: string;
    }): Promise<ApiResult<WalletAuthResponse>> {
      return apiCall(
        () => http.post('/api/v1/auth/wallet/login', params),
        WalletAuthResponseSchema
      );
    },

    /** Register a new anonymous wallet account. */
    async walletRegister(params: {
      readonly wallet_address: string;
      readonly pin: string;
      readonly username?: string;
    }): Promise<ApiResult<WalletAuthResponse>> {
      return apiCall(
        () => http.post('/api/v1/auth/wallet/register', params),
        WalletAuthResponseSchema
      );
    },

    // -------------------------------------------------------------------------
    // QR login
    // -------------------------------------------------------------------------

    /**
     * Create a QR login session (unauthenticated — desktop/web initiates this).
     */
    async createQrSession(): Promise<ApiResult<QrSessionResponse>> {
      return apiCall(() => http.post('/api/v1/auth/qr-session'), QrSessionResponseSchema);
    },

    /**
     * Approve a QR login from an authenticated mobile session.
     */
    async approveQrLogin(sessionId: string): Promise<ApiResult<Record<string, unknown>>> {
      return apiCall(
        () => http.post('/api/v1/auth/qr-login', { session_id: sessionId }),
        EmptySchema
      );
    },

    // -------------------------------------------------------------------------
    // Phone authentication (Signal-style OTP)
    // -------------------------------------------------------------------------

    /**
     * Request an OTP code sent via SMS to the given phone number (E.164).
     * Optionally include country_code for user creation context.
     */
    async phoneRequestCode(
      phoneNumber: string,
      countryCode?: string,
      turnstileToken?: string | null
    ): Promise<ApiResult<PhoneRequestResponse>> {
      return apiCall(
        () =>
          http.post(
            '/api/v1/auth/phone/request',
            withTurnstileToken(
              {
                phone_number: phoneNumber,
                ...(countryCode ? { country_code: countryCode } : {}),
              },
              turnstileToken
            )
          ),
        PhoneRequestResponseSchema
      );
    },

    /**
     * Verify the 6-digit OTP code. On success returns tokens + user.
     * If the phone is new, a user account is created automatically.
     */
    async phoneVerifyCode(
      phoneNumber: string,
      code: string,
      sessionId?: string | null,
      turnstileToken?: string | null
    ): Promise<ApiResult<PhoneVerifyResponse>> {
      return apiCall(
        () =>
          http.post(
            '/api/v1/auth/phone/verify',
            withTurnstileToken(
              {
                phone_number: phoneNumber,
                code,
                ...(sessionId ? { session_id: sessionId } : {}),
              },
              turnstileToken
            )
          ),
        PhoneVerifyResponseSchema
      );
    },

    /**
     * Request a voice call fallback for OTP delivery.
     * Only available 60 seconds after the initial SMS request.
     */
    async phoneCallFallback(phoneNumber: string): Promise<ApiResult<PhoneCallFallbackResponse>> {
      return apiCall(
        () =>
          http.post('/api/v1/auth/phone/call-fallback', {
            phone_number: phoneNumber,
          }),
        PhoneCallFallbackResponseSchema
      );
    },

    async phoneDeviceAttestationChallenge(
      sessionId: string
    ): Promise<ApiResult<DeviceAttestationChallengeResponse>> {
      return apiCall(
        () =>
          http.post('/api/v1/auth/device-attestation/challenge', {
            session_id: sessionId,
          }),
        DeviceAttestationChallengeResponseSchema
      );
    },

    async phoneDeviceAttestApple(
      sessionId: string,
      keyId: string,
      attestation: string
    ): Promise<ApiResult<DeviceAttestationVerifyResponse>> {
      return apiCall(
        () =>
          http.put('/api/v1/auth/device-attestation/attest/apple', {
            session_id: sessionId,
            key_id: keyId,
            attestation,
          }),
        DeviceAttestationVerifyResponseSchema
      );
    },

    async phoneDeviceAttestAndroid(
      sessionId: string,
      integrityToken: string
    ): Promise<ApiResult<DeviceAttestationVerifyResponse>> {
      return apiCall(
        () =>
          http.post('/api/v1/auth/device-attestation/attest/android', {
            session_id: sessionId,
            integrity_token: integrityToken,
          }),
        DeviceAttestationVerifyResponseSchema
      );
    },

    /**
     * List available countries for the phone entry country picker.
     * Optionally filter by search query.
     */
    async phoneCountries(query?: string): Promise<ApiResult<CountriesResponse>> {
      const params = query ? { q: query } : {};
      return apiCall(
        () => http.get('/api/v1/auth/phone/countries', { params }),
        CountriesResponseSchema
      );
    },
  };
}
