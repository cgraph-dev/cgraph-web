/**
 * Forum Sidebar — Board categories with unread counts
 *
 * Features:
 * - Collapsible category sections
 * - Board: icon + name + unread count badge
 * - Active board highlight
 * - "Create Thread" button at top
 * - Board description on hover
 * - Search boards
 *
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from 'react-router-dom';
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { ScrollArea } from '@/components/ui/scroll-area';
import Tooltip from '@/components/ui/tooltip';
import { springs } from '@/lib/animation-presets';
import { cn } from '@/lib/utils';
interface Board {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  unreadCount?: number;
  threadCount?: number;
}

interface BoardCategory {
  id: string;
  name: string;
  boards: Board[];
}

interface ForumSidebarProps {
  categories?: BoardCategory[];
  activeBoardId?: string;
  onCreateThread?: () => void;
  className?: string;
}
function BoardItem({ board, isActive }: { board: Board; isActive: boolean }) {
  const content = (
    <NavLink to={`/forums/boards/${board.id}`} className="block">
      <motion.div
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'group relative flex w-full items-center gap-3 rounded-xl border px-2 py-1.5 transition-all duration-500',
          isActive
            ? 'border-[var(--token-card-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_0_1px_rgba(255,255,255,0.08)] bg-[var(--token-bg-secondary)]'
            : 'border-transparent bg-transparent hover:bg-[var(--token-bg-primary)] backdrop-blur-md'
        )}
        style={
          isActive
            ? { background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-brand-purple) 12%, transparent) 0%, rgba(59,130,246,0.10) 100%)' }
            : {}
        }
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-500 ${
            isActive
              ? 'border-primary-500/30 bg-primary-500/10 text-primary-400 scale-105'
              : 'bg-[var(--token-bg-primary)] border-[var(--token-border-muted)] text-white/40 group-hover:bg-[var(--token-bg-secondary)] group-hover:border-[var(--token-border-muted)]'
          }`}
        >
          <span className={`text-sm ${isActive ? '' : 'group-hover:text-white/80'}`}>{board.icon ?? '#'}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'truncate text-[13px] transition-colors',
              isActive ? 'font-bold text-white' : 'font-medium text-gray-400 group-hover:text-white',
              (board.unreadCount ?? 0) > 0 && !isActive && 'text-gray-200'
            )}
          >
            {board.name}
          </div>
        </div>
        {(board.unreadCount ?? 0) > 0 && (
          <span className={`relative z-10 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold shadow-sm ${isActive ? 'bg-primary-500 text-white shadow-[0_0_8px_color-mix(in_srgb,var(--color-brand-purple)_50%,transparent)]' : 'bg-primary-600/20 text-primary-400'}`}>
            {board.unreadCount}
          </span>
        )}
      </motion.div>
    </NavLink>
  );

  if (board.description) {
    return (
      <Tooltip content={board.description} side="right">
        {content}
      </Tooltip>
    );
  }

  return content;
}
function CategorySection({
  category,
  activeBoardId,
}: {
  category: BoardCategory;
  activeBoardId?: string;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="px-2">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="group flex w-full items-center py-1.5 text-left"
      >
        <motion.div animate={{ rotate: expanded ? 0 : -90 }} transition={springs.snappy}>
          <ChevronDownIcon className="mr-1 h-2.5 w-2.5 text-gray-600" />
        </motion.div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 group-hover:text-gray-400">
          {category.name}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.snappy}
            className="overflow-hidden"
          >
            {category.boards.map((board) => (
              <BoardItem key={board.id} board={board} isActive={board.id === activeBoardId} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
/** Forum Sidebar component. */
export function ForumSidebar({
  categories = [],
  activeBoardId,
  onCreateThread,
  className,
}: ForumSidebarProps) {
  const [search, setSearch] = useState('');

  const filteredCategories = search
    ? categories
        .map((cat) => ({
          ...cat,
          boards: cat.boards.filter((b) => b.name.toLowerCase().includes(search.toLowerCase())),
        }))
        .filter((cat) => cat.boards.length > 0)
    : categories;

  return (
    <div className={cn('flex h-full w-60 flex-col bg-[var(--token-card-bg)]', className)}>
      {/* Header */}
      <div className="border-b border-[var(--token-card-border)] p-3">
        <h2 className="mb-2 text-sm font-bold text-white">Forums</h2>

        {/* Create thread button */}
        {onCreateThread && (
          <motion.button
            onClick={onCreateThread}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-500"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Create Thread
          </motion.button>
        )}

        {/* Search */}
        <div className="relative mt-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search boards..."
            className="peer w-full rounded-xl border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] py-2 pl-9 pr-3 text-xs text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:border-primary-500/40 focus:bg-[var(--token-card-bg)] focus:outline-none focus:ring-4 focus:ring-primary-500/10"
          />
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
        </div>
      </div>

      {/* Board list */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 py-2">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => (
              <CategorySection key={cat.id} category={cat} activeBoardId={activeBoardId} />
            ))
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <ChatBubbleLeftRightIcon className="mb-2 h-8 w-8 text-gray-600" />
              <p className="text-xs text-gray-500">
                {search ? 'No boards match your search' : 'No boards yet'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default ForumSidebar;
