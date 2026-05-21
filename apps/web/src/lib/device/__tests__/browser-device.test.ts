import { describe, expect, it, vi } from 'vitest';
import { getBrowserDeviceId } from '../browser-device';

function createStorage(initial?: string): Storage {
  const values = new Map<string, string>();
  if (initial) values.set('cgraph_device_id', initial);

  return {
    get length() {
      return values.size;
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

describe('getBrowserDeviceId', () => {
  it('reuses an existing browser device id', () => {
    const storage = createStorage('web-existing');

    expect(getBrowserDeviceId(storage)).toBe('web-existing');
  });

  it('creates and persists a web-scoped browser device id', () => {
    const storage = createStorage();

    const deviceId = getBrowserDeviceId(storage);

    expect(deviceId).toMatch(/^web-/);
    expect(storage.setItem).toHaveBeenCalledWith('cgraph_device_id', deviceId);
  });

  it('replaces legacy non-web ids so the socket never joins as default', () => {
    const storage = createStorage('default');

    const deviceId = getBrowserDeviceId(storage);

    expect(deviceId).toMatch(/^web-/);
    expect(deviceId).not.toBe('default');
  });
});
