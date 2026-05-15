/**
 * ConversationSidebar Component
 *
 * Sidebar with search, conversation list, and actions.
 */

import { motion } from 'motion/react';
import {
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  MagnifyingGlassPlusIcon,
  ChatBubbleLeftRightIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { ConversationItem } from './conversation-item';
import { EmptyConversationList, LoadingSpinner } from './empty-states';
import type { ConversationSidebarProps } from './types';
import { tweens } from '@/lib/animation-presets';
import { FADE_IN } from '@/lib/animations/transitions';

/**
 */
/**
 * Conversation Sidebar component.
 */
export function ConversationSidebar({
  conversations,
  activeConversationId,
  currentUserId,
  onlineStatus,
  searchQuery,
  isLoading,
  onSearchChange,
  onOpenSearch,
  onNewConversation,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onUnarchive,
  onPin,
  onMute,
  showArchived,
  onShowArchivedChange,
}: ConversationSidebarProps) {
  return (
    <div className="bg-[var(--token-card-bg)]/40 relative flex h-full w-80 shrink-0 flex-col border-r border-[var(--token-card-border)] backdrop-blur-3xl transition-all duration-300">
      {/* Ambient glow effect */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10" />

      {/* Header */}
      <div className="relative z-10 p-5 pb-3">
        <motion.div
          className="mb-4 flex items-center justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tweens.moderate}
        >
          <h2 className="flex items-center gap-2 bg-gradient-to-r from-white via-primary-200 to-purple-200 bg-clip-text text-2xl font-bold text-transparent">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-400" />
            Messages
          </h2>
          <div className="flex items-center gap-1">
            <motion.button
              onClick={() => {
                onOpenSearch();
                HapticFeedback.light();
              }}
              className="group rounded-xl border border-transparent p-2 text-white/40 backdrop-blur-md transition-all hover:border-[var(--token-border-muted)] hover:bg-[var(--token-card-bg)/0.4] hover:text-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.2),rgba(255,255,255,0.02)_0px_1px_1px_inset]"
              title="Search messages"
              whileTap={{ scale: 0.88 }}
            >
              <MagnifyingGlassPlusIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            </motion.button>
            <motion.button
              onClick={() => {
                onNewConversation();
                HapticFeedback.medium();
              }}
              className="group rounded-xl border border-transparent p-2 text-white/40 backdrop-blur-md transition-all hover:border-[var(--token-border-muted)] hover:bg-[var(--token-card-bg)/0.4] hover:text-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.2),rgba(255,255,255,0.02)_0px_1px_1px_inset]"
              title="New conversation"
              whileTap={{ scale: 0.88 }}
            >
              <PlusIcon className="h-5 w-5 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
            </motion.button>
          </div>
        </motion.div>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onShowArchivedChange(false)}
            aria-pressed={!showArchived}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              !showArchived
                ? 'border-primary-500/30 bg-primary-500/15 text-white'
                : 'border-[var(--token-border-muted)] bg-transparent text-white/50 hover:text-white'
            }`}
          >
            <InboxIcon className="h-4 w-4" />
            Inbox
          </button>
          <button
            type="button"
            onClick={() => onShowArchivedChange(true)}
            aria-pressed={showArchived}
            className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              showArchived
                ? 'border-primary-500/30 bg-primary-500/15 text-white'
                : 'border-[var(--token-border-muted)] bg-transparent text-white/50 hover:text-white'
            }`}
          >
            <ArchiveBoxIcon className="h-4 w-4" />
            Archived
          </button>
        </div>

        {/* Enhanced Search */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...tweens.moderate, delay: 0.1 }}
        >
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search conversations"
            className="focus:border-primary-500/40 focus:ring-primary-500/10 peer w-full rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.4] py-2.5 pl-10 pr-4 text-[13px] text-white shadow-inner shadow-black/20 backdrop-blur-xl transition-all duration-200 placeholder:text-white/20 focus:bg-[var(--token-card-bg)/0.6] focus:outline-none focus:ring-4"
          />
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20 transition-all duration-200 peer-focus:text-primary-400" />
        </motion.div>
      </div>

      {/* Conversations List */}
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        {isLoading && conversations.length === 0 ? (
          <LoadingSpinner />
        ) : conversations.length === 0 ? (
          <EmptyConversationList searchQuery={searchQuery} />
        ) : (
          <motion.div {...FADE_IN} transition={tweens.standard}>
            {conversations.map((conv, index) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...tweens.standard, delay: index * 0.05 }}
              >
                <ConversationItem
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  currentUserId={currentUserId}
                  onlineStatus={onlineStatus}
                  onMarkAsRead={onMarkAsRead}
                  onMarkAsUnread={onMarkAsUnread}
                  onArchive={onArchive}
                  onUnarchive={onUnarchive}
                  onPin={onPin}
                  onMute={onMute}
                  showArchived={showArchived}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
