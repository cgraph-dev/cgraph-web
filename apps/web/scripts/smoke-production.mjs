#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

const baseUrl = process.env.SMOKE_BASE_URL ?? 'https://web.cgraph.org';
const apiOrigin = process.env.SMOKE_API_ORIGIN ?? 'https://cgraph-backend-prod-v2.fly.dev';
const expectTurnstile = process.env.SMOKE_EXPECT_TURNSTILE !== 'false';

function systemChromePath() {
  const explicitPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  if (explicitPath) return explicitPath;

  const candidates = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

function isFirstPartyUrl(url) {
  return url.startsWith(baseUrl) || url.startsWith(apiOrigin);
}

function matchesApiPath(url, path) {
  try {
    const parsed = new URL(url);
    return (
      (url.startsWith(baseUrl) || url.startsWith(apiOrigin)) &&
      parsed.pathname === path
    );
  } catch {
    return false;
  }
}

function isThirdPartyFrameNoise(url) {
  return url.includes('challenges.cloudflare.com') || url === 'about:srcdoc';
}

function waitForOAuthProviders(page) {
  return page
    .waitForResponse(
      (response) => matchesApiPath(response.url(), '/api/v1/auth/oauth/providers'),
      { timeout: 20_000 }
    )
    .catch(() => null);
}

async function launchBrowser() {
  const executablePath = systemChromePath();
  return chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });
}

async function main() {
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const badResponses = [];
  const failedRequests = [];
  const appConsoleErrors = [];
  const oauthProviderStatuses = [];

  page.on('console', (message) => {
    if (!['error', 'warning'].includes(message.type())) return;

    const location = message.location();
    if (isThirdPartyFrameNoise(location.url)) return;

    appConsoleErrors.push({
      type: message.type(),
      text: message.text().slice(0, 500),
      location,
    });
  });

  page.on('pageerror', (error) => {
    appConsoleErrors.push({
      type: 'pageerror',
      text: error.message.slice(0, 500),
      location: {},
    });
  });

  page.on('requestfailed', (request) => {
    if (!isFirstPartyUrl(request.url())) return;

    const failure = request.failure()?.errorText ?? 'unknown';
    const resourceType = request.resourceType();
    if (
      failure === 'net::ERR_ABORTED' &&
      ['image', 'script', 'stylesheet', 'font'].includes(resourceType)
    ) {
      return;
    }

    failedRequests.push({
      url: request.url(),
      resourceType,
      failure,
    });
  });

  page.on('response', (response) => {
    const url = response.url();
    if (!isFirstPartyUrl(url)) return;

    const status = response.status();
    if (status >= 400) {
      badResponses.push({ status, url });
    }
  });

  const loginOAuthProvidersResponse = waitForOAuthProviders(page);
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.getByRole('heading', { name: /welcome back/i }).waitFor({ timeout: 20_000 });
  oauthProviderStatuses.push((await loginOAuthProvidersResponse)?.status() ?? null);
  const loginOk = await page.getByRole('button', { name: /sign in/i }).isVisible();

  const countriesResponse = page.waitForResponse(
    (response) => matchesApiPath(response.url(), '/api/v1/auth/phone/countries'),
    { timeout: 20_000 }
  );
  await page.goto(`${baseUrl}/login/phone`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.getByText(/phone login/i).waitFor({ timeout: 20_000 });
  const countriesStatus = (await countriesResponse).status();
  const phoneInputOk = (await page.locator('input[type="tel"]').count()) >= 2;
  const phoneNextOk = await page.getByRole('button', { name: /^next$/i }).isVisible();

  const registerOAuthProvidersResponse = waitForOAuthProviders(page);
  await page.goto(`${baseUrl}/register`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.getByRole('heading', { name: /create your account/i }).waitFor({ timeout: 20_000 });
  oauthProviderStatuses.push((await registerOAuthProvidersResponse)?.status() ?? null);
  const registerOk = await page.getByRole('button', { name: /create account/i }).isVisible();

  await page.waitForTimeout(3_000);
  const turnstileFrames = page
    .frames()
    .filter((frame) => frame.url().includes('challenges.cloudflare.com')).length;

  await browser.close();

  const summary = {
    baseUrl,
    apiOrigin,
    loginOk,
    phoneInputOk,
    phoneNextOk,
    countriesStatus,
    oauthProviderStatuses,
    registerOk,
    turnstileFrames,
    badResponses,
    failedRequests,
    appConsoleErrors,
  };

  console.log(JSON.stringify(summary, null, 2));

  const failures = [];
  if (!loginOk) failures.push('login form did not render');
  if (!phoneInputOk || !phoneNextOk) failures.push('phone login form did not render');
  if (countriesStatus !== 200) failures.push(`phone countries returned ${countriesStatus}`);
  if (oauthProviderStatuses.some((status) => status !== 200)) {
    failures.push(`OAuth providers returned ${oauthProviderStatuses.join(', ')}`);
  }
  if (!registerOk) failures.push('register form did not render');
  if (expectTurnstile && turnstileFrames < 1) failures.push('Turnstile frame did not render');
  if (badResponses.length > 0) failures.push('first-party HTTP errors were observed');
  if (failedRequests.length > 0) failures.push('first-party failed requests were observed');
  if (appConsoleErrors.length > 0) failures.push('first-party console errors were observed');

  if (failures.length > 0) {
    console.error(`Production smoke failed: ${failures.join('; ')}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
