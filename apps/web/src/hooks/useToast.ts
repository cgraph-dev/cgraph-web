/**
 * Toast notification hook
 *
 * Bridges to the Zustand-based toast system in @/components/ui/Toast.
 * Provides a simple interface for showing toast notifications.
 */

import { useToastStore } from '@/components/ui/toast';

export interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface UseToastReturn {
  showToast: (options: ToastOptions) => void;
}

/**
 * Hook for showing toast notifications.
 * Delegates to the Zustand-powered toast store (components/ui/Toast).
 *
 * @example
 * ```tsx
 * const { showToast } = useToast();
 * showToast({ type: 'success', message: 'Operation completed!' });
 * ```
 */
export function useToast(): UseToastReturn {
  function showToast(options: ToastOptions) {
    useToastStore.getState().addToast({
      type: options.type,
      title: options.message,
      duration: options.duration,
    });
  }

  return { showToast };
}

export default useToast;
