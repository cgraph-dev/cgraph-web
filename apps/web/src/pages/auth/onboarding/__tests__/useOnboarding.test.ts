import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PROFILE_CHECKPOINT_STORAGE_KEY } from '../profile-checkpoint';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  updateUser: vi.fn(),
  completeOnboarding: vi.fn(),
  uploadAvatar: vi.fn(),
  applyIdentityPatch: vi.fn(),
  user: {
    id: 'user-1',
    username: 'tricky',
    displayName: null as string | null,
    avatarUrl: null as string | null,
    phoneNumber: null as string | null,
  },
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({ user: mocks.user, updateUser: mocks.updateUser }),
}));
vi.mock('@/lib/api-client', () => ({
  apiClient: { profile: { completeOnboarding: mocks.completeOnboarding } },
}));
vi.mock('@/lib/avatar-upload', () => ({
  uploadCurrentUserAvatarAndSync: mocks.uploadAvatar,
}));
vi.mock('@/lib/identity/ownIdentitySync', () => ({
  applyOwnIdentityPatch: mocks.applyIdentityPatch,
}));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
}));

import { useOnboarding } from '../useOnboarding';

function completedProfile(displayName = 'Canonical Name') {
  return {
    ok: true,
    data: {
      id: 'user-1',
      username: 'tricky',
      display_name: displayName,
      onboarding_completed: true,
    },
  };
}

describe('useOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mocks.user.displayName = null;
    mocks.user.phoneNumber = null;
    mocks.completeOnboarding.mockResolvedValue(completedProfile());
  });

  it('restores a same-user draft after a remount', () => {
    const first = renderHook(() => useOnboarding());

    act(() => first.result.current.setDisplayName('Draft Name'));
    first.unmount();

    const second = renderHook(() => useOnboarding());
    expect(second.result.current.displayName).toBe('Draft Name');
  });

  it('does not present a generated phone username as the display-name draft', () => {
    mocks.user.phoneNumber = '+14155550001';

    const { result } = renderHook(() => useOnboarding());

    expect(result.current.displayName).toBe('');
  });

  it('trims once, syncs the canonical account, clears the draft, and leaves', async () => {
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.setDisplayName('  Draft Name  '));

    await act(async () => result.current.submit());

    expect(mocks.completeOnboarding).toHaveBeenCalledWith({ display_name: 'Draft Name' });
    expect(mocks.updateUser).toHaveBeenCalledWith({
      displayName: 'Canonical Name',
      onboardingCompleted: true,
    });
    expect(sessionStorage.getItem(PROFILE_CHECKPOINT_STORAGE_KEY)).toBeNull();
    expect(mocks.navigate).toHaveBeenCalledWith('/messages', { replace: true });
  });

  it('blocks duplicate submission while the command is pending', async () => {
    let resolveRequest: ((value: ReturnType<typeof completedProfile>) => void) | undefined;
    mocks.completeOnboarding.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.setDisplayName('Tricky'));

    let firstRequest: Promise<void> | undefined;
    await act(async () => {
      firstRequest = result.current.submit();
      await result.current.submit();
    });

    expect(mocks.completeOnboarding).toHaveBeenCalledTimes(1);
    resolveRequest?.(completedProfile());
    await act(async () => firstRequest);
  });

  it('keeps the draft and a retryable error when persistence fails', async () => {
    mocks.completeOnboarding.mockResolvedValueOnce({
      ok: false,
      error: { code: 'invalid', message: 'Choose another name' },
    });
    const { result } = renderHook(() => useOnboarding());
    act(() => result.current.setDisplayName('Retry Name'));

    await act(async () => result.current.submit());

    expect(result.current.error).toBe('Choose another name');
    expect(sessionStorage.getItem(PROFILE_CHECKPOINT_STORAGE_KEY)).toContain('Retry Name');
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('finishes after an optional avatar failure because the account is already committed', async () => {
    mocks.uploadAvatar.mockRejectedValueOnce(new Error('upload failed'));
    const { result } = renderHook(() => useOnboarding());
    act(() => {
      result.current.setDisplayName('Tricky');
      result.current.handleAvatarCropped({
        blob: new Blob(['avatar'], { type: 'image/jpeg' }),
        file: new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:avatar',
      });
    });

    await act(async () => result.current.submit());

    expect(mocks.uploadAvatar).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledWith('/messages', { replace: true });
    expect(result.current.error).toBeNull();
  });
});
