/**
 * useCreator Hook Unit Tests
 *
 * Tests for the creator identity hook that wraps the creator store
 * for status checks, onboarding, and safe redirect behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
const { mockSafeRedirect } = vi.hoisted(() => ({
  mockSafeRedirect: vi.fn(),
}));

vi.mock('@/lib/security', () => ({
  safeRedirect: mockSafeRedirect,
}));

const mockStoreState = {
  isCreator: false,
  onboardingComplete: false,
  creatorStatus: 'none' as string,
  stripeAccountId: null as string | null,
  isLoading: false,
  error: null as string | null,
  fetchStatus: vi.fn(),
  onboard: vi.fn(),
  refreshOnboard: vi.fn(),
};

vi.mock('@/modules/creator/store', () => ({
  useCreatorStore: vi.fn((selector: (s: typeof mockStoreState) => unknown) =>
    selector(mockStoreState)
  ),
}));

import { useCreator } from '../useCreator';

// Tests

describe('useCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.isCreator = false;
    mockStoreState.onboardingComplete = false;
    mockStoreState.creatorStatus = 'none';
    mockStoreState.stripeAccountId = null;
    mockStoreState.isLoading = false;
    mockStoreState.error = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
  it('should return creator status fields from store', () => {
    mockStoreState.isCreator = true;
    mockStoreState.onboardingComplete = true;
    mockStoreState.creatorStatus = 'active';
    mockStoreState.stripeAccountId = 'acct_abc';

    const { result } = renderHook(() => useCreator());

    expect(result.current.isCreator).toBe(true);
    expect(result.current.onboardingComplete).toBe(true);
    expect(result.current.creatorStatus).toBe('active');
    expect(result.current.stripeAccountId).toBe('acct_abc');
  });

  it('should return loading and error states', () => {
    mockStoreState.isLoading = true;
    mockStoreState.error = 'Something failed';

    const { result } = renderHook(() => useCreator());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe('Something failed');
  });

  it('should expose fetchStatus action', () => {
    const { result } = renderHook(() => useCreator());

    expect(typeof result.current.fetchStatus).toBe('function');
  });
  describe('startOnboarding', () => {
    it('should call onboard and redirect on success', async () => {
      mockStoreState.onboard.mockResolvedValueOnce({ url: 'https://stripe.com/onboard/123' });

      const { result } = renderHook(() => useCreator());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.startOnboarding();
      });

      expect(mockStoreState.onboard).toHaveBeenCalled();
      expect(mockSafeRedirect).toHaveBeenCalledWith('https://stripe.com/onboard/123');
      expect(returnValue).toEqual({ url: 'https://stripe.com/onboard/123' });
    });

    it('should not redirect when onboard returns null', async () => {
      mockStoreState.onboard.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useCreator());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.startOnboarding();
      });

      expect(mockSafeRedirect).not.toHaveBeenCalled();
      expect(returnValue).toBeNull();
    });

    it('should not redirect when url is empty', async () => {
      mockStoreState.onboard.mockResolvedValueOnce({ url: '' });

      const { result } = renderHook(() => useCreator());

      await act(async () => {
        await result.current.startOnboarding();
      });

      expect(mockSafeRedirect).not.toHaveBeenCalled();
    });
  });
  describe('continueOnboarding', () => {
    it('should call refreshOnboard and redirect on success', async () => {
      mockStoreState.refreshOnboard.mockResolvedValueOnce({
        url: 'https://stripe.com/refresh/456',
      });

      const { result } = renderHook(() => useCreator());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.continueOnboarding();
      });

      expect(mockStoreState.refreshOnboard).toHaveBeenCalled();
      expect(mockSafeRedirect).toHaveBeenCalledWith('https://stripe.com/refresh/456');
      expect(returnValue).toEqual({ url: 'https://stripe.com/refresh/456' });
    });

    it('should not redirect when refreshOnboard returns null', async () => {
      mockStoreState.refreshOnboard.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useCreator());

      let returnValue: unknown;
      await act(async () => {
        returnValue = await result.current.continueOnboarding();
      });

      expect(mockSafeRedirect).not.toHaveBeenCalled();
      expect(returnValue).toBeNull();
    });

    it('should not redirect when url is empty', async () => {
      mockStoreState.refreshOnboard.mockResolvedValueOnce({ url: '' });

      const { result } = renderHook(() => useCreator());

      await act(async () => {
        await result.current.continueOnboarding();
      });

      expect(mockSafeRedirect).not.toHaveBeenCalled();
    });
  });
});
