import type { CSSProperties } from 'react';
import {
  getChatThemeCustomColorStyle,
  resolveChatThemeConversationColor,
  chatThemePresetId,
  type ChatThemeAccentPreset,
  type ChatThemeBase,
  type ChatThemeConversationOverride,
  type ChatThemeDefaultConversationColor,
  type ChatThemeSettings,
  type ChatThemeWallpaperPreset,
} from '@cgraph-dev/shared-types/chat-theme';

export interface ChatThemeAppearance {
  readonly base: ChatThemeBase;
  readonly presetId: string;
  readonly conversationColor: string;
  readonly accentHex: string;
  readonly ownBackground: string;
  readonly ownTailBackground: string;
  readonly ownTextColor: string;
  readonly incomingBackground: string;
  readonly incomingTextColor: string;
  readonly previewBackground: string;
  readonly previewBorderColor: string;
  readonly surfaceStyle: Readonly<CSSProperties>;
  readonly outgoingBubbleStyle: Readonly<CSSProperties>;
  readonly incomingBubbleStyle: Readonly<CSSProperties>;
}

type ChatThemeSettingsWithPresetId = ChatThemeSettings & {
  readonly presetId?: string | null;
};

export function chatThemePresetToAppearance(
  preset: ChatThemeAccentPreset,
  base: ChatThemeBase,
): ChatThemeAppearance {
  return chatThemeSettingsToAppearance({
    base,
    presetId: chatThemePresetId(preset),
    accentColor: preset.accentColor,
    messageColors: preset.messageColors,
    ...(preset.wallpaper ? { wallpaper: preset.wallpaper } : {}),
  });
}

export function chatThemeSettingsToAppearance(
  settings: ChatThemeSettingsWithPresetId,
  conversationOverride: ChatThemeConversationOverride = {},
  defaultConversationColor?: ChatThemeDefaultConversationColor,
): ChatThemeAppearance {
  const ownBackground = colorStopsToGradient(settings.messageColors);
  const ownTailBackground = rgbIntToHex(
    settings.messageColors[settings.messageColors.length - 1] ?? settings.accentColor,
  );
  const isDark = settings.base === 'night' || settings.base === 'tinted';
  const incomingBackground = isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(255, 255, 255, 0.82)';
  const previewBackground = settings.wallpaper
    ? colorStopsToGradient(wallpaperToStops(settings.wallpaper), 145)
    : defaultSurfaceBackground(settings.base);
  const resolvedConversationColor = resolveChatThemeConversationColor(
    conversationOverride,
    defaultConversationColor,
  );
  const customColorStyle = getChatThemeCustomColorStyle(
    resolvedConversationColor.customColor,
  );
  const ownTextColor = isDark ? '#f8fafc' : '#ffffff';
  const incomingTextColor = isDark ? '#f8fafc' : '#111827';

  return {
    base: settings.base,
    presetId: settings.presetId ?? 'default',
    conversationColor: resolvedConversationColor.conversationColor,
    accentHex: rgbIntToHex(settings.accentColor),
    ownBackground,
    ownTailBackground,
    ownTextColor,
    incomingBackground,
    incomingTextColor,
    previewBackground,
    previewBorderColor: rgbIntToHex(settings.accentColor),
    surfaceStyle: { background: previewBackground },
    outgoingBubbleStyle: customColorStyle
      ? { ...customColorStyle, color: ownTextColor }
      : { background: ownBackground, color: ownTextColor },
    incomingBubbleStyle: {
      background: incomingBackground,
      color: incomingTextColor,
    },
  };
}

export function getChatThemePresetSwatch(
  preset: ChatThemeAccentPreset,
): string {
  if (preset.messageColors.length > 1) {
    return `linear-gradient(135deg, ${preset.messageColors.map(rgbIntToHex).join(', ')})`;
  }

  return rgbIntToHex(preset.accentColor);
}

function defaultSurfaceBackground(base: ChatThemeBase): string {
  switch (base) {
    case 'day':
      return 'linear-gradient(145deg, #eef7ff, #f7f2ff)';
    case 'classic':
      return 'linear-gradient(145deg, #dcecff, #fff3f8)';
    case 'night':
    case 'tinted':
      return 'linear-gradient(145deg, #121826, #172033)';
  }
}

function colorStopsToGradient(
  colors: readonly number[],
  degrees = 135,
): string {
  const stops = colors.map(rgbIntToHex);
  const firstStop = stops[0];
  if (!firstStop) {
    return 'transparent';
  }

  if (stops.length === 1) {
    return firstStop;
  }

  return `linear-gradient(${degrees}deg, ${stops.join(', ')})`;
}

function wallpaperToStops(
  wallpaper: ChatThemeWallpaperPreset,
): readonly number[] {
  return [
    wallpaper.backgroundColor,
    wallpaper.secondBackgroundColor,
    wallpaper.thirdBackgroundColor,
    wallpaper.fourthBackgroundColor,
  ].filter((color): color is number => typeof color === 'number');
}

function rgbIntToHex(rgbInt: number): string {
  return `#${rgbInt.toString(16).padStart(6, '0')}`;
}
