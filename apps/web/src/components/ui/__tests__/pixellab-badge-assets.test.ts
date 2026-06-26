import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ALL_BADGES,
  getBadgeById,
  getBadgesByRarity,
  getUnlockedBadges,
} from '@/data/badgesCollection';

function publicFileExists(publicUrl: string): boolean {
  return existsSync(join(process.cwd(), 'public', publicUrl.replace(/^\//, '')));
}

function readPngSize(publicUrl: string): { width: number; height: number } {
  const file = readFileSync(join(process.cwd(), 'public', publicUrl.replace(/^\//, '')));

  return {
    width: file.readUInt32BE(16),
    height: file.readUInt32BE(20),
  };
}

describe('PixelLab badge assets', () => {
  it('ships every active badge as a public PNG asset', () => {
    expect(ALL_BADGES).toHaveLength(38);

    for (const badge of ALL_BADGES) {
      const expectedPath = `/cosmetics/pixellab/badge/${badge.id}/${badge.id}_0.png`;

      expect(badge.imageUrl, badge.id).toBe(expectedPath);
      expect(badge.previewUrl, badge.id).toBe(expectedPath);
      expect(badge.lottieUrl, badge.id).toBeUndefined();
      expect(badge.animationType, badge.id).toBe('static');
      expect(publicFileExists(expectedPath), badge.id).toBe(true);
      expect(readPngSize(expectedPath), badge.id).toEqual({ width: 256, height: 256 });
    }
  });

  it('exposes lookup helpers with the same release art', () => {
    expect(getBadgeById('badge-vip')?.imageUrl).toBe(
      '/cosmetics/pixellab/badge/badge-vip/badge-vip_0.png'
    );
    expect(getBadgesByRarity('epic')).toHaveLength(8);
    expect(getBadgesByRarity('legendary')).toHaveLength(10);
    expect(getBadgesByRarity('mythic')).toHaveLength(4);
    expect(getUnlockedBadges().every((badge) => badge.imageUrl?.endsWith('_0.png'))).toBe(true);
  });
});
