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

async function installAuthRouteMocks(page: Page) {
  const requests = {
    forgotPassword: [] as unknown[],
    login: [] as unknown[],
    phoneRequest: [] as unknown[],
    phoneVerify: [] as unknown[],
    register: [] as unknown[],
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
      requests.login.push(body);

      await fulfillJson(route, {
        status: '2fa_required',
        two_factor_token: 'uat-two-factor-token',
      });
      return;
    }

    if (path === '/api/v1/auth/login/2fa') {
      const body = readJsonRequest(route);
      requests.twoFactor.push(body);

      await fulfillJson(route, {
        user: authUser({ email: 'twofa@cgraph.dev', username: 'twofa_owner' }),
        tokens,
      });
      return;
    }

    if (path === '/api/v1/auth/register') {
      const body = readJsonRequest(route);
      requests.register.push(body);

      await fulfillJson(route, {
        user: authUser({ email: 'new-owner@cgraph.dev', username: 'new_owner' }),
        tokens,
      });
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
      requests.resetPassword.push(body);

      await fulfillJson(route, { success: true, message: 'Password reset' });
      return;
    }

    if (path === '/api/v1/auth/verify-email') {
      const body = readJsonRequest(route);
      requests.verifyEmail.push(body);

      await fulfillJson(route, {
        email_verified: true,
        message: 'Email verified',
        user: authUser(),
      });
      return;
    }

    if (path === '/api/v1/auth/resend-verification') {
      const body = readJsonRequest(route);
      requests.resendVerification.push(body);

      await fulfillJson(route, {});
      return;
    }

    if (path === '/api/v1/auth/qr-session') {
      await fulfillJson(route, {
        session_id: 'qr-session-uat',
        qr_payload: 'cgraph://qr-login/qr-session-uat',
        expires_in: 300,
      });
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
      requests.phoneRequest.push(body);

      await fulfillJson(route, {
        session_id: 'phone-session-uat',
        expires_in: 300,
        transport: 'sms',
        retry_after: 0,
        call_fallback_available_after: 0,
        debug_verification_code: '123456',
      });
      return;
    }

    if (path === '/api/v1/auth/phone/verify') {
      const body = readJsonRequest(route);
      requests.phoneVerify.push(body);

      await fulfillJson(route, {
        user: authUser({
          email: null,
          username: 'phone_owner',
          phone_number: '+14155551234',
        }),
        tokens,
        is_new_user: false,
        session_id: 'phone-session-uat',
        next_step: 'completed',
      });
      return;
    }

    if (path === '/api/v1/me') {
      await fulfillJson(route, authUser());
      return;
    }

    if (path === '/api/v1/users/me/settings') {
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

    await page.goto('/verify-email?email=owner-uat%40cgraph.dev');
    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible();
    await page.getByRole('button', { name: /resend verification email/i }).click();
    await expect(page.getByText(/new verification email sent/i)).toBeVisible();
    expect(requests.resendVerification[0]).toMatchObject({ email: 'owner-uat@cgraph.dev' });
  });

  test('renders QR login and verifies phone login entry plus OTP completion', async ({ page }) => {
    const requests = await installAuthRouteMocks(page);

    await page.goto('/qr-login');
    await expect(page.getByText(/open cgraph on your phone/i)).toBeVisible();
    await expect(page.getByText(/waiting for scan/i)).toBeVisible();

    await page.goto('/login/phone');
    await expect(page.getByText('Phone login')).toBeVisible();
    await page.getByPlaceholder('(415) 555-1234').fill('(415) 555-1234');
    await page.getByRole('button', { name: /^next$/i }).click();

    await expect(page.getByRole('heading', { name: /enter the verification code/i })).toBeVisible();
    for (const [index, digit] of ['1', '2', '3', '4', '5', '6'].entries()) {
      await page.getByLabel(`Code digit ${index + 1}`).fill(digit);
    }

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
});
