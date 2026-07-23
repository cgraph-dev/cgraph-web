/**
 * Groups page type definitions
 */

import type { Group, Channel } from '@/modules/groups/store';

export interface ServerIconProps {
  group: Group;
  isActive: boolean;
}

export interface ChannelItemProps {
  channel: Channel;
  groupId: string;
  isActive: boolean;
  onSelect?: () => void;
}

export interface CategorySectionProps {
  category: {
    id: string;
    name: string;
    channels?: Channel[];
  };
  groupId: string;
  channelId?: string;
  isExpanded: boolean;
  onToggle: () => void;
  animationDelay: number;
}

export interface ServerListProps {
  groups: readonly Group[];
  activeGroupId?: string;
  showMobileDirectory?: boolean;
}

export interface ChannelListProps {
  activeGroup: Group | undefined;
  channelId?: string;
  expandedCategories: Set<string>;
  toggleCategory: (id: string) => void;
  mobileVisible?: boolean;
  onCloseMobile?: () => void;
  onBackToGroups?: () => void;
}

export interface ContentAreaProps {
  activeGroup: Group | undefined;
  groupId?: string;
  channelId?: string;
}
