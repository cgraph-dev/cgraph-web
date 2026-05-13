import { existsSync, readFileSync } from 'node:fs';
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
  const path = join(root, file);
  if (!existsSync(path)) continue;

  const text = readFileSync(path, 'utf8');
  if (/\bsetInterval\s*\(/.test(text) || /\bwindow\.setInterval\s*\(/.test(text)) {
    violations.push(`${file}: fixed interval polling is forbidden; use the adaptive scheduler`);
  }
}

const userChannelPath = 'src/lib/socket/userChannel.ts';
const userChannel = readFileSync(join(root, userChannelPath), 'utf8');
const friendRequestHandler = userChannel.match(
  /channel\.on\('friend_request',\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\n\s*\}\);/
);

if (!friendRequestHandler) {
  violations.push(`${userChannelPath}: friend_request socket handler is missing`);
} else {
  const handlerSource = friendRequestHandler[0];
  if (handlerSource.includes('fetchPendingRequests')) {
    violations.push(
      `${userChannelPath}: friend_request must apply the socket payload directly, not refetch pending requests`
    );
  }
  if (!handlerSource.includes('upsertIncomingRequest')) {
    violations.push(`${userChannelPath}: friend_request must upsert the incoming request into the social store`);
  }
}

if (violations.length > 0) {
  console.error('Background polling gate failed:\n');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log('Background polling gate passed.');
