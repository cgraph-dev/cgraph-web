import {
  chatThemePresetId,
  type ChatThemeAccentPreset,
  type ChatThemeBase,
  type ChatThemeWallpaperPreset,
} from "@cgraph-dev/shared-types/chat-theme";

export interface ChatThemePreviewStyle {
  readonly base: ChatThemeBase;
  readonly presetId: string;
  readonly accentHex: string;
  readonly ownBackground: string;
  readonly ownTailBackground: string;
  readonly ownTextColor: string;
  readonly incomingBackground: string;
  readonly incomingTextColor: string;
  readonly previewBackground: string;
  readonly previewBorderColor: string;
}

export function chatThemePresetToPreviewStyle(
  preset: ChatThemeAccentPreset,
  base: ChatThemeBase,
): ChatThemePreviewStyle {
  const ownBackground = colorStopsToGradient(preset.messageColors);
  const ownTailBackground = rgbIntToHex(
    preset.messageColors[preset.messageColors.length - 1] ?? preset.accentColor,
  );
  const wallpaper = preset.wallpaper;
  const incomingBackground =
    base === "night" || base === "tinted"
      ? "rgba(255, 255, 255, 0.12)"
      : "rgba(255, 255, 255, 0.82)";

  return {
    base,
    presetId: chatThemePresetId(preset),
    accentHex: rgbIntToHex(preset.accentColor),
    ownBackground,
    ownTailBackground,
    ownTextColor: base === "night" || base === "tinted" ? "#f8fafc" : "#ffffff",
    incomingBackground,
    incomingTextColor:
      base === "night" || base === "tinted" ? "#f8fafc" : "#111827",
    previewBackground: wallpaper
      ? colorStopsToGradient(wallpaperToStops(wallpaper), 145)
      : base === "day"
        ? "linear-gradient(145deg, #eef7ff, #f7f2ff)"
        : base === "classic"
          ? "linear-gradient(145deg, #dcecff, #fff3f8)"
          : "linear-gradient(145deg, #121826, #172033)",
    previewBorderColor: rgbIntToHex(preset.accentColor),
  };
}

export function getChatThemePresetSwatch(
  preset: ChatThemeAccentPreset,
): string {
  if (preset.messageColors.length > 1) {
    return `linear-gradient(135deg, ${preset.messageColors.map(rgbIntToHex).join(", ")})`;
  }
  return rgbIntToHex(preset.accentColor);
}

function colorStopsToGradient(
  colors: readonly number[],
  degrees = 135,
): string {
  const stops = colors.map(rgbIntToHex);
  const firstStop = stops[0];
  if (!firstStop) {
    return "transparent";
  }
  if (stops.length === 1) {
    return firstStop;
  }
  return `linear-gradient(${degrees}deg, ${stops.join(", ")})`;
}

function wallpaperToStops(
  wallpaper: ChatThemeWallpaperPreset,
): readonly number[] {
  return [
    wallpaper.backgroundColor,
    wallpaper.secondBackgroundColor,
    wallpaper.thirdBackgroundColor,
    wallpaper.fourthBackgroundColor,
  ].filter((color): color is number => typeof color === "number");
}

function rgbIntToHex(rgbInt: number): string {
  return `#${rgbInt.toString(16).padStart(6, "0")}`;
}
