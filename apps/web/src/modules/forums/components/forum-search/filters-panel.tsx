/**
 * FiltersPanel Component
 *
 * Expandable panel with sort, time range, type, and category filters.
 */

import { motion, AnimatePresence } from 'motion/react';
import { SORT_OPTIONS, TIME_RANGE_OPTIONS, CONTENT_TYPE_OPTIONS } from './constants';
import type { FiltersPanelProps } from './types';

export function FiltersPanel({
  isOpen,
  filters,
  categories,
  primaryColor,
  onFilterChange,
  onToggleCategory,
  onClearFilters,
}: FiltersPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="space-y-4 border-t border-[var(--token-card-border)] p-4">
            {/* Sort Options */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-400">Sort By</label>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => onFilterChange({ sortBy: value })}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      filters.sortBy === value
                        ? 'text-white'
                        : 'bg-[var(--token-card-bg)] text-gray-400 hover:bg-[var(--token-hover)]'
                    }`}
                    style={filters.sortBy === value ? { backgroundColor: primaryColor } : {}}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Range */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-400">Time Range</label>
              <div className="flex flex-wrap gap-2">
                {TIME_RANGE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onFilterChange({ timeRange: value })}
                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      filters.timeRange === value
                        ? 'text-white'
                        : 'bg-[var(--token-card-bg)] text-gray-400 hover:bg-[var(--token-hover)]'
                    }`}
                    style={filters.timeRange === value ? { backgroundColor: primaryColor } : {}}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-400">Content Type</label>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => onFilterChange({ type: value })}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      filters.type === value
                        ? 'text-white'
                        : 'bg-[var(--token-card-bg)] text-gray-400 hover:bg-[var(--token-hover)]'
                    }`}
                    style={filters.type === value ? { backgroundColor: primaryColor } : {}}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-400">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => onToggleCategory(category.id)}
                      className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                        filters.categories.includes(category.id)
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                      style={{
                        backgroundColor: filters.categories.includes(category.id)
                          ? category.color || primaryColor
                          : `${category.color || primaryColor}20`,
                      }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Advanced Facets */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={filters.hasAttachments ?? false}
                  onChange={(e) => onFilterChange({ hasAttachments: e.target.checked || undefined })}
                  className="rounded"
                />
                Has attachments
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={filters.isPinned ?? false}
                  onChange={(e) => onFilterChange({ isPinned: e.target.checked || undefined })}
                  className="rounded"
                />
                Pinned only
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Min score</label>
                <input
                  type="number"
                  min={0}
                  value={filters.minScore ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : undefined;
                    onFilterChange({ minScore: val });
                  }}
                  placeholder="0"
                  className="w-20 rounded-lg bg-[var(--token-card-bg)] px-2.5 py-1 text-sm text-white placeholder-gray-500"
                />
              </div>
            </div>

            {/* Clear Filters */}
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-400 underline hover:text-white"
            >
              Clear all filters
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
