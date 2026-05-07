import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const sourceRoot = join(root, 'src');
const allowedDangerousFiles = new Set([
  'src/shared/components/security/safe-html.tsx',
  'src/modules/forums/components/forum-theme-renderer/forum-theme-provider.tsx',
]);
const allowedDomPurifyFiles = new Set(['src/shared/components/security/safe-html.tsx']);

const sourceExtensions = new Set(['.ts', '.tsx']);
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

    if (!sourceExtensions.has(path.slice(path.lastIndexOf('.')))) continue;
    if (path.includes('.test.') || path.includes('.spec.') || path.includes('.stories.')) continue;
    checkFile(path);
  }
}

function checkFile(path) {
  const rel = relative(root, path).replaceAll('\\', '/');
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (/dangerouslySetInnerHTML\s*=/.test(line) && !allowedDangerousFiles.has(rel)) {
      violations.push(`${rel}:${lineNumber} raw dangerouslySetInnerHTML must use SafeHtml`);
    }

    if (/\binnerHTML\s*=|\binsertAdjacentHTML\s*\(/.test(line) && !allowedDangerousFiles.has(rel)) {
      violations.push(`${rel}:${lineNumber} raw DOM HTML sink is not allowed`);
    }

    if (/from ['"]dompurify['"]/.test(line) && !allowedDomPurifyFiles.has(rel)) {
      violations.push(`${rel}:${lineNumber} DOMPurify must be centralized in SafeHtml`);
    }
  });
}

walk(sourceRoot);

if (violations.length > 0) {
  console.error('Unsafe HTML sink gate failed:\n');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log('Safe HTML sink gate passed.');
