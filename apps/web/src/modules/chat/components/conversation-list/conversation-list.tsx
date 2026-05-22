/**
 * ConversationList Component
 *
 * Virtualized conversation list. One flat row array is built from
 * noteToSelf / pinned / regular slices and rendered through
 * `@tanstack/react-virtual`. Per-row heights come from the discriminated
 * union in `./rows` so the virtualizer can size the scroll area without
 * measuring DOM.
 *
 * @see reference/Signal/Signal-Desktop/ts/components/ConversationList.dom.tsx
 *   (RowType enum, fixed heights, getRow / renderRow pattern)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { BookmarkIcon as PinIcon } from '@heroicons/react/24/outline';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useChatStore, type Conversation } from '@/modules/chat/store/chatStore.impl';
import { useAuthStore } from '@/modules/auth/store';
import { DRAFTS_CHANGED_EVENT, getAllDrafts } from '@/lib/offline/indexeddb-cache';
import type { ConversationListProps } from './types';
import { useConversationList } from './useConversationList';
import { ConversationListHeader } from './conversation-list-header';
import { ConversationItem } from './conversation-item';
import { EmptyState } from './empty-state';
import { NoteToSelfItem } from './note-to-self-item';
import { NewChatModal } from './new-chat-modal';
import { buildRows, rowHeight, rowKey, RowType, type Row } from './rows';

/**
 * Conversation List component.
 */
export function ConversationList({ className = '' }: ConversationListProps) {
  const { user } = useAuthStore();
  const typingUsers = useChatStore((s) => s.typingUsers);
  const draftPreviews = useDraftPreviews();
  const {
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    showNewChat,
    setShowNewChat,
    pinnedConversations,
    regularConversations,
    filteredConversations,
    handleConversationClick,
  } = useConversationList();

  const rows = useMemo<Row[]>(() => {
    const noteToSelf = filteredConversations.filter((c) => c.isNoteToSelf);
    return buildRows({
      noteToSelf,
      pinned: pinnedConversations,
      regular: regularConversations,
    });
  }, [filteredConversations, pinnedConversations, regularConversations]);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const row = rows[index];
      return row ? rowHeight(row) : 76;
    },
    overscan: 8,
    getItemKey: (index) => {
      const row = rows[index];
      return row ? rowKey(row, index) : `row:${index}`;
    },
  });

  const items = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div className={`flex h-full flex-col ${className}`}>
      <ConversationListHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filter={filter}
        onFilterChange={setFilter}
        onNewChat={() => setShowNewChat(true)}
      />

      {filteredConversations.length === 0 ? (
        <EmptyState searchQuery={searchQuery} onNewChat={() => setShowNewChat(true)} />
      ) : (
        <div ref={parentRef} className="flex-1 overflow-y-auto">
          <div style={{ height: totalSize, position: 'relative' }}>
            {items.map((item) => {
              const row = rows[item.index];
              if (!row) return null;

              return (
                <div
                  key={item.key}
                  data-row-index={item.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: `translateY(${item.start}px)`,
                    height: rowHeight(row),
                  }}
                >
                  <RenderedRow
                    row={row}
                    currentUserId={user?.id}
                    typingUsers={typingUsers}
                    draftPreviews={draftPreviews}
                    onClickConversation={handleConversationClick}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
      </AnimatePresence>
    </div>
  );
}

interface RenderedRowProps {
  readonly row: Row;
  readonly currentUserId: string | undefined;
  readonly typingUsers: Record<string, readonly string[]>;
  readonly draftPreviews: Readonly<Record<string, string>>;
  readonly onClickConversation: (conversation: Conversation) => void;
}

function RenderedRow({
  row,
  currentUserId,
  typingUsers,
  draftPreviews,
  onClickConversation,
}: RenderedRowProps): React.ReactNode {
  switch (row.type) {
    case RowType.NoteToSelf:
      return (
        <NoteToSelfItem
          conversation={row.conversation}
          onClick={() => onClickConversation(row.conversation)}
        />
      );
    case RowType.Header:
      return <SectionHeader label={row.label} />;
    case RowType.Conversation:
      return (
        <ConversationItem
          conversation={row.conversation}
          currentUserId={currentUserId}
          typingUsers={[...(typingUsers[row.conversation.id] ?? [])]}
          draftPreview={draftPreviews[row.conversation.id] ?? null}
          onClick={() => onClickConversation(row.conversation)}
        />
      );
  }
}

function useDraftPreviews(): Readonly<Record<string, string>> {
  const [draftPreviews, setDraftPreviews] = useState<Record<string, string>>({});

  const loadDrafts = useCallback(() => {
    let cancelled = false;
    void getAllDrafts()
      .then((drafts) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const draft of drafts) {
          const preview = draft.text.replace(/\s+/g, ' ').trim();
          if (preview.length > 0) {
            next[draft.conversationId] = preview;
          }
        }
        setDraftPreviews((current) => (areDraftPreviewsEqual(current, next) ? current : next));
      })
      .catch(() => {
        if (!cancelled) {
          setDraftPreviews((current) =>
            Object.keys(current).length === 0 ? current : {}
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cancelInitialLoad = loadDrafts();
    const handleDraftsChanged = () => {
      loadDrafts();
    };
    window.addEventListener(DRAFTS_CHANGED_EVENT, handleDraftsChanged);
    return () => {
      cancelInitialLoad();
      window.removeEventListener(DRAFTS_CHANGED_EVENT, handleDraftsChanged);
    };
  }, [loadDrafts]);

  return draftPreviews;
}

function areDraftPreviewsEqual(
  current: Readonly<Record<string, string>>,
  next: Readonly<Record<string, string>>
): boolean {
  const currentKeys = Object.keys(current);
  const nextKeys = Object.keys(next);
  if (currentKeys.length !== nextKeys.length) return false;
  return nextKeys.every((key) => current[key] === next[key]);
}

function SectionHeader({ label }: { readonly label: 'pinned' | 'all' }): React.ReactNode {
  if (label === 'pinned') {
    return (
      <div className="flex h-full items-center gap-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
        <PinIcon className="h-3 w-3" />
        Pinned
      </div>
    );
  }
  return (
    <div className="flex h-full items-center px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
      All Messages
    </div>
  );
}

export default ConversationList;
