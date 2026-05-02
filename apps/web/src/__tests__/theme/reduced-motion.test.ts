import { beforeEach, describe, expect, it, vi } from 'vitest';

import { transitionTheme } from '../../components/theme-picker/theme-transition';

beforeEach(() => {
  vi.useFakeTimers();
  document.documentElement.className = '';
});

describe('theme transition accessibility', () => {
  it('skips transition classes when reduced motion is requested', () => {
    const applyTheme = vi.fn();

    transitionTheme(applyTheme, true);

    expect(applyTheme).toHaveBeenCalledTimes(1);
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false);
  });

  it('uses the fallback transition class when reduced motion is disabled', () => {
    const applyTheme = vi.fn();

    transitionTheme(applyTheme, false);

    expect(applyTheme).toHaveBeenCalledTimes(1);
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(true);

    vi.advanceTimersByTime(300);
    expect(document.documentElement.classList.contains('theme-transitioning')).toBe(false);
    vi.useRealTimers();
  });
});