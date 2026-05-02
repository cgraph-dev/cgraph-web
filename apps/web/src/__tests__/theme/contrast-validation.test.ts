import { describe, expect, it } from 'vitest';

import {
  type SemanticTokens,
  AURORA_TOKENS,
  DARK_TOKENS,
  LIGHT_TOKENS,
  contrastRatio,
} from '../../lib/theme/tokens';

function passesAA(hex1: string, hex2: string): boolean {
  return contrastRatio(hex1, hex2) >= 4.5;
}

function passesAALarge(hex1: string, hex2: string): boolean {
  return contrastRatio(hex1, hex2) >= 3;
}

type ThemeFixture = {
  name: string;
  tokens: SemanticTokens;
};

type ContrastPair = {
  name: string;
  textKey: keyof SemanticTokens;
  backgroundKey: keyof SemanticTokens;
  minimumRatio: number;
  backdropKey?: keyof SemanticTokens;
  usesLargeText?: boolean;
};

const THEMES: ThemeFixture[] = [
  { name: 'Aurora', tokens: AURORA_TOKENS },
  { name: 'Dark', tokens: DARK_TOKENS },
  { name: 'Light', tokens: LIGHT_TOKENS },
];

const CONTRAST_PAIRS: ContrastPair[] = [
  {
    name: 'text-primary on bg-primary',
    textKey: 'text-primary',
    backgroundKey: 'bg-primary',
    minimumRatio: 4.5,
  },
  {
    name: 'text-primary on bg-secondary',
    textKey: 'text-primary',
    backgroundKey: 'bg-secondary',
    minimumRatio: 4.5,
  },
  {
    name: 'text-primary on card-bg',
    textKey: 'text-primary',
    backgroundKey: 'card-bg',
    backdropKey: 'bg-primary',
    minimumRatio: 4.5,
  },
  {
    name: 'sidebar-text on sidebar-bg',
    textKey: 'sidebar-text',
    backgroundKey: 'sidebar-bg',
    minimumRatio: 4.5,
  },
  {
    name: 'text-secondary on bg-primary',
    textKey: 'text-secondary',
    backgroundKey: 'bg-primary',
    minimumRatio: 3,
    usesLargeText: true,
  },
  {
    name: 'text-muted on bg-primary',
    textKey: 'text-muted',
    backgroundKey: 'bg-primary',
    minimumRatio: 3,
    usesLargeText: true,
  },
  {
    name: 'text-primary on input-bg',
    textKey: 'text-primary',
    backgroundKey: 'input-bg',
    backdropKey: 'bg-primary',
    minimumRatio: 4.5,
  },
  {
    name: 'text-on-primary on interactive-primary',
    textKey: 'text-on-primary',
    backgroundKey: 'interactive-primary',
    minimumRatio: 4.5,
  },
  {
    name: 'link-default on bg-primary',
    textKey: 'link-default',
    backgroundKey: 'bg-primary',
    minimumRatio: 4.5,
  },
  {
    name: 'chat-bubble-sent-text on chat-bubble-sent',
    textKey: 'chat-bubble-sent-text',
    backgroundKey: 'chat-bubble-sent',
    backdropKey: 'chat-bg',
    minimumRatio: 4.5,
  },
  {
    name: 'chat-bubble-received-text on chat-bubble-received',
    textKey: 'chat-bubble-received-text',
    backgroundKey: 'chat-bubble-received',
    backdropKey: 'chat-bg',
    minimumRatio: 4.5,
  },
  {
    name: 'feedback-error on card-bg',
    textKey: 'feedback-error',
    backgroundKey: 'card-bg',
    backdropKey: 'bg-primary',
    minimumRatio: 3,
    usesLargeText: true,
  },
];

function expandHexChannel(channel: string): string {
  return channel.length === 1 ? `${channel}${channel}` : channel;
}

function normalizeHex(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const hex = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;

  if (hex.length !== 3 && hex.length !== 6) {
    throw new Error(`Unsupported hex color: ${value}`);
  }

  if (hex.length === 3) {
    return `#${expandHexChannel(hex[0] ?? '')}${expandHexChannel(hex[1] ?? '')}${expandHexChannel(hex[2] ?? '')}`;
  }

  return `#${hex}`;
}

function hexToRgb(value: string): { red: number; green: number; blue: number } {
  const normalized = normalizeHex(value);
  return {
    red: Number.parseInt(normalized.slice(1, 3), 16),
    green: Number.parseInt(normalized.slice(3, 5), 16),
    blue: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex(red: number, green: number, blue: number): string {
  return `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

function parseRgba(
  value: string
): { red: number; green: number; blue: number; alpha: number } | null {
  const match = value
    .trim()
    .match(
      /^rgba?\((\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*(\d*\.?\d+))?\)$/i
    );

  if (!match) {
    return null;
  }

  return {
    red: Number.parseFloat(match[1] ?? '0'),
    green: Number.parseFloat(match[2] ?? '0'),
    blue: Number.parseFloat(match[3] ?? '0'),
    alpha: Number.parseFloat(match[4] ?? '1'),
  };
}

function resolveOpaqueColor(color: string, backdrop: string): string {
  if (color.startsWith('#')) {
    return normalizeHex(color);
  }

  const rgba = parseRgba(color);
  if (!rgba) {
    throw new Error(`Unsupported color value: ${color}`);
  }

  const background = hexToRgb(backdrop);
  return rgbToHex(
    rgba.red * rgba.alpha + background.red * (1 - rgba.alpha),
    rgba.green * rgba.alpha + background.green * (1 - rgba.alpha),
    rgba.blue * rgba.alpha + background.blue * (1 - rgba.alpha)
  );
}

describe('WCAG AA contrast validation', () => {
  for (const theme of THEMES) {
    describe(`${theme.name} theme`, () => {
      for (const pair of CONTRAST_PAIRS) {
        it(`${pair.name} meets ${pair.minimumRatio}:1`, () => {
          const bgPrimary = theme.tokens['bg-primary'];
          const textColor = resolveOpaqueColor(theme.tokens[pair.textKey]!, bgPrimary);
          const backdrop =
            (pair.backdropKey
              ? theme.tokens[pair.backdropKey]
              : theme.tokens[pair.backgroundKey]) ?? bgPrimary;
          const backgroundColor = resolveOpaqueColor(theme.tokens[pair.backgroundKey]!, backdrop);
          const ratio = contrastRatio(textColor, backgroundColor);
          const passes = pair.usesLargeText
            ? passesAALarge(textColor, backgroundColor)
            : passesAA(textColor, backgroundColor);

          expect(
            passes,
            `${theme.name}: ${pair.name} expected >= ${pair.minimumRatio}:1, received ${ratio.toFixed(2)}:1`
          ).toBe(true);
          expect(ratio).toBeGreaterThanOrEqual(pair.minimumRatio);
        });
      }
    });
  }
});
