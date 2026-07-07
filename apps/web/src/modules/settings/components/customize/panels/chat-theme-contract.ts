/**
 * Temporary web adapter for the source-first chat theme contract.
 *
 * Remove this file after `@cgraph-dev/shared-types/chat-theme` is published and
 * pinned by web. Values mirror cgraph-packages commit
 * a49ab8c1bd3e3a4d589e032ff7e33537df3c86d7.
 */

export const CHAT_THEME_BASES = ["classic", "day", "night", "tinted"] as const;

export type ChatThemeBase = (typeof CHAT_THEME_BASES)[number];

type ChatThemeBaseColor =
  | "blue"
  | "cyan"
  | "green"
  | "pink"
  | "orange"
  | "purple"
  | "red"
  | "yellow"
  | "gray";

export interface ChatThemeWallpaperPreset {
  readonly intensity: number;
  readonly backgroundColor: number;
  readonly secondBackgroundColor?: number;
  readonly thirdBackgroundColor?: number;
  readonly fourthBackgroundColor?: number;
  readonly dark?: boolean;
}

export interface ChatThemeAccentPreset {
  readonly id: number;
  readonly accentColor: number;
  readonly messageColors: readonly number[];
  readonly wallpaper?: ChatThemeWallpaperPreset;
}

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

const BASE_COLOR_RGB = {
  blue: 0x0088ff,
  cyan: 0x00c2ed,
  green: 0x29b327,
  pink: 0xeb6ca4,
  orange: 0xf08200,
  purple: 0x9472ee,
  red: 0xd33213,
  yellow: 0xedb400,
  gray: 0x6d839e,
} as const satisfies Readonly<Record<ChatThemeBaseColor, number>>;

const BASE_COLOR_INDEX = {
  blue: 10,
  cyan: 11,
  green: 12,
  pink: 13,
  orange: 14,
  purple: 15,
  red: 16,
  yellow: 17,
  gray: 18,
} as const satisfies Readonly<Record<ChatThemeBaseColor, number>>;

const TINTED_BASE_WALLPAPERS = {
  blue: {
    intensity: 40,
    backgroundColor: 0x1e3557,
    secondBackgroundColor: 0x182036,
    thirdBackgroundColor: 0x1c4352,
    fourthBackgroundColor: 0x16263a,
    dark: true,
  },
  cyan: {
    intensity: 40,
    backgroundColor: 0x1e3557,
    secondBackgroundColor: 0x151a36,
    thirdBackgroundColor: 0x1c4352,
    fourthBackgroundColor: 0x2a4541,
    dark: true,
  },
  green: {
    intensity: 40,
    backgroundColor: 0x2d4836,
    secondBackgroundColor: 0x172b19,
    thirdBackgroundColor: 0x364331,
    fourthBackgroundColor: 0x103231,
    dark: true,
  },
  pink: {
    intensity: 40,
    backgroundColor: 0x2c0b22,
    secondBackgroundColor: 0x290020,
    thirdBackgroundColor: 0x160a22,
    fourthBackgroundColor: 0x3b1834,
    dark: true,
  },
  orange: {
    intensity: 40,
    backgroundColor: 0x2c211b,
    secondBackgroundColor: 0x442917,
    thirdBackgroundColor: 0x22191f,
    fourthBackgroundColor: 0x3b2714,
    dark: true,
  },
  purple: {
    intensity: 40,
    backgroundColor: 0x3a1c3a,
    secondBackgroundColor: 0x24193c,
    thirdBackgroundColor: 0x392e3e,
    fourthBackgroundColor: 0x1a1632,
    dark: true,
  },
  red: {
    intensity: 40,
    backgroundColor: 0x2c211b,
    secondBackgroundColor: 0x44332a,
    thirdBackgroundColor: 0x22191f,
    fourthBackgroundColor: 0x3b2d36,
    dark: true,
  },
  yellow: {
    intensity: 40,
    backgroundColor: 0x2c2512,
    secondBackgroundColor: 0x45360b,
    thirdBackgroundColor: 0x221d08,
    fourthBackgroundColor: 0x3b2f13,
    dark: true,
  },
  gray: {
    intensity: 40,
    backgroundColor: 0x1c2731,
    secondBackgroundColor: 0x1a1c25,
    thirdBackgroundColor: 0x27303b,
    fourthBackgroundColor: 0x1b1b21,
    dark: true,
  },
} as const satisfies Readonly<
  Record<ChatThemeBaseColor, ChatThemeWallpaperPreset>
>;

const DAY_CLASSIC_ACCENT_PRESETS: readonly ChatThemeAccentPreset[] = [
  {
    id: 106,
    accentColor: 0xf55783,
    messageColors: [0xd6f5ff, 0xc9fdfe],
    wallpaper: {
      intensity: 50,
      backgroundColor: 0x8dc0eb,
      secondBackgroundColor: 0xb9d1ea,
      thirdBackgroundColor: 0xc6b1ef,
      fourthBackgroundColor: 0xebd7ef,
    },
  },
  {
    id: 102,
    accentColor: 0xff5fa9,
    messageColors: [0xfff4d7],
    wallpaper: {
      intensity: 50,
      backgroundColor: 0xeaa36e,
      secondBackgroundColor: 0xf0e486,
      thirdBackgroundColor: 0xf29ebf,
      fourthBackgroundColor: 0xe8c06e,
    },
  },
  {
    id: 104,
    accentColor: 0x5a9e29,
    messageColors: [0xfff8df],
    wallpaper: {
      intensity: 50,
      backgroundColor: 0x7fc289,
      secondBackgroundColor: 0xe4d573,
      thirdBackgroundColor: 0xafd677,
      fourthBackgroundColor: 0xf0c07a,
    },
  },
  {
    id: 101,
    accentColor: 0x7e5fe5,
    messageColors: [0xf5e2ff],
    wallpaper: {
      intensity: 50,
      backgroundColor: 0xe4b2ea,
      secondBackgroundColor: 0x8376c2,
      thirdBackgroundColor: 0xeab9d9,
      fourthBackgroundColor: 0xb493e6,
    },
  },
  {
    id: 107,
    accentColor: 0x2cb9ed,
    messageColors: [0xadf7b5, 0xfcff8b],
    wallpaper: {
      intensity: 50,
      backgroundColor: 0x1a2e1a,
      secondBackgroundColor: 0x47623c,
      thirdBackgroundColor: 0x222e24,
      fourthBackgroundColor: 0x314429,
    },
  },
  {
    id: 103,
    accentColor: 0x199972,
    messageColors: [0xfffec7],
    wallpaper: {
      intensity: 50,
      backgroundColor: 0xdceb92,
      secondBackgroundColor: 0x8fe1d6,
      thirdBackgroundColor: 0x67a3f2,
      fourthBackgroundColor: 0x85d685,
    },
  },
  {
    id: 105,
    accentColor: 0xda90d9,
    messageColors: [0x94fff9, 0xccffc7],
    wallpaper: {
      intensity: 50,
      backgroundColor: 0xffc3b2,
      secondBackgroundColor: 0xe2c0ff,
      thirdBackgroundColor: 0xffe7b2,
    },
  },
];

const DAY_ACCENT_PRESETS: readonly ChatThemeAccentPreset[] = [
  { id: 101, accentColor: 0x0088ff, messageColors: [0x0088ff, 0xff53f4] },
  { id: 102, accentColor: 0x00b09b, messageColors: [0xaee946, 0x00b09b] },
  { id: 103, accentColor: 0xd33213, messageColors: [0xf9db00, 0xd33213] },
  { id: 104, accentColor: 0xea8ced, messageColors: [0xea8ced, 0x00c2ed] },
];

const NIGHT_ACCENT_PRESETS: readonly ChatThemeAccentPreset[] = [
  {
    id: 102,
    accentColor: 0x00b09b,
    messageColors: [0xaee946, 0x00b09b],
    wallpaper: {
      dark: true,
      intensity: 35,
      backgroundColor: 0xe4b2ea,
      secondBackgroundColor: 0x8376c2,
      thirdBackgroundColor: 0xeab9d9,
      fourthBackgroundColor: 0xb493e6,
    },
  },
  {
    id: 103,
    accentColor: 0xd33213,
    messageColors: [0xf9db00, 0xd33213],
    wallpaper: {
      dark: true,
      intensity: 40,
      backgroundColor: 0xfec496,
      secondBackgroundColor: 0xdd6cb9,
      thirdBackgroundColor: 0x962fbf,
      fourthBackgroundColor: 0x4f5bd5,
    },
  },
  {
    id: 104,
    accentColor: 0xea8ced,
    messageColors: [0xea8ced, 0x00c2ed],
    wallpaper: {
      dark: true,
      intensity: 30,
      backgroundColor: 0x8adbf2,
      secondBackgroundColor: 0x888dec,
      thirdBackgroundColor: 0xe39fea,
      fourthBackgroundColor: 0x679ced,
    },
  },
];

const BASE_COLORS_DAY: readonly ChatThemeBaseColor[] = [
  "blue",
  "cyan",
  "green",
  "pink",
  "orange",
  "purple",
  "red",
  "yellow",
  "gray",
];

const BASE_COLORS_NIGHT: readonly ChatThemeBaseColor[] = [
  "blue",
  "cyan",
  "green",
  "pink",
  "orange",
  "purple",
  "red",
  "yellow",
];

export function getChatThemeAccentPresetsForBase(
  base: ChatThemeBase,
): readonly ChatThemeAccentPreset[] {
  switch (base) {
    case "classic":
      return [
        ...DAY_CLASSIC_ACCENT_PRESETS,
        ...BASE_COLORS_DAY.map((color) => baseColorPreset(color, base)),
      ];
    case "night":
      return [
        ...NIGHT_ACCENT_PRESETS,
        ...BASE_COLORS_NIGHT.map((color) => baseColorPreset(color, base)),
      ];
    case "day":
      return [
        ...DAY_ACCENT_PRESETS,
        ...BASE_COLORS_DAY.map((color) => baseColorPreset(color, base)),
      ];
    case "tinted":
      return BASE_COLORS_DAY.map((color) => baseColorPreset(color, base));
  }
}

export function chatThemePresetId(
  preset: Pick<ChatThemeAccentPreset, "id">,
): string {
  return `preset:${preset.id}`;
}

export function deriveDarkChatThemeMessageColors(
  accent: number,
): readonly [number, number] {
  const bottom = multiplyHsv(accent, 1.019, 0.731, 0.59);
  const top = multiplyHsv(bottom, 0.966, 0.61, 0.98);
  return [top, bottom];
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

export function rgbIntToHex(rgbInt: number): string {
  return `#${rgbInt.toString(16).padStart(6, "0")}`;
}

function baseColorAccent(
  name: ChatThemeBaseColor,
  base: ChatThemeBase,
): number {
  if (base === "night" && name === "blue") {
    return 0x3e88f7;
  }
  return BASE_COLOR_RGB[name];
}

function baseColorPreset(
  name: ChatThemeBaseColor,
  base: ChatThemeBase,
): ChatThemeAccentPreset {
  const accentColor = baseColorAccent(name, base);
  const isDarkBase = base === "tinted" || base === "night";

  return {
    id: BASE_COLOR_INDEX[name],
    accentColor,
    messageColors: isDarkBase
      ? deriveDarkChatThemeMessageColors(accentColor)
      : [accentColor],
    ...(base === "tinted" ? { wallpaper: TINTED_BASE_WALLPAPERS[name] } : {}),
  };
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

function multiplyHsv(
  rgbInt: number,
  hueMultiplier: number,
  saturationMultiplier: number,
  valueMultiplier: number,
): number {
  const [red, green, blue] = rgbIntToChannels(rgbInt);
  const [hue, saturation, value] = rgbToHsv(red, green, blue);
  const [outRed, outGreen, outBlue] = hsvToRgb(
    (hue * hueMultiplier) % 360,
    Math.min(1, saturation * saturationMultiplier),
    Math.min(1, value * valueMultiplier),
  );
  return (outRed << 16) | (outGreen << 8) | outBlue;
}

function rgbIntToChannels(rgbInt: number): readonly [number, number, number] {
  return [(rgbInt >> 16) & 0xff, (rgbInt >> 8) & 0xff, rgbInt & 0xff];
}

function rgbToHsv(
  red: number,
  green: number,
  blue: number,
): readonly [number, number, number] {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const value = Math.max(r, g, b);
  const chroma = value - Math.min(r, g, b);
  const hue =
    chroma === 0
      ? 0
      : value === r
        ? (g - b) / chroma
        : value === g
          ? 2 + (b - r) / chroma
          : 4 + (r - g) / chroma;

  return [
    60 * (hue < 0 ? hue + 6 : hue),
    value === 0 ? 0 : chroma / value,
    value,
  ];
}

function hsvToRgb(
  hue: number,
  saturation: number,
  value: number,
): readonly [number, number, number] {
  const channel = (offset: number): number => {
    const k = (offset + hue / 60) % 6;
    return Math.round(
      (value - value * saturation * Math.max(Math.min(k, 4 - k, 1), 0)) * 255,
    );
  };

  return [channel(5), channel(3), channel(1)];
}
