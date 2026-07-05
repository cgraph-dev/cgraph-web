import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
  APP_THEME_MANIFESTS,
  APP_THEME_MANIFEST_BY_ID,
  CGRAPH_THEME_STORAGE_KEY,
  DEFAULT_APP_THEME_ID,
} from '@cgraph-dev/design-tokens/app-theme-manifest';

const bootstrapSource = readFileSync(
  join(process.cwd(), 'public/theme-bootstrap.js'),
  'utf8'
);

interface BootstrapResult {
  readonly rootClasses: Set<string>;
  readonly colorScheme: string | undefined;
  readonly bodyClassList: Set<string>;
  readonly bodyBackgroundColor: string | undefined;
  readonly bodyColor: string | undefined;
  readonly loaderBackground: string | undefined;
  readonly themeColor: string | undefined;
}

function createClassList(initial: readonly string[] = []) {
  const values = new Set(initial);

  return {
    values,
    add: (...classes: string[]) => {
      for (const className of classes) values.add(className);
    },
    remove: (...classes: string[]) => {
      for (const className of classes) values.delete(className);
    },
  };
}

function runBootstrap(
  preferences: Record<string, unknown> | null,
  prefersDark = true
): BootstrapResult {
  const rootClassList = createClassList(['light', 'dark', 'theme-dark']);
  const bodyClassList = createClassList();
  const root = { classList: rootClassList, style: {} as Record<string, string> };
  const body = { classList: bodyClassList, style: {} as Record<string, string> };
  const loader = { style: {} as Record<string, string> };
  const themeMeta = {
    content: undefined as string | undefined,
    setAttribute(name: string, value: string) {
      if (name === 'content') this.content = value;
    },
  };

  vm.runInNewContext(bootstrapSource, {
    document: {
      documentElement: root,
      body,
      getElementById(id: string) {
        return id === 'initial-loader' ? loader : null;
      },
      querySelector(selector: string) {
        return selector === 'meta[name="theme-color"]' ? themeMeta : null;
      },
    },
    localStorage: {
      getItem(key: string) {
        if (key !== CGRAPH_THEME_STORAGE_KEY || preferences === null) return null;
        return JSON.stringify(preferences);
      },
    },
    window: {
      matchMedia() {
        return { matches: prefersDark };
      },
    },
  });

  return {
    rootClasses: rootClassList.values,
    colorScheme: root.style.colorScheme,
    bodyClassList: bodyClassList.values,
    bodyBackgroundColor: body.style.backgroundColor,
    bodyColor: body.style.color,
    loaderBackground: loader.style.background,
    themeColor: themeMeta.content,
  };
}

describe('theme bootstrap projection', () => {
  it('projects every package-owned app theme manifest into the early bootstrap script', () => {
    for (const theme of APP_THEME_MANIFESTS) {
      const result = runBootstrap({ activeThemeId: theme.id });

      expect(result.rootClasses.has(theme.category)).toBe(true);
      expect(result.rootClasses.has(theme.bootstrap.variantClass)).toBe(true);
      expect(result.colorScheme).toBe(theme.bootstrap.colorScheme);
      expect(result.bodyClassList.has('antialiased')).toBe(true);
      expect(result.bodyBackgroundColor).toBe(theme.bootstrap.bodyBackground);
      expect(result.bodyColor).toBe(theme.bootstrap.bodyColor);
      expect(result.loaderBackground).toBe(theme.bootstrap.loaderBackground);
      expect(result.themeColor).toBe(theme.bootstrap.themeColor);
    }
  });

  it('falls back to the package-owned default theme when storage is empty or stale', () => {
    const defaultTheme = APP_THEME_MANIFEST_BY_ID[DEFAULT_APP_THEME_ID];

    expect(runBootstrap(null).themeColor).toBe(defaultTheme.bootstrap.themeColor);
    expect(runBootstrap({ activeThemeId: 'system' }).themeColor).toBe(
      defaultTheme.bootstrap.themeColor
    );
  });

  it('preserves system-preference behavior without accepting system as a stored theme id', () => {
    expect(
      runBootstrap({ activeThemeId: 'light', settings: { respectSystemPreference: true } }, true)
        .themeColor
    ).toBe(APP_THEME_MANIFEST_BY_ID.aurora.bootstrap.themeColor);

    expect(
      runBootstrap({ activeThemeId: 'dark', settings: { respectSystemPreference: true } }, false)
        .themeColor
    ).toBe(APP_THEME_MANIFEST_BY_ID.light.bootstrap.themeColor);
  });
});
