/**
 * Safe Storage Wrapper
 *
 * Provides error-resilient localStorage and sessionStorage wrappers
 * for use with Zustand persist middleware.
 *
 * Prevents crashes when:
 * - Storage is full (quota exceeded)
 * - User is in incognito/private mode
 * - Storage is corrupted
 * - Storage access is blocked by browser policies
 *
 */

import { type StateStorage } from 'zustand/middleware';
import { createLogger } from '@/lib/logger';

const logger = createLogger('SafeStorage');

/**
 * Creates a safe localStorage wrapper that handles errors gracefully
 */
export function createSafeLocalStorage(): StateStorage {
  return {
    getItem: (name: string): string | null => {
      try {
        return localStorage.getItem(name);
      } catch (error) {
        logger.warn(`Failed to read "${name}" from localStorage:`, error);
        return null;
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        localStorage.setItem(name, value);
      } catch (error) {
        logger.warn(`Failed to write "${name}" to localStorage:`, error);
      }
    },
    removeItem: (name: string): void => {
      try {
        localStorage.removeItem(name);
      } catch (error) {
        logger.warn(`Failed to remove "${name}" from localStorage:`, error);
      }
    },
  };
}

/**
 * Pre-instantiated safe localStorage for common use
 */
export const safeLocalStorage = createSafeLocalStorage();
