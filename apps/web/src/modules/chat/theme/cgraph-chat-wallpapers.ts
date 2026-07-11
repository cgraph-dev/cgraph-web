import type { CSSProperties } from 'react';
import type { ChatThemeWallpaperPreset } from '@cgraph-dev/shared-types/chat-theme';

export interface CGraphChatWallpaper {
  readonly id: string;
  readonly label: string;
  readonly wallpaper: ChatThemeWallpaperPreset;
}

export const CGRAPH_CHAT_WALLPAPERS = [
  {
    id: 'lattice',
    label: 'Lattice',
    wallpaper: {
      intensity: 44,
      backgroundColor: 0xe5f1fa,
      secondBackgroundColor: 0xc4dfef,
      thirdBackgroundColor: 0xe8eaf9,
      fourthBackgroundColor: 0xdfeff0,
      dark: false,
    },
  },
  {
    id: 'contour',
    label: 'Contour',
    wallpaper: {
      intensity: 42,
      backgroundColor: 0xe2f1eb,
      secondBackgroundColor: 0xb6d5c9,
      thirdBackgroundColor: 0xd9e9d9,
      fourthBackgroundColor: 0xb0c9be,
      dark: false,
    },
  },
  {
    id: 'weave',
    label: 'Weave',
    wallpaper: {
      intensity: 38,
      backgroundColor: 0xf5e5e0,
      secondBackgroundColor: 0xe8c4ba,
      thirdBackgroundColor: 0xf2d7c7,
      fourthBackgroundColor: 0xe0b6a9,
      dark: false,
    },
  },
  {
    id: 'current',
    label: 'Current',
    wallpaper: {
      intensity: 36,
      backgroundColor: 0x192436,
      secondBackgroundColor: 0x284b5c,
      thirdBackgroundColor: 0x263848,
      fourthBackgroundColor: 0x131b2a,
      dark: true,
    },
  },
] as const satisfies readonly CGraphChatWallpaper[];

export const DEFAULT_CGRAPH_CHAT_WALLPAPER =
  CGRAPH_CHAT_WALLPAPERS[0].wallpaper;

export function getCGraphChatWallpaper(
  wallpaper?: ChatThemeWallpaperPreset,
): CGraphChatWallpaper | undefined {
  return CGRAPH_CHAT_WALLPAPERS.find((candidate) =>
    wallpapersMatch(candidate.wallpaper, wallpaper),
  );
}

export function getCGraphChatWallpaperStyle(
  wallpaper?: ChatThemeWallpaperPreset,
): Readonly<CSSProperties> | undefined {
  const cgraphWallpaper = getCGraphChatWallpaper(wallpaper);
  if (!cgraphWallpaper) return undefined;

  const colors = wallpaperColors(cgraphWallpaper.wallpaper);
  const lineColor = cgraphWallpaper.wallpaper.dark
    ? `rgba(255, 255, 255, ${lineOpacity(cgraphWallpaper.wallpaper.intensity)})`
    : `rgba(25, 45, 65, ${lineOpacity(cgraphWallpaper.wallpaper.intensity)})`;
  const gradient = `linear-gradient(145deg, ${colors.join(', ')})`;

  switch (cgraphWallpaper.id) {
    case 'lattice':
      return {
        backgroundColor: colors[0],
        backgroundImage: `${gradient}, linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
        backgroundPosition: '0 0, -1px -1px, -1px -1px',
        backgroundSize: '100% 100%, 28px 28px, 28px 28px',
      };
    case 'contour':
      return {
        backgroundColor: colors[0],
        backgroundImage: `repeating-radial-gradient(ellipse at 0 110%, transparent 0 16px, ${lineColor} 17px 18px, transparent 19px 34px), ${gradient}`,
        backgroundSize: '100% 100%, 100% 100%',
      };
    case 'weave':
      return {
        backgroundColor: colors[0],
        backgroundImage: `repeating-linear-gradient(45deg, ${lineColor} 0 1px, transparent 1px 12px), repeating-linear-gradient(135deg, ${lineColor} 0 1px, transparent 1px 12px), ${gradient}`,
        backgroundSize: '24px 24px, 24px 24px, 100% 100%',
      };
    case 'current':
      return {
        backgroundColor: colors[0],
        backgroundImage: `repeating-linear-gradient(135deg, ${lineColor} 0 1px, transparent 1px 18px), ${gradient}`,
        backgroundSize: '32px 32px, 100% 100%',
      };
  }

  return undefined;
}

function wallpapersMatch(
  first: ChatThemeWallpaperPreset,
  second?: ChatThemeWallpaperPreset,
): boolean {
  if (!second) return false;

  return (
    first.intensity === second.intensity &&
    first.backgroundColor === second.backgroundColor &&
    first.secondBackgroundColor === second.secondBackgroundColor &&
    first.thirdBackgroundColor === second.thirdBackgroundColor &&
    first.fourthBackgroundColor === second.fourthBackgroundColor &&
    Boolean(first.dark) === Boolean(second.dark)
  );
}

function wallpaperColors(
  wallpaper: ChatThemeWallpaperPreset,
): readonly string[] {
  return [
    wallpaper.backgroundColor,
    wallpaper.secondBackgroundColor,
    wallpaper.thirdBackgroundColor,
    wallpaper.fourthBackgroundColor,
  ]
    .filter((color): color is number => typeof color === 'number')
    .map(rgbIntToHex);
}

function lineOpacity(intensity: number): string {
  return Math.min(0.16, Math.max(0.05, intensity / 400)).toFixed(3);
}

function rgbIntToHex(rgbInt: number): string {
  return `#${rgbInt.toString(16).padStart(6, '0')}`;
}
