/**
 * Tests for response-extractors.ts - Type guards and utility extractors
 *
 * Covers: isRecord, asString, asNumber, asBool, asOptionalString,
 * asOptionalNumber, asStringOrNull, str, asRecordOrUndef, asRecordOrEmpty,
 * asEnum, asArray, typedKeys
 */
import { describe, it, expect } from 'vitest';
import {
  isRecord,
  asString,
  asNumber,
  asBool,
  asOptionalString,
  asOptionalNumber,
  asStringOrNull,
  str,
  asRecordOrUndef,
  asRecordOrEmpty,
  asEnum,
  asArray,
  typedKeys,
} from '../response-extractors';

// isRecord
describe('isRecord', () => {
  it('returns true for plain objects', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ key: 'value' })).toBe(true);
  });

  it('returns true for arrays (typeof object)', () => {
    // Arrays are objects in JS - isRecord only checks typeof + non-null
    expect(isRecord([1, 2])).toBe(true);
  });

  it('returns false for null', () => {
    expect(isRecord(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isRecord(undefined)).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isRecord('string')).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(true)).toBe(false);
  });
});

// asString
describe('asString', () => {
  it('returns string values directly', () => {
    expect(asString('hello')).toBe('hello');
    expect(asString('')).toBe('');
  });

  it('returns default fallback for non-strings', () => {
    expect(asString(42)).toBe('');
    expect(asString(null)).toBe('');
    expect(asString(undefined)).toBe('');
    expect(asString(true)).toBe('');
    expect(asString({})).toBe('');
  });

  it('returns custom fallback for non-strings', () => {
    expect(asString(42, 'fallback')).toBe('fallback');
    expect(asString(null, 'N/A')).toBe('N/A');
  });
});

// asNumber
describe('asNumber', () => {
  it('returns number values directly', () => {
    expect(asNumber(42)).toBe(42);
    expect(asNumber(0)).toBe(0);
    expect(asNumber(-3.14)).toBe(-3.14);
  });

  it('returns default fallback for non-numbers', () => {
    expect(asNumber('42')).toBe(0);
    expect(asNumber(null)).toBe(0);
    expect(asNumber(undefined)).toBe(0);
    expect(asNumber(true)).toBe(0);
  });

  it('returns custom fallback for non-numbers', () => {
    expect(asNumber('42', -1)).toBe(-1);
  });

  it('returns NaN as a number (typeof NaN is number)', () => {
    expect(asNumber(NaN)).toBeNaN();
  });
});

// asBool
describe('asBool', () => {
  it('returns boolean values directly', () => {
    expect(asBool(true)).toBe(true);
    expect(asBool(false)).toBe(false);
  });

  it('returns default fallback for non-booleans', () => {
    expect(asBool(0)).toBe(false);
    expect(asBool(1)).toBe(false);
    expect(asBool('true')).toBe(false);
    expect(asBool(null)).toBe(false);
  });

  it('returns custom fallback for non-booleans', () => {
    expect(asBool(null, true)).toBe(true);
  });
});

// asOptionalString
describe('asOptionalString', () => {
  it('returns string values', () => {
    expect(asOptionalString('hello')).toBe('hello');
    expect(asOptionalString('')).toBe('');
  });

  it('returns undefined for non-strings', () => {
    expect(asOptionalString(42)).toBeUndefined();
    expect(asOptionalString(null)).toBeUndefined();
    expect(asOptionalString(undefined)).toBeUndefined();
    expect(asOptionalString(true)).toBeUndefined();
  });
});

// asOptionalNumber
describe('asOptionalNumber', () => {
  it('returns number values', () => {
    expect(asOptionalNumber(42)).toBe(42);
    expect(asOptionalNumber(0)).toBe(0);
  });

  it('returns undefined for non-numbers', () => {
    expect(asOptionalNumber('42')).toBeUndefined();
    expect(asOptionalNumber(null)).toBeUndefined();
    expect(asOptionalNumber(undefined)).toBeUndefined();
  });
});

// asStringOrNull
describe('asStringOrNull', () => {
  it('returns non-empty strings', () => {
    expect(asStringOrNull('hello')).toBe('hello');
  });

  it('returns null for empty strings', () => {
    expect(asStringOrNull('')).toBeNull();
  });

  it('returns null for non-strings', () => {
    expect(asStringOrNull(42)).toBeNull();
    expect(asStringOrNull(null)).toBeNull();
    expect(asStringOrNull(undefined)).toBeNull();
  });
});

// str
describe('str', () => {
  it('extracts string field from record', () => {
    expect(str({ name: 'Alice' }, 'name')).toBe('Alice');
  });

  it('returns fallback for non-string field', () => {
    expect(str({ count: 42 }, 'count')).toBe('');
    expect(str({ count: 42 }, 'count', 'N/A')).toBe('N/A');
  });

  it('returns fallback for missing field', () => {
    expect(str({ name: 'Alice' }, 'email')).toBe('');
  });

  it('returns fallback for undefined record', () => {
    expect(str(undefined, 'key')).toBe('');
    expect(str(undefined, 'key', 'default')).toBe('default');
  });
});

// asRecordOrUndef
describe('asRecordOrUndef', () => {
  it('returns plain objects', () => {
    const obj = { a: 1 };
    expect(asRecordOrUndef(obj)).toBe(obj);
  });

  it('returns undefined for arrays', () => {
    expect(asRecordOrUndef([1, 2])).toBeUndefined();
  });

  it('returns undefined for null', () => {
    expect(asRecordOrUndef(null)).toBeUndefined();
  });

  it('returns undefined for primitives', () => {
    expect(asRecordOrUndef('string')).toBeUndefined();
    expect(asRecordOrUndef(42)).toBeUndefined();
  });
});

// asRecordOrEmpty
describe('asRecordOrEmpty', () => {
  it('returns plain objects', () => {
    const obj = { a: 1 };
    expect(asRecordOrEmpty(obj)).toBe(obj);
  });

  it('returns empty object for arrays', () => {
    expect(asRecordOrEmpty([1, 2])).toEqual({});
  });

  it('returns empty object for null', () => {
    expect(asRecordOrEmpty(null)).toEqual({});
  });

  it('returns empty object for primitives', () => {
    expect(asRecordOrEmpty('string')).toEqual({});
    expect(asRecordOrEmpty(42)).toEqual({});
  });
});

// asEnum
describe('asEnum', () => {
  const allowed = ['red', 'green', 'blue'] as const;
  type Color = (typeof allowed)[number];

  it('returns valid enum value from array', () => {
    expect(asEnum<Color>('red', allowed, 'blue')).toBe('red');
    expect(asEnum<Color>('green', allowed, 'blue')).toBe('green');
  });

  it('returns fallback for invalid value', () => {
    expect(asEnum<Color>('yellow', allowed, 'blue')).toBe('blue');
  });

  it('returns fallback for non-string values', () => {
    expect(asEnum<Color>(42, allowed, 'blue')).toBe('blue');
    expect(asEnum<Color>(null, allowed, 'blue')).toBe('blue');
  });

  it('works with Set', () => {
    const allowedSet = new Set(['a', 'b', 'c']);
    expect(asEnum('a', allowedSet, 'c')).toBe('a');
    expect(asEnum('z', allowedSet, 'c')).toBe('c');
  });
});

// asArray
describe('asArray', () => {
  const isString = (x: unknown): x is string => typeof x === 'string';
  const isNumber = (x: unknown): x is number => typeof x === 'number';

  it('filters array elements through guard', () => {
    expect(asArray(['a', 1, 'b', 2], isString)).toEqual(['a', 'b']);
    expect(asArray(['a', 1, 'b', 2], isNumber)).toEqual([1, 2]);
  });

  it('returns empty array for non-array input', () => {
    expect(asArray('not-array', isString)).toEqual([]);
    expect(asArray(null, isString)).toEqual([]);
    expect(asArray(undefined, isString)).toEqual([]);
    expect(asArray(42, isString)).toEqual([]);
  });

  it('returns empty array when no elements match', () => {
    expect(asArray([1, 2, 3], isString)).toEqual([]);
  });

  it('returns all elements when all match', () => {
    expect(asArray(['a', 'b', 'c'], isString)).toEqual(['a', 'b', 'c']);
  });
});

// typedKeys
describe('typedKeys', () => {
  it('returns keys of an object', () => {
    const obj = { a: 1, b: 'hello', c: true };
    const keys = typedKeys(obj);
    expect(keys).toEqual(expect.arrayContaining(['a', 'b', 'c']));
    expect(keys).toHaveLength(3);
  });

  it('returns empty array for empty object', () => {
    expect(typedKeys({})).toEqual([]);
  });
});
