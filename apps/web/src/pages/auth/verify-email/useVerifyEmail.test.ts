import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearRateLimitScopes } from '@/lib/api-rate-limit';

const mocks = vi.hoisted(() => ({
  user: null as { email: string; emailVerifiedAt: string | null } | null,
  searchParams: new URLSearchParams(),
  checkAuth: vi.fn(),
  post: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mocks.searchParams],
}));

vi.mock('@/lib/api-client', () => ({
  http: { post: mocks.post },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ warn: vi.fn() }),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({ user: mocks.user, checkAuth: mocks.checkAuth }),
}));

import { useVerifyEmail } from './useVerifyEmail';

describe('useVerifyEmail', () => {
  beforeEach(() => {
    clearRateLimitScopes(['auth:verification-resend']);
    mocks.user = null;
    mocks.searchParams = new URLSearchParams();
    mocks.checkAuth.mockReset();
    mocks.post.mockReset();
  });

  it('leaves the pending page once the authenticated account refreshes as verified', async () => {
    mocks.user = { email: 'member@example.com', emailVerifiedAt: null };

    const { result, rerender } = renderHook(() => useVerifyEmail());

    await waitFor(() => expect(result.current.state).toBe('pending'));

    mocks.user = { email: 'member@example.com', emailVerifiedAt: '2026-07-13T12:00:00Z' };
    rerender();

    await waitFor(() => expect(result.current.state).toBe('already-verified'));
  });

  it('uses the entered address only when no signed-in account owns the resend request', async () => {
    mocks.searchParams = new URLSearchParams('email=recovery@example.com');
    mocks.post.mockResolvedValue({ data: { message: 'Verification request received' } });

    const { result } = renderHook(() => useVerifyEmail());

    await act(async () => {
      await result.current.handleResend();
    });

    expect(result.current.isResendEmailEditable).toBe(true);
    expect(mocks.post).toHaveBeenCalledWith('/api/v1/auth/resend-verification', {
      email: 'recovery@example.com',
    });
    expect(result.current.resendSuccess).toBe(true);
  });

  it('locks resend to the signed-in account email', async () => {
    mocks.user = { email: 'member@example.com', emailVerifiedAt: null };
    mocks.searchParams = new URLSearchParams('email=other@example.com');
    mocks.post.mockResolvedValue({ data: { data: { retry_after: 300 } } });

    const { result } = renderHook(() => useVerifyEmail());

    await waitFor(() => expect(result.current.resendEmail).toBe('member@example.com'));

    await act(async () => {
      await result.current.handleResend();
    });

    expect(result.current.isResendEmailEditable).toBe(false);
    expect(mocks.post).toHaveBeenCalledWith('/api/v1/auth/resend-verification', {
      email: 'member@example.com',
    });
    expect(result.current.resendCooldownSeconds).toBeGreaterThan(0);

    await act(async () => {
      await result.current.handleResend();
    });

    expect(mocks.post).toHaveBeenCalledTimes(1);
  });

  it('uses the server retry window after an authenticated resend is rate limited', async () => {
    mocks.user = { email: 'member@example.com', emailVerifiedAt: null };
    mocks.post.mockRejectedValue({
      response: {
        status: 429,
        headers: { 'retry-after': '120' },
        data: { error: 'Please wait before requesting another verification email' },
      },
    });

    const { result } = renderHook(() => useVerifyEmail());

    await act(async () => {
      await result.current.handleResend();
    });

    expect(result.current.resendCooldownSeconds).toBeGreaterThanOrEqual(119);
    expect(result.current.resendError).toContain('Please wait');
  });
});
