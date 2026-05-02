/**
 * Tests for response-extractors.ts
 *
 * Type-safe API response parsing: ensureArray, ensureObject,
 * extractPagination, extractErrorMessage.
 */
import { describe, it, expect } from 'vitest';
import {
  ensureArray,
  ensureObject,
  extractPagination,
  extractErrorMessage,
} from '../response-extractors';

// ensureArray
describe('ensureArray', () => {
  it('returns empty array for null', () => {
    expect(ensureArray(null)).toEqual([]);
  });

  it('returns empty array for undefined', () => {
    expect(ensureArray(undefined)).toEqual([]);
  });

  it('returns direct array as-is', () => {
    const arr = [1, 2, 3];
    expect(ensureArray(arr)).toBe(arr);
  });

  it('extracts using specified key', () => {
    const data = { friends: [{ id: 1 }, { id: 2 }], meta: {} };
    expect(ensureArray(data, 'friends')).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('falls back to common wrapper keys: data', () => {
    expect(ensureArray({ data: ['a', 'b'] })).toEqual(['a', 'b']);
  });

  it('falls back to common wrapper keys: items', () => {
    expect(ensureArray({ items: [1] })).toEqual([1]);
  });

  it('falls back to common wrapper keys: results', () => {
    expect(ensureArray({ results: [42] })).toEqual([42]);
  });

  it('falls back to common wrapper keys: list', () => {
    expect(ensureArray({ list: ['x'] })).toEqual(['x']);
  });

  it('falls back to common wrapper keys: records', () => {
    expect(ensureArray({ records: [{ k: 'v' }] })).toEqual([{ k: 'v' }]);
  });

  it('returns empty array for non-array object without matching keys', () => {
    expect(ensureArray({ foo: 'bar' })).toEqual([]);
  });

  it('returns empty array for primitives', () => {
    expect(ensureArray(42)).toEqual([]);
    expect(ensureArray('string')).toEqual([]);
    expect(ensureArray(true)).toEqual([]);
  });

  it('prefers specified key over common keys', () => {
    const data = { custom: ['custom'], data: ['fallback'] };
    expect(ensureArray(data, 'custom')).toEqual(['custom']);
  });
});

// ensureObject
describe('ensureObject', () => {
  it('returns null for null', () => {
    expect(ensureObject(null)).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(ensureObject(undefined)).toBeNull();
  });

  it('returns null for arrays', () => {
    expect(ensureObject([1, 2])).toBeNull();
  });

  it('extracts from specified key', () => {
    const user = { id: '1', name: 'Alice' };
    expect(ensureObject({ user }, 'user')).toEqual(user);
  });

  it('ignores specified key if it holds a non-object', () => {
    expect(ensureObject({ user: 'string_value' }, 'user')).not.toBe('string_value');
  });

  it('ignores specified key if it holds an array', () => {
    const data = { user: [1, 2], id: '1', name: 'test' };
    // Should NOT return the array, should fall through
    const result = ensureObject(data, 'user');
    expect(Array.isArray(result)).toBe(false);
  });

  it('falls back to data wrapper', () => {
    const inner = { id: '1', name: 'Bob' };
    expect(ensureObject({ data: inner })).toEqual(inner);
  });

  it('returns object as-is if it has non-meta keys', () => {
    const obj = { id: '1', name: 'Direct' };
    expect(ensureObject(obj)).toEqual(obj);
  });

  it('returns null for objects with only meta keys', () => {
    const obj = { data: 'stringVal', meta: {}, status: 200, message: 'ok' };
    // data is a string (not object), so data wrapper won't match.
    // All keys are meta-like, so it should return null.
    expect(ensureObject(obj)).toBeNull();
  });

  it('returns null for primitives', () => {
    expect(ensureObject(42 as never)).toBeNull();
    expect(ensureObject('str' as never)).toBeNull();
  });
});

// extractPagination
describe('extractPagination', () => {
  it('returns defaults for null', () => {
    const p = extractPagination(null);
    expect(p).toEqual({
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
      totalCount: 0,
    });
  });

  it('returns defaults for undefined', () => {
    expect(extractPagination(undefined).hasNextPage).toBe(false);
  });

  it('returns defaults for non-object', () => {
    expect(extractPagination('string').totalCount).toBe(0);
  });

  it('extracts from page_info envelope', () => {
    const data = {
      data: [],
      page_info: {
        has_next_page: true,
        has_previous_page: false,
        start_cursor: 'abc',
        end_cursor: 'xyz',
        total_count: 100,
      },
    };
    const p = extractPagination(data);
    expect(p.hasNextPage).toBe(true);
    expect(p.hasPreviousPage).toBe(false);
    expect(p.startCursor).toBe('abc');
    expect(p.endCursor).toBe('xyz');
    expect(p.totalCount).toBe(100);
  });

  it('uses defaults for missing page_info fields', () => {
    const data = { page_info: { has_next_page: true } };
    const p = extractPagination(data);
    expect(p.hasNextPage).toBe(true);
    expect(p.endCursor).toBeNull(); // default
    expect(p.totalCount).toBe(0); // default
  });

  it('returns defaults when page_info is absent', () => {
    const data = { data: [] };
    const p = extractPagination(data);
    expect(p.hasNextPage).toBe(false);
    expect(p.endCursor).toBeNull();
  });
});

// extractErrorMessage
describe('extractErrorMessage', () => {
  it('returns default for null', () => {
    expect(extractErrorMessage(null)).toBe('An unexpected error occurred');
  });

  it('returns custom default', () => {
    expect(extractErrorMessage(null, 'Oops')).toBe('Oops');
  });

  it('extracts from response.data.error string', () => {
    const err = { response: { data: { error: 'Not found' } } };
    expect(extractErrorMessage(err)).toBe('Not found');
  });

  it('extracts from response.data.error.message', () => {
    const err = { response: { data: { error: { message: 'Validation failed', code: 'E001' } } } };
    expect(extractErrorMessage(err)).toBe('Validation failed');
  });

  it('extracts from response.data.message', () => {
    const err = { response: { data: { message: 'Server error' } } };
    expect(extractErrorMessage(err)).toBe('Server error');
  });

  it('joins response.data.errors array of strings', () => {
    const err = { response: { data: { errors: ['field required', 'too short'] } } };
    expect(extractErrorMessage(err)).toBe('field required, too short');
  });

  it('joins response.data.errors array of objects', () => {
    const err = {
      response: { data: { errors: [{ message: 'invalid email' }, { message: 'weak password' }] } },
    };
    expect(extractErrorMessage(err)).toBe('invalid email, weak password');
  });

  it('extracts from direct message property', () => {
    const err = { message: 'Network error' };
    expect(extractErrorMessage(err)).toBe('Network error');
  });

  it('handles Error instance', () => {
    expect(extractErrorMessage(new Error('Crash'))).toBe('Crash');
  });

  it('returns string error directly', () => {
    expect(extractErrorMessage('Something broke')).toBe('Something broke');
  });

  it('returns default for unrecognized object', () => {
    expect(extractErrorMessage({ code: 500 })).toBe('An unexpected error occurred');
  });
});
