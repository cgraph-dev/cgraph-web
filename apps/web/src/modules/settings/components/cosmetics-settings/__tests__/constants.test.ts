import { describe, expect, it } from 'vitest';
import { themeProfiles } from '@cgraph-dev/design-tokens';

import { THEME_PRESETS_ARRAY } from '../constants';

describe('cosmetics settings theme presets', () => {
  it('uses the shared theme-profile order and display names', () => {
    expect(THEME_PRESETS_ARRAY.map((preset) => preset.id)).toEqual(
      themeProfiles.map((profile) => profile.id)
    );
    expect(THEME_PRESETS_ARRAY.map((preset) => preset.name)).toEqual(
      themeProfiles.map((profile) => profile.name)
    );
  });

  it('keeps the legacy settings adapter fields', () => {
    const cyberpunk = THEME_PRESETS_ARRAY.find((preset) => preset.id === 'cyberpunk-neon');

    expect(cyberpunk).toMatchObject({
      description: 'Cyberpunk Neon theme',
      backgroundConfig: {
        type: 'gradient',
        overlay: true,
      },
      particleType: 'glitch',
    });
  });
});
