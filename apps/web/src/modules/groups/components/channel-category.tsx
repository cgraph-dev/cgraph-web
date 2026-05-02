/**
 * Collapsible channel category header.
 *
 * Collapse state is persisted per category so large groups keep their navigation shape.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { springs } from '@/lib/animation-presets';
import { cn } from '@/lib/utils';

interface ChannelCategoryProps {
  /** Category unique ID */
  categoryId: string;
  /** Category display name */
  name: string;
  /** Number of channels in this category */
  channelCount?: number;
  /** Children channel items */
  children: React.ReactNode;
  /** Callback when "+" is clicked */
  onCreateChannel?: (categoryId: string) => void;
  className?: string;
}

const STORAGE_KEY = 'cgraph:collapsed-categories';

function parseStringArray(raw: string): string[] {
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) && parsed.every((value) => typeof value === 'string') ? parsed : [];
}

function getCollapsedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(parseStringArray(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function persistCollapsedSet(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

/** Channel Category component. */
export function ChannelCategory({
  categoryId,
  name,
  channelCount = 0,
  children,
  onCreateChannel,
  className,
}: ChannelCategoryProps) {
  const [collapsed, setCollapsed] = useState(() => getCollapsedSet().has(categoryId));
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    setCollapsed(getCollapsedSet().has(categoryId));
  }, [categoryId]);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      const set = getCollapsedSet();
      if (next) {
        set.add(categoryId);
      } else {
        set.delete(categoryId);
      }
      persistCollapsedSet(set);
      return next;
    });
  };

  const handleCreate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateChannel?.(categoryId);
  };

  return (
    <div className={cn('pt-4', className)}>
      {/* Category Header */}
      <button
        onClick={handleToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group flex w-full items-center px-1 text-left"
      >
        <motion.div
          animate={{ rotate: collapsed ? -90 : 0 }}
          transition={springs.snappy}
          className="mr-0.5 flex-shrink-0"
        >
          <ChevronDownIcon className="h-2.5 w-2.5 text-gray-500" />
        </motion.div>

        <span className="flex-1 truncate text-[11px] font-bold uppercase tracking-wider text-gray-500 transition-colors group-hover:text-gray-300">
          {name}
        </span>

        {/* Channel count when collapsed */}
        {collapsed && channelCount > 0 && (
          <span className="mr-1 text-[10px] text-gray-600">{channelCount}</span>
        )}

        {/* Create channel button on hover */}
        <AnimatePresence>
          {hovered && onCreateChannel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={springs.snappy}
            >
              <button
                onClick={handleCreate}
                className="rounded p-0.5 hover:bg-[var(--token-card-bg)]"
                aria-label={`Add channel to ${name}`}
              >
                <PlusIcon className="h-3.5 w-3.5 text-gray-500 hover:text-gray-300" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Channels */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.snappy}
            className="overflow-hidden"
          >
            <div className="mt-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChannelCategory;
