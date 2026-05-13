/**
 * ChannelList component
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDownIcon, UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { http } from '@/lib/api-client';
import { useGroupStore } from '@/modules/groups/store';
import type { ChannelListProps } from './types';
import { ChannelItem } from './channel-item';
import { tweens, loop, springs } from '@/lib/animation-presets';
import { FADE_UP } from '@/lib/animations/transitions';

/**
 * Channel List component with category creation.
 */
export function ChannelList({
  activeGroup,
  channelId,
  expandedCategories,
  toggleCategory,
}: ChannelListProps) {
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const { fetchGroup } = useGroupStore();
  if (!activeGroup) {
    return (
      <div className="bg-[var(--token-card-bg)]/40 relative z-10 flex w-60 shrink-0 flex-col border-r border-[var(--token-card-border)] backdrop-blur-3xl transition-all duration-300">
        {/* Ambient glow */}
        <div className="from-primary-500/5 to-purple-500/5 pointer-events-none absolute inset-0 bg-gradient-to-b via-black/20" />

        {/* Server Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="relative z-10 flex h-14 items-center border-b border-[var(--token-border-muted)] px-4">
            <h2 className="bg-gradient-to-br from-white to-white/60 bg-clip-text font-bold tracking-tight text-transparent">
              Select a server
            </h2>
          </div>
          <div className="relative z-10 flex flex-1 items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="p-4 text-center"
            >
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={loop(tweens.glacial)}>
                <UserGroupIcon className="mx-auto mb-3 h-12 w-12 text-primary-400" />
              </motion.div>
              <p className="text-gray-400">Select a server to view channels</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--token-card-bg)]/40 relative z-10 flex w-60 shrink-0 flex-col border-r border-[var(--token-card-border)] backdrop-blur-3xl transition-all duration-300">
      {/* Ambient glow */}
      <div className="from-primary-500/5 to-purple-500/5 pointer-events-none absolute inset-0 bg-gradient-to-b via-black/20" />

      {/* Server Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <div className="flex h-14 items-center border-b border-[var(--token-border-muted)] p-5 px-4 pb-3">
          <h2 className="truncate bg-gradient-to-br from-white to-white/60 bg-clip-text font-bold tracking-tight text-transparent">
            {activeGroup.name}
          </h2>
        </div>
      </motion.div>

      {/* Channels */}
      <div className="relative z-10 flex-1 space-y-0.5 overflow-y-auto py-3">
        {activeGroup.categories?.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springs.bouncy}
          >
            {/* Category Header */}
            <motion.button
              onClick={() => {
                toggleCategory(category.id);
                HapticFeedback.light();
              }}
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
              whileTap={{ scale: 0.98 }}
              className="group flex w-full items-center gap-1 rounded px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/40 transition-all hover:text-white/60"
            >
              <motion.div
                animate={{ rotate: expandedCategories.has(category.id) ? 0 : -90 }}
                transition={tweens.fast}
              >
                <ChevronDownIcon className="h-3 w-3" />
              </motion.div>
              {category.name}
            </motion.button>

            {/* Category Channels */}
            <AnimatePresence>
              {expandedCategories.has(category.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={tweens.fast}
                  className="mt-0.5 overflow-hidden"
                >
                  {category.channels?.map((channel) => (
                    <motion.div
                      key={channel.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={springs.bouncy}
                    >
                      <ChannelItem
                        channel={channel}
                        groupId={activeGroup.id}
                        isActive={channel.id === channelId}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Uncategorized channels */}
        {activeGroup.channels
          ?.filter((c) => !c.categoryId)
          .map((channel) => (
            <motion.div
              key={channel.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={springs.bouncy}
            >
              <ChannelItem
                channel={channel}
                groupId={activeGroup.id}
                isActive={channel.id === channelId}
              />
            </motion.div>
          ))}

        {/* Create Category */}
        <div className="mt-2 px-2">
          {showCategoryInput ? (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1"
            >
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Category name"
                autoFocus
                onKeyDown={async (e) => {
                  if (e.key === 'Enter' && categoryName.trim()) {
                    await http.post(`/api/v1/groups/${activeGroup.id}/categories`, {
                      name: categoryName.trim(),
                    });
                    setCategoryName('');
                    setShowCategoryInput(false);
                    fetchGroup(activeGroup.id);
                  } else if (e.key === 'Escape') {
                    setShowCategoryInput(false);
                    setCategoryName('');
                  }
                }}
                className="min-w-0 flex-1 rounded bg-[var(--token-card-bg)/0.6] px-2 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </motion.div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCategoryInput(true)}
              className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/30 transition-colors hover:text-white/60"
            >
              <PlusIcon className="h-3 w-3" />
              Create Category
            </motion.button>
          )}
        </div>
      </div>

      {/* User Panel */}
      <motion.div
        {...FADE_UP}
        transition={{ delay: 0.3 }}
        className="relative z-10 flex h-[60px] items-center gap-2 border-t border-[var(--token-border-muted)] bg-[var(--token-bg-primary)/0.3] px-3 backdrop-blur-md"
      >
        <motion.div
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
          whileTap={{ scale: 0.98 }}
          className="flex flex-1 cursor-pointer items-center gap-2.5 rounded-lg p-1.5 transition-colors"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.6]">
            <span className="text-[13px] font-bold text-white/80">Y</span>
            <motion.div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[rgba(20,20,25,0.95)] bg-green-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-white/90">You</p>
            <p className="truncate text-[11px] font-medium text-white/40">Online</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
