import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB_SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ROUTED_SOURCE_DIRS = ['pages', 'modules', 'shared', 'layouts'];
const SOURCE_FILE_PATTERN = /\.(ts|tsx)$/;
const IGNORED_SEGMENTS = new Set(['__tests__', '__mocks__']);

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      if (IGNORED_SEGMENTS.has(entry)) return [];
      return listSourceFiles(path);
    }
    return SOURCE_FILE_PATTERN.test(entry) ? [path] : [];
  });
}

describe('route inventory hygiene', () => {
  it('does not ship literal coming-soon panels in routed web source', () => {
    const offenders = ROUTED_SOURCE_DIRS.flatMap((dir) => listSourceFiles(join(WEB_SRC, dir)))
      .map((file) => ({
        file,
        source: readFileSync(file, 'utf8'),
      }))
      .filter(({ source }) => /coming soon/i.test(source))
      .map(({ file }) => file.replace(`${WEB_SRC}/`, 'src/'));

    expect(offenders).toEqual([]);
  });
});
