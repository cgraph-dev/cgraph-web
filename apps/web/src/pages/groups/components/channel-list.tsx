/**
 * ChannelList component
 */

import { NavLink } from 'react-router-dom';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  XMarkIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { IconButton } from '@/components/ui/button';
import type { ChannelListProps } from './types';
import { ChannelItem } from './channel-item';

/**
 * Channel list renderer and navigation.
 */
export function ChannelList({
  activeGroup,
  channelId,
  expandedCategories,
  toggleCategory,
  mobileVisible = false,
  onCloseMobile,
  onBackToGroups,
}: ChannelListProps) {
  if (!activeGroup) {
    return (
      <div
        data-testid="groups-channel-list"
        className="cgraph-pane relative z-10 hidden w-60 shrink-0 flex-col lg:flex"
      >
        <div className="flex h-14 shrink-0 items-center border-b border-[var(--token-border-muted)] px-4">
          <h2 className="truncate font-bold text-[var(--token-text-primary)]">Select a server</h2>
        </div>
        <div className="flex flex-1 items-center justify-center p-4 text-center">
          <div>
            <UserGroupIcon className="mx-auto mb-3 h-12 w-12 text-[var(--token-text-muted)]" />
            <p className="text-sm text-[var(--token-text-secondary)]">
              Select a server to view channels
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="groups-channel-list"
      aria-label={`${activeGroup.name} channels`}
      className={`${mobileVisible ? 'flex' : 'hidden'} cgraph-pane relative z-20 min-h-0 w-full shrink-0 flex-col lg:flex lg:w-60`}
    >
      <div
        className="flex h-14 shrink-0 items-center gap-1 border-b border-[var(--token-border-muted)] px-2 lg:hidden"
        data-testid="groups-channel-list-mobile-header"
      >
        <IconButton
          icon={<ChevronLeftIcon />}
          label="Back to groups"
          size="md"
          onClick={onBackToGroups}
          className="h-11 w-11 shrink-0"
        />
        <h2 className="min-w-0 flex-1 truncate px-1 text-sm font-semibold text-[var(--token-text-primary)]">
          {activeGroup.name}
        </h2>
        <NavLink
          to={`/groups/${activeGroup.id}/settings`}
          onClick={() => HapticFeedback.light()}
          aria-label={`Open ${activeGroup.name} settings`}
          className="cgraph-control cgraph-control-icon cgraph-control-ghost flex h-11 w-11 shrink-0 items-center justify-center p-2"
          data-cgraph-material="solid"
          data-cgraph-surface="control"
          data-cgraph-state="idle"
          data-cgraph-variant="ghost"
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </NavLink>
        <IconButton
          icon={<XMarkIcon />}
          label="Close channel list"
          size="md"
          onClick={onCloseMobile}
          className="h-11 w-11 shrink-0"
        />
      </div>

      <div className="hidden lg:block">
        <div className="flex h-14 items-center border-b border-[var(--token-border-muted)] px-3">
          <h2 className="truncate px-1 font-bold text-[var(--token-text-primary)]">
            {activeGroup.name}
          </h2>
          <NavLink
            to={`/groups/${activeGroup.id}/settings`}
            onClick={() => HapticFeedback.light()}
            aria-label={`Open ${activeGroup.name} settings`}
            className="cgraph-control cgraph-control-icon cgraph-control-ghost ml-auto flex h-10 w-10 shrink-0 items-center justify-center p-2"
            data-cgraph-material="solid"
            data-cgraph-surface="control"
            data-cgraph-state="idle"
            data-cgraph-variant="ghost"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </NavLink>
        </div>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto py-3">
        {activeGroup.categories?.map((category) => (
          <div key={category.id}>
            <button
              type="button"
              onClick={() => {
                toggleCategory(category.id);
                HapticFeedback.light();
              }}
              aria-expanded={expandedCategories.has(category.id)}
              className="cgraph-control cgraph-control-ghost flex min-h-11 w-full items-center gap-1 rounded-none px-2 py-1.5 text-left text-[11px] font-bold uppercase text-[var(--token-text-muted)] lg:min-h-8"
              data-cgraph-material="solid"
              data-cgraph-surface="control"
              data-cgraph-state="idle"
              data-cgraph-variant="ghost"
            >
              <ChevronDownIcon
                className={`h-3 w-3 transition-transform duration-150 ${
                  expandedCategories.has(category.id) ? '' : '-rotate-90'
                }`}
              />
              {category.name}
            </button>

            {expandedCategories.has(category.id) && (
              <div className="mt-0.5">
                {category.channels?.map((channel) => (
                  <ChannelItem
                    key={channel.id}
                    channel={channel}
                    groupId={activeGroup.id}
                    isActive={channel.id === channelId}
                    onSelect={onCloseMobile}
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {activeGroup.channels
          ?.filter((c) => !c.categoryId)
          .map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              groupId={activeGroup.id}
              isActive={channel.id === channelId}
              onSelect={onCloseMobile}
            />
          ))}
      </div>
    </div>
  );
}
