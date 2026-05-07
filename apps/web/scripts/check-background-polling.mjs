import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const files = [
  'src/lib/offline/sync-service.ts',
  'src/lib/offline/use-offline-status.ts',
  'src/shared/components/connection-status.tsx',
  'src/modules/admin/components/moderation-dashboard.tsx',
];

const violations = [];

for (const file of files) {
  const text = readFileSync(join(root, file), 'utf8');
  if (/\bsetInterval\s*\(/.test(text) || /\bwindow\.setInterval\s*\(/.test(text)) {
    violations.push(`${file}: fixed interval polling is forbidden; use the adaptive scheduler`);
  }
}

if (violations.length > 0) {
  console.error('Background polling gate failed:\n');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log('Background polling gate passed.');
