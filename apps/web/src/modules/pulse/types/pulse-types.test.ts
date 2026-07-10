import { describe, expect, it } from 'vitest';

import { normalizePulseScore } from './index';

describe('Pulse score normalization', () => {
  it('accepts the backend trusted tier', () => {
    expect(
      normalizePulseScore({
        forum_id: 'forum-1',
        forum_name: 'CGraph',
        score: 50,
        tier: 'trusted',
      })
    ).toEqual({
      forumId: 'forum-1',
      forumName: 'CGraph',
      score: 50,
      tier: 'trusted',
    });
  });

  it('rejects the retired local tier vocabulary', () => {
    expect(
      normalizePulseScore({
        forum_id: 'forum-1',
        forum_name: 'CGraph',
        score: 50,
        tier: 'gold',
      })
    ).toBeNull();
  });
});
