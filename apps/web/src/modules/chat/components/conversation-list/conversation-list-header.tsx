/**
 * ConversationListHeader component
 */

import { motion } from 'motion/react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useThemeStore, THEME_COLORS } from '@/stores/theme';
import type { FilterType } from './types';
import { FILTER_OPTIONS } from './constants';

interface ConversationListHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onNewChat: () => void;
}

/**
 */
/**
 * Conversation List Header component.
 */
export function ConversationListHeader({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  onNewChat,
}: ConversationListHeaderProps) {
  const { theme } = useThemeStore();
  const colors = THEME_COLORS[theme.colorPreset];

  return (
    <div className="border-b border-[var(--token-border-muted)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Messages</h2>
        <motion.button
          whileHover={{ opacity: 0.9 }}
          whileTap={{ scale: 0.9 }}
          onClick={onNewChat}
          className="rounded-xl bg-primary-600 p-2 text-white"
          style={{ backgroundColor: colors.primary }}
        >
          <PlusIcon className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="peer w-full rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] py-2 pl-9 pr-4 text-sm text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:border-primary-500/40 focus:bg-[var(--token-card-bg)/0.6] focus:outline-none focus:ring-4 focus:ring-primary-500/10"
        />
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
      </div>

      {/* Filters */}
      <div className="mt-3 flex gap-2">
        {FILTER_OPTIONS.map((f) => (
          <motion.button
            key={f.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFilterChange(f.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.id
                ? 'bg-primary-600/20 text-primary-400'
                : 'bg-[var(--token-card-bg)/0.6] text-gray-400 hover:text-white'
            }`}
          >
            {f.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
