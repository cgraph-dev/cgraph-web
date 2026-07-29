/**
 * ChannelHeader Component
 *
 * Header bar with channel info and actions.
 */

import {
  HashtagIcon,
  BookmarkIcon,
  BellIcon,
  BellSlashIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { IconButton } from '@/components/ui/button';
import type { ChannelHeaderProps } from './types';

const channelIcons = {
  text: HashtagIcon,
  announcement: MegaphoneIcon,
  forum: ChatBubbleLeftRightIcon,
} as const;

/** Channel identity and actions. */
export function ChannelHeader({
  channelName,
  channelTopic,
  channelType = 'text',
  channelLabel,
  isSearchOpen,
  onToggleSearch,
  notificationLevel = 'mentions',
  isSavingNotifications,
  onToggleNotifications,
  showMembers,
  onToggleMembers,
  showPinnedMessages,
  onTogglePinnedMessages,
  pinnedCount,
}: ChannelHeaderProps) {
  const Icon = channelIcons[channelType] ?? HashtagIcon;
  const NotificationIcon = notificationLevel === 'none' ? BellSlashIcon : BellIcon;

  return (
    <header className="cgraph-pane-header flex h-14 shrink-0 items-center justify-between px-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-5 w-5 text-[var(--token-text-muted)]" />
        <span className="truncate font-semibold text-[var(--token-text-primary)]">
          {channelName}
        </span>
        {channelLabel && (
          <span className="hidden rounded-md bg-[var(--product-surface-recessed)] px-2 py-0.5 text-[11px] font-semibold uppercase text-[var(--token-text-muted)] sm:inline">
            {channelLabel}
          </span>
        )}
        {channelTopic && (
          <div className="hidden min-w-0 items-center sm:flex">
            <div className="mx-2 h-5 w-px bg-[var(--product-line)]" />
            <span className="max-w-md truncate text-sm text-[var(--token-text-muted)]">
              {channelTopic}
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {onToggleSearch && (
          <IconButton
            icon={<MagnifyingGlassIcon />}
            label="Search messages"
            size="sm"
            variant={isSearchOpen ? 'secondary' : 'ghost'}
            onClick={onToggleSearch}
            aria-pressed={isSearchOpen}
          />
        )}
        {onToggleNotifications && (
          <IconButton
            icon={<NotificationIcon />}
            label={notificationLevel === 'none' ? 'Unmute channel' : 'Mute channel'}
            size="sm"
            variant={notificationLevel === 'none' ? 'danger' : 'ghost'}
            onClick={onToggleNotifications}
            disabled={isSavingNotifications}
            aria-pressed={notificationLevel === 'none'}
          />
        )}
        <span className="relative">
          <IconButton
            icon={<BookmarkIcon />}
            label="Pinned messages"
            size="sm"
            variant={showPinnedMessages ? 'secondary' : 'ghost'}
            onClick={onTogglePinnedMessages}
            aria-pressed={showPinnedMessages}
          />
          {(pinnedCount ?? 0) > 0 && (
            <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--token-interactive-primary)] px-1 text-[10px] font-bold text-[var(--token-text-on-primary)]">
              {pinnedCount}
            </span>
          )}
        </span>
        <IconButton
          icon={<UserGroupIcon />}
          label={showMembers ? 'Hide members' : 'Show members'}
          size="sm"
          variant={showMembers ? 'secondary' : 'ghost'}
          onClick={onToggleMembers}
          aria-pressed={showMembers}
        />
      </div>
    </header>
  );
}
