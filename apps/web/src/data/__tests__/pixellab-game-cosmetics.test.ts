import { describe, expect, it } from 'vitest';

import {
  NAMEPLATE_REGISTRY,
  PIXELLAB_GAME_NAMEPLATES,
  getNameplateById,
} from '../pixellab-game-cosmetics';
import { ALL_BORDERS, getAvatarBorderDisplayTypeById, getBorderById } from '../avatar-borders';

describe('PixelLab game cosmetic overlays', () => {
  it('adds release-grade nameplates to the shared registry shape', () => {
    expect(PIXELLAB_GAME_NAMEPLATES.map((plate) => plate.id)).toEqual([
      'plate_ranked_ascendant_01',
      'plate_ember_colossus_01',
      'plate_void_relay_01',
      'plate_solar_grove_01',
      'plate_sakura_vanguard_01',
    ]);
    expect(NAMEPLATE_REGISTRY).toContainEqual(getNameplateById('plate_void_relay_01'));

    const ranked = getNameplateById('plate_ranked_ascendant_01');

    expect(ranked?.rarity).toBe('mythic');
    expect(ranked?.imageUrl).toContain('/cosmetics/pixellab/nameplate/');
    expect(ranked?.animationType).toBe('lottie');
  });

  it('adds game avatar borders with catalog and display semantics', () => {
    const ids = ALL_BORDERS.map((border) => border.id);

    expect(ids).toContain('border_ranked_ascendant_01');
    expect(ids).toContain('border_ember_colossus_01');
    expect(ids).toContain('border_void_relay_01');
    expect(ids).toContain('border_solar_grove_01');

    const ember = getBorderById('border_ember_colossus_01');

    expect(ember?.theme).toBe('elemental');
    expect(ember?.imageUrl).toContain('/cosmetics/pixellab/avatar-border/');
    expect(getAvatarBorderDisplayTypeById('border_void_relay_01')).toBe('mythic');
  });
});
