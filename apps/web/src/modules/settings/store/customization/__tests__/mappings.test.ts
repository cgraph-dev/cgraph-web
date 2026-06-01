import { describe, expect, it } from 'vitest';
import { PROFILE_THEME_IDS } from '@/data/profileThemes';
import { getThemeColor, getThemePreset, PROFILE_THEME_TO_COLOR } from '../mappings';

describe('customization profile theme mappings', () => {
  it('derives supported profile theme color presets from the shared theme catalog', () => {
    expect(Object.keys(PROFILE_THEME_TO_COLOR)).toEqual([...PROFILE_THEME_IDS]);
  });

  it('does not preserve stale legacy profile theme aliases as semantic mappings', () => {
    expect(PROFILE_THEME_TO_COLOR['classic-purple']).toBeUndefined();
    expect(getThemeColor('profile-default')).toBe('emerald');
    expect(getThemePreset('classic-purple')).toBe('emerald');
  });
});
