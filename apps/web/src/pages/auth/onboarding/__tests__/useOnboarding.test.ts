import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  updateUser: vi.fn(),
  httpPost: vi.fn(),
  httpPut: vi.fn(),
  updateSettingsCategory: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({
    user: {
      id: 'user-1',
      username: 'tricky',
      displayName: 'Tricky',
      avatarUrl: null,
    },
    updateUser: mocks.updateUser,
  }),
}));

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    settings: {
      updateCategory: mocks.updateSettingsCategory,
    },
  },
  http: {
    post: mocks.httpPost,
    put: mocks.httpPut,
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
  }),
}));

import { useOnboarding } from '../useOnboarding';

describe('useOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateSettingsCategory.mockResolvedValue({ ok: true, data: {} });
  });

  it('marks onboarding skipped before leaving the route', async () => {
    mocks.httpPost.mockResolvedValueOnce({ data: { data: { completed: true } } });

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await result.current.handleSkip();
    });

    expect(mocks.httpPost).toHaveBeenCalledWith('/api/v1/onboarding/skip');
    expect(mocks.updateUser).toHaveBeenCalledWith({ onboardingCompleted: true });
    expect(mocks.navigate).toHaveBeenCalledWith('/messages');
    expect(result.current.error).toBeNull();
  });

  it('marks onboarding complete locally before leaving after final save', async () => {
    mocks.httpPut.mockResolvedValue({ data: { data: {} } });
    mocks.httpPost.mockResolvedValue({ data: { data: { onboarding_completed: true } } });

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await result.current.handleNext();
      await result.current.handleNext();
      await result.current.handleNext();
    });

    await act(async () => {
      await result.current.handleNext();
    });

    expect(mocks.httpPut).toHaveBeenNthCalledWith(1, '/api/v1/me', {
      user: {
        display_name: 'Tricky',
        bio: '',
        avatar_url: null,
      },
    });
    expect(mocks.updateSettingsCategory).toHaveBeenCalledWith('notifications', {
      notify_messages: true,
      notify_mentions: true,
      notify_friend_requests: true,
    });
    expect(mocks.httpPost).toHaveBeenCalledWith('/api/v1/me/onboarding/complete');
    expect(mocks.updateUser).toHaveBeenCalledWith({
      displayName: 'Tricky',
      avatarUrl: null,
    });
    expect(mocks.updateUser).toHaveBeenCalledWith({ onboardingCompleted: true });
    expect(mocks.navigate).toHaveBeenCalledWith('/messages');
    expect(result.current.error).toBeNull();
  });

  it('keeps the user on onboarding when skip cannot be saved', async () => {
    mocks.httpPost.mockRejectedValueOnce(new Error('network down'));

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await result.current.handleSkip();
    });

    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(result.current.error).toBe('We could not skip onboarding. Please try again.');
  });

  it('surfaces a route-owned error when final onboarding save fails', async () => {
    mocks.httpPut.mockRejectedValueOnce(new Error('save failed'));

    const { result } = renderHook(() => useOnboarding());

    await act(async () => {
      await result.current.handleNext();
      await result.current.handleNext();
      await result.current.handleNext();
    });

    await act(async () => {
      await result.current.handleNext();
    });

    expect(mocks.navigate).not.toHaveBeenCalled();
    expect(result.current.error).toBe('We could not save onboarding. Please try again.');
  });
});
