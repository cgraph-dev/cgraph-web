import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getBorderById } from '@/data/avatar-borders';

const PIXELLAB_AVATAR_BORDER_GIF_IDS = [
  'border_8bit_common_01',
  'border_kawaii_common_01',
  'border_cyberpunk_common_01',
  'border_cosmic_common_01',
  'border_signal_noir_01',
  'border_aurora_command_01',
  'border_ranked_ascendant_01',
  'border_ember_colossus_01',
  'border_void_relay_01',
  'border_solar_grove_01',
  'border_anime_rare_01',
  'border_cyberpunk_rare_01',
  'border_8bit_epic_01',
  'border_cyberpunk_epic_01',
  'border_cosmic_legendary_01',
  'border_cyberpunk_mythic_01',
] as const;

function publicFileExists(publicUrl: string): boolean {
  return existsSync(join(process.cwd(), 'public', publicUrl.replace(/^\//, '')));
}

describe('PixelLab animated avatar border assets', () => {
  it('ships every replaced avatar border as a public GIF asset', () => {
    for (const id of PIXELLAB_AVATAR_BORDER_GIF_IDS) {
      const border = getBorderById(id);
      const expectedPath = `/cosmetics/pixellab/avatar-border/${id}/${id}_0.gif`;

      expect(border, id).toBeDefined();
      expect(border?.imageUrl, id).toBe(expectedPath);
      expect(border?.previewUrl, id).toBe(expectedPath);
      expect(border?.lottieUrl, id).toBeUndefined();
      expect(publicFileExists(expectedPath), id).toBe(true);
    }
  });
});
