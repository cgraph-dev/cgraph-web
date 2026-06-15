import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_TITLES, getTitleById } from '@/data/titlesCollection';

const REMOVED_NON_GIF_TITLE_IDS = [
  'newcomer',
  'guardian_of_privacy',
  'voice_of_the_people',
  'year_one',
  'the_timeless',
  'vip',
  'cosmic_traveler',
  'frost_monarch',
  'anniversary_2024',
  'top_10_weekly',
  'top_3_weekly',
] as const;

function publicFileExists(publicUrl: string): boolean {
  return existsSync(join(process.cwd(), 'public', publicUrl.replace(/^\//, '')));
}

describe('PixelLab animated title assets', () => {
  it('ships every active title as a public GIF asset', () => {
    expect(ALL_TITLES).toHaveLength(49);

    for (const title of ALL_TITLES) {
      const expectedPath = `/cosmetics/pixellab/title/${title.id}/${title.id}_0.gif`;

      expect(title.imageUrl, title.id).toBe(expectedPath);
      expect(title.previewUrl, title.id).toBe(expectedPath);
      expect(publicFileExists(expectedPath), title.id).toBe(true);
    }
  });

  it('does not expose title rows that still need GIF artwork', () => {
    for (const titleId of REMOVED_NON_GIF_TITLE_IDS) {
      expect(getTitleById(titleId), titleId).toBeUndefined();
    }
  });
});
