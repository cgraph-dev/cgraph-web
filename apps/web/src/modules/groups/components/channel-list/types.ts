import type { Channel } from '@/modules/groups/store';

export interface ChannelListProps {
  /** Additional CSS classes */
  className?: string;
}

export interface CategorySectionProps {
  /** Channel category data */
  category: import('@/modules/groups/store').ChannelCategory;
  /** Whether this section is expanded */
  isExpanded: boolean;
  /** Currently active channel ID for highlighting */
  activeChannelId?: string;
  /** Toggle section expansion */
  onToggle: () => void;
  /** Open the create channel modal for this category */
  onCreateChannel: () => void;
}

export interface ChannelItemProps {
  /** Channel data */
  channel: Channel;
  /** Whether this channel is currently active */
  isActive: boolean;
}

export interface CreateChannelModalProps {
  /** Group to create the channel in */
  groupId: string;
  /** Category to create the channel under */
  categoryId: string | null;
  /** Close the modal */
  onClose: () => void;
}

/** Channel type option for the type selector */
export interface ChannelTypeOption {
  /** Channel type value */
  value: Channel['type'];
  /** Display label */
  label: string;
  /** Icon component */
  icon: React.ElementType;
}
