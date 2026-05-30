/**
 * FormattingToolbar -- inline formatting buttons for message composition.
 *
 * Provides 5 formatting actions matching Signal's BodyRange styles:
 * Bold (Ctrl+B), Italic (Ctrl+I), Monospace, Strikethrough, Spoiler
 *
 * Gated behind `rich_text_formatting` feature flag.
 */

import { memo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/animation-presets';
import type { BodyRangeStyle } from '@cgraph-dev/shared-types';

interface FormattingToolbarProps {
  readonly onFormat: (style: BodyRangeStyle) => void;
  readonly hasSelection: boolean;
  readonly className?: string;
}

interface ToolbarButton {
  readonly style: BodyRangeStyle;
  readonly label: string;
  readonly icon: string;
  readonly shortcut: string;
}

const TOOLBAR_BUTTONS: ReadonlyArray<ToolbarButton> = [
  { style: 'bold', label: 'Bold', icon: 'B', shortcut: 'Ctrl+B' },
  { style: 'italic', label: 'Italic', icon: 'I', shortcut: 'Ctrl+I' },
  { style: 'monospace', label: 'Monospace', icon: '<>', shortcut: 'Ctrl+E' },
  { style: 'strikethrough', label: 'Strikethrough', icon: 'S', shortcut: 'Ctrl+Shift+X' },
  { style: 'spoiler', label: 'Spoiler', icon: '||', shortcut: 'Ctrl+Shift+S' },
] as const;

export const FormattingToolbar = memo(function FormattingToolbar({
  onFormat,
  hasSelection,
  className,
}: FormattingToolbarProps): ReactNode {
  const { enabled: richTextEnabled } = useFeatureFlag('rich_text_formatting');

  if (!richTextEnabled || !hasSelection) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={springs.snappy}
      className={cn(
        'flex items-center gap-0.5 rounded-lg border border-[var(--token-border-muted)] bg-[var(--token-card-bg)] p-1 shadow-lg backdrop-blur-md',
        className
      )}
    >
      {TOOLBAR_BUTTONS.map((btn) => (
        <button
          key={btn.style}
          type="button"
          title={`${btn.label} (${btn.shortcut})`}
          aria-label={btn.label}
          className={cn(
            'flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-xs font-medium transition-colors',
            'text-[var(--token-text-secondary)] hover:bg-[var(--token-bg-secondary)] hover:text-[var(--token-text-primary)]',
            btn.style === 'bold' && 'font-bold',
            btn.style === 'italic' && 'italic',
            btn.style === 'strikethrough' && 'line-through',
            btn.style === 'monospace' && 'font-mono'
          )}
          onClick={() => onFormat(btn.style)}
        >
          {btn.icon}
        </button>
      ))}
    </motion.div>
  );
});
