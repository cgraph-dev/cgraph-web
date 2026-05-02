/**
 * Theme palette type definition.
 * Each theme provides a complete set of colors for its appearance.
 * Matches the color shape used by mobile's ThemeColors type.
 */

export interface ThemePalette {
  readonly id: string;
  readonly name: string;
  readonly category: 'light' | 'dark';

  readonly background: string;
  readonly surface: string;
  readonly surfaceSecondary: string;
  readonly surfaceHover: string;
  readonly surfaceElevated: string;

  readonly primary: string;
  readonly primaryHover: string;
  readonly primaryLight: string;
  readonly primaryMuted: string;
  readonly secondary: string;
  readonly accent: string;

  readonly text: string;
  readonly textSecondary: string;
  readonly textTertiary: string;
  readonly textInverse: string;
  readonly textLink: string;

  readonly border: string;
  readonly borderLight: string;
  readonly borderFocus: string;
  readonly divider: string;

  readonly error: string;
  readonly errorLight: string;
  readonly success: string;
  readonly successLight: string;
  readonly warning: string;
  readonly warningLight: string;
  readonly info: string;
  readonly infoLight: string;

  readonly card: string;
  readonly cardHover: string;
  readonly input: string;
  readonly inputBorder: string;
  readonly inputFocus: string;
  readonly inputPlaceholder: string;

  readonly disabled: string;
  readonly disabledText: string;
  readonly highlight: string;
  readonly selection: string;

  readonly overlay: string;
  readonly overlayLight: string;
  readonly shadow: string;

  readonly glow: {
    readonly primary: string;
    readonly bright: string;
    readonly dim: string;
    readonly green: string;
  };

  readonly chat: {
    readonly bg: string;
    readonly hover: string;
    readonly input: string;
    readonly bubbleSent: string;
    readonly bubbleSentText: string;
    readonly bubbleReceived: string;
    readonly bubbleReceivedText: string;
    readonly timestamp: string;
  };

  readonly sidebar: {
    readonly bg: string;
    readonly hover: string;
    readonly active: string;
    readonly text: string;
    readonly textActive: string;
  };

  readonly tabBar: {
    readonly bg: string;
    readonly border: string;
    readonly active: string;
    readonly inactive: string;
  };

  readonly status: {
    readonly online: string;
    readonly idle: string;
    readonly dnd: string;
    readonly offline: string;
    readonly invisible: string;
  };

  readonly rarity: {
    readonly free: string;
    readonly common: string;
    readonly uncommon: string;
    readonly rare: string;
    readonly epic: string;
    readonly legendary: string;
    readonly mythic: string;
    readonly divine: string;
  };

  readonly premium: {
    readonly gold: string;
    readonly goldLight: string;
    readonly goldDark: string;
  };

  readonly holo: {
    readonly primary: string;
    readonly secondary: string;
    readonly accent: string;
    readonly glow: string;
    readonly scanline: string;
    readonly background: string;
  };
}

export type ThemeId = 'dark' | 'light' | 'aurora' | 'bubble';
