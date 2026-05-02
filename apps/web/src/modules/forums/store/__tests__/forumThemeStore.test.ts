import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useForumThemeStore,
  useActiveForumTheme,
  type ForumThemePreset,
  type ForumTitleAnimation,
} from '../forumThemeStore';
import { useThemeStore } from '@/stores/theme';

beforeEach(() => {
  useThemeStore.setState(useThemeStore.getInitialState());
  vi.clearAllMocks();
});

// Exports

describe('forumThemeStore exports', () => {
  it('exports useForumThemeStore as useThemeStore alias', () => {
    expect(useForumThemeStore).toBe(useThemeStore);
  });

  it('exports useActiveForumTheme hook', () => {
    expect(typeof useActiveForumTheme).toBe('function');
  });
});

// useActiveForumTheme hook

describe('useActiveForumTheme', () => {
  it('returns dark-elite preset by default', () => {
    const { result } = renderHook(() => useActiveForumTheme());
    expect(result.current).toBeDefined();
    expect(result.current?.name).toBe('Dark Elite');
  });

  it('returns preset matching activeForumThemeId', () => {
    useThemeStore.setState({ activeForumThemeId: 'cyberpunk' });
    const { result } = renderHook(() => useActiveForumTheme());
    expect(result.current?.name).toBe('Cyberpunk 2077');
  });

  it('returns undefined for unknown themeId', () => {
    useThemeStore.setState({ activeForumThemeId: 'nonexistent' });
    const { result } = renderHook(() => useActiveForumTheme());
    expect(result.current).toBeUndefined();
  });
});

// Type checks (compile-time but runtime validated via values)

describe('type values', () => {
  it('ForumThemePreset values are valid', () => {
    const presets: ForumThemePreset[] = ['classic-mybb', 'dark-elite', 'cyberpunk', 'custom'];
    presets.forEach((p) => expect(typeof p).toBe('string'));
  });

  it('ForumTitleAnimation values are valid', () => {
    const anims: ForumTitleAnimation[] = ['none', 'gradient', 'glow', 'holographic', 'matrix'];
    anims.forEach((a) => expect(typeof a).toBe('string'));
  });
});
