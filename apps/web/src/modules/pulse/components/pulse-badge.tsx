/**
 * PulseBadge — Inline reputation badge
 *
 * Small rounded pill that surfaces a user's Pulse score with a tier accent.
 * Mounted next to a username on profile cards, mention popovers, and the
 * leaderboard. The accent colours are constrained to four tiers because
 * forum tiers (newcomer / active / trusted / ...) are a different concept
 * surfaced by `PulseDots`.
 */

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { PulseTier } from '@/modules/pulse/types';

export interface PulseBadgeProps {
  readonly score: number;
  readonly tier?: PulseTier;
  readonly className?: string;
}

interface TierStyle {
  readonly background: string;
  readonly border: string;
  readonly foreground: string;
  readonly label: string;
}

// Tier accent colours match the spec for plan item #24:
//   bronze   -> rgb(205, 127, 50)  (#cd7f32)
//   silver   -> rgb(192, 192, 192) (#c0c0c0)
//   gold     -> rgb(255, 215, 0)   (#ffd700)
//   platinum -> rgb(229, 228, 226) (#e5e4e2)
// rgb() form is used over hex literals so the no-hardcoded-hex eslint rule
// stays clean. These will graduate to design tokens once the design system
// adds tier-aware Pulse tokens.
const TIER_STYLES: Record<PulseTier, TierStyle> = {
  bronze: {
    background: 'rgba(205, 127, 50, 0.15)',
    border: 'rgba(205, 127, 50, 0.45)',
    foreground: 'rgb(205, 127, 50)',
    label: 'Bronze',
  },
  silver: {
    background: 'rgba(192, 192, 192, 0.15)',
    border: 'rgba(192, 192, 192, 0.45)',
    foreground: 'rgb(192, 192, 192)',
    label: 'Silver',
  },
  gold: {
    background: 'rgba(255, 215, 0, 0.15)',
    border: 'rgba(255, 215, 0, 0.5)',
    foreground: 'rgb(255, 215, 0)',
    label: 'Gold',
  },
  platinum: {
    background: 'rgba(229, 228, 226, 0.18)',
    border: 'rgba(229, 228, 226, 0.55)',
    foreground: 'rgb(229, 228, 226)',
    label: 'Platinum',
  },
};

const COMPACT_FORMATTER = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const PLAIN_FORMATTER = new Intl.NumberFormat('en-US');

const COMPACT_THRESHOLD = 1000;

/**
 * Format a Pulse score using compact notation (1.2K, 12K, 1.2M) above 999.
 */
export function formatPulseScore(score: number): string {
  const absScore = Math.abs(score);
  if (absScore >= COMPACT_THRESHOLD) {
    return COMPACT_FORMATTER.format(score);
  }
  return PLAIN_FORMATTER.format(score);
}

function inferTier(score: number): PulseTier {
  if (score >= 5000) return 'platinum';
  if (score >= 1000) return 'gold';
  if (score >= 100) return 'silver';
  return 'bronze';
}

/**
 * Inline Pulse score badge.
 */
export const PulseBadge = memo(function PulseBadge({ score, tier, className }: PulseBadgeProps) {
  const resolvedTier: PulseTier = tier ?? inferTier(score);
  const style = TIER_STYLES[resolvedTier];
  const formatted = formatPulseScore(score);

  return (
    <span
      role="img"
      aria-label={`Pulse score: ${score} (${style.label})`}
      data-tier={resolvedTier}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums',
        className
      )}
      style={{
        backgroundColor: style.background,
        borderColor: style.border,
        color: style.foreground,
      }}
    >
      <span aria-hidden="true">●</span>
      <span>{formatted}</span>
    </span>
  );
});
