/**
 * Hook for detecting clicks outside a referenced element.
 */
import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook that detects clicks outside of a referenced element.
 *
 * Useful for closing dropdowns, modals, and popovers when clicking outside.
 *
 * @param callback - function to call when clicking outside
 * @param enabled - whether the listener is active (default: true)
 * @returns ref to attach to the target element
 *
 * @example
 * const ref = useClickOutside(() => setIsOpen(false));
 * return <div ref={ref}>Dropdown content</div>;
 *
 * @example
 * const ref = useClickOutside(handleClose, isOpen);
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  callback: () => void,
  enabled: boolean = true
): RefObject<T | null> {
  const ref = useRef<T>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref current
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target;

      if (ref.current && target instanceof Node && !ref.current.contains(target)) {
        callbackRef.current();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callbackRef.current();
      }
    };

    // Use mousedown for faster response
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [enabled]);

  return ref;
}
