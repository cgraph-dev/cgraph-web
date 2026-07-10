/**
 * PulseBadge — Inline reputation badge
 *
 * Small rounded pill that surfaces a user's Pulse score with a tier accent.
 * Mounted next to a username on profile cards, mention popovers, and the
 * leaderboard. Tier semantics come from the shared backend-aligned contract;
 * this component owns only its local visual treatment.
 */

import { memo } from 'react';
import { pulseTierForScore, type PulseTier } from '@cgraph-dev/shared-types';
import { cn } from '@/lib/utils';

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

const TIER_STYLES: Record<PulseTier, TierStyle> = {
  newcomer: {
    background: 'rgba(156, 163, 175, 0.15)',
    border: 'rgba(156, 163, 175, 0.45)',
    foreground: 'rgb(156, 163, 175)',
    label: 'Newcomer',
  },
  active: {
    background: 'rgba(96, 165, 250, 0.15)',
    border: 'rgba(96, 165, 250, 0.45)',
    foreground: 'rgb(96, 165, 250)',
    label: 'Active',
  },
  trusted: {
    background: 'rgba(74, 222, 128, 0.15)',
    border: 'rgba(74, 222, 128, 0.45)',
    foreground: 'rgb(74, 222, 128)',
    label: 'Trusted',
  },
  expert: {
    background: 'rgba(192, 132, 252, 0.15)',
    border: 'rgba(192, 132, 252, 0.45)',
    foreground: 'rgb(192, 132, 252)',
    label: 'Expert',
  },
  authority: {
    background: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(251, 191, 36, 0.45)',
    foreground: 'rgb(251, 191, 36)',
    label: 'Authority',
  },
  legend: {
    background: 'rgba(253, 224, 71, 0.18)',
    border: 'rgba(253, 224, 71, 0.55)',
    foreground: 'rgb(253, 224, 71)',
    label: 'Legend',
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

/**
 * Inline Pulse score badge.
 */
export const PulseBadge = memo(function PulseBadge({ score, tier, className }: PulseBadgeProps) {
  const resolvedTier: PulseTier = tier ?? pulseTierForScore(score);
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
