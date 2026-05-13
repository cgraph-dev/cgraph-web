/**
 * Friend Normalizers Unit Tests
 *
 * Tests for normalizeRequest and normalizeFriend helper functions
 * that transform raw API responses into typed Friend/FriendRequest objects.
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeRequest,
  normalizeFriend,
  normalizeIncomingRequestEvent,
} from '../friend-normalizers';

describe('normalizeRequest', () => {
  describe('incoming requests', () => {
    it('normalizes a complete incoming request with "from" data', () => {
      const raw: Record<string, unknown> = {
        id: 'req-1',
        from: {
          id: 'user-2',
          username: 'alice',
          display_name: 'Alice',
          avatar_url: 'https://example.com/alice.png',
          avatar_border_id: 'border-1',
        },
        sent_at: '2026-01-01T00:00:00Z',
      };

      const result = normalizeRequest(raw, 'incoming');

      expect(result.id).toBe('req-1');
      expect(result.type).toBe('incoming');
      expect(result.user.id).toBe('user-2');
      expect(result.user.username).toBe('alice');
      expect(result.user.displayName).toBe('Alice');
      expect(result.user.avatarUrl).toBe('https://example.com/alice.png');
      expect(result.createdAt).toBe('2026-01-01T00:00:00Z');
    });

    it('falls back to unknown user when "from" is missing', () => {
      const raw: Record<string, unknown> = {
        id: 'req-2',
        created_at: '2026-02-01T00:00:00Z',
      };

      const result = normalizeRequest(raw, 'incoming');

      expect(result.user.id).toBe('unknown');
      expect(result.user.username).toBe('Unknown User');
      expect(result.user.displayName).toBeNull();
      expect(result.user.avatarUrl).toBeNull();
    });

    it('uses created_at when sent_at is missing', () => {
      const raw: Record<string, unknown> = {
        id: 'req-3',
        from: { id: 'u-1', username: 'bob' },
        created_at: '2026-03-01T00:00:00Z',
      };

      const result = normalizeRequest(raw, 'incoming');

      expect(result.createdAt).toBe('2026-03-01T00:00:00Z');
    });

    it('falls back to current ISO timestamp when no date fields exist', () => {
      const raw: Record<string, unknown> = {
        id: 'req-4',
        from: { id: 'u-1', username: 'bob' },
      };

      const result = normalizeRequest(raw, 'incoming');

      // Should be a valid ISO date string
      expect(() => new Date(result.createdAt)).not.toThrow();
    });
  });

  describe('outgoing requests', () => {
    it('normalizes an outgoing request using "to" data', () => {
      const raw: Record<string, unknown> = {
        id: 'req-5',
        to: {
          id: 'user-3',
          username: 'carol',
          display_name: 'Carol',
          avatar_url: null,
        },
        sent_at: '2026-04-01T00:00:00Z',
      };

      const result = normalizeRequest(raw, 'outgoing');

      expect(result.type).toBe('outgoing');
      expect(result.user.id).toBe('user-3');
      expect(result.user.username).toBe('carol');
      expect(result.user.displayName).toBe('Carol');
    });

    it('falls back to unknown user when "to" is missing for outgoing', () => {
      const raw: Record<string, unknown> = { id: 'req-6' };

      const result = normalizeRequest(raw, 'outgoing');

      expect(result.user.id).toBe('unknown');
      expect(result.user.username).toBe('Unknown User');
    });
  });

  describe('edge cases', () => {
    it('handles camelCase field names (displayName, avatarUrl)', () => {
      const raw: Record<string, unknown> = {
        id: 'req-7',
        from: {
          id: 'u-5',
          username: 'dave',
          displayName: 'Dave',
          avatarUrl: 'https://example.com/dave.png',
          avatarBorderId: 'border-2',
        },
        sent_at: '2026-05-01T00:00:00Z',
      };

      const result = normalizeRequest(raw, 'incoming');

      expect(result.user.displayName).toBe('Dave');
      expect(result.user.avatarUrl).toBe('https://example.com/dave.png');
    });

    it('defaults username to "Unknown" when missing from user data', () => {
      const raw: Record<string, unknown> = {
        id: 'req-8',
        from: { id: 'u-6' },
      };

      const result = normalizeRequest(raw, 'incoming');

      expect(result.user.username).toBe('Unknown');
    });

    it('handles non-object "from" value gracefully', () => {
      const raw: Record<string, unknown> = {
        id: 'req-9',
        from: 'not-an-object',
      };

      const result = normalizeRequest(raw, 'incoming');

      expect(result.user.id).toBe('unknown');
    });
  });
});

describe('normalizeFriend', () => {
  it('normalizes a friend with nested user data (snake_case)', () => {
    const raw: Record<string, unknown> = {
      id: 'fs-1',
      user: {
        id: 'user-1',
        username: 'alice',
        display_name: 'Alice',
        avatar_url: 'https://example.com/alice.png',
        avatar_border_id: 'border-1',
      },
      since: '2025-06-15T00:00:00Z',
    };

    const result = normalizeFriend(raw);

    expect(result.id).toBe('user-1');
    expect(result.username).toBe('alice');
    expect(result.displayName).toBe('Alice');
    expect(result.avatarUrl).toBe('https://example.com/alice.png');
    expect(result.friendshipId).toBe('fs-1');
    expect(result.createdAt).toBe('2025-06-15T00:00:00Z');
    expect(result.status).toBe('offline');
    expect(result.statusMessage).toBeNull();
  });

  it('falls back to top-level id when user.id is missing', () => {
    const raw: Record<string, unknown> = {
      id: 'fs-2',
      user: { username: 'bob' },
      created_at: '2025-07-01T00:00:00Z',
    };

    const result = normalizeFriend(raw);

    expect(result.id).toBe('fs-2');
  });

  it('handles missing user data gracefully', () => {
    const raw: Record<string, unknown> = {
      id: 'fs-3',
    };

    const result = normalizeFriend(raw);

    expect(result.username).toBe('Unknown');
    expect(result.displayName).toBeNull();
    expect(result.avatarUrl).toBeNull();
    expect(result.friendshipId).toBe('fs-3');
  });

  it('uses created_at when since is missing', () => {
    const raw: Record<string, unknown> = {
      id: 'fs-4',
      user: { id: 'u-1', username: 'x' },
      created_at: '2025-08-01T00:00:00Z',
    };

    const result = normalizeFriend(raw);

    expect(result.createdAt).toBe('2025-08-01T00:00:00Z');
  });

  it('handles camelCase field names', () => {
    const raw: Record<string, unknown> = {
      id: 'fs-5',
      user: {
        id: 'u-2',
        username: 'carol',
        displayName: 'Carol',
        avatarUrl: 'https://example.com/carol.png',
        avatarBorderId: 'b-1',
      },
      since: '2025-09-01T00:00:00Z',
    };

    const result = normalizeFriend(raw);

    expect(result.displayName).toBe('Carol');
    expect(result.avatarUrl).toBe('https://example.com/carol.png');
  });

  it('always sets status to offline and statusMessage to null', () => {
    const raw: Record<string, unknown> = {
      id: 'fs-6',
      user: { id: 'u-3', username: 'test', status: 'online' },
    };

    const result = normalizeFriend(raw);

    expect(result.status).toBe('offline');
    expect(result.statusMessage).toBeNull();
  });
});

describe('normalizeIncomingRequestEvent', () => {
  it('normalizes the user-channel friend_request payload', () => {
    const result = normalizeIncomingRequestEvent({
      request_id: 'req-10',
      from_user_id: 'user-10',
      from_username: 'maya',
      from_display_name: 'Maya',
      from_avatar_url: 'https://example.com/maya.png',
      created_at: '2026-05-08T00:00:00Z',
    });

    expect(result).toEqual({
      id: 'req-10',
      user: {
        id: 'user-10',
        username: 'maya',
        displayName: 'Maya',
        avatarUrl: 'https://example.com/maya.png',
        avatarBorderId: null,
        avatar_border_id: null,
      },
      createdAt: '2026-05-08T00:00:00Z',
      type: 'incoming',
    });
  });

  it('rejects payloads that cannot identify the request and actor', () => {
    expect(normalizeIncomingRequestEvent({ request_id: 'req-missing-user' })).toBeNull();
    expect(normalizeIncomingRequestEvent({ from_user_id: 'user-missing-request' })).toBeNull();
  });
});
