import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

function readSourceFiles(directory: string): readonly string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : readSourceFiles(path);
    return /\.(?:css|ts|tsx)$/.test(entry.name) && !/\.test\.[tj]sx?$/.test(entry.name)
      ? [readFileSync(path, 'utf8')]
      : [];
  });
}

const source = readSourceFiles(join(process.cwd(), 'src')).join('\n');
const css =
  readSourceFiles(join(process.cwd(), 'src', 'styles')).join('\n') +
  readFileSync(join(process.cwd(), 'src', 'index.css'), 'utf8');

describe('hover motion policy', () => {
  it('keeps cards and controls free of hover rotation and 3D tilt', () => {
    expect(source).not.toMatch(/whileHover\s*=\s*\{\s*\{[^}]*\brotate:/);
    expect(source).not.toMatch(/\bhover3D\b/);
    expect(source).not.toMatch(/\bTiltCard\b/);
    expect(source).not.toMatch(/\bhoverAnimations\.tilt\b/);
    expect(source).not.toMatch(/(?:group-)?hover:-?rotate/);
  });

  it('keeps stylesheet hover states non-transforming', () => {
    expect(css).not.toMatch(/:hover\s*\{[^}]*\btransform:/);
    expect(css).not.toContain('transform-style: preserve-3d');
    expect(css).not.toMatch(/\bperspective:/);
    expect(css).not.toMatch(/\bhover:-?translate(?:-[xy])?/);
    expect(css).not.toContain('transition-all');
  });
});
