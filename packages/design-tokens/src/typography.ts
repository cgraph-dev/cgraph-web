/** Typography tokens. */

export interface FontFamily {
  readonly sans: string;
  readonly mono: string;
  readonly display: string;
}

export interface FontSize {
  readonly xs: number;
  readonly sm: number;
  readonly base: number;
  readonly lg: number;
  readonly xl: number;
  readonly '2xl': number;
  readonly '3xl': number;
  readonly '4xl': number;
}

export interface LineHeight {
  readonly tight: number;
  readonly normal: number;
  readonly relaxed: number;
}

export interface FontWeight {
  readonly normal: number;
  readonly medium: number;
  readonly semibold: number;
  readonly bold: number;
}

export interface LetterSpacing {
  readonly tight: number;
  readonly normal: number;
  readonly wide: number;
}

export const fontFamily: FontFamily = {
  sans: 'Inter, system-ui, -apple-system, sans-serif',
  mono: 'JetBrains Mono, Fira Code, monospace',
  display: 'Cal Sans, Inter, sans-serif',
};

export const fontSize: FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const lineHeight: LineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

export const fontWeight: FontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export const letterSpacing: LetterSpacing = {
  tight: -0.025,
  normal: 0,
  wide: 0.05,
};
