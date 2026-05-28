import { describe, expect, it } from 'vitest';

import { otherUserIdentityPatchFromPayload } from '../otherIdentitySync';

describe('otherUserIdentityPatchFromPayload', () => {
  it('normalizes backend-shaped badge and nameplate cosmetic patches', () => {
    const patch = otherUserIdentityPatchFromPayload('friend-1', {
      customization: {
        equipped_badges: ['badge-founder'],
        equipped_nameplate: 'plate_aurora',
      },
    });

    expect(patch).toMatchObject({
      equippedBadgeIds: ['badge-founder'],
      equippedNameplateId: 'plate_aurora',
    });
  });
});
