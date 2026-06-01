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

import {
  useCustomizationApplication,
  getAvatarBorderStyle,
  getReactionStyleClass,
} from '../useCustomizationApplication';

// getAvatarBorderStyle — pure function

describe('getAvatarBorderStyle', () => {
  it('returns empty className for null', () => {
    expect(getAvatarBorderStyle(null)).toEqual({ className: '' });
  });

  it('returns empty className for "none"', () => {
    expect(getAvatarBorderStyle('none')).toEqual({ className: '' });
  });

  it('returns correct class for static border', () => {
    expect(getAvatarBorderStyle('static').className).toBe('avatar-border-static');
  });

  it('returns correct class for simple-glow', () => {
    expect(getAvatarBorderStyle('simple-glow').className).toBe('avatar-border-glow');
  });

  it('returns correct class for gentle-pulse', () => {
    expect(getAvatarBorderStyle('gentle-pulse').className).toBe('avatar-border-pulse');
  });

  it('returns correct class for rotating-ring', () => {
    expect(getAvatarBorderStyle('rotating-ring').className).toBe('avatar-border-rotating');
  });

  it('returns correct class for dual-ring', () => {
    expect(getAvatarBorderStyle('dual-ring').className).toBe('avatar-border-dual-ring');
  });

  it('returns correct class for rainbow-spin', () => {
    expect(getAvatarBorderStyle('rainbow-spin').className).toBe('avatar-border-rainbow');
  });

  it('does not map particle-orbit to a legacy CSS particle border', () => {
    expect(getAvatarBorderStyle('particle-orbit').className).toBe('');
  });

  it('returns correct class for electric-arc', () => {
    expect(getAvatarBorderStyle('electric-arc').className).toBe('avatar-border-electric');
  });

  it('returns correct class for flame-ring', () => {
    expect(getAvatarBorderStyle('flame-ring').className).toBe('avatar-border-flame');
  });

  it('returns correct class for cosmic-drift', () => {
    expect(getAvatarBorderStyle('cosmic-drift').className).toBe('avatar-border-cosmic');
  });

  it('returns empty className for unknown border id', () => {
    expect(getAvatarBorderStyle('unknown-border').className).toBe('');
  });

  it('returns empty className for empty string', () => {
    expect(getAvatarBorderStyle('').className).toBe('');
  });
});

// getReactionStyleClass

describe('getReactionStyleClass', () => {
  it('returns reaction-bounce for "bounce"', () => {
    expect(getReactionStyleClass('bounce')).toBe('reaction-bounce');
  });

  it('returns reaction-pop for "pop"', () => {
    expect(getReactionStyleClass('pop')).toBe('reaction-pop');
  });

  it('returns reaction-float for "float"', () => {
    expect(getReactionStyleClass('float')).toBe('reaction-float');
  });

  it('returns reaction-spin for "spin"', () => {
    expect(getReactionStyleClass('spin')).toBe('reaction-spin');
  });

  it('returns reaction-shake for "shake"', () => {
    expect(getReactionStyleClass('shake')).toBe('reaction-shake');
  });

  it('returns reaction-zoom for "zoom"', () => {
    expect(getReactionStyleClass('zoom')).toBe('reaction-zoom');
  });

  it('returns reaction-bounce as default for unknown style', () => {
    expect(getReactionStyleClass('unknown')).toBe('reaction-bounce');
  });
});

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
