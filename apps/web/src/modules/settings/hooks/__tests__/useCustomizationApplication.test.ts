import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { getProfileThemeOrDefault } from '@/data/profileThemes';
const { mockState } = vi.hoisted(() => ({
  mockState: {
    profileTheme: null as string | null,
    selectedProfileThemeId: 'signal-noir',
    chatTheme: 'default',
    particleEffect: 'none',
    backgroundEffect: 'solid',
    animationSpeed: 'normal',
  },
}));

vi.mock('@/modules/settings/store/customization/customizationStore', () => ({
  useCustomizationStore: vi.fn((selector: (s: typeof mockState) => unknown) => selector(mockState)),
}));

import { useCustomizationApplication } from '../useCustomizationApplication';

// useCustomizationApplication hook — CSS variable injection

describe('useCustomizationApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.style.cssText = '';
    document.body.className = '';
    mockState.profileTheme = null;
    mockState.selectedProfileThemeId = 'signal-noir';
    mockState.chatTheme = 'default';
    mockState.particleEffect = 'none';
    mockState.backgroundEffect = 'solid';
    mockState.animationSpeed = 'normal';
  });

  it('applies shared profile theme CSS variables by default', () => {
    const theme = getProfileThemeOrDefault('signal-noir');
    renderHook(() => useCustomizationApplication());
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--profile-primary')).toBe(theme.accentPrimary);
    expect(root.style.getPropertyValue('--profile-secondary')).toBe(theme.accentSecondary);
    expect(root.style.getPropertyValue('--profile-text')).toBe(theme.textColor);
  });

  it('sets animation speed to 1 for normal', () => {
    renderHook(() => useCustomizationApplication());
    expect(document.documentElement.style.getPropertyValue('--animation-speed')).toBe('1');
  });

  it('sets animation speed to 1.5 for slow', () => {
    mockState.animationSpeed = 'slow';
    renderHook(() => useCustomizationApplication());
    expect(document.documentElement.style.getPropertyValue('--animation-speed')).toBe('1.5');
  });

  it('sets animation speed to 0.5 for fast', () => {
    mockState.animationSpeed = 'fast';
    renderHook(() => useCustomizationApplication());
    expect(document.documentElement.style.getPropertyValue('--animation-speed')).toBe('0.5');
  });

  it('falls back to 1 for unknown animation speed', () => {
    mockState.animationSpeed = 'ludicrous';
    renderHook(() => useCustomizationApplication());
    expect(document.documentElement.style.getPropertyValue('--animation-speed')).toBe('1');
  });

  it('applies aurora-glass theme colors from the shared catalog', () => {
    const theme = getProfileThemeOrDefault('aurora-glass');
    mockState.selectedProfileThemeId = theme.id;
    renderHook(() => useCustomizationApplication());
    expect(document.documentElement.style.getPropertyValue('--profile-primary')).toBe(
      theme.accentPrimary
    );
  });

  it('rejects stale legacy profile theme IDs', () => {
    mockState.selectedProfileThemeId = 'classic-purple';
    renderHook(() => useCustomizationApplication());
    expect(document.documentElement.style.getPropertyValue('--profile-primary')).toBe('');
  });

  it('profileTheme overrides selectedProfileThemeId', () => {
    const theme = getProfileThemeOrDefault('sakura-dream');
    mockState.profileTheme = theme.id;
    mockState.selectedProfileThemeId = 'signal-noir';
    renderHook(() => useCustomizationApplication());
    expect(document.documentElement.style.getPropertyValue('--profile-primary')).toBe(
      theme.accentPrimary
    );
  });

  it('adds chat-theme body class', () => {
    mockState.chatTheme = 'retro';
    renderHook(() => useCustomizationApplication());
    expect(document.body.classList.contains('chat-theme-retro')).toBe(true);
  });

  it('does not add particle class when effect is none', () => {
    renderHook(() => useCustomizationApplication());
    const hasParticle = Array.from(document.body.classList).some((c) =>
      c.startsWith('particle-effect-')
    );
    expect(hasParticle).toBe(false);
  });

  it('clears legacy particle effect body classes', () => {
    document.body.classList.add('particle-effect-stars');
    mockState.particleEffect = 'snow';
    renderHook(() => useCustomizationApplication());
    const hasParticle = Array.from(document.body.classList).some((c) =>
      c.startsWith('particle-effect-')
    );
    expect(hasParticle).toBe(false);
  });

  it('does not add bg-effect class when solid', () => {
    renderHook(() => useCustomizationApplication());
    const hasBg = Array.from(document.body.classList).some((c) => c.startsWith('bg-effect-'));
    expect(hasBg).toBe(false);
  });

  it('clears legacy background effect body classes', () => {
    document.body.classList.add('bg-effect-dots');
    mockState.backgroundEffect = 'gradient';
    renderHook(() => useCustomizationApplication());
    const hasBg = Array.from(document.body.classList).some((c) => c.startsWith('bg-effect-'));
    expect(hasBg).toBe(false);
  });
});
