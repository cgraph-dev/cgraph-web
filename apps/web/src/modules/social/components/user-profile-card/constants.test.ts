import { describe, expect, it } from 'vitest';
import { pulseTierForScore } from '@cgraph-dev/shared-types';

import { pulseDotCountForTier } from './constants';

describe('profile-card Pulse presentation', () => {
  it.each([
    [0, 0],
    [10, 1],
    [50, 2],
    [200, 3],
    [500, 4],
    [1000, 5],
  ] as const)('maps canonical Pulse score %i to %i presentation dots', (score, dots) => {
    expect(pulseDotCountForTier(pulseTierForScore(score))).toBe(dots);
  });
});
