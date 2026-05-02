/**
 * Tests for useAdaptiveMotion hook and getAdaptiveAnimationProps.
 *
 * Verifies motion adaptation based on device capabilities, user preferences,
 * and runtime FPS measurements.
 *
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAdaptiveMotion } from '../useAdaptiveMotion';

// Mock matchMedia default (no reduced motion)
const createMatchMedia = (matches: boolean) =>
  vi.fn().mockImplementation((query: string) => {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    return {
      matches: query === '(prefers-reduced-motion: reduce)' ? matches : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_type: string, cb: (e: MediaQueryListEvent) => void) =>
        listeners.push(cb)
      ),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      _listeners: listeners,
    };
  });

describe('useAdaptiveMotion', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Default: capable device, no reduced motion preference
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: 8,
      writable: true,
      configurable: true,
    });
    window.matchMedia = createMatchMedia(false);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
      (cb) => setTimeout(() => cb(performance.now()), 16) as unknown as number
    );
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) =>
      clearTimeout(id as unknown as ReturnType<typeof setTimeout>)
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('enables animations by default on capable devices', () => {
    const { result } = renderHook(() => useAdaptiveMotion());

    expect(result.current.shouldAnimate).toBe(true);
    expect(result.current.motionScale).toBe(1);
    expect(result.current.prefersReducedMotion).toBe(false);
    expect(result.current.currentFps).toBe(60);
  });

  it('respects forceReduced config', () => {
    const { result } = renderHook(() => useAdaptiveMotion({ forceReduced: true }));

    expect(result.current.shouldAnimate).toBe(false);
  });

  it('detects prefers-reduced-motion', () => {
    window.matchMedia = createMatchMedia(true);

    const { result } = renderHook(() => useAdaptiveMotion());

    expect(result.current.prefersReducedMotion).toBe(true);
    expect(result.current.shouldAnimate).toBe(false);
    expect(result.current.motionScale).toBeLessThanOrEqual(0.5);
  });

  it('detects low-end devices based on hardware concurrency', () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: 2,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useAdaptiveMotion());

    expect(result.current.isLowEndDevice).toBe(true);
    expect(result.current.motionScale).toBeLessThanOrEqual(0.5);
  });

  it('detects low-end devices based on deviceMemory', () => {
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: 8,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, 'deviceMemory', {
      value: 2,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useAdaptiveMotion());

    expect(result.current.isLowEndDevice).toBe(true);
  });

  it('starts with default FPS of 60', () => {
    const { result } = renderHook(() => useAdaptiveMotion());
    expect(result.current.currentFps).toBe(60);
    expect(result.current.isPerformanceDegraded).toBe(false);
  });

  it('cleans up on unmount', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

    const { unmount } = renderHook(() => useAdaptiveMotion());
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });
});
