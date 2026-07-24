import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const i18n = vi.hoisted(() => {
  const instance = {
    init: vi.fn(),
    use: vi.fn(),
  };

  instance.use.mockReturnValue(instance);
  return instance;
});

vi.mock('i18next', () => ({ default: i18n }));
vi.mock('i18next-http-backend', () => ({ default: {} }));
vi.mock('i18next-icu', () => ({ default: {} }));
vi.mock('react-i18next', () => ({ initReactI18next: {} }));
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));

const englishLocalesDirectory = resolve(process.cwd(), 'public/locales/en');

describe('i18n runtime configuration', () => {
  beforeEach(async () => {
    vi.resetModules();
    i18n.init.mockClear();
    i18n.use.mockClear();
    i18n.use.mockReturnValue(i18n);
    document.documentElement.lang = '';
    document.documentElement.dir = '';

    await import('../i18n');
  });

  it('declares exactly the shipped English namespaces', () => {
    const initOptions = i18n.init.mock.calls[0]?.[0] as {
      ns: readonly string[];
      supportedLngs: readonly string[];
    };
    const shippedNamespaces = readdirSync(englishLocalesDirectory)
      .filter((fileName) => fileName.endsWith('.json'))
      .map((fileName) => fileName.slice(0, -'.json'.length))
      .sort();

    expect([...initOptions.ns].sort()).toEqual(shippedNamespaces);
    expect(initOptions.supportedLngs).toEqual(['en']);
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
  });
});
