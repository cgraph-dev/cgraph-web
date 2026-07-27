/**
 * ChannelList component
 */

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  XMarkIcon,
  UserGroupIcon,
  PlusIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { http } from '@/lib/api-client';
import { Button, IconButton } from '@/components/ui/button';
import { useGroupStore } from '@/modules/groups/store';
import type { ChannelListProps } from './types';
import { ChannelItem } from './channel-item';

/**
 * Channel List component with category creation.
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
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const { fetchGroup } = useGroupStore();
  if (!activeGroup) {
    return (
      <div
        data-testid="groups-channel-list"
        className="relative z-10 hidden w-60 shrink-0 flex-col border-r border-[var(--token-card-border)] bg-[var(--token-card-bg)] lg:flex"
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
      className={`${mobileVisible ? 'flex' : 'hidden'} relative z-20 min-h-0 w-full shrink-0 flex-col border-r border-[var(--token-card-border)] bg-[var(--token-card-bg)] lg:flex lg:w-60`}
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

        <div className="mt-2 px-2">
          {showCategoryInput ? (
            <div className="flex items-center gap-1">
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
                aria-label="Category name"
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-[var(--token-border-muted)] bg-[var(--token-bg-secondary)] px-2 py-1 text-sm text-[var(--token-text-primary)] outline-none placeholder:text-[var(--token-text-muted)] focus:border-[var(--token-interactive-primary)] focus:ring-2 focus:ring-[var(--token-interactive-primary)]/20 lg:min-h-9 lg:text-xs"
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              animated={false}
              leftIcon={<PlusIcon />}
              onClick={() => setShowCategoryInput(true)}
              className="min-h-11 !justify-start px-1.5 text-[11px] font-bold uppercase lg:min-h-8"
            >
              Create Category
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
