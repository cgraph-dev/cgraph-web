import { describe, expect, it } from 'vitest';
import { PROFILE_CARD_LAYOUT_IDS, PROFILE_CARD_LAYOUTS } from '@cgraph-dev/shared-types';

import { profileStyles } from '../profile-panel.constants';

describe('profile panel constants', () => {
  it('uses the shared package profile-card layout set', () => {
    expect(profileStyles.map((style) => style.id)).toEqual(PROFILE_CARD_LAYOUT_IDS);
    expect(profileStyles.map((style) => style.name)).toEqual(
      PROFILE_CARD_LAYOUTS.map((layout) => layout.name)
    );
    expect(profileStyles.find((style) => style.id === 'premium')?.premium).toBe(true);
  });
});
