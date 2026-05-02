/**
 * ConversationList row model — one flat array of row descriptors for the
 * virtualizer, with exact heights per row type.
 *
 * Modelled on Signal-Desktop's `ConversationList.dom.tsx` (RowType enum,
 * discriminated Row union, fixed NORMAL / HEADER row heights). The same
 * pattern lets the virtualizer report total size without measuring DOM.
 *
 * @see reference/Signal/Signal-Desktop/ts/components/ConversationList.dom.tsx
 */

import type { Conversation } from '@/modules/chat/store/chatStore.impl';

export const NORMAL_ROW_HEIGHT = 76;
export const HEADER_ROW_HEIGHT = 40;

export enum RowType {
  NoteToSelf = 'NoteToSelf',
  Header = 'Header',
  Conversation = 'Conversation',
}

export type HeaderLabel = 'pinned' | 'all';

export type Row =
  | { type: RowType.NoteToSelf; conversation: Conversation }
  | { type: RowType.Header; label: HeaderLabel }
  | { type: RowType.Conversation; conversation: Conversation };

interface BuildRowsInput {
  readonly noteToSelf: ReadonlyArray<Conversation>;
  readonly pinned: ReadonlyArray<Conversation>;
  readonly regular: ReadonlyArray<Conversation>;
}

/**
 * Flatten the three conversation slices into a single row array with section
 * headers inserted between them.
 */
export function buildRows({ noteToSelf, pinned, regular }: BuildRowsInput): Row[] {
  const rows: Row[] = [];

  for (const conversation of noteToSelf) {
    rows.push({ type: RowType.NoteToSelf, conversation });
  }

  if (pinned.length > 0) {
    rows.push({ type: RowType.Header, label: 'pinned' });
    for (const conversation of pinned) {
      rows.push({ type: RowType.Conversation, conversation });
    }
  }

  if (regular.length > 0) {
    if (pinned.length > 0) {
      rows.push({ type: RowType.Header, label: 'all' });
    }
    for (const conversation of regular) {
      rows.push({ type: RowType.Conversation, conversation });
    }
  }

  return rows;
}

/** Fixed pixel height for each row type, used by the virtualizer. */
export function rowHeight(row: Row): number {
  switch (row.type) {
    case RowType.Header:
      return HEADER_ROW_HEIGHT;
    case RowType.NoteToSelf:
    case RowType.Conversation:
      return NORMAL_ROW_HEIGHT;
  }
}

/** Stable identity for virtualizer reconciliation across list mutations. */
export function rowKey(row: Row, index: number): string {
  switch (row.type) {
    case RowType.NoteToSelf:
      return `nts:${row.conversation.id}`;
    case RowType.Header:
      return `header:${row.label}`;
    case RowType.Conversation:
      return `conv:${row.conversation.id}`;
    default: {
      const _exhaustive: never = row;
      void _exhaustive;
      return `row:${index}`;
    }
  }
}
