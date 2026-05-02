interface ThemeMetadataEntry {
  name: string;
  icon: string;
  description: string;
}

export const THEME_METADATA: Record<string, ThemeMetadataEntry> = {
  aurora: {
    name: 'Aurora',
    icon: '🌌',
    description: 'Purple-blue gradients with glass effects',
  },
  dark: {
    name: 'Dark',
    icon: '🌙',
    description: 'Steel chrome dark with vivid lime accent',
  },
  light: {
    name: 'Light',
    icon: '☀️',
    description: 'Clean daylight with crisp lime accent',
  },
  bubble: {
    name: 'Bubble',
    icon: '🫧',
    description: 'Liquid glass with prismatic rainbow edges',
  },
} as const;

/** Display order for themes in the picker */
export const THEME_ORDER = ['aurora', 'dark', 'light', 'bubble'] as const;

/** Keyboard shortcut cycle order */
export const THEME_CYCLE = ['aurora', 'dark', 'light', 'bubble'] as const;
