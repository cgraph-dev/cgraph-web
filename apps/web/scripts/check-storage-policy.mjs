import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const sourceRoot = join(root, 'src');
const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      if (entry === '__tests__' || entry === 'test') continue;
      walk(path);
      continue;
    }

    if (!/\.(ts|tsx)$/.test(path)) continue;
    if (path.includes('.test.') || path.includes('.spec.') || path.includes('.stories.')) continue;
    checkFile(path);
  }
}

function checkFile(path) {
  const rel = relative(root, path).replaceAll('\\', '/');
  const text = readFileSync(path, 'utf8');

  if (/localStorage\.clear\s*\(/.test(text)) {
    violations.push(`${rel}: localStorage.clear() is forbidden; remove namespaced keys instead`);
  }

  if (/sessionStorage\.clear\s*\(/.test(text)) {
    violations.push(`${rel}: sessionStorage.clear() is forbidden; remove namespaced keys instead`);
  }
}

walk(sourceRoot);

if (violations.length > 0) {
  console.error('Storage policy gate failed:\n');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log('Storage policy gate passed.');
