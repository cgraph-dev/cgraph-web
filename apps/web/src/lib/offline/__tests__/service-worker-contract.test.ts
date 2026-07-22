import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const serviceWorkerPath = resolve(process.cwd(), 'public/sw.js');

describe('offline service worker contract', () => {
  it('uses the account-scoped v4 outbox contract', async () => {
    const source = await readFile(serviceWorkerPath, 'utf8');

    expect(source).toContain("const OFFLINE_DB_VERSION = 4;");
    expect(source).toContain('request.onupgradeneeded');
    expect(source).toContain("pending.createIndex('by_account'");
    expect(source).toContain("pending.createIndex('by_account_conversation'");
    expect(source).toContain('async function authenticatedAccountId()');
    expect(source).toContain('message.accountId === accountId');
    expect(source).toContain("message.status === 'pending' || message.status === 'sending'");
    expect(source).toContain("status: 'failed'");
  });
});
