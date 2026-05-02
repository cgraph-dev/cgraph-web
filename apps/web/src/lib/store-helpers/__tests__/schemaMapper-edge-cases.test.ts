/**
 * Extended tests for schema-mapper.ts
 *
 * Covers edge cases in case conversion, debounced save timer management,
 * and mapper round-tripping with various data shapes.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  toApiParams,
  fromApiParams,
  createSchemaMapper,
  createDebouncedSave,
} from '../schema-mapper';
import type { BaseStoreState, FieldSchema } from '../types';

// camelToSnake edge cases (tested via toApiParams with empty schema)
describe('camelToSnake conversion via toApiParams', () => {
  const emptySchema: FieldSchema = {};

  it('converts single-word camelCase', () => {
    expect(toApiParams({ name: 'test' }, emptySchema)).toEqual({ name: 'test' });
  });

  it('converts multi-word camelCase', () => {
    expect(toApiParams({ firstName: 'John' }, emptySchema)).toEqual({ first_name: 'John' });
  });

  it('converts consecutive capitals', () => {
    // "isURL" -> "is_u_r_l" (per simple regex replace)
    const result = toApiParams({ isURL: true }, emptySchema);
    expect(result).toHaveProperty('is_u_r_l');
  });

  it('handles already snake_case keys', () => {
    const result = toApiParams({ already_snake: 'val' }, emptySchema);
    expect(result).toEqual({ already_snake: 'val' });
  });

  it('preserves values of various types', () => {
    const data = {
      strField: 'hello',
      numField: 42,
      boolField: true,
      nullField: null,
      arrayField: [1, 2, 3],
      objField: { nested: true },
    };
    const result = toApiParams(data, emptySchema);
    expect(result.str_field).toBe('hello');
    expect(result.num_field).toBe(42);
    expect(result.bool_field).toBe(true);
    expect(result.null_field).toBeNull();
    expect(result.array_field).toEqual([1, 2, 3]);
    expect(result.obj_field).toEqual({ nested: true });
  });

  it('schema mappings override automatic conversion', () => {
    const schema: FieldSchema = { myWeirdKey: 'custom_api_name' };
    const result = toApiParams({ myWeirdKey: 'value' }, schema);
    expect(result).toEqual({ custom_api_name: 'value' });
  });
});

// snakeToCamel edge cases (tested via fromApiParams with empty schema)
describe('snakeToCamel conversion via fromApiParams', () => {
  const emptySchema: FieldSchema = {};

  it('converts snake_case to camelCase', () => {
    const defaults = { firstName: '' };
    const result = fromApiParams({ first_name: 'Jane' }, emptySchema, defaults);
    expect(result.firstName).toBe('Jane');
  });

  it('handles single-word keys', () => {
    const defaults = { name: '' };
    const result = fromApiParams({ name: 'test' }, emptySchema, defaults);
    expect(result.name).toBe('test');
  });

  it('handles multiple underscores', () => {
    const defaults = { veryLongFieldName: '' };
    const result = fromApiParams({ very_long_field_name: 'val' }, emptySchema, defaults);
    expect(result.veryLongFieldName).toBe('val');
  });

  it('does not include keys not in defaults', () => {
    const defaults = { known: 'default' };
    const result = fromApiParams(
      { known: 'overridden', unknown_field: 'ignored' },
      emptySchema,
      defaults
    );
    expect(result).toEqual({ known: 'overridden' });
    expect('unknownField' in result).toBe(false);
  });
});

// createSchemaMapper
describe('createSchemaMapper advanced', () => {
  it('handles empty data', () => {
    const schema: FieldSchema = { firstName: 'first_name' };
    const mapper = createSchemaMapper(schema);

    expect(mapper.toApi({})).toEqual({});
    expect(mapper.fromApi({}, { firstName: 'default' })).toEqual({ firstName: 'default' });
  });

  it('round-trips with mixed schema and automatic conversion', () => {
    const schema: FieldSchema = { userId: 'user_id' };
    const mapper = createSchemaMapper(schema);

    const original = { userId: 'abc', displayName: 'Test' };
    const api = mapper.toApi(original);
    expect(api).toEqual({ user_id: 'abc', display_name: 'Test' });

    const restored = mapper.fromApi(api, { userId: '', displayName: '' });
    expect(restored).toEqual(original);
  });

  it('exposes the schema for external use', () => {
    const schema: FieldSchema = { a: 'x', b: 'y' };
    const mapper = createSchemaMapper(schema);
    expect(mapper.schema).toBe(schema);
  });
});

// createDebouncedSave - extended
describe('createDebouncedSave extended', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses default delay of 500ms when not specified', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn();
    const state = {} as BaseStoreState;

    const debouncedSave = createDebouncedSave(saveFn);
    debouncedSave(state, set);

    expect(saveFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(499);
    expect(saveFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(saveFn).toHaveBeenCalledOnce();
  });

  it('debounces multiple calls - only last one fires', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn();

    const debouncedSave = createDebouncedSave(saveFn, { delay: 200 });

    // Call multiple times rapidly
    const state1 = { value: 1 } as unknown as BaseStoreState;
    const state2 = { value: 2 } as unknown as BaseStoreState;
    const state3 = { value: 3 } as unknown as BaseStoreState;

    debouncedSave(state1, set);
    debouncedSave(state2, set);
    debouncedSave(state3, set);

    await vi.advanceTimersByTimeAsync(200);

    // Only last call should have fired
    expect(saveFn).toHaveBeenCalledOnce();
    expect(saveFn).toHaveBeenCalledWith(state3, set);
  });

  it('clears isSaving on success', async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const stateUpdates: Array<Partial<BaseStoreState>> = [];
    const set = vi.fn((updater: unknown) => {
      if (typeof updater === 'function') {
        stateUpdates.push(updater({}));
      } else {
        stateUpdates.push(updater as Partial<BaseStoreState>);
      }
    });
    const state = {} as BaseStoreState;

    const debouncedSave = createDebouncedSave(saveFn, { delay: 100 });
    debouncedSave(state, set);

    await vi.advanceTimersByTimeAsync(100);

    // Should have set isSaving: false after completion
    const lastUpdate = stateUpdates[stateUpdates.length - 1];
    expect(lastUpdate).toMatchObject({ isSaving: false });
  });

  it('handles non-Error rejection with generic message', async () => {
    const saveFn = vi.fn().mockRejectedValue('string-error');
    const stateUpdates: Array<Partial<BaseStoreState>> = [];
    const set = vi.fn((updater: unknown) => {
      if (typeof updater === 'function') {
        stateUpdates.push(updater({}));
      } else {
        stateUpdates.push(updater as Partial<BaseStoreState>);
      }
    });
    const state = {} as BaseStoreState;

    const debouncedSave = createDebouncedSave(saveFn, { delay: 50 });
    debouncedSave(state, set);

    await vi.advanceTimersByTimeAsync(50);

    const lastUpdate = stateUpdates[stateUpdates.length - 1];
    expect(lastUpdate).toMatchObject({ isSaving: false, error: 'Save failed' });
  });
});
