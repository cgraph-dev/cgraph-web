import { Link } from 'react-router-dom';
import type { ForumSearchResult } from '@/modules/forums/store/forumStore.types';

const TYPE_BADGE_STYLES: Record<
  ForumSearchResult['type'],
  { readonly className: string; readonly label: string }
> = {
  thread: {
    className: 'bg-[var(--token-bg-tertiary)] text-[var(--token-feedback-info)]',
    label: 'Thread',
  },
  post: {
    className: 'bg-[var(--token-bg-tertiary)] text-[var(--token-feedback-success)]',
    label: 'Post',
  },
  comment: {
    className: 'bg-[var(--token-bg-tertiary)] text-[var(--token-text-secondary)]',
    label: 'Comment',
  },
};

function highlightText(text: string, highlights?: string[]): React.ReactNode {
  if (!highlights?.length) return text;

  const lowerText = text.toLowerCase();
  const ranges: Array<{ start: number; end: number }> = [];

  for (const highlight of highlights) {
    const needle = highlight.trim();
    if (!needle) continue;

    const lowerNeedle = needle.toLowerCase();
    let start = lowerText.indexOf(lowerNeedle);

    while (start !== -1) {
      ranges.push({ start, end: start + needle.length });
      start = lowerText.indexOf(lowerNeedle, start + needle.length);
    }
  }

  if (!ranges.length) return text;

  const mergedRanges = ranges
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .reduce<Array<{ start: number; end: number }>>((merged, range) => {
      const previous = merged[merged.length - 1];
      if (previous && range.start <= previous.end) {
        previous.end = Math.max(previous.end, range.end);
        return merged;
      }
      merged.push({ ...range });
      return merged;
    }, []);

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const range of mergedRanges) {
    if (range.start > cursor) {
      parts.push(text.slice(cursor, range.start));
    }
    parts.push(
      <mark
        key={`${range.start}-${range.end}`}
        className="rounded bg-[var(--token-bg-tertiary)] px-0.5 text-[var(--token-status-warning)]"
      >
        {text.slice(range.start, range.end)}
      </mark>
    );
    cursor = range.end;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface SearchResultCardProps {
  readonly result: ForumSearchResult;
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const badge = TYPE_BADGE_STYLES[result.type];
  const preview =
    result.contentPreview.length > 200
      ? `${result.contentPreview.slice(0, 200)}…`
      : result.contentPreview;

  return (
    <Link
      to={`/forums/${result.forum.slug}/post/${result.id}`}
      className="cgraph-card block border border-[var(--token-border-default)] bg-[var(--token-card-bg)] p-4 transition-colors hover:bg-[var(--token-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--token-focus-ring)]"
    >
      <div className="flex items-start gap-3">
        <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}>
          {badge.label}
        </span>

        <div className="min-w-0 flex-1">
          {result.title && (
            <h3 className="mb-1 truncate text-sm font-semibold text-[var(--token-text-primary)]">
              {highlightText(result.title, result.highlights)}
            </h3>
          )}

          <p className="mb-2 text-sm leading-relaxed text-[var(--token-text-secondary)]">
            {highlightText(preview, result.highlights)}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--token-text-muted)]">
            <div className="flex items-center gap-1.5">
              {result.author.avatar ? (
                <img src={result.author.avatar} alt="" className="h-4 w-4 rounded-full" />
              ) : (
                <span
                  className="h-4 w-4 rounded-full bg-[var(--token-bg-tertiary)]"
                  aria-hidden="true"
                />
              )}
              <span>{result.author.username}</span>
            </div>

            <span>in</span>
            <span className="text-[var(--token-interactive-primary)]">{result.forum.name}</span>

            {result.board && (
              <>
                <span aria-hidden="true">›</span>
                <span>{result.board.name}</span>
              </>
            )}

            <span className="ml-auto tabular-nums">
              {result.score > 0 ? '+' : ''}
              {result.score} pts
            </span>

            <time dateTime={result.createdAt}>{formatRelativeTime(result.createdAt)}</time>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default SearchResultCard;
