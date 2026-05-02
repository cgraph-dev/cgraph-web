/**
 * Reply Preview — small rounded card rendered inside a message bubble
 * when the message is a reply to another. Mirrors Signal Desktop's
 * Quote.dom.tsx structure (see
 * /CGraph/reference/Signal/Signal-Desktop/ts/components/conversation/Quote.dom.tsx):
 * left accent bar, author title, single-line truncated content, click to
 * jump to the referenced message in the conversation view.
 */

import type { ReactNode } from 'react';
import { useThemeStore, COLORS } from '@/stores/theme/themeStore';
import type { ColorPreset } from '@/stores/theme/themeStore';
import { logger } from '@/lib/logger';

const SNIPPET_MAX_LENGTH = 80;
const FALLBACK_LABEL = 'Replying to a message…';

export interface ReplyPreviewProps {
  readonly replyToId: string;
  readonly authorName: string | null;
  readonly snippet: string | null;
  readonly isOwn: boolean;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function isColorPreset(value: unknown): value is ColorPreset {
  return typeof value === 'string' && value in COLORS;
}

function scrollToMessage(targetId: string): void {
  if (typeof document === 'undefined') return;
  const target = document.getElementById(`message-${targetId}`);
  if (!target) {
    logger.debug('reply-preview: target message not in DOM', { targetId });
    return;
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Reply preview card rendered above a message that is itself a reply.
 * Click jumps the conversation view to the referenced message.
 */
export function ReplyPreview({
  replyToId,
  authorName,
  snippet,
  isOwn,
}: ReplyPreviewProps): ReactNode {
  const colorPreset = useThemeStore((s) => s.colorPreset);
  const accentColor = isColorPreset(colorPreset)
    ? COLORS[colorPreset].primary
    : COLORS.purple.primary;

  const trimmedSnippet = snippet
    ? truncate(snippet.replace(/\s+/g, ' ').trim(), SNIPPET_MAX_LENGTH)
    : null;
  const headerLabel = authorName ?? (trimmedSnippet ? 'Unknown' : FALLBACK_LABEL);

  function handleClick(): void {
    scrollToMessage(replyToId);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      scrollToMessage(replyToId);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Jump to replied message from ${headerLabel}`}
      className={`mb-1 flex w-full max-w-xs items-stretch gap-2 overflow-hidden rounded-lg border border-transparent bg-[var(--token-card-bg)/0.6] py-1.5 pl-1.5 pr-3 text-left text-xs backdrop-blur-[8px] transition-colors hover:bg-[var(--token-card-bg)/0.8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--token-focus-ring)] dark:border-[var(--token-border-muted)] dark:bg-[var(--token-card-bg)/0.6] ${isOwn ? 'self-end text-right' : ''}`}
    >
      <span
        aria-hidden="true"
        className="flex-shrink-0 rounded-full"
        style={{ width: 3, backgroundColor: accentColor }}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium" style={{ color: accentColor }}>
          {headerLabel}
        </span>
        {trimmedSnippet && (
          <span className="truncate text-[var(--token-text-muted)] dark:text-gray-400">
            {trimmedSnippet}
          </span>
        )}
      </span>
    </button>
  );
}

export default ReplyPreview;
