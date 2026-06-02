import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { getProfileThemeOrDefault } from '@/data/profileThemes';
const { mockCustomizationState, mockHttpGet, mockHttpPost } = vi.hoisted(() => ({
  mockCustomizationState: {
    profileTheme: null as string | null,
    selectedProfileThemeId: 'signal-noir',
    chatTheme: 'default',
    particleEffect: 'none',
    backgroundEffect: 'solid',
    animationSpeed: 'normal',
  },
  mockHttpGet: vi.fn(),
  mockHttpPost: vi.fn(),
}));

vi.mock('@/modules/settings/store/customization/customizationStore', () => ({
  useCustomizationStore: vi.fn((selector: (s: typeof mockCustomizationState) => unknown) => {
    return selector(mockCustomizationState);
  }),
}));

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: vi.fn((value: string) => value),
}));

vi.mock('@/lib/api-client', () => ({
  http: {
    get: mockHttpGet,
    post: mockHttpPost,
  },
}));

import { useCustomizationApplication } from '../useCustomizationApplication';
import { useUsernameChange } from '../useUsernameChange';
describe('useCustomizationApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset DOM state
    document.documentElement.style.cssText = '';
    document.body.className = '';
    // Reset customization state
    mockCustomizationState.profileTheme = null;
    mockCustomizationState.selectedProfileThemeId = 'signal-noir';
    mockCustomizationState.chatTheme = 'default';
    mockCustomizationState.particleEffect = 'none';
    mockCustomizationState.backgroundEffect = 'solid';
    mockCustomizationState.animationSpeed = 'normal';
  });

  it('applies shared profile theme CSS variables', () => {
    const theme = getProfileThemeOrDefault('signal-noir');
    renderHook(() => useCustomizationApplication());

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--profile-primary')).toBe(theme.accentPrimary);
    expect(root.style.getPropertyValue('--profile-secondary')).toBe(theme.accentSecondary);
  });

  it('applies aurora-glass theme CSS variables from the shared catalog', () => {
    const theme = getProfileThemeOrDefault('aurora-glass');
    mockCustomizationState.selectedProfileThemeId = theme.id;

    renderHook(() => useCustomizationApplication());

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--profile-primary')).toBe(theme.accentPrimary);
  });

  it('applies animation speed CSS variable for normal speed', () => {
    renderHook(() => useCustomizationApplication());

    expect(document.documentElement.style.getPropertyValue('--animation-speed')).toBe('1');
  });

  it('applies fast animation speed', () => {
    mockCustomizationState.animationSpeed = 'fast';

    renderHook(() => useCustomizationApplication());

    expect(document.documentElement.style.getPropertyValue('--animation-speed')).toBe('0.5');
  });

  it('clears legacy particle effect body classes', () => {
    document.body.classList.add('particle-effect-sparkles');
    mockCustomizationState.particleEffect = 'sparkles';

    renderHook(() => useCustomizationApplication());

    const hasParticleClass = Array.from(document.body.classList).some((c) =>
      c.startsWith('particle-effect-')
    );
    expect(hasParticleClass).toBe(false);
  });

  it('does not add particle effect body class when "none"', () => {
    mockCustomizationState.particleEffect = 'none';

    renderHook(() => useCustomizationApplication());

    const hasParticleClass = Array.from(document.body.classList).some((c) =>
      c.startsWith('particle-effect-')
    );
    expect(hasParticleClass).toBe(false);
  });

  it('prefers profileTheme over selectedProfileThemeId', () => {
    const theme = getProfileThemeOrDefault('ember-forge');
    mockCustomizationState.profileTheme = theme.id;
    mockCustomizationState.selectedProfileThemeId = 'signal-noir';

    renderHook(() => useCustomizationApplication());

    expect(document.documentElement.style.getPropertyValue('--profile-primary')).toBe(
      theme.accentPrimary
    );
  });

  it('does not apply stale legacy profile theme IDs', () => {
    mockCustomizationState.selectedProfileThemeId = 'classic-purple';

    renderHook(() => useCustomizationApplication());

    expect(document.documentElement.style.getPropertyValue('--profile-primary')).toBe('');
  });
});
describe('useUsernameChange', () => {
  const baseOptions = {
    currentUsername: 'olduser',
    lastChangeDate: null as Date | null,
    isPremium: false,
    onSuccess: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpGet.mockResolvedValue({
      data: { available: true, message: 'Username is available!' },
    });
    mockHttpPost.mockResolvedValue({ data: { ok: true } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns initial state correctly', () => {
    const { result } = renderHook(() => useUsernameChange(baseOptions));

    expect(result.current.newUsername).toBe('');
    expect(result.current.isChecking).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.checkResult).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.showHistory).toBe(false);
    expect(result.current.canChange).toBe(true);
  });

  it('canChange is true when lastChangeDate is null', () => {
    const { result } = renderHook(() => useUsernameChange(baseOptions));

    expect(result.current.canChange).toBe(true);
    expect(result.current.remainingDays).toBe(0);
  });

  it('canChange is false when within cooldown period (standard user)', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 5); // 5 days ago

    const { result } = renderHook(() =>
      useUsernameChange({
        ...baseOptions,
        lastChangeDate: recentDate,
      })
    );

    expect(result.current.canChange).toBe(false);
    expect(result.current.remainingDays).toBe(25); // 30 - 5
  });

  it('premium users have shorter cooldown', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 5); // 5 days ago

    const { result } = renderHook(() =>
      useUsernameChange({
        ...baseOptions,
        lastChangeDate: recentDate,
        isPremium: true,
      })
    );

    expect(result.current.remainingDays).toBe(2); // 7 - 5
    expect(result.current.cooldownDays).toBe(7);
  });

  it('setNewUsername updates the username value', async () => {
    const { result } = renderHook(() => useUsernameChange(baseOptions));

    act(() => {
      result.current.setNewUsername('newuser');
    });

    expect(result.current.newUsername).toBe('newuser');
    await waitFor(() => {
      expect(result.current.checkResult?.available).toBe(true);
    });
  });

  it('toggleHistory toggles showHistory state', () => {
    const { result } = renderHook(() => useUsernameChange(baseOptions));

    expect(result.current.showHistory).toBe(false);

    act(() => {
      result.current.toggleHistory();
    });

    expect(result.current.showHistory).toBe(true);

    act(() => {
      result.current.toggleHistory();
    });

    expect(result.current.showHistory).toBe(false);
  });

  it('reports invalid format for short usernames', async () => {
    const { result } = renderHook(() => useUsernameChange(baseOptions));

    act(() => {
      result.current.setNewUsername('ab');
    });

    // useDebounce is mocked to pass through immediately
    await waitFor(() => {
      expect(result.current.checkResult).toEqual({
        available: false,
        message: expect.stringContaining('3-32 characters'),
      });
    });
  });

  it('reports invalid format for usernames with special characters', async () => {
    const { result } = renderHook(() => useUsernameChange(baseOptions));

    act(() => {
      result.current.setNewUsername('user@name!');
    });

    await waitFor(() => {
      expect(result.current.checkResult?.available).toBe(false);
    });
  });

  it('clears checkResult when username matches current', async () => {
    const { result } = renderHook(() => useUsernameChange(baseOptions));

    act(() => {
      result.current.setNewUsername('olduser');
    });

    await waitFor(() => {
      expect(result.current.checkResult).toBeNull();
    });
  });

  it('handleSubmit does nothing when canChange is false', async () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 1); // 1 day ago

    const { result } = renderHook(() =>
      useUsernameChange({
        ...baseOptions,
        lastChangeDate: recentDate,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockHttpPost).not.toHaveBeenCalled();
  });
});
