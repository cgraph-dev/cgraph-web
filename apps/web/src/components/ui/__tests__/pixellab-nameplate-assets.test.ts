import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getNameplateById } from '@cgraph-dev/animation-constants';

const PIXELLAB_SINGLE_GIF_NAMEPLATE_IDS = [
  'plate_obsidian_flare_loop_01',
  'plate_glacial_sentinel_loop_01',
  'plate_parchment_scroll_loop_01',
  'plate_cyber_cipher_loop_01',
  'plate_void_thorn_loop_01',
  'plate_royal_banner_loop_01',
  'plate_crystal_bloom_loop_01',
  'plate_royal_shield_loop_01',
  'plate_neon_gate_loop_01',
  'plate_emerald_relic_loop_01',
  'plate_lava_war_banner_loop_01',
  'plate_moonlit_glass_loop_01',
  'plate_frost_gate_loop_01',
  'plate_sakura_silver_loop_01',
] as const;

const PIXELLAB_STATIC_CROP_NAMEPLATE_IDS = [
  'plate_mystic_purple_relic_01',
  'plate_crimson_blade_01',
  'plate_reactor_core_01',
  'plate_void_crown_01',
  'plate_scarab_relic_01',
] as const;

function publicFileExists(publicUrl: string): boolean {
  return existsSync(join(process.cwd(), 'public', publicUrl.replace(/^\//, '')));
}

describe('PixelLab animated nameplate assets', () => {
  it('ships every single-GIF registry row with a public asset file', () => {
    for (const id of PIXELLAB_SINGLE_GIF_NAMEPLATE_IDS) {
      const plate = getNameplateById(id);

      expect(plate, id).toBeDefined();
      expect(plate?.imageUrl).toBe(`/cosmetics/pixellab/nameplate/${id}/${id}_0.gif`);
      expect(plate?.previewUrl).toBe(plate?.imageUrl);
      expect(publicFileExists(plate?.imageUrl ?? ''), id).toBe(true);
    }
  });

  it('ships every static cropped registry row with a public asset file', () => {
    for (const id of PIXELLAB_STATIC_CROP_NAMEPLATE_IDS) {
      const plate = getNameplateById(id);

      expect(plate, id).toBeDefined();
      expect(plate?.imageUrl).toBe(`/cosmetics/pixellab/nameplate/${id}/${id}_0.png`);
      expect(plate?.previewUrl).toBe(plate?.imageUrl);
      expect(publicFileExists(plate?.imageUrl ?? ''), id).toBe(true);
    }
  });
});
