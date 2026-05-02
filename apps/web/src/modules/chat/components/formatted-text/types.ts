/**
 * FormattedText types -- local to the component module.
 * Re-exports shared types and adds component-specific interfaces.
 */

export type { BodyRange, BodyRangeStyle, DisplayNode, RangeNode } from '@cgraph/shared-types';

export interface FormattedTextProps {
  readonly content: string;
  readonly bodyRanges: ReadonlyArray<import('@cgraph/shared-types').BodyRange>;
  readonly className?: string;
}

export interface SpoilerTextProps {
  readonly nodes: ReadonlyArray<import('@cgraph/shared-types').DisplayNode>;
  readonly spoilerId: number;
}

/** Partial display data accumulated during tree collapse */
export interface PartialDisplayData {
  readonly isBold?: boolean;
  readonly isItalic?: boolean;
  readonly isMonospace?: boolean;
  readonly isSpoiler?: boolean;
  readonly isStrikethrough?: boolean;
  readonly spoilerId?: number;
}
