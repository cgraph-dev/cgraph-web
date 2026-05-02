/**
 * Per-conversation draft autosave hook.
 *
 * Modelled on Signal-Desktop's `saveDraft` / `debouncedSaveDraft` pair in
 * `state/ducks/composer.preload.ts`: text changes are debounced for 100 ms,
 * an empty / whitespace-only value clears the draft, and the caller is
 * expected to invoke `clearDraft()` after a successful send.
 *
 * Drafts are persisted in IndexedDB (`apps/web/src/lib/offline/indexeddb-cache.ts`)
 * so they survive tab reloads and restart with the conversation.
 *
 * @see reference/Signal/Signal-Desktop/ts/state/ducks/composer.preload.ts (line 1499)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteDraft, getDraft, saveDraft as persistDraft } from '@/lib/offline/indexeddb-cache';
import { createLogger } from '@/lib/logger';

const DEBOUNCE_MS = 100;
const logger = createLogger('useDraft');

export interface UseDraftReturn {
  /** Text currently stored for this conversation (after the initial hydration). */
  readonly draftText: string;
  /** Whether the initial IDB read has completed. */
  readonly hydrated: boolean;
  /** Update the draft text; persists after a short debounce. */
  readonly setDraftText: (text: string) => void;
  /** Synchronously clear the draft — call after a successful send. */
  readonly clearDraft: () => void;
}

/**
 * Returns draft state for a conversation, hydrating from IndexedDB on mount
 * and autosaving subsequent changes.
 */
export function useDraft(conversationId: string | undefined): UseDraftReturn {
  const [draftText, setDraftTextState] = useState('');
  const [hydrated, setHydrated] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationIdRef = useRef<string | undefined>(conversationId);
  conversationIdRef.current = conversationId;

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);

    if (!conversationId) {
      setDraftTextState('');
      setHydrated(true);
      return () => {
        cancelled = true;
      };
    }

    getDraft(conversationId)
      .then((record) => {
        if (cancelled) return;
        setDraftTextState(record?.text ?? '');
        setHydrated(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        logger.error('Failed to load draft', err);
        setHydrated(true);
      });

    return () => {
      cancelled = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [conversationId]);

  const setDraftText = useCallback((text: string): void => {
    setDraftTextState(text);

    const targetConversationId = conversationIdRef.current;
    if (!targetConversationId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      void persistDraft(targetConversationId, text).catch((err: unknown) => {
        logger.error('Failed to persist draft', err);
      });
    }, DEBOUNCE_MS);
  }, []);

  const clearDraft = useCallback((): void => {
    const targetConversationId = conversationIdRef.current;
    setDraftTextState('');
    if (!targetConversationId) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    void deleteDraft(targetConversationId).catch((err: unknown) => {
      logger.error('Failed to clear draft', err);
    });
  }, []);

  return { draftText, hydrated, setDraftText, clearDraft };
}
