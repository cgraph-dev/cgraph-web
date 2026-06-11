import { describe, expect, it } from 'vitest';

import { otherUserIdentityPatchFromPayload } from '../otherIdentitySync';

describe('otherUserIdentityPatchFromPayload', () => {
  it('normalizes backend-shaped badge and nameplate cosmetic patches', () => {
    const patch = otherUserIdentityPatchFromPayload('friend-1', {
      customization: {
        equipped_badges: ['badge-founder'],
        equipped_nameplate: 'plate_gilded_sapphire_loop_01',
      },
    });

    expect(patch).toMatchObject({
      equippedBadgeIds: ['badge-founder'],
      equippedNameplateId: 'plate_gilded_sapphire_loop_01',
    });
  });
});
