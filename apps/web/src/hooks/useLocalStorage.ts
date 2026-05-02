/**
 * Hook for type-safe localStorage access.
 */
import { useState, useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useLocalStorage');

/**
 * Hook that syncs state with localStorage.
 *
 * Handles serialization/deserialization and storage events for
 * cross-tab synchronization.
 *
 * @param key - localStorage key
 * @param initialValue - default value if key doesn't exist
 * @returns tuple of [value, setValue, removeValue]
 *
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 * const [settings, setSettings, clearSettings] = useLocalStorage('settings', {});
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Read from localStorage on mount
  function readValue(): T {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);

      if (item === null) return initialValue;
      const parsed: { value: T } = { value: JSON.parse(item) };
      return parsed.value;
    } catch (error: unknown) {
      logger.warn(
        `Error reading localStorage key "${key}":`,
        error instanceof Error ? error.message : error
      );
      return initialValue;
    }
  }

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Update localStorage when state changes
  function setValue(value: T | ((prev: T) => T)) {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          window.dispatchEvent(new StorageEvent('storage', { key }));
        }
      } catch (error: unknown) {
        logger.warn(
          `Error setting localStorage key "${key}":`,
          error instanceof Error ? error.message : error
        );
      }
  }

  // Remove from localStorage
  function removeValue() {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        window.dispatchEvent(new StorageEvent('storage', { key }));
      }
      setStoredValue(initialValue);
    } catch (error: unknown) {
      logger.warn(
        `Error removing localStorage key "${key}":`,
        error instanceof Error ? error.message : error
      );
    }
  }

  // Sync across tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch {
          // JSON.parse failed; fall back to initialValue to avoid corrupt state.
          setStoredValue(initialValue);
        }
      } else if (event.key === key && event.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
