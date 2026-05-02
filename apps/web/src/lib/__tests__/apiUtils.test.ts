import { describe, it, expect } from 'vitest';
import {
  ensureArray,
  ensureObject,
  extractPagination,
  isNonEmptyString,
  isValidId,
} from '../api-utils';

describe('API Utils', () => {
  describe('ensureArray', () => {
    it('should return empty array for null', () => {
      expect(ensureArray(null)).toEqual([]);
    });

    it('should return empty array for undefined', () => {
      expect(ensureArray(undefined)).toEqual([]);
    });

    it('should return array directly if input is array', () => {
      const arr = [1, 2, 3];
      expect(ensureArray(arr)).toBe(arr);
    });

    it('should extract array from object with specified key', () => {
      const data = { friends: [{ id: 1 }, { id: 2 }] };
      expect(ensureArray(data, 'friends')).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should extract array from data wrapper', () => {
      const data = { data: [1, 2, 3] };
      expect(ensureArray(data)).toEqual([1, 2, 3]);
    });

    it('should extract array from items wrapper', () => {
      const data = { items: ['a', 'b', 'c'] };
      expect(ensureArray(data)).toEqual(['a', 'b', 'c']);
    });

    it('should return empty array for object without array', () => {
      expect(ensureArray({ name: 'test' })).toEqual([]);
    });

    it('should return empty array for primitive values', () => {
      expect(ensureArray('string')).toEqual([]);
      expect(ensureArray(123)).toEqual([]);
      expect(ensureArray(true)).toEqual([]);
    });
  });

  describe('ensureObject', () => {
    it('should return null for null', () => {
      expect(ensureObject(null)).toBeNull();
    });

    it('should return null for undefined', () => {
      expect(ensureObject(undefined)).toBeNull();
    });

    it('should return object directly if input is object with properties', () => {
      const obj = { id: 1, name: 'test' };
      expect(ensureObject(obj)).toEqual(obj);
    });

    it('should extract object from data wrapper', () => {
      const data = { data: { id: 1, name: 'test' } };
      expect(ensureObject(data)).toEqual({ id: 1, name: 'test' });
    });

    it('should return null for arrays', () => {
      expect(ensureObject([1, 2, 3])).toBeNull();
    });

    it('should return null for primitives', () => {
      expect(ensureObject('string')).toBeNull();
      expect(ensureObject(123)).toBeNull();
    });

    it('should extract object from specified key', () => {
      const data = { user: { id: 1, name: 'John' } };
      expect(ensureObject(data, 'user')).toEqual({ id: 1, name: 'John' });
    });
  });

  describe('extractPagination', () => {
    it('should return defaults for null', () => {
      const result = extractPagination(null);
      expect(result.hasNextPage).toBe(false);
      expect(result.endCursor).toBeNull();
      expect(result.totalCount).toBe(0);
    });

    it('should return defaults for undefined', () => {
      const result = extractPagination(undefined);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    it('should extract pagination from page_info envelope', () => {
      const data = {
        data: [],
        page_info: {
          has_next_page: true,
          has_previous_page: false,
          start_cursor: 'start',
          end_cursor: 'end',
          total_count: 100,
        },
      };
      const result = extractPagination(data);
      expect(result.hasNextPage).toBe(true);
      expect(result.endCursor).toBe('end');
      expect(result.totalCount).toBe(100);
    });

    it('should handle missing page_info fields with defaults', () => {
      const data = { page_info: { has_next_page: true } };
      const result = extractPagination(data);
      expect(result.hasNextPage).toBe(true);
      expect(result.endCursor).toBeNull();
      expect(result.totalCount).toBe(0);
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty string', () => {
      expect(isNonEmptyString('hello')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isNonEmptyString('')).toBe(false);
    });

    it('should return false for whitespace-only string', () => {
      expect(isNonEmptyString('   ')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isNonEmptyString(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isNonEmptyString(undefined)).toBe(false);
    });

    it('should return false for non-string types', () => {
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
      expect(isNonEmptyString([])).toBe(false);
    });
  });

  describe('isValidId', () => {
    it('should return true for non-empty string', () => {
      expect(isValidId('user-123')).toBe(true);
    });

    it('should return true for positive number', () => {
      expect(isValidId(123)).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(isValidId('')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isValidId(null)).toBe(false);
      expect(isValidId(undefined)).toBe(false);
    });
  });
});
