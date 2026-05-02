/**
 * Advanced Search constants - Default filter values and select options
 */
import type { AdvancedSearchFilters } from './types';

export const defaultFilters: AdvancedSearchFilters = {
  keywords: '',
  author: '',
  dateRange: 'any',
  searchIn: 'all',
  forumId: null,
  includeSubforums: true,
  contentType: 'all',
  showClosed: true,
  showSticky: true,
  showNormal: true,
  sortBy: 'relevance',
  sortOrder: 'desc',
  resultsPerPage: 25,
};

/* ── Shared Tailwind class tokens ───────────────────────────── */

export const INPUT_CLS =
  'w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-4 py-2 text-[var(--token-text-primary)] placeholder-[var(--token-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--token-interactive-primary)_20%,transparent)]';

export const SELECT_CLS =
  'w-full rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-4 py-2 text-[var(--token-text-primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--token-interactive-primary)_20%,transparent)]';

export const CHECKBOX_CLS =
  'rounded border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] text-[var(--token-interactive-primary)] focus:ring-[var(--token-interactive-primary)]';

export const LABEL_CLS = 'mb-2 block text-sm font-medium text-[var(--token-text-secondary)]';

/* ── Select / radio option lists ────────────────────────────── */

export const DATE_RANGE_OPTIONS: { value: AdvancedSearchFilters['dateRange']; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'day', label: 'Past 24 hours' },
  { value: 'week', label: 'Past week' },
  { value: 'month', label: 'Past month' },
  { value: 'year', label: 'Past year' },
  { value: 'custom', label: 'Custom range' },
];

export const SEARCH_IN_OPTIONS: { value: AdvancedSearchFilters['searchIn']; label: string }[] = [
  { value: 'all', label: 'Titles and content' },
  { value: 'titles', label: 'Titles only' },
  { value: 'content', label: 'Content only' },
  { value: 'firstPost', label: 'First post only' },
];

export const SORT_BY_OPTIONS: { value: AdvancedSearchFilters['sortBy']; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'date', label: 'Date' },
  { value: 'author', label: 'Author' },
  { value: 'replies', label: 'Replies' },
  { value: 'views', label: 'Views' },
];

export const CONTENT_TYPES = ['all', 'threads', 'posts'] as const;

export interface ThreadStatusOption {
  key: keyof Pick<
    AdvancedSearchFilters,
    'showNormal' | 'showSticky' | 'showClosed' | 'hasAttachments' | 'hasPoll'
  >;
  label: string;
  boolean: boolean; // true = plain boolean, false = boolean|undefined
}

export const THREAD_STATUS_OPTIONS: ThreadStatusOption[] = [
  { key: 'showNormal', label: 'Normal threads', boolean: true },
  { key: 'showSticky', label: 'Sticky/pinned', boolean: true },
  { key: 'showClosed', label: 'Closed threads', boolean: true },
  { key: 'hasAttachments', label: 'Has attachments', boolean: false },
  { key: 'hasPoll', label: 'Has poll', boolean: false },
];
