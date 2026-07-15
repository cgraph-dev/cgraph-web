import { expect, test, type Page, type Route } from '@playwright/test';

const strongPassword = 'CGraph!2026Password';

test.use({ storageState: { cookies: [], origins: [] } });

function authUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'auth-user-uat',
    uid: 'auth-user-uat',
    user_id: 4242,
    user_id_display: '#000004242',
    email: 'owner-uat@cgraph.dev',
    username: 'owner_uat',
    display_name: 'Owner UAT',
    avatar_url: null,
    email_verified_at: '2026-01-01T00:00:00.000Z',
    onboarding_completed: true,
    status: 'online',
    karma: 0,
    is_verified: true,
    is_premium: false,
    can_change_username: true,
    inserted_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const tokens = {
  access_token: 'uat-access-token',
  refresh_token: 'uat-refresh-token',
  token_type: 'Bearer',
  expires_in: 900,
};

interface MockJsonResponse {
  readonly body: unknown;
  readonly status?: number;
}

interface AuthRouteMockOptions {
  readonly loginResponses?: readonly MockJsonResponse[];
  readonly phoneRequestResponses?: readonly MockJsonResponse[];
  readonly phoneVerifyResponses?: readonly MockJsonResponse[];
  readonly phoneCallFallbackResponses?: readonly MockJsonResponse[];
  readonly registrationLockResponses?: readonly MockJsonResponse[];
  readonly profileUpdateResponses?: readonly MockJsonResponse[];
  readonly qrSessionResponses?: readonly MockJsonResponse[];
  readonly registerResponses?: readonly MockJsonResponse[];
  readonly resetPasswordResponses?: readonly MockJsonResponse[];
  readonly twoFactorResponses?: readonly MockJsonResponse[];
  readonly verifyEmailResponses?: readonly MockJsonResponse[];
}

function mockResponse(body: unknown, status = 200): MockJsonResponse {
  return { body, status };
}

function selectMockResponse(
  responses: readonly MockJsonResponse[] | undefined,
  index: number,
  fallback: MockJsonResponse
): MockJsonResponse {
  if (!responses || responses.length === 0) {
    return fallback;
  }

  return responses[Math.min(index, responses.length - 1)] ?? fallback;
}

async function fulfillMockResponse(route: Route, response: MockJsonResponse): Promise<void> {
  await fulfillJson(route, response.body, response.status ?? 200);
}

function readJsonRequest(route: Route): unknown {
  const body = route.request().postData();

  if (!body) return null;

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

async function fulfillJson(route: Route, data: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(status >= 400 ? data : { data }),
  });
}

async function installAuthRouteMocks(page: Page, options: AuthRouteMockOptions = {}) {
  const requests = {
    forgotPassword: [] as unknown[],
    login: [] as unknown[],
    phoneCallFallback: [] as unknown[],
    phoneRequest: [] as unknown[],
    phoneVerify: [] as unknown[],
    profileUpdate: [] as unknown[],
    qrSession: [] as unknown[],
    register: [] as unknown[],
    registrationLock: [] as unknown[],
    resetPassword: [] as unknown[],
    resendVerification: [] as unknown[],
    twoFactor: [] as unknown[],
    verifyEmail: [] as unknown[],
  };

  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === '/api/v1/auth/oauth/providers') {
      await fulfillJson(route, { providers: [] });
      return;
    }

    if (path === '/api/v1/auth/login') {
      const body = readJsonRequest(route);
      const attempt = requests.login.length;
      requests.login.push(body);

      await fulfillMockResponse(
        route,
        selectMockResponse(
          options.loginResponses,
          attempt,
          mockResponse({
            status: '2fa_required',
            two_factor_token: 'uat-two-factor-token',
          })
        )
      );
      return;
    }

    if (path === '/api/v1/auth/login/2fa') {
      const body = readJsonRequest(route);
      const attempt = requests.twoFactor.length;
      requests.twoFactor.push(body);

      await fulfillMockResponse(
        route,
        selectMockResponse(
          options.twoFactorResponses,
          attempt,
          mockResponse({
            user: authUser({ email: 'twofa@cgraph.dev', username: 'twofa_owner' }),
            tokens,
          })
        )
      );
      return;
    }

    if (path === '/api/v1/auth/register') {
      const body = readJsonRequest(route);
      const attempt = requests.register.length;
      requests.register.push(body);

      await fulfillMockResponse(
        route,
        selectMockResponse(
          options.registerResponses,
          attempt,
          mockResponse({
            user: authUser({ email: 'new-owner@cgraph.dev', username: 'new_owner' }),
            tokens,
          })
        )
      );
      return;
    }

    if (path === '/api/v1/auth/forgot-password') {
      const body = readJsonRequest(route);
      requests.forgotPassword.push(body);

      await fulfillJson(route, { sent: true, message: 'Reset email sent' });
      return;
    }

    if (path === '/api/v1/auth/reset-password') {
      const body = readJsonRequest(route);
      const attempt = requests.resetPassword.length;
      requests.resetPassword.push(body);

      await fulfillMockResponse(
        route,
        selectMockResponse(
          options.resetPasswordResponses,
          attempt,
          mockResponse({ success: true, message: 'Password reset' })
        )
      );
      return;
    }

    if (path === '/api/v1/auth/verify-email') {
      const body = readJsonRequest(route);
      const attempt = requests.verifyEmail.length;
      requests.verifyEmail.push(body);

      await fulfillMockResponse(
        route,
        selectMockResponse(
          options.verifyEmailResponses,
          attempt,
          mockResponse({
            email_verified: true,
            message: 'Email verified',
            user: authUser(),
            tokens,
          })
        )
      );
      return;
    }

    if (path === '/api/v1/auth/resend-verification') {
      const body = readJsonRequest(route);
      requests.resendVerification.push(body);

      await fulfillJson(route, {});
      return;
    }

    if (path === '/api/v1/auth/qr-session') {
      const attempt = requests.qrSession.length;
      requests.qrSession.push(null);

      await fulfillMockResponse(
        route,
        selectMockResponse(
          options.qrSessionResponses,
          attempt,
          mockResponse({
            session_id: 'qr-session-uat',
            qr_payload: 'cgraph://qr-login/qr-session-uat',
            expires_in: 300,
          })
        )
      );
      return;
    }

    if (path === '/api/v1/auth/phone/countries') {
      await fulfillJson(route, {
        countries: [
          { code: 'US', name: 'United States', calling_code: '+1', flag: '🇺🇸' },
          { code: 'RO', name: 'Romania', calling_code: '+40', flag: '🇷🇴' },
        ],
      });
      return;
    }

    if (path === '/api/v1/auth/phone/request') {
      const body = readJsonRequest(route);
      const attempt = requests.phoneRequest.length;
      requests.phoneRequest.push(body);

      await fulfillMockResponse(
        route,
        selectMockResponse(
          options.phoneRequestResponses,
          attempt,
          mockResponse({
            session_id: 'phone-session-uat',
            expires_in: 300,
            transport: 'sms',
            retry_after: 0,
            call_fallback_available_after: 0,
            debug_verification_code: '123456',
          })
        )
      );
      return;
    }

    if (path === '/api/v1/auth/phone/call-fallback') {
      const body = readJsonRequest(route);
      const attempt = requests.phoneCallFallback.length;
      requests.phoneCallFallback.push(body);

      await fulfillMockResponse(
        route,
        selectMockResponse(
          options.phoneCallFallbackResponses,
          attempt,
          mockResponse({
            session_id: 'phone-session-voice-uat',
            expires_in: 300,
            transport: 'voice',
            retry_after: 0,
            call_fallback_available_after: 0,
            debug_verification_code: '654321',
          })
        )
      );
      return;
    }

    if (path === '/api/v1/auth/phone/verify') {
      const body = readJsonRequest(route);
      const attempt = requests.phoneVerify.length;
      requests.phoneVerify.push(body);

      await fulfillMockResponse(
        route,
        selectMockResponse(
          options.phoneVerifyResponses,
          attempt,
          mockResponse({
            user: authUser({
              email: null,
              username: 'phone_owner',
              phone_number: '+14155551234',
            }),
            tokens,
            is_new_user: false,
            session_id: 'phone-session-uat',
            next_step: 'completed',
          })
        )
      );
      return;
    }

    if (path === '/api/v1/auth/registration-lock/verify') {
      const body = readJsonRequest(route);
      const attempt = requests.registrationLock.length;
      requests.registrationLock.push(body);

      await fulfillMockResponse(
        route,
        selectMockResponse(
          options.registrationLockResponses,
          attempt,
          mockResponse({
            user: authUser({
              email: null,
              username: 'locked_phone_owner',
              phone_number: '+14155551234',
            }),
            tokens,
            is_new_user: false,
            session_id: 'phone-lock-session-uat',
            next_step: 'completed',
          })
        )
      );
      return;
    }

    if (path === '/api/v1/me' && request.method() === 'PUT') {
      const body = readJsonRequest(route);
      const attempt = requests.profileUpdate.length;
      requests.profileUpdate.push(body);

      await fulfillMockResponse(
        route,
        selectMockResponse(
          options.profileUpdateResponses,
          attempt,
          mockResponse(authUser({ display_name: 'Phone Founder', username: 'phone_founder' }))
        )
      );
      return;
    }

    if (path === '/api/v1/me') {
      await fulfillJson(route, authUser());
      return;
    }

    if (path === '/api/v1/settings' || path.startsWith('/api/v1/settings/')) {
      await fulfillJson(route, {});
      return;
    }

    if (path === '/api/v1/conversations') {
      await fulfillJson(route, []);
      return;
    }

    await fulfillJson(route, {});
  });

  return requests;
}

async function requestPhoneCode(page: Page): Promise<void> {
  await page.getByPlaceholder('(415) 555-1234').fill('(415) 555-1234');
  await page.getByRole('button', { name: /^next$/i }).click();
  await expect(page.getByRole('heading', { name: /enter the verification code/i })).toBeVisible();
}

async function fillOtpCode(page: Page, code: string): Promise<void> {
  for (const [index, digit] of code.split('').entries()) {
    await page.getByLabel(`Code digit ${index + 1}`).fill(digit);
  }
}

test.describe('auth and account lifecycle routes', () => {
  test('completes the email login 2FA route without a dead end', async ({ page }) => {
    const requests = await installAuthRouteMocks(page);

    await page.goto('/login');
    await page.getByLabel(/email or username/i).fill('twofa@cgraph.dev');
    await page.locator('#password').fill(strongPassword);
    await page.getByRole('button', { name: /^sign in/i }).click();

    await expect(page.getByRole('heading', { name: /two-factor authentication/i })).toBeVisible();
    await page.locator('#two-factor-code').fill('123456');

    await expect(page).toHaveURL(/\/messages$/);
    await expect.poll(() => requests.login.length).toBe(1);
    await expect.poll(() => requests.twoFactor.length).toBe(1);
    expect(requests.twoFactor[0]).toMatchObject({
      two_factor_token: 'uat-two-factor-token',
      code: '123456',
    });
  });

  test('keeps credential and 2FA failures visible on the login route', async ({ page }) => {
    const requests = await installAuthRouteMocks(page, {
      loginResponses: [
        mockResponse(
          {
            error: {
              code: 'invalid_credentials',
              message: 'Invalid email or password',
            },
          },
          401
        ),
        mockResponse({
          status: '2fa_required',
          two_factor_token: 'uat-two-factor-token',
        }),
      ],
      twoFactorResponses: [
        mockResponse(
          {
            error: {
              code: 'two_factor_invalid',
              message: 'Invalid verification code',
            },
          },
          401
        ),
      ],
    });

    await page.goto('/login');
    await page.getByLabel(/email or username/i).fill('twofa@cgraph.dev');
    await page.locator('#password').fill('wrong-password');
    await page.getByRole('button', { name: /^sign in/i }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Invalid email or password')).toBeVisible();
    expect(requests.twoFactor).toEqual([]);

    await page.locator('#password').fill(strongPassword);
    await page.getByRole('button', { name: /^sign in/i }).click();
    await expect(page.getByRole('heading', { name: /two-factor authentication/i })).toBeVisible();

    await page.locator('#two-factor-code').fill('654321');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Invalid verification code')).toBeVisible();
    await expect.poll(() => requests.login.length).toBe(2);
    await expect.poll(() => requests.twoFactor.length).toBe(1);
    expect(requests.twoFactor[0]).toMatchObject({
      two_factor_token: 'uat-two-factor-token',
      code: '654321',
    });
  });

  test('submits registration through the routed account creation page', async ({ page }) => {
    const requests = await installAuthRouteMocks(page);

    await page.goto('/register');
    await page.locator('#email').fill('new-owner@cgraph.dev');
    await page.locator('#username').fill('new_owner');
    await page.locator('#password').fill(strongPassword);
    await page.locator('#confirmPassword').fill(strongPassword);
    await page.getByLabel(/agree to the terms/i).check();
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/messages$/);
    await expect.poll(() => requests.register.length).toBe(1);
    expect(requests.register[0]).toMatchObject({
      user: {
        email: 'new-owner@cgraph.dev',
        username: 'new_owner',
        password: strongPassword,
        password_confirmation: strongPassword,
      },
    });
  });

  test('keeps duplicate registration failures on the account creation route', async ({ page }) => {
    const requests = await installAuthRouteMocks(page, {
      registerResponses: [
        mockResponse(
          {
            error: {
              code: 'email_taken',
              message: 'Email is already registered',
            },
          },
          422
        ),
      ],
    });

    await page.goto('/register');
    await page.locator('#email').fill('new-owner@cgraph.dev');
    await page.locator('#username').fill('new_owner');
    await page.locator('#password').fill(strongPassword);
    await page.locator('#confirmPassword').fill(strongPassword);
    await page.getByLabel(/agree to the terms/i).check();
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByText('Email is already registered')).toBeVisible();
    await expect.poll(() => requests.register.length).toBe(1);
    expect(requests.register[0]).toMatchObject({
      user: {
        email: 'new-owner@cgraph.dev',
        username: 'new_owner',
        password: strongPassword,
        password_confirmation: strongPassword,
      },
    });
  });

  test('keeps backend validation details visible for correction', async ({ page }) => {
    await installAuthRouteMocks(page, {
      registerResponses: [
        mockResponse(
          {
            error: {
              code: 'validation_error',
              message: 'Validation failed',
              details: {
                username: ['has already been taken'],
              },
            },
          },
          422
        ),
      ],
    });

    await page.goto('/register');
    await page.locator('#email').fill('new-owner@cgraph.dev');
    await page.locator('#username').fill('new_owner');
    await page.locator('#password').fill(strongPassword);
    await page.locator('#confirmPassword').fill(strongPassword);
    await page.getByLabel(/agree to the terms/i).check();
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('alert')).toContainText('username: has already been taken');
    await expect(page.locator('#email')).toHaveValue('new-owner@cgraph.dev');
    await expect(page.locator('#username')).toHaveValue('new_owner');

    await page.waitForTimeout(5100);
    await expect(page.getByRole('alert')).toContainText('username: has already been taken');
  });

  test('submits forgot-password, reset-password, and verify-email routes', async ({ page }) => {
    const requests = await installAuthRouteMocks(page);

    await page.goto('/forgot-password');
    await page.locator('#email').fill('owner-uat@cgraph.dev');
    await page.getByRole('button', { name: /send reset link|reset password|submit/i }).click();
    await expect(page.getByRole('heading', { name: /check.*email/i })).toBeVisible();
    expect(requests.forgotPassword[0]).toMatchObject({ email: 'owner-uat@cgraph.dev' });

    await page.goto('/reset-password?token=reset-token-uat');
    await page.getByPlaceholder('Enter new password').fill(strongPassword);
    await page.getByPlaceholder('Confirm new password').fill(strongPassword);
    await page.getByRole('button', { name: /^reset password/i }).click();
    await expect(page.getByRole('heading', { name: /password reset/i })).toBeVisible();
    expect(requests.resetPassword[0]).toMatchObject({
      token: 'reset-token-uat',
      password: strongPassword,
      password_confirmation: strongPassword,
    });

    await page.goto('/verify-email?token=verify-token-uat');
    await expect(page.getByRole('heading', { name: /email verified/i })).toBeVisible();
    expect(requests.verifyEmail[0]).toMatchObject({ token: 'verify-token-uat' });
    await page.getByRole('button', { name: /continue to app/i }).click();
    await expect(page).toHaveURL(/\/messages$/);
    await page.reload();
    await expect(page).toHaveURL(/\/messages$/);

    await page.goto('/verify-email?email=owner-uat%40cgraph.dev');
    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible();
    await page.getByRole('button', { name: /resend verification email/i }).click();
    await expect(page.getByText(/verification request received/i)).toBeVisible();
    expect(requests.resendVerification[0]).toMatchObject({ email: 'owner-uat@cgraph.dev' });
  });

  test('keeps a replaced verification link on the resend recovery route', async ({ page }) => {
    const requests = await installAuthRouteMocks(page, {
      verifyEmailResponses: [mockResponse({ error: 'Invalid verification token' }, 400)],
    });

    await page.goto('/verify-email?token=replaced-token-uat');
    await expect(page.getByRole('heading', { name: /link expired/i })).toBeVisible();
    await expect(page.getByText(/use only the newest link/i)).toBeVisible();

    await page.locator('#email').fill('owner-uat@cgraph.dev');
    await page.getByRole('button', { name: /resend verification email/i }).click();

    await expect(page.getByText(/verification request received/i)).toBeVisible();
    expect(requests.verifyEmail[0]).toMatchObject({ token: 'replaced-token-uat' });
    expect(requests.resendVerification[0]).toMatchObject({ email: 'owner-uat@cgraph.dev' });
  });

  test('keeps invalid, expired, and replayed reset tokens on the recovery route', async ({
    page,
  }) => {
    const invalidResetToken = {
      error: {
        code: 'invalid_reset_token',
        message: 'Invalid or expired reset token',
      },
    };
    const requests = await installAuthRouteMocks(page, {
      resetPasswordResponses: [
        mockResponse(invalidResetToken, 400),
        mockResponse(invalidResetToken, 400),
        mockResponse({ success: true, message: 'Password reset' }),
        mockResponse(invalidResetToken, 400),
      ],
    });

    async function submitReset(token: string) {
      await page.goto(`/reset-password?token=${token}`);
      await page.getByPlaceholder('Enter new password').fill(strongPassword);
      await page.getByPlaceholder('Confirm new password').fill(strongPassword);
      await page.getByRole('button', { name: /^reset password/i }).click();
    }

    await submitReset('invalid-token-uat');
    await expect(page.getByRole('heading', { name: /link expired/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /request new link/i })).toBeVisible();

    await submitReset('expired-token-uat');
    await expect(page.getByRole('heading', { name: /link expired/i })).toBeVisible();

    await submitReset('replay-token-uat');
    await expect(page.getByRole('heading', { name: /password reset/i })).toBeVisible();

    await submitReset('replay-token-uat');
    await expect(page.getByRole('heading', { name: /link expired/i })).toBeVisible();

    expect(requests.resetPassword).toEqual([
      expect.objectContaining({ token: 'invalid-token-uat' }),
      expect.objectContaining({ token: 'expired-token-uat' }),
      expect.objectContaining({ token: 'replay-token-uat' }),
      expect.objectContaining({ token: 'replay-token-uat' }),
    ]);
  });

  test('keeps QR login honest while mobile approval is unavailable and verifies phone login', async ({
    page,
  }) => {
    const requests = await installAuthRouteMocks(page);

    await page.goto('/qr-login');
    await expect(page.getByRole('heading', { name: /qr login requires the cgraph mobile app/i }))
      .toBeVisible();
    await expect(page.getByText(/use email or phone login on this browser/i)).toBeVisible();
    expect(requests.qrSession).toEqual([]);

    await page.goto('/login/phone');
    await expect(page.getByText('Phone login')).toBeVisible();
    await requestPhoneCode(page);
    await fillOtpCode(page, '123456');

    await expect(page).toHaveURL(/\/messages$/);
    expect(requests.phoneRequest[0]).toMatchObject({
      phone_number: '+14155551234',
      country_code: 'US',
    });
    await expect.poll(() => requests.phoneVerify.length).toBe(1);
    expect(requests.phoneVerify[0]).toMatchObject({
      phone_number: '+14155551234',
      code: '123456',
      session_id: 'phone-session-uat',
    });
  });

  test('does not create QR sessions when the mobile-assisted route is gated off', async ({ page }) => {
    const requests = await installAuthRouteMocks(page);

    await page.goto('/qr-login');
    await expect(page.getByRole('heading', { name: /qr login requires the cgraph mobile app/i }))
      .toBeVisible();
    await page.waitForTimeout(250);
    expect(requests.qrSession).toEqual([]);
  });

  test('completes new-user phone registration through profile and permissions', async ({ page }) => {
    const requests = await installAuthRouteMocks(page, {
      phoneVerifyResponses: [
        mockResponse({
          user: authUser({
            email: null,
            username: '',
            display_name: '',
            phone_number: '+14155551234',
          }),
          tokens,
          is_new_user: true,
          session_id: 'new-phone-session-uat',
          next_step: 'profile',
        }),
      ],
      profileUpdateResponses: [
        mockResponse(
          authUser({
            email: null,
            username: 'phone_founder',
            display_name: 'Phone Founder',
            phone_number: '+14155551234',
          })
        ),
      ],
    });

    await page.goto('/register/phone');
    await expect(page.getByText('Signal-style registration')).toBeVisible();
    await requestPhoneCode(page);
    await fillOtpCode(page, '123456');

    await expect(page.getByRole('heading', { name: /set up your profile/i })).toBeVisible();
    await page.getByLabel(/display name/i).fill('Phone Founder');
    await page.getByLabel(/username/i).fill('phone_founder');
    await page.getByRole('button', { name: /^continue$/i }).click();

    await expect(page.getByRole('heading', { name: /choose your permissions/i })).toBeVisible();
    const skipPermissionButton = page.getByRole('button', { name: /skip for now/i });
    if (await skipPermissionButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await skipPermissionButton.click();
    }
    await page.getByRole('button', { name: /continue to cgraph/i }).click();

    await expect(page).toHaveURL(/\/messages$/);
    expect(requests.profileUpdate[0]).toMatchObject({
      user: {
        display_name: 'Phone Founder',
        username: 'phone_founder',
      },
    });
  });

  test('allows phone OTP resend and voice-call fallback from the code screen', async ({ page }) => {
    const requests = await installAuthRouteMocks(page, {
      phoneRequestResponses: [
        mockResponse({
          session_id: 'phone-session-uat',
          expires_in: 300,
          transport: 'sms',
          retry_after: 0,
          call_fallback_available_after: 0,
          debug_verification_code: '123456',
        }),
        mockResponse({
          session_id: 'phone-session-retry-uat',
          expires_in: 300,
          transport: 'sms',
          retry_after: 0,
          call_fallback_available_after: 0,
          debug_verification_code: '234567',
        }),
      ],
      phoneCallFallbackResponses: [
        mockResponse({
          session_id: 'phone-session-voice-uat',
          expires_in: 300,
          transport: 'voice',
          retry_after: 0,
          call_fallback_available_after: 0,
          debug_verification_code: '654321',
        }),
      ],
    });

    await page.goto('/login/phone');
    await requestPhoneCode(page);

    await page.getByRole('button', { name: /resend sms/i }).click();
    await expect.poll(() => requests.phoneRequest.length).toBe(2);

    await page.getByRole('button', { name: /call me instead/i }).click();
    await expect.poll(() => requests.phoneCallFallback.length).toBe(1);
    await expect(page.getByText(/we are calling/i)).toBeVisible();
    await expect(page.getByText(/last delivery method: voice call/i)).toBeVisible();

    expect(requests.phoneCallFallback[0]).toMatchObject({
      phone_number: '+14155551234',
    });
  });

  test('completes phone login through registration-lock PIN verification', async ({ page }) => {
    const requests = await installAuthRouteMocks(page, {
      phoneVerifyResponses: [
        mockResponse({
          user: authUser({
            email: null,
            username: 'locked_phone_owner',
            phone_number: '+14155551234',
          }),
          tokens: null,
          is_new_user: false,
          session_id: 'phone-lock-session-uat',
          next_step: 'registration_lock',
        }),
      ],
      registrationLockResponses: [
        mockResponse({
          user: authUser({
            email: null,
            username: 'locked_phone_owner',
            phone_number: '+14155551234',
          }),
          tokens,
          is_new_user: false,
          session_id: 'phone-lock-session-uat',
          next_step: 'completed',
        }),
      ],
    });

    await page.goto('/login/phone');
    await requestPhoneCode(page);
    await fillOtpCode(page, '123456');

    await expect(page.getByRole('heading', { name: /enter your pin/i })).toBeVisible();
    await page.getByLabel(/enter pin/i).fill('1234');
    await page.getByRole('button', { name: /^submit$/i }).click();

    await expect(page).toHaveURL(/\/messages$/);
    expect(requests.registrationLock[0]).toMatchObject({
      session_id: 'phone-lock-session-uat',
      pin: '1234',
    });
  });

  test('keeps native-device-required phone sign-in on web with a clear recovery message', async ({
    page,
  }) => {
    await installAuthRouteMocks(page, {
      phoneVerifyResponses: [
        mockResponse({
          user: authUser({
            email: null,
            username: 'native_required_owner',
            phone_number: '+14155551234',
          }),
          tokens: null,
          is_new_user: false,
          session_id: 'native-required-session-uat',
          next_step: 'device_attestation',
        }),
      ],
    });

    await page.goto('/login/phone');
    await requestPhoneCode(page);
    await fillOtpCode(page, '123456');

    await expect(
      page.getByText(/requires native device verification.*switch back to email on web/i)
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /enter the verification code/i })).toBeVisible();
    await expect(page).toHaveURL(/\/login\/phone$/);
  });
});
