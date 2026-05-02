/**
 * Signal BodyRange types -- shared across all CGraph platforms.
 *
 * Follows Signal's BodyRange.std.ts type system exactly.
 * Styles map 1:1 to Signal's BodyRange.Style proto enum.
 */

/** The 5 supported formatting styles (Signal BodyRange.Style proto) */
export type BodyRangeStyle = 'bold' | 'italic' | 'monospace' | 'strikethrough' | 'spoiler';

/** Numeric style codes matching Signal's proto enum values */
export const BODY_RANGE_STYLE_VALUES = {
  NONE: 0,
  BOLD: 1,
  ITALIC: 2,
  SPOILER: 3,
  STRIKETHROUGH: 4,
  MONOSPACE: 5,
} as const;

/** Map from string style to proto value */
export const STYLE_TO_VALUE: Readonly<Record<BodyRangeStyle, number>> = {
  bold: BODY_RANGE_STYLE_VALUES.BOLD,
  italic: BODY_RANGE_STYLE_VALUES.ITALIC,
  spoiler: BODY_RANGE_STYLE_VALUES.SPOILER,
  strikethrough: BODY_RANGE_STYLE_VALUES.STRIKETHROUGH,
  monospace: BODY_RANGE_STYLE_VALUES.MONOSPACE,
} as const;

/** A single body range -- inline formatting annotation on message text */
export interface BodyRange {
  readonly start: number;
  readonly length: number;
  readonly style: BodyRangeStyle;
  /** Groups contiguous spoiler ranges (Signal spoilerId pattern) */
  readonly spoilerId?: number;
  /** For @mentions -- the user's ACI (address identifier) */
  readonly mentionAci?: string;
}

/** A display-ready node after collapsing the range tree (Signal DisplayNode) */
export interface DisplayNode {
  readonly text: string;
  readonly start: number;
  readonly length: number;

  // Formatting flags
  readonly isBold?: boolean;
  readonly isItalic?: boolean;
  readonly isMonospace?: boolean;
  readonly isSpoiler?: boolean;
  readonly isStrikethrough?: boolean;

  // Spoiler grouping
  readonly spoilerId?: number;
  readonly spoilerChildren?: ReadonlyArray<DisplayNode>;
}

/** Range node used during tree construction (has nested ranges) */
export interface RangeNode extends BodyRange {
  readonly ranges: ReadonlyArray<RangeNode>;
}

/** Constant for unrevealed spoiler replacement text (Signal SPOILER_REPLACEMENT) */
export const SPOILER_REPLACEMENT = '\u25A0\u25A0\u25A0\u25A0';

/** All valid style string values */
export const VALID_STYLES: ReadonlyArray<BodyRangeStyle> = [
  'bold',
  'italic',
  'monospace',
  'strikethrough',
  'spoiler',
] as const;

/** Type guard: is the given string a valid BodyRangeStyle? */
export function isValidBodyRangeStyle(style: string): style is BodyRangeStyle {
  return VALID_STYLES.some((s) => s === style);
}

/** Type guard: does this range represent a formatting range? */
export function isFormattingRange(range: BodyRange): boolean {
  return 'style' in range && isValidBodyRangeStyle(range.style);
}

/** Type guard: does this range represent a mention? */
export function isMentionRange(range: BodyRange): boolean {
  return 'mentionAci' in range && typeof range.mentionAci === 'string';
}
