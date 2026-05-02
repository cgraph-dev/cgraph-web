/**
 * SpoilerText -- renders spoiler content as obscured text until clicked.
 *
 * Follows Signal's spoiler reveal pattern:
 * - Unrevealed: shows SPOILER_REPLACEMENT with blurred background
 * - Click/tap: reveals actual text with opacity animation
 * - Per spoilerId grouping: one click reveals entire spoiler group
 */

import { useState, memo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { SPOILER_REPLACEMENT } from '@cgraph/shared-types';
import type { DisplayNode } from './types';
import { springs } from '@/lib/animation-presets';

interface SpoilerTextProps {
  readonly nodes: ReadonlyArray<DisplayNode>;
  readonly spoilerId: number;
}

export const SpoilerText = memo(function SpoilerText({
  nodes,
  spoilerId,
}: SpoilerTextProps): ReactNode {
  const [revealed, setRevealed] = useState(false);

  function handleReveal(): void {
    setRevealed(true);
  }

  if (revealed) {
    return (
      <motion.span
        key={`spoiler-revealed-${spoilerId}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={springs.gentle}
      >
        {nodes.map((node, idx) => (
          <StyledSpan key={`${node.start}-${idx}`} node={node} />
        ))}
      </motion.span>
    );
  }

  return (
    <motion.span
      role="button"
      tabIndex={0}
      aria-label="Spoiler text -- click to reveal"
      className="cursor-pointer select-none rounded bg-gray-500/80 px-0.5 text-transparent transition-colors hover:bg-gray-400/80"
      onClick={handleReveal}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleReveal();
        }
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {SPOILER_REPLACEMENT}
    </motion.span>
  );
});

/** Renders a single DisplayNode with appropriate inline styles */
function StyledSpan({ node }: { readonly node: DisplayNode }): ReactNode {
  const classes: string[] = [];

  if (node.isBold) classes.push('font-bold');
  if (node.isItalic) classes.push('italic');
  if (node.isStrikethrough) classes.push('line-through opacity-60');
  if (node.isMonospace) {
    classes.push(
      'rounded bg-[var(--token-card-bg)]/60 px-1 py-0.5 font-mono text-xs text-pink-300'
    );
  }

  if (classes.length === 0) {
    return <span>{node.text}</span>;
  }

  return <span className={classes.join(' ')}>{node.text}</span>;
}
