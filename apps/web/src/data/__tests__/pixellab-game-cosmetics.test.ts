import { describe, expect, it } from 'vitest';

import { NAMEPLATE_REGISTRY, getNameplateById } from '@cgraph-dev/animation-constants';
import { ALL_BORDERS, getAvatarBorderDisplayTypeById, getBorderById } from '../avatar-borders';

const PIXELLAB_GAME_NAMEPLATE_IDS = [
  'plate_ranked_ascendant_01',
  'plate_ember_colossus_01',
  'plate_void_relay_01',
  'plate_solar_grove_01',
  'plate_sakura_vanguard_01',
  'plate_stone_sentinel_01',
] as const;

describe('PixelLab game cosmetics package consumption', () => {
  it('uses shared release-grade nameplates without a web-local overlay', () => {
    expect(NAMEPLATE_REGISTRY.map((plate) => plate.id)).toEqual(
      expect.arrayContaining([...PIXELLAB_GAME_NAMEPLATE_IDS])
    );
    expect(NAMEPLATE_REGISTRY).toContainEqual(getNameplateById('plate_void_relay_01'));

    const ranked = getNameplateById('plate_ranked_ascendant_01');

    expect(ranked?.rarity).toBe('mythic');
    expect(ranked?.imageUrl).toContain('/cosmetics/pixellab/nameplate/');
    expect(ranked?.animationType).toBe('lottie');

    const stone = getNameplateById('plate_stone_sentinel_01');

    expect(stone?.rarity).toBe('epic');
    expect(stone?.textEffect).toBe('metallic');
    expect(stone?.emblem).toBeNull();
    expect(stone?.borderStyle).toBe('none');
    expect(stone?.borderColor).toBeNull();
    expect(stone?.imageUrl).toContain('/cosmetics/pixellab/nameplate/plate_stone_sentinel_01/');
  });

  it('uses shared game avatar borders through the web adapter', () => {
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
