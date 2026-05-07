import type { MessageSearchResult, SearchFilters } from './types';
import { http } from '@/lib/api-client';
import axios from 'axios';
import { createLogger } from '@/lib/logger';
import { STORAGE_KEYS } from '@/lib/storage/namespaces';

const logger = createLogger('messageSearch');

/**
 * LocalStorage key for recent searches
 */
export const RECENT_SEARCHES_KEY = STORAGE_KEYS.messageSearchRecent;

/**
 * Maximum recent searches to store
 */
export const MAX_RECENT_SEARCHES = 5;

/**
 * Debounce delay for search input (ms)
 */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Highlight search term in content
 */
export function highlightContent(content: string, searchTerm: string): string {
  if (!searchTerm.trim()) return content;
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return content.replace(
    regex,
    '<mark class="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">$1</mark>'
  );
}

/**
 * Minimum characters the backend accepts for a message search query. See
 * `apps/backend/lib/cgraph_web/controllers/api/v1/search_controller.ex:82`.
 */
export const SEARCH_MIN_CHARS = 2;

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  const record: Record<string, unknown> = { ...value };
  return record;
}

function normalizeSearchResult(raw: unknown, query: string): MessageSearchResult | null {
  const record = toRecord(raw);
  if (!record) return null;
  const sender = toRecord(record.sender) ?? {};

  const id = toStringOrNull(record.id);
  const conversationId =
    toStringOrNull(record.conversationId) ?? toStringOrNull(record.conversation_id);
  const content = toStringOrNull(record.content);
  if (!id || !conversationId || content === null) return null;

  const senderId = toStringOrNull(record.senderId) ?? toStringOrNull(record.sender_id) ?? '';
  const senderUsername = toStringOrNull(sender.username) ?? '';
  const senderAvatarUrl =
    toStringOrNull(sender.avatarUrl) ?? toStringOrNull(sender.avatar_url) ?? undefined;
  const conversationName =
    toStringOrNull(record.conversation_name) ??
    toStringOrNull(record.conversationName) ??
    'Conversation';
  const createdAt =
    toStringOrNull(record.createdAt) ??
    toStringOrNull(record.created_at) ??
    new Date().toISOString();
  const messageType =
    toStringOrNull(record.messageType) ??
    toStringOrNull(record.contentType) ??
    toStringOrNull(record.content_type) ??
    'text';
  const highlight = toStringOrNull(record.highlight);

  return {
    id,
    conversationId,
    conversationName,
    senderId,
    senderUsername,
    senderAvatarUrl,
    content,
    highlightedContent: highlight ?? highlightContent(content, query),
    createdAt,
    messageType,
  };
}

/**
 * Query the backend MeiliSearch endpoint for messages. Returns an empty
 * array for queries shorter than the server's minimum (to avoid a 400).
 * Accepts an AbortSignal so callers can cancel stale requests.
 */
export async function searchMessages(
  query: string,
  filters: SearchFilters,
  signal?: AbortSignal
): Promise<MessageSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < SEARCH_MIN_CHARS) return [];

  const params: Record<string, string> = { q: trimmed, limit: '20' };
  if (filters.conversationId) params.conversation_id = filters.conversationId;
  if (filters.userId) params.from = filters.userId;
  if (filters.dateFrom) params.after = filters.dateFrom;
  if (filters.dateTo) params.before = filters.dateTo;

  try {
    const response = await http.get('/api/v1/search/messages', { params, signal });
    const payload: unknown = response.data;
    const rawArray = getDataArray(payload);
    const results: MessageSearchResult[] = [];
    for (const entry of rawArray) {
      const normalized = normalizeSearchResult(entry, trimmed);
      if (normalized) results.push(normalized);
    }
    return results;
  } catch (err: unknown) {
    if (axios.isCancel(err)) return [];
    logger.error('Message search failed', err);
    throw err;
  }
}

function getDataArray(payload: unknown): unknown[] {
  const record = toRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.results)) return record.results;
  return [];
}

/**
 * Load recent searches from localStorage
 */
export function loadRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  return [];
}

/**
 * Save a search term to recent searches
 */
export function saveRecentSearch(term: string, current: string[]): string[] {
  if (!term.trim()) return current;
  const updated = [term, ...current.filter((s) => s !== term)].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  return updated;
}
