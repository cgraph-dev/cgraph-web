/**
 * Forum Jump Dropdown — C4
 *
 * Classic MyBB "Forum Jump" dropdown that lets users quickly
 * navigate to any board within the current forum.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForumHostingStore } from '@/modules/forums/store/forumHostingStore.impl';
import type { Board } from '@/modules/forums/store/forumHostingStore.types';

interface ForumJumpProps {
  forumId: string;
  forumSlug: string;
  currentBoardId?: string;
}

function buildHierarchy(boards: Board[]): Array<Board & { depth: number }> {
  const childrenMap = new Map<string | null, Board[]>();
  for (const board of boards) {
    const parentKey = board.parentBoardId ?? board.parentId ?? null;
    const list = childrenMap.get(parentKey) ?? [];
    list.push(board);
    childrenMap.set(parentKey, list);
  }

  const result: Array<Board & { depth: number }> = [];

  function walk(parentId: string | null, depth: number) {
    const children = childrenMap.get(parentId) ?? [];
    const sorted = [...children].sort((a, b) => a.position - b.position);
    for (const child of sorted) {
      result.push({ ...child, depth });
      walk(child.id, depth + 1);
    }
  }

  walk(null, 0);
  return result;
}

/** Forum jump navigation component for quickly switching between boards. */
export function ForumJump({ forumId, forumSlug, currentBoardId }: ForumJumpProps) {
  const boards = useForumHostingStore((s) => s.boards);
  const fetchBoards = useForumHostingStore((s) => s.fetchBoards);
  const [selectedBoardId, setSelectedBoardId] = useState(currentBoardId ?? '');
  const navigate = useNavigate();

  // Fetch boards if empty
  if (boards.length === 0 && forumId) {
    fetchBoards(forumId).catch(() => {
      // Non-critical, fail silently
    });
  }

  const hierarchy = useMemo(() => buildHierarchy(boards), [boards]);

  const handleGo = () => {
    if (!selectedBoardId) return;
    const board = boards.find((b) => b.id === selectedBoardId);
    if (board) {
      navigate(`/forums/${forumSlug}/boards/${board.slug || board.id}`);
    }
  };

  if (boards.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="whitespace-nowrap font-medium text-gray-400">Forum Jump:</span>
      <select
        value={selectedBoardId}
        onChange={(e) => setSelectedBoardId(e.target.value)}
        className="min-w-[200px] rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-primary-500"
      >
        <option value="">-- Select Board --</option>
        {hierarchy.map((board) => (
          <option key={board.id} value={board.id}>
            {'—'.repeat(board.depth)} {board.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleGo}
        disabled={!selectedBoardId}
        className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
      >
        Go
      </button>
    </div>
  );
}
