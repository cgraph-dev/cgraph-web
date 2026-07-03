/**
 * useBilling Hook Unit Tests
 *
 * Tests for the billing hook that wraps billingService.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
const mockRedirectToCheckout = vi.fn();
const mockRedirectToPortal = vi.fn();
const mockGetPlans = vi.fn();

vi.mock('@/services/billing', () => ({
  billingService: {
    redirectToCheckout: (...args: unknown[]) => mockRedirectToCheckout(...args),
    redirectToPortal: (...args: unknown[]) => mockRedirectToPortal(...args),
    getPlans: (...args: unknown[]) => mockGetPlans(...args),
  },
}));

import { useBilling } from '../useBilling';
beforeEach(() => {
  vi.clearAllMocks();
});
describe('useBilling', () => {
  it('returns redirectToCheckout, redirectToPortal, and getPlans', () => {
    const { result } = renderHook(() => useBilling());

    expect(typeof result.current.redirectToCheckout).toBe('function');
    expect(typeof result.current.redirectToPortal).toBe('function');
    expect(typeof result.current.getPlans).toBe('function');
  });

  describe('redirectToCheckout', () => {
    it('calls billingService.redirectToCheckout with planId and yearly flag', async () => {
      mockRedirectToCheckout.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useBilling());

      await act(async () => {
        await result.current.redirectToCheckout('premium', true);
      });

      expect(mockRedirectToCheckout).toHaveBeenCalledWith('premium', true);
    });

    it('defaults yearly to false', async () => {
      mockRedirectToCheckout.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useBilling());

      await act(async () => {
        await result.current.redirectToCheckout('premium');
      });

      expect(mockRedirectToCheckout).toHaveBeenCalledWith('premium', false);
    });

    it('propagates errors from billingService', async () => {
      mockRedirectToCheckout.mockRejectedValueOnce(new Error('Checkout failed'));

      const { result } = renderHook(() => useBilling());

      await expect(
        act(async () => {
          await result.current.redirectToCheckout('premium');
        })
      ).rejects.toThrow('Checkout failed');
    });
  });

  describe('redirectToPortal', () => {
    it('calls billingService.redirectToPortal', async () => {
      mockRedirectToPortal.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useBilling());

      await act(async () => {
        await result.current.redirectToPortal();
      });

      expect(mockRedirectToPortal).toHaveBeenCalled();
    });

    it('propagates errors', async () => {
      mockRedirectToPortal.mockRejectedValueOnce(new Error('Portal error'));

      const { result } = renderHook(() => useBilling());

      await expect(
        act(async () => {
          await result.current.redirectToPortal();
        })
      ).rejects.toThrow('Portal error');
    });
  });

  describe('getPlans', () => {
    it('returns plans from billingService', async () => {
      const mockPlans = [
        { id: 'free', name: 'Free', price: 0 },
        { id: 'premium', name: 'Premium', price: 9.99 },
      ];
      mockGetPlans.mockResolvedValueOnce(mockPlans);

      const { result } = renderHook(() => useBilling());

      let plans: unknown;
      await act(async () => {
        plans = await result.current.getPlans();
      });

      expect(plans).toEqual(mockPlans);
    });

    it('propagates errors', async () => {
      mockGetPlans.mockRejectedValueOnce(new Error('Plans unavailable'));

      const { result } = renderHook(() => useBilling());

      await expect(
        act(async () => {
          await result.current.getPlans();
        })
      ).rejects.toThrow('Plans unavailable');
    });
  });

  describe('handler stability', () => {
    it('returns stable function references across renders', () => {
      const { result, rerender } = renderHook(() => useBilling());

      const first = {
        checkout: result.current.redirectToCheckout,
        portal: result.current.redirectToPortal,
        plans: result.current.getPlans,
      };

      rerender();

      expect(result.current.redirectToCheckout).toBe(first.checkout);
      expect(result.current.redirectToPortal).toBe(first.portal);
      expect(result.current.getPlans).toBe(first.plans);
    });
  });
});
