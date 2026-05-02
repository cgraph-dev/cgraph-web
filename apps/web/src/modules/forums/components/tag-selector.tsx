/**
 * TagSelector Component
 *
 * Multi-select dropdown for thread tags:
 * - Tags grouped by category with color-coded chips
 * - Max-per-category enforcement
 * - Remove button per tag
 * - Dropdown search / filter
 *
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDownIcon, XMarkIcon, TagIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
interface Tag {
  id: string;
  name: string;
  color: string;
  categoryId?: string;
  categoryName?: string;
}

interface TagCategory {
  id: string;
  name: string;
  maxTags?: number;
  tags: Tag[];
}

interface TagSelectorProps {
  forumId: string;
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
  categories?: TagCategory[];
  maxTotal?: number;
  className?: string;
}
/** Tag Selector component. */
export default function TagSelector({
  forumId: _forumId,
  selectedTags,
  onChange,
  categories = [],
  maxTotal = 10,
  className,
}: TagSelectorProps) {
  void _forumId;

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedIds = new Set(selectedTags.map((t) => t.id));

  const isMaxReached = selectedTags.length >= maxTotal;

  const isCategoryMaxReached = (categoryId: string | undefined, maxTags: number | undefined) => {
    if (!categoryId || !maxTags) return false;
    const count = selectedTags.filter((t) => t.categoryId === categoryId).length;
    return count >= maxTags;
  };

  const handleToggleTag = (tag: Tag, category?: TagCategory) => {
    if (selectedIds.has(tag.id)) {
      // Remove
      onChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      // Check limits
      if (isMaxReached) return;
      if (category && isCategoryMaxReached(category.id, category.maxTags)) return;

      const enrichedTag: Tag = {
        ...tag,
        categoryId: category?.id ?? tag.categoryId,
        categoryName: category?.name ?? tag.categoryName,
      };
      onChange([...selectedTags, enrichedTag]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      tags: cat.tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    }))
    .filter((cat) => cat.tags.length > 0);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Selected Tags + Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="focus:ring-primary-500/50 flex min-h-[40px] w-full flex-wrap items-center gap-1.5 rounded-lg border border-[var(--token-card-border)] bg-[var(--token-bg-secondary)] px-3 py-2 text-left transition-colors hover:border-[var(--token-card-border)] focus:outline-none focus:ring-1"
      >
        <TagIcon className="h-4 w-4 flex-shrink-0 text-gray-500" />

        {selectedTags.length === 0 && <span className="text-sm text-gray-500">Select tags…</span>}

        {selectedTags.map((tag) => (
          <span
            key={tag.id}
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: `${tag.color}40`, borderColor: tag.color, borderWidth: 1 }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
            {tag.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag.id);
              }}
              className="ml-0.5 rounded-full p-0.5 text-gray-400 transition-colors hover:bg-[var(--token-hover)] hover:text-white"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </span>
        ))}

        <ChevronDownIcon
          className={cn(
            'ml-auto h-4 w-4 flex-shrink-0 text-gray-500 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--token-card-border)] bg-gray-900 shadow-xl"
          >
            {/* Search */}
            <div className="border-b border-[var(--token-card-border)] p-2">
              <input
                type="text"
                placeholder="Filter tags…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="focus:ring-primary-500/50 w-full rounded-md bg-[var(--token-card-bg)] px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-1"
                autoFocus
              />
            </div>

            {/* Tag groups */}
            <div className="max-h-64 overflow-y-auto p-2">
              {filteredCategories.length === 0 && (
                <p className="px-2 py-3 text-center text-sm text-gray-500">No tags found</p>
              )}

              {filteredCategories.map((cat) => {
                const catMaxReached = isCategoryMaxReached(cat.id, cat.maxTags);

                return (
                  <div key={cat.id} className="mb-2 last:mb-0">
                    <div className="mb-1 flex items-center justify-between px-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        {cat.name}
                      </span>
                      {cat.maxTags && (
                        <span className="text-[10px] text-gray-600">
                          {selectedTags.filter((t) => t.categoryId === cat.id).length}/{cat.maxTags}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 px-1">
                      {cat.tags.map((tag) => {
                        const isSelected = selectedIds.has(tag.id);
                        const disabled = !isSelected && (isMaxReached || catMaxReached);

                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => handleToggleTag(tag, cat)}
                            disabled={disabled}
                            className={cn(
                              'flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-all',
                              isSelected
                                ? 'font-semibold text-white'
                                : 'text-gray-400 hover:text-white',
                              disabled && !isSelected && 'cursor-not-allowed opacity-40'
                            )}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: `${tag.color}30`,
                                    borderColor: tag.color,
                                    borderWidth: 1,
                                  }
                                : { backgroundColor: 'rgba(255,255,255,0.04)' }
                            }
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
