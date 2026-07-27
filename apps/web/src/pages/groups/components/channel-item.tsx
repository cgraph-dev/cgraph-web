/**
 * ChannelItem component
 */

import { NavLink } from 'react-router-dom';
import {
  HashtagIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { getGroupChannelRouteForChannel } from '@/modules/groups/routing';
import type { ChannelItemProps } from './types';

/**
 */
/**
 * Channel Item component.
 */
export function ChannelItem({ channel, groupId, isActive, onSelect }: ChannelItemProps) {
  const getIcon = () => {
    switch (channel.type) {
      case 'voice':
        return SpeakerWaveIcon;
      case 'video':
        return VideoCameraIcon;
      case 'announcement':
        return MegaphoneIcon;
      case 'forum':
        return ChatBubbleLeftRightIcon;
      default:
        return HashtagIcon;
    }
  };

  const Icon = getIcon();

  return (
    <NavLink
      to={getGroupChannelRouteForChannel(groupId, channel)}
      onClick={() => {
        HapticFeedback.light();
        onSelect?.();
      }}
      aria-current={isActive ? 'page' : undefined}
      data-cgraph-material="solid"
      data-cgraph-surface="control"
      data-cgraph-state={isActive ? 'selected' : 'idle'}
      data-cgraph-variant="ghost"
      className={`cgraph-control cgraph-control-ghost relative mx-2 flex min-h-11 items-center gap-1.5 px-2 py-1.5 lg:min-h-9 ${
        isActive
          ? '!border-[var(--token-card-border)] !bg-[var(--token-bg-tertiary)] !text-[var(--token-text-primary)]'
          : 'text-[var(--token-text-secondary)]'
      }`}
    >
      <Icon className="h-5 w-5 flex-shrink-0 text-current" />
      <span className={`truncate text-[13px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
        {channel.name}
      </span>
      {channel.unreadCount > 0 && (
        <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--token-interactive-primary)] px-1 text-[10px] font-bold text-[var(--token-text-on-primary)]">
          {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
        </span>
      )}
    </NavLink>
  );
}
