import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_PROFILE_THEMES, type ProfileThemeConfig } from '@/data/profileThemes';
import { useThemeCustomization } from '../hooks';

const {
  mockFetchCustomizations,
  mockSaveCustomizations,
  mockSetProfileTheme,
  mockUpdateTheme,
  mockToast,
  mockToastError,
  mockToastSuccess,
} = vi.hoisted(() => ({
  mockFetchCustomizations: vi.fn(),
  mockSaveCustomizations: vi.fn(),
  mockSetProfileTheme: vi.fn(),
  mockUpdateTheme: vi.fn(),
  mockToast: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

vi.mock('@/modules/auth/store', () => ({
  useAuthStore: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/modules/settings/store/customization/customizationStore', () => ({
  useCustomizationStore: () => ({
    profileTheme: null,
    chatTheme: 'purple',
    forumTheme: null,
    appTheme: 'purple',
    isSaving: false,
    error: null,
    fetchCustomizations: mockFetchCustomizations,
    saveCustomizations: mockSaveCustomizations,
    setProfileTheme: mockSetProfileTheme,
    updateTheme: mockUpdateTheme,
  }),
}));

vi.mock('@/shared/components/ui', () => ({
  toast: {
    error: mockToastError,
    info: mockToast,
    success: mockToastSuccess,
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

function lockedProfileTheme(): ProfileThemeConfig {
  const theme = ALL_PROFILE_THEMES[0];
  if (!theme) throw new Error('Expected shared profile theme fixture');

  return {
    ...theme,
    tier: 'premium',
    unlocked: false,
  };
}

function unlockedProfileTheme(): ProfileThemeConfig {
  const theme = ALL_PROFILE_THEMES[1] ?? ALL_PROFILE_THEMES[0];
  if (!theme) throw new Error('Expected shared profile theme fixture');
  return theme;
}

describe('useThemeCustomization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('previews locked profile themes without writing them to the customization store', () => {
    const theme = lockedProfileTheme();
    const { result } = renderHook(() => useThemeCustomization(), { wrapper });

    act(() => result.current.handleApplyProfileTheme(theme));

    expect(mockSetProfileTheme).not.toHaveBeenCalled();
    expect(mockUpdateTheme).not.toHaveBeenCalled();
    expect(result.current.selectedThemes.profile).toBe(theme.id);
    expect(result.current.isThemePreviewing(theme.id)).toBe(true);
    expect(mockToast).toHaveBeenCalledWith(
      'Previewing theme — Unlock to save',
      expect.objectContaining({ duration: expect.any(Number) })
    );
  });

  it('applies unlocked profile themes through the typed profile-theme action only', () => {
    const theme = unlockedProfileTheme();
    const { result } = renderHook(() => useThemeCustomization(), { wrapper });

    act(() => result.current.handleApplyProfileTheme(theme));

    expect(mockSetProfileTheme).toHaveBeenCalledWith(theme.id);
    expect(mockUpdateTheme).not.toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalledWith(`Applied "${theme.name}" theme!`);
  });
});
