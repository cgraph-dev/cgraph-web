/**
 * useBilling hook tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockCreateCheckout = vi.fn();
const mockCreatePortal = vi.fn();
const mockGetPlans = vi.fn();
const mockSafeRedirect = vi.fn();

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    billing: {
      createCheckout: (...args: unknown[]) => mockCreateCheckout(...args),
      createPortal: (...args: unknown[]) => mockCreatePortal(...args),
      getPlans: (...args: unknown[]) => mockGetPlans(...args),
    },
  },
}));

vi.mock('@/lib/security', () => ({
  safeRedirect: (...args: unknown[]) => mockSafeRedirect(...args),
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
    it('creates checkout with planId and yearly flag', async () => {
      mockCreateCheckout.mockResolvedValueOnce({
        ok: true,
        data: { url: 'https://checkout.stripe.com/c/session' },
      });

      const { result } = renderHook(() => useBilling());

      await act(async () => {
        await result.current.redirectToCheckout('premium', true);
      });

      expect(mockCreateCheckout).toHaveBeenCalledWith('premium', true);
      expect(mockSafeRedirect).toHaveBeenCalledWith('https://checkout.stripe.com/c/session');
    });

    it('defaults yearly to false', async () => {
      mockCreateCheckout.mockResolvedValueOnce({
        ok: true,
        data: { url: 'https://checkout.stripe.com/c/session' },
      });

      const { result } = renderHook(() => useBilling());

      await act(async () => {
        await result.current.redirectToCheckout('enterprise');
      });

      expect(mockCreateCheckout).toHaveBeenCalledWith('enterprise', false);
    });

    it('does not redirect when checkout creation fails', async () => {
      mockCreateCheckout.mockResolvedValueOnce({
        ok: false,
        error: { code: 'billing_error', message: 'Checkout failed' },
        status: 500,
      });

      const { result } = renderHook(() => useBilling());

      await act(async () => {
        await result.current.redirectToCheckout('premium');
      });

      expect(mockSafeRedirect).not.toHaveBeenCalled();
    });
  });

  describe('redirectToPortal', () => {
    it('creates a billing portal session', async () => {
      mockCreatePortal.mockResolvedValueOnce({
        ok: true,
        data: { url: 'https://billing.stripe.com/p/session' },
      });

      const { result } = renderHook(() => useBilling());

      await act(async () => {
        await result.current.redirectToPortal();
      });

      expect(mockCreatePortal).toHaveBeenCalled();
      expect(mockSafeRedirect).toHaveBeenCalledWith('https://billing.stripe.com/p/session');
    });

    it('does not redirect when portal creation fails', async () => {
      mockCreatePortal.mockResolvedValueOnce({
        ok: false,
        error: { code: 'billing_error', message: 'Portal failed' },
        status: 500,
      });

      const { result } = renderHook(() => useBilling());

      await act(async () => {
        await result.current.redirectToPortal();
      });

      expect(mockSafeRedirect).not.toHaveBeenCalled();
    });
  });

  describe('getPlans', () => {
    it('returns plans from apiClient.billing', async () => {
      const mockPlans = [
        { id: 'premium', name: 'Premium', price: 9.99 },
        { id: 'enterprise', name: 'Enterprise', price: 29.99 },
      ];
      mockGetPlans.mockResolvedValueOnce({ ok: true, data: mockPlans });

      const { result } = renderHook(() => useBilling());

      let plans: unknown;
      await act(async () => {
        plans = await result.current.getPlans();
      });

      expect(plans).toEqual(mockPlans);
    });

    it('returns an empty array when plan loading fails', async () => {
      mockGetPlans.mockResolvedValueOnce({
        ok: false,
        error: { code: 'billing_error', message: 'Plans unavailable' },
        status: 500,
      });

      const { result } = renderHook(() => useBilling());

      let plans: unknown;
      await act(async () => {
        plans = await result.current.getPlans();
      });

      expect(plans).toEqual([]);
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
